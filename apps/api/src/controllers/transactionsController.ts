import { Response } from "express";
import * as transactionService from "../services/transactions";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import {
  Prisma,
  PaymentMethod,
  TransactionType,
} from "../generated/tenant/client";
import { prisma as publicPrisma } from "../lib/prisma";
import logger from "../../logs/log";

const Decimal = Prisma.Decimal;
const CONTROLLER_SOURCE = "transactionsController";

const baseRequestMeta = (req: AuthRequest): Record<string, unknown> => ({
  userId: req.userId ?? null,
  storeId: req.store?.id ?? null,
  organizationId: req.organization?.id ?? null,
});

const normalizeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    };
  }

  return { error };
};

const logInfo = (message: string, data?: Record<string, unknown>): void => {
  void logger.info(CONTROLLER_SOURCE, message, data);
};

const logWarn = (message: string, data?: Record<string, unknown>): void => {
  void logger.warn(CONTROLLER_SOURCE, message, data);
};

const logError = (
  message: string,
  error: unknown,
  data?: Record<string, unknown>
): void => {
  void logger.error(CONTROLLER_SOURCE, message, {
    ...data,
    ...normalizeError(error),
  });
};

const getTransactionsSchema = z.object({
  store_id: z.string().optional(),
  storeId: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  transaction_type: z.string().optional(),
  category_id: z.string().optional(),
  customer_id: z.string().optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});

const getTransactionsByGroupSchema = z.object({
  groupId: z.string().min(1),
});

const getTransactionsByGroupQuerySchema = z.object({
  storeId: z.string().optional(),
});

const createTransactionSchema = z.object({
  product_variation_id: z.string().min(1),
  store_id: z.string().min(1),
  transaction_type: z.nativeEnum(TransactionType),
  quantity: z.number().int().positive(),
  unit_price: z.number().optional(), // Can be optional if fetched from DB, but usually provided
  total_amount: z.number().optional(),
  payment_method: z.nativeEnum(PaymentMethod).optional(),
  customer_id: z.string().optional(),
  remarks: z.string().optional(),
  notes: z.string().optional(),
  group_id: z.string().optional(),
  original_transaction_id: z.string().nullable().optional(),
  redeem_points: z.number().int().nonnegative().optional(),
  loyalty_discount_amount: z.number().nonnegative().optional(),
  payments: z
    .array(
      z.object({
        amount: z.number().positive(),
        payment_method: z.nativeEnum(PaymentMethod),
        currency: z.string().optional(),
        reference: z.string().optional(),
        note: z.string().optional(),
        received_at: z.string().optional(),
        payer_id: z.string().optional(),
        exchange_rate: z.number().positive().optional(),
      })
    )
    .optional(),
});

const returnTransactionSchema = z.object({
  quantity: z.number().positive().optional(),
});

const getTransactionSummarySchema = z.object({
  storeId: z.string().optional(),
  store_id: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type TransactionResponseNode = {
  user_id?: string | null;
  seller_name?: string | null;
  items?: TransactionResponseNode[];
  returns?: TransactionResponseNode[];
};

const enrichTransactionsWithSellerNames = async <T extends TransactionResponseNode>(
  transactions: T[]
): Promise<Array<T & { seller_name: string | null }>> => {
  const userIds = new Set<string>();
  const stack: TransactionResponseNode[] = [...transactions];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    if (current.user_id) {
      userIds.add(current.user_id);
    }

    if (current.items?.length) stack.push(...current.items);
    if (current.returns?.length) stack.push(...current.returns);
  }

  if (userIds.size === 0) {
    return transactions.map(t => ({ ...t, seller_name: null }));
  }

  const users = await publicPrisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, name: true, email: true },
  });

  const userNameMap = new Map<string, string>(
    users.map((u) => [u.id, u.name || u.email || `User ${u.id.slice(-6)}`])
  );

  const mapNode = <N extends T>(node: N): N & { seller_name: string | null } => ({
    ...node,
    seller_name: node.user_id ? (userNameMap.get(node.user_id) ?? null) : null,
    items: node.items?.map((child) => mapNode(child as T)) as N["items"],
    returns: node.returns?.map((child) => mapNode(child as T)) as N["returns"],
  });

  return transactions.map(mapNode);
};

