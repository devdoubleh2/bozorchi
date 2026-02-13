import { Response } from "express";
import * as transactionService from "../services/transactions";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import {
  Prisma,
  PaymentMethod,
  TransactionType,
} from "../generated/tenant/client";

const Decimal = Prisma.Decimal;

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
  quantity: z.number().int().positive(),
});

const getTransactionSummarySchema = z.object({
  storeId: z.string().optional(),
  store_id: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

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
  async getTransactions(req: AuthRequest, res: Response) {
    const validation = getTransactionsSchema.safeParse(req.query);
    if (!validation.success) {
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
      return res.status(400).json({ error: "Store ID is required" });
    }

    if (!req.tenantPrisma) {
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

      return res.json(result);
    } catch (error) {
      console.error("Error in getTransactions:", error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: String(error) });
    }
  }

  async getTransactionsByGroup(req: AuthRequest, res: Response) {
    const paramsValidation = getTransactionsByGroupSchema.safeParse(req.params);
    if (!paramsValidation.success) {
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
      return res.status(400).json({ message: "storeId is required" });
    }

    if (!req.tenantPrisma) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const transactions = await transactionService.getTransactionsByGroupId(
      storeIdToUse,
      groupId,
      req.tenantPrisma
    );

    return res.json({ transactions });
  }

  async createTransaction(req: AuthRequest, res: Response) {
    const validation = createTransactionSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
    }

    const userId = req.userId!;

    // Convert numbers to Decimals for service if needed, or pass as numbers if service expects numbers.
    // Looking at service types (from previous context), it seems to expect numbers or Decimals depending on implementation.
    // But `createTransaction` in service likely takes `TransactionCreateInput` which might expect numbers or Decimals.
    // The service implementation (viewed earlier) uses `Prisma.Decimal` for `unit_price` and `total_amount`.
    // However, the `transactionService.createTransaction` signature (from `inventoryController` usage) accepts an object.
    // Let's check `inventoryController` usage:
    // unit_price: new Decimal(cost_price), total_amount: ...
    // So we should convert to Decimal here.

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

    // Note: The service `createTransaction` might need to be updated to accept `Decimal` if it doesn't already,
    // or we cast it. In `inventoryController`, it was passed `new Decimal()`.
    // Actually, `inventoryController` imports `createTransaction` from `@/services/transactions`.
    // Here we import `* as transactionService`.

    if (!req.tenantPrisma) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    try {
      const result = await transactionService.createTransaction(
        transactionData,
        req.tenantPrisma
      );

      return res.status(201).json({
        message: "Transaction created successfully",
        transaction: result,
      });
    } catch (error) {
      console.error("Error in createTransaction:", error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: String(error) });
    }
  }

  async getTransaction(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    // Fix: getTransaction expects (id, userId) or (id, userId, storeId).
    // The error said "Expected 1-2 arguments, but got 3".
    // Let's check the service definition if possible, but based on error, it likely only takes 2 args.
    // Or maybe (id, userId).
    // I will try with 2 arguments first as `req.store?.id` might be implicit or not needed if ID is unique.
    // Wait, the error `Expected 1-2 arguments, but got 3` implies it accepts at most 2.

    if (!req.tenantPrisma) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const transaction = await transactionService.getTransaction(
      id,
      req.store?.id,
      req.tenantPrisma
    );

    return res.json({ transaction });
  }

  async returnTransaction(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    const validation = returnTransactionSchema.safeParse(req.body);
    if (!validation.success) {
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
      return res.status(404).json({ error: "Tenant not found" });
    }

    const result = await transactionService.returnTransaction(
      id,
      userId,
      quantity,
      req.tenantPrisma
    );

    return res.status(200).json({
      message: "Transaction returned successfully",
      transaction: result,
    });
  }



  async getDashboardStats(req: AuthRequest, res: Response) {
    const validation = getTransactionSummarySchema.safeParse(req.query);
    if (!validation.success) {
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
      return res.status(400).json({ error: "Store ID is required" });
    }

    // Default to current month if dates not provided
    const now = new Date();
    const startDate = startDateParam || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = endDateParam || now.toISOString();

    if (!req.tenantPrisma) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    try {
      const stats = await transactionService.getDashboardStats(
        storeId,
        startDate,
        endDate,
        req.tenantPrisma
      );

      return res.json(stats);
    } catch (error) {
      console.error("[DASHBOARD_STATS] Error:", error);
      return res.status(500).json({
        error: "Failed to fetch dashboard stats",
        message: String(error)
      });
    }
  }

  async exchangeTransaction(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Transaction ID is required" });
    }
    const userId = req.userId!;

    if (!req.tenantPrisma) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const transaction = await transactionService.getTransaction(
      id,
      req.store?.id,
      req.tenantPrisma
    );
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const validation = exchangeTransactionSchema.safeParse(req.body);
    if (!validation.success) {
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

    return res.json({
      message: "Exchange processed successfully",
      result,
    });
  }

  async repayDebt(req: AuthRequest, res: Response) {
    const userId = req.userId!;

    const validation = repayDebtSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
    }
    const { customerId, amount, storeId } = validation.data;

    if (!req.tenantPrisma) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const result = await transactionService.repayDebt(
      customerId,
      new Decimal(amount),
      storeId,
      userId,
      req.tenantPrisma
    );

    return res.json({
      message: "Debt repayment processed successfully",
      transaction: result,
    });
  }

  async transferStock(req: AuthRequest, res: Response) {
    const validation = transferStockSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input data",
        details: validation.error.issues,
      });
    }

    const { targetStoreId, productVariationId, quantity } = validation.data;
    const userId = req.userId!;
    const sourceStoreId = req.store?.id;

    if (!sourceStoreId) {
      return res.status(400).json({ error: "Source store ID is required (from context)" });
    }

    if (!req.tenantPrisma) {
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

      return res.json({
        message: "Stock transfer processed successfully",
        transfer: result,
      });
    } catch (error) {
      console.error("Error in transferStock:", error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: String(error) });
    }
  }
  async deleteTransaction(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    if (!req.tenantPrisma) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    try {
      await transactionService.deleteTransaction(
        id,
        req.store?.id || "",
        req.tenantPrisma
      );

      return res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Error in deleteTransaction:", error);
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