const exchangeTransactionSchema = z.object({
  returnQuantity: z.number().int().positive(),
  newProductVariationId: z.string().min(1),
  newQuantity: z.number().int().positive(),
  newUnitPrice: z.number(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
});

const repayDebtSchema = z.object({
  customerId: z.string().min(1),
  amount: z.number().positive(),
  storeId: z.string().min(1),
});

export class TransactionsController {
  async getTransactions(req: AuthRequest, res: Response): Promise<Response> {
    const startedAt = Date.now();
    const requestMeta = {
      ...baseRequestMeta(req),
      route: "getTransactions",
      query: req.query,
    };

    logInfo("Get transactions started", requestMeta);

    const validation = getTransactionsSchema.safeParse(req.query);
    if (!validation.success) {
      logWarn("Get transactions validation failed", {
        ...requestMeta,
        validationErrors: validation.error.issues,
      });
      return res
        .status(400)
        .json({
          error: "Invalid query parameters",
          details: validation.error.issues,
        });
    }
    const {
      start_date,
      end_date,
      transaction_type,
      category_id,
      customer_id,
      customerId,
      search: _search,
      limit,
      offset
    } = validation.data;

    const userId = req.userId!;

    if (!req.store?.id) {
      logWarn("Get transactions rejected: missing store context", requestMeta);
      return res.status(400).json({ error: "Store ID is required" });
    }

    if (!req.tenantPrisma) {
      logWarn("Get transactions rejected: tenant prisma missing", requestMeta);
      return res.status(404).json({ error: "Tenant not found" });
    }

    try {
      const result = await transactionService.getTransactions(
        {
          storeId: req.store.id,
          userId,
          startDate: start_date,
          endDate: end_date,
          transactionType: transaction_type as TransactionType | undefined,
          categoryId: category_id,
          customerId: customer_id || customerId,
          limit: limit || 50,
          page: offset !== undefined ? Math.floor(offset / (limit || 50)) + 1 : 1,
        },
        req.tenantPrisma
      );

      type EnrichedTransaction = (typeof result.transactions)[number] & { seller_name: string | null };
      let enrichedTransactions: EnrichedTransaction[] = result.transactions.map(t => ({ ...t, seller_name: null }));
      
      try {
        const enriched = await enrichTransactionsWithSellerNames(
          result.transactions as unknown as TransactionResponseNode[]
        );
        enrichedTransactions = enriched as EnrichedTransaction[];
      } catch (userLookupError) {
        logWarn("Failed to enrich seller names for transactions", {
          ...requestMeta,
          userLookupError:
            userLookupError instanceof Error
              ? userLookupError.message
              : String(userLookupError),
        });
      }

      logInfo("Get transactions completed", {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        count: result.transactions.length,
        total: result.pagination.total,
      });

      return res.json({
        ...result,
        transactions: enrichedTransactions,
      });
    } catch (error) {
      logError("Get transactions failed", error, {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
      });
      return res
        .status(500)
        .json({ message: "Internal server error", error: String(error) });
    }
  }

  async getTransactionsByGroup(req: AuthRequest, res: Response) {
    const startedAt = Date.now();
    const requestMeta = {
      ...baseRequestMeta(req),
      route: "getTransactionsByGroup",
      params: req.params,
      query: req.query,
    };

    logInfo("Get transactions by group started", requestMeta);

    const paramsValidation = getTransactionsByGroupSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      logWarn("Get transactions by group params validation failed", {
        ...requestMeta,
        validationErrors: paramsValidation.error.issues,
      });
      return res
        .status(400)
        .json({
          error: "Invalid params",
          details: paramsValidation.error.issues,
        });
    }
    const { groupId } = paramsValidation.data;

    const queryValidation = getTransactionsByGroupQuerySchema.safeParse(
      req.query
    );
    if (!queryValidation.success) {
      logWarn("Get transactions by group query validation failed", {
        ...requestMeta,
        validationErrors: queryValidation.error.issues,
      });
      return res
        .status(400)
        .json({
          error: "Invalid query",
          details: queryValidation.error.issues,
        });
    }
    const { storeId } = queryValidation.data;

    // Ensure storeId is provided either via query or context if possible, but query is standard for this app
    const storeIdToUse = storeId || req.store?.id;
    if (!storeIdToUse) {
      logWarn("Get transactions by group rejected: missing store id", requestMeta);
      return res.status(400).json({ message: "storeId is required" });
    }

    if (!req.tenantPrisma) {
      logWarn(
        "Get transactions by group rejected: tenant prisma missing",
        requestMeta
      );
      return res.status(404).json({ error: "Tenant not found" });
    }

    try {
      const transactions = await transactionService.getTransactionsByGroupId(
        storeIdToUse,
        groupId,
        req.tenantPrisma
      );

      logInfo("Get transactions by group completed", {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        groupId,
        count: transactions.length,
      });

      return res.json({ transactions });
    } catch (error) {
      logError("Get transactions by group failed", error, {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        groupId,
        storeId: storeIdToUse,
      });
      return res.status(500).json({
        message: "Internal server error",
        error: String(error),
      });
    }
  }

  async createTransaction(req: AuthRequest, res: Response) {
    const startedAt = Date.now();
    const requestMeta = {
      ...baseRequestMeta(req),
      route: "createTransaction",
      body: req.body,
    };

    logInfo("Create transaction started", requestMeta);

    const validation = createTransactionSchema.safeParse(req.body);
    if (!validation.success) {
      logWarn("Create transaction validation failed", {
        ...requestMeta,
        validationErrors: validation.error.issues,
      });
      return res
        .status(400)
        .json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
    }

    const userId = req.userId!;

    const {
      unit_price,
      total_amount,
      loyalty_discount_amount,
      payments,
      notes,
      remarks,
      ...rest
    } = validation.data;

    const transactionData = {
      ...rest,
      remarks: remarks || notes,
      unit_price: new Decimal(unit_price ?? 0),
      total_amount: new Decimal(total_amount ?? 0),
      loyalty_discount_amount:
        loyalty_discount_amount !== undefined
          ? new Decimal(loyalty_discount_amount)
          : undefined,
      payments: payments?.map((payment) => ({
        ...payment,
        amount: new Decimal(payment.amount),
        exchange_rate:
          payment.exchange_rate !== undefined
            ? new Decimal(payment.exchange_rate)
            : undefined,
      })),
      userId,
    };

    if (!req.tenantPrisma) {
      logWarn("Create transaction rejected: tenant prisma missing", requestMeta);
      return res.status(404).json({ error: "Tenant not found" });
    }

    try {
      const result = await transactionService.createTransaction(
        transactionData,
        req.tenantPrisma
      );

      logInfo("Create transaction completed", {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        transactionId: result.id,
        transactionType: result.transaction_type,
        amount: result.total_amount,
      });

      return res.status(201).json({
        message: "Transaction created successfully",
        transaction: result,
      });
    } catch (error) {
      logError("Create transaction failed", error, {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
      });
      return res
        .status(500)
        .json({ message: "Internal server error", error: String(error) });
    }
  }

  async getTransaction(req: AuthRequest, res: Response) {
    const startedAt = Date.now();
    const requestMeta = {
      ...baseRequestMeta(req),
      route: "getTransaction",
      params: req.params,
    };

    logInfo("Get transaction started", requestMeta);

    const { id } = req.params;
    if (!id) {
      logWarn("Get transaction rejected: missing transaction id", requestMeta);
      return res.status(400).json({ error: "Transaction ID is required" });
    }


    if (!req.tenantPrisma) {
      logWarn("Get transaction rejected: tenant prisma missing", requestMeta);
      return res.status(404).json({ error: "Tenant not found" });
    }

    try {
      const transaction = await transactionService.getTransaction(
        id,
        req.store?.id,
        req.tenantPrisma
      );

      logInfo("Get transaction completed", {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        transactionId: transaction.id,
      });

      return res.json({ transaction });
    } catch (error) {
      logError("Get transaction failed", error, {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        transactionId: id,
      });
      return res.status(500).json({
        message: "Internal server error",
        error: String(error),
      });
    }
  }

  async returnTransaction(req: AuthRequest, res: Response) {
    const startedAt = Date.now();
    const requestMeta = {
      ...baseRequestMeta(req),
      route: "returnTransaction",
      params: req.params,
      body: req.body,
    };

    logInfo("Return transaction started", requestMeta);

    const { id } = req.params;
    if (!id) {
      logWarn("Return transaction rejected: missing transaction id", requestMeta);
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    const validation = returnTransactionSchema.safeParse(req.body);
    if (!validation.success) {
      logWarn("Return transaction validation failed", {
        ...requestMeta,
        validationErrors: validation.error.issues,
      });
      return res
        .status(400)
        .json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
    }
    const { quantity } = validation.data;
    const userId = req.userId!;

    if (!req.tenantPrisma) {
      logWarn("Return transaction rejected: tenant prisma missing", requestMeta);
      return res.status(404).json({ error: "Tenant not found" });
    }

    try {
      const result = await transactionService.returnTransaction(
        id,
        userId,
        quantity,
        req.tenantPrisma
      );

      logInfo("Return transaction completed", {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        transactionId: result.id,
        originalTransactionId: id,
      });

      return res.status(200).json({
        message: "Transaction returned successfully",
        transaction: result,
      });
    } catch (error) {
      logError("Return transaction failed", error, {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        originalTransactionId: id,
      });
      return res.status(500).json({
        message: "Internal server error",
        error: String(error),
      });
    }
  }

  async getDashboardStats(req: AuthRequest, res: Response) {
    const startedAt = Date.now();
    const requestMeta = {
      ...baseRequestMeta(req),
      route: "getDashboardStats",
      query: req.query,
    };

    logInfo("Get dashboard stats started", requestMeta);

    const validation = getTransactionSummarySchema.safeParse(req.query);
    if (!validation.success) {
      logWarn("Get dashboard stats validation failed", {
        ...requestMeta,
        validationErrors: validation.error.issues,
      });
      return res
        .status(400)
        .json({
          error: "Invalid query parameters",
          details: validation.error.issues,
        });
    }
    const { startDate: startDateParam, endDate: endDateParam } = validation.data;

    const storeId = req.store?.id;
    if (!storeId) {
      logWarn("Get dashboard stats rejected: missing store context", requestMeta);
      return res.status(400).json({ error: "Store ID is required" });
    }

    // Default to current month if dates not provided
    const now = new Date();
    const startDate = startDateParam || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = endDateParam || now.toISOString();

    if (!req.tenantPrisma) {
      logWarn("Get dashboard stats rejected: tenant prisma missing", requestMeta);
      return res.status(404).json({ error: "Tenant not found" });
    }

    try {
      const stats = await transactionService.getDashboardStats(
        storeId,
        startDate,
        endDate,
        req.tenantPrisma
      );

      logInfo("Get dashboard stats completed", {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        totalOut: stats.totalOut,
        profit: stats.profit,
      });

      return res.json(stats);
    } catch (error) {
      logError("Get dashboard stats failed", error, {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
      });
      return res.status(500).json({
        error: "Failed to fetch dashboard stats",
        message: String(error)
      });
    }
  }

  async exchangeTransaction(req: AuthRequest, res: Response) {
    const startedAt = Date.now();
    const requestMeta = {
      ...baseRequestMeta(req),
      route: "exchangeTransaction",
      params: req.params,
      body: req.body,
    };

    logInfo("Exchange transaction started", requestMeta);

    const { id } = req.params;
    if (!id) {
      logWarn("Exchange transaction rejected: missing transaction id", requestMeta);
      return res.status(400).json({ error: "Transaction ID is required" });
    }
    const userId = req.userId!;

    if (!req.tenantPrisma) {
      logWarn("Exchange transaction rejected: tenant prisma missing", requestMeta);
      return res.status(404).json({ error: "Tenant not found" });
    }

    const validation = exchangeTransactionSchema.safeParse(req.body);
    if (!validation.success) {
      logWarn("Exchange transaction validation failed", {
        ...requestMeta,
        validationErrors: validation.error.issues,
      });
      return res
        .status(400)
        .json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
    }
    const {
      returnQuantity,
      newProductVariationId,
      newQuantity,
      newUnitPrice,
      paymentMethod,
    } = validation.data;

    try {
      const transaction = await transactionService.getTransaction(
        id,
        req.store?.id,
        req.tenantPrisma
      );
      if (!transaction) {
        logWarn("Exchange transaction rejected: transaction not found", {
          ...requestMeta,
          transactionId: id,
        });
        return res.status(404).json({ error: "Transaction not found" });
      }

      const result = await transactionService.exchangeTransaction(
        id,
        userId,
        {
          returnQuantity,
          newProductVariationId,
          newQuantity,
          newUnitPrice: new Decimal(newUnitPrice),
          paymentMethod,
        },
        req.tenantPrisma
      );

      logInfo("Exchange transaction completed", {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        originalTransactionId: id,
        newTransactionId: result.newTransaction.id,
      });

      return res.json({
        message: "Exchange processed successfully",
        result,
      });
    } catch (error) {
      logError("Exchange transaction failed", error, {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        originalTransactionId: id,
      });
      return res.status(500).json({
        message: "Internal server error",
        error: String(error),
      });
    }
  }

  async repayDebt(req: AuthRequest, res: Response) {
    const startedAt = Date.now();
    const requestMeta = {
      ...baseRequestMeta(req),
      route: "repayDebt",
      body: req.body,
    };

    logInfo("Repay debt started", requestMeta);

    const userId = req.userId!;

    const validation = repayDebtSchema.safeParse(req.body);
    if (!validation.success) {
      logWarn("Repay debt validation failed", {
        ...requestMeta,
        validationErrors: validation.error.issues,
      });
      return res
        .status(400)
        .json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
    }
    const { customerId, amount, storeId } = validation.data;

    if (!req.tenantPrisma) {
      logWarn("Repay debt rejected: tenant prisma missing", requestMeta);
      return res.status(404).json({ error: "Tenant not found" });
    }

    try {
      const result = await transactionService.repayDebt(
        customerId,
        new Decimal(amount),
        storeId,
        userId,
        req.tenantPrisma
      );

      logInfo("Repay debt completed", {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        transactionId: result.id,
        customerId,
        amount,
      });

      return res.json({
        message: "Debt repayment processed successfully",
        transaction: result,
      });
    } catch (error) {
      logError("Repay debt failed", error, {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        customerId,
        amount,
      });
      return res.status(500).json({
        message: "Internal server error",
        error: String(error),
      });
    }
  }

  async transferStock(req: AuthRequest, res: Response) {
    const startedAt = Date.now();
    const requestMeta = {
      ...baseRequestMeta(req),
      route: "transferStock",
      body: req.body,
    };

    logInfo("Transfer stock started", requestMeta);

    const validation = transferStockSchema.safeParse(req.body);
    if (!validation.success) {
      logWarn("Transfer stock validation failed", {
        ...requestMeta,
        validationErrors: validation.error.issues,
      });
      return res.status(400).json({
        error: "Invalid input data",
        details: validation.error.issues,
      });
    }

    const { targetStoreId, productVariationId, quantity } = validation.data;
    const userId = req.userId!;
    const sourceStoreId = req.store?.id;

    if (!sourceStoreId) {
      logWarn("Transfer stock rejected: missing source store context", requestMeta);
      return res.status(400).json({ error: "Source store ID is required (from context)" });
    }

    if (!req.tenantPrisma) {
      logWarn("Transfer stock rejected: tenant prisma missing", requestMeta);
      return res.status(404).json({ error: "Tenant not found" });
    }

    try {
      const result = await transactionService.transferStock(
        sourceStoreId,
        targetStoreId,
        productVariationId,
        quantity,
        userId,
        req.tenantPrisma
      );

      logInfo("Transfer stock completed", {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        sourceStoreId,
        targetStoreId,
        productVariationId,
        quantity,
        transferGroupId: result.groupId,
      });

      return res.json({
        message: "Stock transfer processed successfully",
        transfer: result,
      });
    } catch (error) {
      logError("Transfer stock failed", error, {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        sourceStoreId,
        targetStoreId,
        productVariationId,
        quantity,
      });
      return res
        .status(500)
        .json({ message: "Internal server error", error: String(error) });
    }
  }

  async deleteTransaction(req: AuthRequest, res: Response) {
    const startedAt = Date.now();
    const requestMeta = {
      ...baseRequestMeta(req),
      route: "deleteTransaction",
      params: req.params,
    };

    logInfo("Delete transaction started", requestMeta);

    const { id } = req.params;
    if (!id) {
      logWarn("Delete transaction rejected: missing transaction id", requestMeta);
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    if (!req.tenantPrisma) {
      logWarn("Delete transaction rejected: tenant prisma missing", requestMeta);
      return res.status(404).json({ error: "Tenant not found" });
    }

    try {
      await transactionService.deleteTransaction(
        id,
        req.store?.id || "",
        req.tenantPrisma
      );

      logInfo("Delete transaction completed", {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        transactionId: id,
      });

      return res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      logError("Delete transaction failed", error, {
        ...requestMeta,
        durationMs: Date.now() - startedAt,
        transactionId: id,
      });
      return res.status(500).json({
        message: "Failed to delete transaction",
        error: String(error)
      });
    }
  }
}

const transferStockSchema = z.object({
  targetStoreId: z.string().min(1),
  productVariationId: z.string().min(1),
  quantity: z.number().int().positive(),
});
