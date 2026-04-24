import {
  PaymentMethod,
  PrismaClient,
  TransactionType,
  Prisma,
} from "../generated/tenant/client";
import { z } from "zod";
import {
  convertCurrency,
  getBaseCurrency,
} from "./currencyService";
import { logger } from "../lib/logger";
import { notificationService } from "./notificationService";
import { fcmService } from "./fcm";

const SERVICE_SOURCE = "transactionsService";

const serviceNormalizeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    };
  }

  return { error };
};

const serviceLogInfo = (
  operation: string,
  data?: Record<string, unknown>
): void => {
  logger.info(`[${SERVICE_SOURCE}] ${operation}`, data);
};

const serviceLogError = (
  operation: string,
  error: unknown,
  data?: Record<string, unknown>
): void => {
  logger.error(`[${SERVICE_SOURCE}] ${operation}`, {
    ...data,
    ...serviceNormalizeError(error),
  });
};




/**
 * Type alias for database client operations.
 * Uses the PrismaClient type directly from the generated client to avoid
 * type incompatibilities caused by different import paths.
 */
export type PrismaClientOrTransaction = PrismaClient | Prisma.TransactionClient;

// Helper to create Decimal from string/number/Decimal
const DecimalSchema = z
  .union([z.number(), z.string(), z.instanceof(Prisma.Decimal)])
  .transform((val) => new Prisma.Decimal(val));


// Zod Schema for getTransactions options
const GetTransactionsOptionsSchema = z.object({
  storeId: z.string(),
  userId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  transactionType: z.nativeEnum(TransactionType).optional(),
  categoryId: z.string().optional(),
  customerId: z.string().optional(),
  groupId: z.string().optional(), // Filter by specific group_id for fetching one POS session
  limit: z.number().optional(),
  page: z.number().optional(),
});

type GetTransactionsOptions = z.infer<typeof GetTransactionsOptionsSchema>;

// Zod Schema for createTransaction data
const PaymentCreateInputSchema = z.object({
  amount: DecimalSchema,
  payment_method: z.nativeEnum(PaymentMethod),
  currency: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
  received_at: z.string().optional(),
  payer_id: z.string().optional(), // Added payer_id
  exchange_rate: DecimalSchema.optional(), // Added exchange_rate
});

type PaymentCreateInput = z.infer<typeof PaymentCreateInputSchema>;

const CreateTransactionDataSchema = z.object({
  product_variation_id: z.string(),
  quantity: z.coerce.number().positive(),
  unit_price: DecimalSchema,
  total_amount: DecimalSchema,
  transaction_type: z.nativeEnum(TransactionType),
  remarks: z.string().optional(),
  customer_id: z.string().nullable().optional(),
  store_id: z.string(),
  userId: z.string(),
  supplier_id: z.string().nullable().optional(),
  supplier_order_id: z.string().nullable().optional(),
  currency: z.string().optional(),
  exchange_rate: DecimalSchema.optional(),
  source_currency: z.string().optional(), // For import transactions with foreign currency
  source_amount: DecimalSchema.optional(), // Original purchase amount in foreign currency
  payment_method: z.nativeEnum(PaymentMethod).optional(),
  payments: z.array(PaymentCreateInputSchema).optional(),
  redeem_points: z.coerce.number().nonnegative().optional(),
  loyalty_discount_amount: DecimalSchema.optional(),
  group_id: z.string().optional(),
  original_transaction_id: z.string().nullable().optional(),
});

type CreateTransactionData = z.infer<typeof CreateTransactionDataSchema>;

const ExchangeTransactionDataSchema = z.object({
  returnQuantity: z.coerce.number().positive(),
  newProductVariationId: z.string(),
  newQuantity: z.coerce.number().positive(),
  newUnitPrice: DecimalSchema.optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
});

type ExchangeTransactionData = z.infer<typeof ExchangeTransactionDataSchema>;

// Helper to round currency to 2 decimal places
// Using Prisma.Decimal for rounding
function roundCurrency(amount: Prisma.Decimal): Prisma.Decimal {
  return amount.toDecimalPlaces(2);
}

// Helper to calculate loyalty points
function calculateLoyaltyPoints(amount: Prisma.Decimal): number {
  // 1 point for every 1000 currency units (example logic)
  return Math.floor(amount.toNumber() / 1000);
}

// Define the type for the transaction with relations
type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: {
    product_variation: {
      include: {
        product: true;
        unit: true;
      };
    };
    customer: true;
    supplier: true;
    payments: true;
    returns: {
      include: {
        product_variation: {
          include: {
            product: true,
            unit: true;
          };
        };
        customer: true;
        supplier: true;
        payments: true;
      };
    };
  };
}>;

// Helper to map transaction response
function mapTransactionResponse(transaction: TransactionWithRelations) {
  return {
    ...transaction,
    // Flatten product_name and variation_name for frontend convenience
    product_name: transaction.product_variation?.product?.name || null,
    variation_name: transaction.product_variation?.name || null,
    unit_price: transaction.unit_price.toNumber(),
    total_amount: transaction.total_amount.toNumber(),
    selling_price: transaction.selling_price.toNumber(),
    delivery_cost: transaction.delivery_cost.toNumber(),
    loyalty_discount_amount: transaction.loyalty_discount_amount.toNumber(),
    payments: transaction.payments?.map((p) => ({
      amount: p.amount.toNumber(),
    })),
    returns: transaction.returns?.map((r) => ({
      ...r,
      product_name: r.product_variation?.product?.name || null,
      variation_name: r.product_variation?.name || null,
      unit_price: r.unit_price.toNumber(),
      total_amount: r.total_amount.toNumber(),
      selling_price: r.selling_price.toNumber(),
      delivery_cost: r.delivery_cost.toNumber(),
      loyalty_discount_amount: r.loyalty_discount_amount.toNumber(),
      payments: r.payments?.map((p) => ({
        ...p,
        amount: p.amount.toNumber(),
      })),
      returns: [], // Avoid infinite recursion
    })),
  };
}

// Helper to sanitize payments
function sanitizePayments(
  payments: PaymentCreateInput[] | undefined
): PaymentCreateInput[] {
  if (!payments || payments.length === 0) {
    return [];
  }
  return payments;
}

export async function getTransactions(
  options: GetTransactionsOptions,
  prismaClient: PrismaClientOrTransaction
) {
  const startedAt = Date.now();

  try {
    const parsedOptions = GetTransactionsOptionsSchema.parse(options);
    const where = buildTransactionWhereClause(parsedOptions);
    const limit = parsedOptions.limit || 50;
    const page = parsedOptions.page || 1;

    serviceLogInfo("Get transactions started", {
      storeId: parsedOptions.storeId,
      userId: parsedOptions.userId,
      page,
      limit,
    });

    const [transactions, total] = await Promise.all([
      prismaClient.transaction.findMany({
        where,
        include: {
          product_variation: {
            include: {
              product: true,
              unit: true,
            },
          },
          customer: true,
          supplier: true,
          payments: true,
          returns: {
            include: {
              product_variation: {
                include: {
                  product: true,
                  unit: true,
                },
              },
              customer: true,
              supplier: true,
              payments: true,
            },
          },
        },
        orderBy: { transaction_date: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prismaClient.transaction.count({ where }),
    ]);


    // FISCALIZATION DISABLED - Fiscal receipt fetching commented out
    // const fiscalReceipts = groupIds.length > 0 ? await prismaClient.fiscalReceipt.findMany({
    //   where: { group_id: { in: groupIds } },
    //   select: { group_id: true, status: true, id: true, qr_code_url: true, receipt_number: true }
    // }) : [];
    // const fiscalMap = new Map(fiscalReceipts.map((f) => [f.group_id!, f]));
    // const fiscalMap = new Map();

    const result = {
      transactions: transactions.map((t) => {
        // FISCALIZATION DISABLED - fiscal data commented out
        // const fiscal = t.group_id ? fiscalMap.get(t.group_id) : undefined;
        return {
          ...mapTransactionResponse(t),
          // FISCALIZATION DISABLED
          fiscal_status: null,
          fiscal_receipt_id: null,
          fiscal_qr_url: null,
          fiscal_receipt_number: null,
        };
      }),
      pagination: {
        total,
        limit,
        page,
        pages: Math.ceil(total / limit),
      },
    };

    serviceLogInfo("Get transactions completed", {
      storeId: parsedOptions.storeId,
      userId: parsedOptions.userId,
      page,
      limit,
      durationMs: Date.now() - startedAt,
      count: result.transactions.length,
      total,
    });

    return result;
  } catch (error) {
    serviceLogError("Get transactions failed", error, {
      storeId: options.storeId,
      userId: options.userId,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

export async function getTransactionsByGroupId(
  storeId: string,
  groupId: string,
  prismaClient: PrismaClientOrTransaction
) {
  const startedAt = Date.now();

  try {
    serviceLogInfo("Get transactions by group started", {
      storeId,
      groupId,
    });

    const transactions = await prismaClient.transaction.findMany({
      where: { store_id: storeId, group_id: groupId },
      include: {
        product_variation: {
          include: {
            product: true,
            unit: true,
          },
        },
        customer: true,
        supplier: true,
        payments: true,
        returns: {
          include: {
            product_variation: {
              include: {
                product: true,
                unit: true,
              },
            },
            customer: true,
            supplier: true,
            payments: true,
          },
        },
      },
      orderBy: { transaction_date: "desc" },
    });

    const result = transactions.map(mapTransactionResponse);

    serviceLogInfo("Get transactions by group completed", {
      storeId,
      groupId,
      durationMs: Date.now() - startedAt,
      count: result.length,
    });

    return result;
  } catch (error) {
    serviceLogError("Get transactions by group failed", error, {
      storeId,
      groupId,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

// --- Validation & Calculation Helpers ---

function buildTransactionWhereClause(
  options: GetTransactionsOptions
): Prisma.TransactionWhereInput {
  const {
    storeId,
    startDate,
    endDate,
    transactionType,
    categoryId,
    customerId,
    groupId,
  } = options;

  return {
    store_id: storeId,
    ...(customerId && { customer_id: customerId }),
    ...(transactionType && { transaction_type: transactionType }),
    ...(groupId && { group_id: groupId }),
    ...(startDate &&
      endDate && {
      transaction_date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }),
    ...(categoryId && {
      product_variation: {
        product: {
          product_category_id: categoryId,
        },
      },
    }),
  };
}

function validateReturnEligibility(
  originalTransaction: { transaction_type: TransactionType; quantity: number },
  quantityToReturn: number
) {
  if (originalTransaction.transaction_type !== "export") {
    throw new Error("Only export transactions can be returned");
  }

  if (quantityToReturn > originalTransaction.quantity) {
    throw new Error("Return quantity cannot exceed original quantity");
  }
}

function calculateRefundAmount(
  unitPrice: Prisma.Decimal,
  quantityToReturn: number
) {
  return roundCurrency(unitPrice.times(quantityToReturn));
}

function calculateExchangeFinancials(
  refundAmount: Prisma.Decimal,
  newUnitPrice: Prisma.Decimal,
  newQuantity: number
) {
  const saleAmount = roundCurrency(newUnitPrice.times(newQuantity));
  const netAmount = saleAmount.minus(refundAmount);
  return { saleAmount, netAmount };
}

function validateRepaymentAmount(amount: Prisma.Decimal) {
  if (amount.lessThanOrEqualTo(0)) {
    throw new Error("Repayment amount must be positive");
  }
}

// --- Helper Functions ---


async function validateProductVariation(
  tx: Prisma.TransactionClient,
  productVariationId: string
) {
  const productVariation = await tx.productVariation.findUnique({
    where: { id: productVariationId },
    include: { product: true },
  });

  if (!productVariation) {
    throw new Error("Product variation not found");
  }
  return productVariation;
}

// Transfer Validation Helpers
async function validateStore(
  tx: Prisma.TransactionClient,
  storeId: string,
  storeName: "source" | "destination"
): Promise<{ id: string; name: string }> {
  // Query public schema for store (stores are in public schema, not tenant schema)
  const stores = await tx.$queryRaw<{ id: string; name: string }[]>`
    SELECT id, name FROM public.stores
    WHERE id = ${storeId}
    LIMIT 1
  `;

  if (!stores || stores.length === 0) {
    throw new Error(`${storeName} store not found: ${storeId}`);
  }
  return stores[0]!; // Non-null assertion: we just validated length > 0
}

async function validateProductInStore(
  tx: Prisma.TransactionClient,
  productVariationId: string,
  storeId: string
) {
  const productVariation = await tx.productVariation.findFirst({
    where: {
      id: productVariationId,
      OR: [
        { store_id: storeId },
        { store_id: null }, // Global products
      ],
    },
    include: { product: true },
  });

  if (!productVariation) {
    throw new Error(
      `Product variation ${productVariationId} not available in store ${storeId}`
    );
  }
  return productVariation;
}

async function checkInventoryAvailability(
  tx: Prisma.TransactionClient,
  storeId: string,
  productVariationId: string,
  requiredQuantity: number,
  productName?: string
) {
  const inventory = await tx.inventory.findFirst({
    where: {
      product_variation_id: productVariationId,
      store_id: storeId,
    },
  });

  if (!inventory) {
    throw new Error(
      `No inventory found for product${productName ? ` "${productName}"` : ""} in store ${storeId}`
    );
  }

  if (inventory.quantity_in_stock < requiredQuantity) {
    throw new Error(
      `Insufficient stock for product${productName ? ` "${productName}"` : ""}. Available: ${inventory.quantity_in_stock}, Required: ${requiredQuantity}`
    );
  }

  return inventory;
}


async function handleOutgoingStock(
  tx: Prisma.TransactionClient,
  storeId: string,
  productVariationId: string,
  productName: string,
  variationName: string,
  quantity: number,
  fallbackUnitCost: Prisma.Decimal
) {
  // 1. Check total available stock (Inventory Aggregate)
  const inventory = await tx.inventory.findFirst({
    where: { product_variation_id: productVariationId, store_id: storeId },
  });

  if (!inventory || inventory.quantity_in_stock < quantity) {
    throw new Error(
      `Insufficient stock for product: ${productName} (${variationName})`
    );
  }

  // 2. Allocate from Batches (FIFO)
  const batches = await tx.inventoryBatch.findMany({
    where: {
      product_variation_id: productVariationId,
      store_id: storeId,
      quantity_remaining: { gt: 0 },
    },
    orderBy: { received_at: "asc" }, // Oldest first
  });

  let remainingToAllocate = quantity;
  let totalCost = new Prisma.Decimal(0);
  const allocationsToCreate: { batch_id: string; quantity: number }[] = [];

  for (const batch of batches) {
    if (remainingToAllocate <= 0) break;

    const allocateAmount = Math.min(
      batch.quantity_remaining,
      remainingToAllocate
    );

    // Update batch remaining quantity
    await tx.inventoryBatch.update({
      where: { id: batch.id },
      data: { quantity_remaining: { decrement: allocateAmount } },
    });

    // Accumulate cost
    totalCost = totalCost.plus(batch.cost_price.times(allocateAmount));

    // Track allocation
    allocationsToCreate.push({
      batch_id: batch.id,
      quantity: allocateAmount,
    });

    remainingToAllocate -= allocateAmount;
  }

  // Handle unallocated (Legacy/Missing batch)
  if (remainingToAllocate > 0) {
    // Use product price as fallback when no batches are available
    totalCost = totalCost.plus(fallbackUnitCost.times(remainingToAllocate));
  }

  // Update Aggregate Inventory
  await tx.inventory.update({
    where: { id: inventory.id },
    data: { quantity_in_stock: { decrement: quantity } },
  });

  return { totalCost, allocationsToCreate };
}

async function handleIncomingStock(
  tx: Prisma.TransactionClient,
  storeId: string,
  productVariationId: string,
  quantity: number
) {
  const existingInventory = await tx.inventory.findFirst({
    where: { product_variation_id: productVariationId, store_id: storeId },
  });

  if (existingInventory) {
    await tx.inventory.update({
      where: { id: existingInventory.id },
      data: { quantity_in_stock: { increment: quantity } },
    });
  } else {
    await tx.inventory.create({
      data: {
        product_variation_id: productVariationId,
        store_id: storeId,
        quantity_in_stock: quantity,
      },
    });
  }
}

async function handleInventoryAdjustment(
  tx: Prisma.TransactionClient,
  storeId: string,
  productVariationId: string,
  quantity: number,
  fallbackUnitCost: Prisma.Decimal
) {
  const existingInventory = await tx.inventory.findFirst({
    where: { product_variation_id: productVariationId, store_id: storeId },
  });

  const currentQty = existingInventory?.quantity_in_stock || 0;
  let totalCost = new Prisma.Decimal(0);
  const allocationsToCreate: { batch_id: string; quantity: number }[] = [];

  if (quantity < 0) {
    // Outgoing adjustment (Shrinkage)
    const absQuantity = Math.abs(quantity);

    if (currentQty < absQuantity) {
      throw new Error(`Cannot adjust: resulting stock would be negative.`);
    }
    await tx.inventory.update({
      where: { id: existingInventory!.id },
      data: { quantity_in_stock: { increment: quantity } }, // quantity is negative
    });

    const batches = await tx.inventoryBatch.findMany({
      where: {
        product_variation_id: productVariationId,
        store_id: storeId,
        quantity_remaining: { gt: 0 },
      },
      orderBy: { received_at: "asc" },
    });

    let remainingToAllocate = absQuantity;

    for (const batch of batches) {
      if (remainingToAllocate <= 0) break;
      const allocateAmount = Math.min(
        batch.quantity_remaining,
        remainingToAllocate
      );

      await tx.inventoryBatch.update({
        where: { id: batch.id },
        data: { quantity_remaining: { decrement: allocateAmount } },
      });

      totalCost = totalCost.plus(batch.cost_price.times(allocateAmount));
      allocationsToCreate.push({
        batch_id: batch.id,
        quantity: allocateAmount,
      });
      remainingToAllocate -= allocateAmount;
    }

    if (remainingToAllocate > 0) {
      totalCost = totalCost.plus(fallbackUnitCost.times(remainingToAllocate));
    }
  } else {
    // Incoming adjustment (Found stock)
    if (existingInventory) {
      await tx.inventory.update({
        where: { id: existingInventory.id },
        data: { quantity_in_stock: { increment: quantity } },
      });
    } else {
      await tx.inventory.create({
        data: {
          product_variation_id: productVariationId,
          store_id: storeId,
          quantity_in_stock: quantity,
        },
      });
    }
  }

  return { totalCost, allocationsToCreate };
}

async function redeemLoyaltyPoints(
  tx: Prisma.TransactionClient,
  customerId: string | null | undefined,
  redeemPoints: number | undefined
) {
  if (customerId && redeemPoints && redeemPoints > 0) {
    const loyaltyCard = await tx.loyaltyCard.findUnique({
      where: { customer_id: customerId },
    });

    if (!loyaltyCard || loyaltyCard.points < redeemPoints) {
      throw new Error("Insufficient loyalty points");
    }

    await tx.loyaltyCard.update({
      where: { customer_id: customerId },
      data: { points: { decrement: redeemPoints } },
    });
  }
}

async function createTransactionRecord(
  tx: Prisma.TransactionClient,
  data: CreateTransactionData,
  transactionCostPrice: Prisma.Decimal,
  sellingPrice: Prisma.Decimal,
  loyaltyDiscountAmount: Prisma.Decimal,
  currency: string = "UZS",
  exchangeRate: Prisma.Decimal = new Prisma.Decimal(1)
) {
  return await tx.transaction.create({
    data: {
      product_variation_id: data.product_variation_id,
      quantity: data.quantity,
      unit_price: data.unit_price,
      total_amount: data.total_amount,
      transaction_type: data.transaction_type,
      remarks: data.remarks || null,
      customer_id: data.customer_id || null,
      store_id: data.store_id,
      user_id: data.userId,
      supplier_id: data.supplier_id || null,
      supplier_order_id: data.supplier_order_id || null,
      selling_price: sellingPrice,
      delivery_cost: transactionCostPrice,
      loyalty_discount_amount: loyaltyDiscountAmount,
      group_id: data.group_id || null,
      original_transaction_id: data.original_transaction_id || null,
      currency,
      exchange_rate: exchangeRate,
    },
  });
}

async function createPostTransactionRecords(
  tx: Prisma.TransactionClient,
  transactionId: string,
  data: CreateTransactionData,
  allocationsToCreate: { batch_id: string; quantity: number }[],
  transactionCostPrice: Prisma.Decimal,
  deliveryCost: Prisma.Decimal | null,
  isServiceProduct: boolean = false
) {
  // Services don't have inventory batches or allocations
  if (isServiceProduct) {
    return;
  }

  // Create Allocations (Outgoing)
  if (allocationsToCreate.length > 0) {
    await tx.inventoryBatchAllocation.createMany({
      data: allocationsToCreate.map((a) => ({
        batch_id: a.batch_id,
        reference_type: "transaction",
        reference_id: transactionId,
        quantity: a.quantity,
      })),
    });
  }

  // Create New Batch (Incoming)
  if (
    data.transaction_type === "import" ||
    data.transaction_type === "return" ||
    data.transaction_type === "transfer_in" ||
    (data.transaction_type === "adjustment" && data.quantity > 0)
  ) {
    await tx.inventoryBatch.create({
      data: {
        product_variation_id: data.product_variation_id,
        store_id: data.store_id,
        transaction_id: transactionId,
        quantity_received: data.quantity,
        quantity_remaining: data.quantity,
        cost_price: transactionCostPrice,
        delivery_cost: deliveryCost ?? null,
      },
    });
  }
}

async function processPayments(
  tx: Prisma.TransactionClient,
  transactionId: string,
  payments: PaymentCreateInput[] | undefined,
  paymentMethod: PaymentMethod | undefined,
  totalAmount: Prisma.Decimal,
  exchangeRate: Prisma.Decimal = new Prisma.Decimal(1)
) {
  const sanitizedPayments = sanitizePayments(payments);

  if (sanitizedPayments.length > 0) {
    await tx.payment.createMany({
      data: sanitizedPayments.map((p) => ({
        transaction_id: transactionId,
        amount: p.amount,
        payment_method: p.payment_method,
        currency: p.currency || "UZS",
        exchange_rate: p.exchange_rate || exchangeRate,
        reference: p.reference || null,
        received_at: p.received_at ? new Date(p.received_at) : new Date(),
        payer_id: p.payer_id || null,
      })),
    });
  } else if (paymentMethod) {
    await tx.payment.create({
      data: {
        transaction_id: transactionId,
        amount: totalAmount,
        payment_method: paymentMethod,
        currency: "UZS",
        exchange_rate: exchangeRate,
        received_at: new Date(),
      },
    });
  }
}

async function accrueLoyaltyPoints(
  tx: Prisma.TransactionClient,
  customerId: string | null | undefined,
  transactionType: TransactionType,
  totalAmount: Prisma.Decimal
) {
  if (customerId && transactionType === "export") {
    const pointsEarned = calculateLoyaltyPoints(totalAmount);
    if (pointsEarned > 0) {
      await tx.loyaltyCard.upsert({
        where: { customer_id: customerId },
        update: { points: { increment: pointsEarned } },
        create: {
          customer_id: customerId,
          card_number: `CARD-${customerId}`,
          points: pointsEarned,
        },
      });
    }
  }
}

export async function createTransaction(
  data: CreateTransactionData,
  prismaClient: PrismaClientOrTransaction
) {
  const startedAt = Date.now();
  const requestMeta = {
    storeId: data.store_id,
    transactionType: data.transaction_type,
    productVariationId: data.product_variation_id,
    quantity: data.quantity,
    userId: data.userId,
  };

  try {
    const parsedData = CreateTransactionDataSchema.parse(data);
    const {
      product_variation_id,
      store_id,
      transaction_type,
      quantity,
      unit_price,
    } = parsedData;

    serviceLogInfo("Create transaction started", requestMeta);

    const execute = async (tx: Prisma.TransactionClient) => {
      // 1. Validate Product Variation
      const productVariation = await validateProductVariation(
        tx,
        product_variation_id
      );

      // 2. Get base currency for store
      const baseCurrency = await getBaseCurrency(store_id, tx);

      // 3. Determine cost price with currency conversion
      let transactionCostPrice = new Prisma.Decimal(unit_price.toString());
      let appliedExchangeRate = new Prisma.Decimal(1);
      let transactionCurrency = parsedData.currency || baseCurrency.code;
      let sourceCurrency = parsedData.source_currency;
      let sourceAmount = parsedData.source_amount;

      // For import transactions, handle currency conversion
      if (
        transaction_type === "import" &&
        sourceCurrency &&
        sourceAmount &&
        sourceCurrency !== baseCurrency.code
      ) {
        const conversion = await convertCurrency(
          sourceAmount,
          sourceCurrency,
          baseCurrency.code,
          store_id,
          tx,
          parsedData.exchange_rate
        );

        transactionCostPrice = conversion.convertedAmount;
        appliedExchangeRate = conversion.exchangeRate;
        transactionCurrency = baseCurrency.code;
      }

      let allocationsToCreate: { batch_id: string; quantity: number }[] = [];

      // Check if this is a service product (no inventory tracking)
      const isServiceProduct = productVariation.product.type === "service";

      // 4. Handle Inventory Updates & FIFO Batching
      // Services skip all inventory operations - they are sold directly without stock
      if (isServiceProduct) {
        // For services: use product price as cost (for profit calculation)
        transactionCostPrice = productVariation.price;
      } else if (
        transaction_type === "export" ||
        transaction_type === "transfer_out" ||
        transaction_type === "supplier_return" ||
        transaction_type === "internal_use"
      ) {
        // Use base currency cost from product variation
        const result = await handleOutgoingStock(
          tx,
          store_id,
          product_variation_id,
          productVariation.product.name,
          productVariation.name,
          quantity,
          productVariation.price
        );
        allocationsToCreate = result.allocationsToCreate;
        if (quantity > 0) {
          transactionCostPrice = result.totalCost.div(quantity);
        }
      } else if (
        transaction_type === "import" ||
        transaction_type === "return" ||
        transaction_type === "transfer_in"
      ) {
        await handleIncomingStock(tx, store_id, product_variation_id, quantity);
      } else if (transaction_type === "adjustment") {
        const result = await handleInventoryAdjustment(
          tx,
          store_id,
          product_variation_id,
          quantity,
          productVariation.price
        );
        allocationsToCreate = result.allocationsToCreate;
        if (Math.abs(quantity) > 0) {
          transactionCostPrice = result.totalCost.div(Math.abs(quantity));
        }
      }

      // 5. Handle Loyalty Points (Redemption)
      await redeemLoyaltyPoints(
        tx,
        parsedData.customer_id,
        parsedData.redeem_points
      );

      // 6. Create Transaction Record
      const transaction = await createTransactionRecord(
        tx,
        parsedData,
        transactionCostPrice,
        productVariation.selling_price,
        parsedData.loyalty_discount_amount || new Prisma.Decimal(0),
        transactionCurrency,
        appliedExchangeRate
      );

      // 7. Store source currency info if provided
      if (sourceCurrency && sourceAmount) {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            source_currency: sourceCurrency,
            source_amount: sourceAmount,
          },
        });
      }

      // 8. Post-Transaction Batch Operations
      await createPostTransactionRecords(
        tx,
        transaction.id,
        parsedData,
        allocationsToCreate,
        transactionCostPrice,
        null,
        isServiceProduct
      );

      // 6. Handle Payments
      await processPayments(
        tx,
        transaction.id,
        parsedData.payments,
        parsedData.payment_method,
        parsedData.total_amount,
        parsedData.exchange_rate
      );

      // 7. Handle Loyalty Points (Accrual)
      await accrueLoyaltyPoints(
        tx,
        parsedData.customer_id,
        parsedData.transaction_type,
        parsedData.total_amount
      );

      // 8. Fetch and return the complete transaction
      const fullTransaction = await tx.transaction.findUniqueOrThrow({
        where: { id: transaction.id },
        include: {
          product_variation: {
            include: {
              product: true,
              unit: true,
            },
          },
          customer: true,
          supplier: true,
          payments: true,
          returns: {
            include: {
              product_variation: {
                include: {
                  product: true,
                  unit: true,
                },
              },
              customer: true,
              supplier: true,
              payments: true,
            },
          },
        },
      });

      return mapTransactionResponse(fullTransaction);
    };

    // Execute transaction
    const transactionResult = await ("$transaction" in prismaClient
      ? (prismaClient as PrismaClient).$transaction(execute)
      : execute(prismaClient as Prisma.TransactionClient));

    // Send Telegram notification to organization owner
    try {
      // Get store details from tenant prisma
      const store = await prismaClient.store.findUnique({
        where: { id: parsedData.store_id },
        select: {
          name: true,
          organization_id: true,
        },
      });

      if (store && store.organization_id) {
        // Map transaction types to notification types
        const notificationTypeMap: Record<
          string,
          | "sale"
          | "refund"
          | "import"
          | "transfer_in"
          | "transfer_out"
          | "adjustment"
          | "internal_use"
          | "supplier_return"
          | "debt"
        > = {
          export: "sale",
          debt: "debt",
          return: "refund",
          import: "import",
          transfer_in: "transfer_in",
          transfer_out: "transfer_out",
          adjustment: "adjustment",
          internal_use: "internal_use",
          supplier_return: "supplier_return",
        };

        const notificationType = notificationTypeMap[parsedData.type] || "sale";

        await notificationService.notifyTransactionToOwner({
          organizationId: store.organization_id,
          storeName: store.name,
          transactionAmount: parsedData.total_amount,
          transactionType: notificationType,
          description: parsedData.description,
          remarks: parsedData.remarks,
          itemCount: parsedData.items?.length,
          currency: parsedData.currency,
          transactionId: transactionResult.id,
        });

          const pushTitle = `${store.name}: ${notificationType.replace(/_/g, " ")}`;
          const pushBody = productName
            ? `${productName} x${quantity} • ${parsedData.total_amount.toNumber()} ${parsedData.currency || "UZS"}`
            : `${parsedData.total_amount.toNumber()} ${parsedData.currency || "UZS"}`;

          await fcmService.sendToOrganizationOwner(store.organization_id, {
            title: pushTitle,
            body: pushBody,
            data: {
              organizationId: store.organization_id,
              storeName: store.name,
              transactionId: transactionResult.id,
              transactionType: notificationType,
            },
          });
        }
      }
    } catch (error) {
      // Log error but don't fail the transaction
      logger.error("Failed to send transaction notifications", "transactions", {
        error: (error as Error).message,
        transactionId: transactionResult.id,
      });
    }

    serviceLogInfo("Create transaction completed", {
      ...requestMeta,
      durationMs: Date.now() - startedAt,
      transactionId: transactionResult.id,
    });

    return transactionResult;
  } catch (error) {
    serviceLogError("Create transaction failed", error, {
      ...requestMeta,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

export async function getTransaction(
  id: string,
  storeId: string | undefined,
  prismaClient: PrismaClientOrTransaction
) {
  const startedAt = Date.now();

  try {
    serviceLogInfo("Get transaction started", {
      transactionId: id,
      storeId: storeId ?? null,
    });

    const transaction = await prismaClient.transaction.findUnique({
      where: { id },
      include: {
        product_variation: {
          include: {
            product: true,
            unit: true,
          },
        },

        customer: true,
        supplier: true,
        payments: true,
        returns: {
          include: {
            product_variation: {
              include: {
                product: true,
                unit: true,
              },
            },
            customer: true,
            supplier: true,
            payments: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (storeId && transaction.store_id !== storeId) {
      throw new Error("Access denied");
    }

    const result = mapTransactionResponse(transaction);

    serviceLogInfo("Get transaction completed", {
      transactionId: id,
      storeId: storeId ?? null,
      durationMs: Date.now() - startedAt,
    });

    return result;
  } catch (error) {
    serviceLogError("Get transaction failed", error, {
      transactionId: id,
      storeId: storeId ?? null,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

export async function returnTransaction(
  id: string,
  userId: string,
  returnQuantity: number | undefined,
  prismaClient: PrismaClientOrTransaction
) {
  const startedAt = Date.now();

  try {
    serviceLogInfo("Return transaction started", {
      transactionId: id,
      userId,
      returnQuantity: returnQuantity ?? null,
    });

    const execute = async (tx: Prisma.TransactionClient) => {
      const originalTransaction = await tx.transaction.findUnique({
        where: { id },
        include: {
          product_variation: true,
        },
      });

      if (!originalTransaction) {
        throw new Error("Transaction not found");
      }

      const quantityToReturn = returnQuantity || originalTransaction.quantity;

      validateReturnEligibility(originalTransaction, quantityToReturn);

      // Always refund the exact value of the returned quantity as a single payment.
      const refundTotal = calculateRefundAmount(
        originalTransaction.unit_price,
        quantityToReturn
      );

      // Create return transaction
      const returnTx = await createTransaction(
        {
          product_variation_id: originalTransaction.product_variation_id!,
          quantity: quantityToReturn,
          unit_price: originalTransaction.unit_price,
          total_amount: refundTotal,
          transaction_type: "return",
          remarks: `Return for transaction ${id}`,
          customer_id: originalTransaction.customer_id,
          store_id: originalTransaction.store_id,
          userId,
          payment_method: PaymentMethod.cash,
          group_id: originalTransaction.group_id || undefined,
          original_transaction_id: originalTransaction.id,
        },
        tx
      );

      return returnTx;
    };

    const result = "$transaction" in prismaClient
      ? await (prismaClient as PrismaClient).$transaction(execute)
      : await execute(prismaClient as Prisma.TransactionClient);

    serviceLogInfo("Return transaction completed", {
      transactionId: id,
      userId,
      returnQuantity: returnQuantity ?? null,
      durationMs: Date.now() - startedAt,
      resultTransactionId: result.id,
    });

    return result;
  } catch (error) {
    serviceLogError("Return transaction failed", error, {
      transactionId: id,
      userId,
      returnQuantity: returnQuantity ?? null,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

export async function exchangeTransaction(
  originalTransactionId: string,
  userId: string,
  exchangeData: ExchangeTransactionData,
  prismaClient: PrismaClientOrTransaction
) {
  const startedAt = Date.now();

  try {
    const parsedExchangeData = ExchangeTransactionDataSchema.parse(exchangeData);

    serviceLogInfo("Exchange transaction started", {
      originalTransactionId,
      userId,
      returnQuantity: parsedExchangeData.returnQuantity,
      newProductVariationId: parsedExchangeData.newProductVariationId,
      newQuantity: parsedExchangeData.newQuantity,
    });

    const execute = async (tx: Prisma.TransactionClient) => {
      // 1. Process Return
      const originalTx = await tx.transaction.findUnique({
        where: { id: originalTransactionId },
      });

      if (!originalTx) throw new Error("Original transaction not found");

      validateReturnEligibility(
        originalTx,
        parsedExchangeData.returnQuantity
      );

      const refundAmount = calculateRefundAmount(
        originalTx.unit_price,
        parsedExchangeData.returnQuantity
      );

      // Fetch new product for sale
      const newProduct = await validateProductVariation(
        tx,
        parsedExchangeData.newProductVariationId
      );

      const unitPrice =
        parsedExchangeData.newUnitPrice ?? newProduct.selling_price;

      const { netAmount, saleAmount } = calculateExchangeFinancials(
        refundAmount,
        unitPrice,
        parsedExchangeData.newQuantity
      );

      // Create Return Transaction
      await createTransaction(
        {
          product_variation_id: originalTx.product_variation_id!,
          quantity: parsedExchangeData.returnQuantity,
          unit_price: originalTx.unit_price,
          total_amount: refundAmount,
          transaction_type: "return",
          remarks: `Exchange Return for ${originalTransactionId}`,
          customer_id: originalTx.customer_id,
          store_id: originalTx.store_id,
          userId,
          payment_method: parsedExchangeData.paymentMethod || PaymentMethod.cash,
          group_id: originalTx.group_id || undefined,
        },
        tx
      );

      // Create New Sale Transaction
      const newSaleTx = await createTransaction(
        {
          product_variation_id: parsedExchangeData.newProductVariationId,
          quantity: parsedExchangeData.newQuantity,
          unit_price: unitPrice,
          total_amount: saleAmount,
          transaction_type: "export",
          remarks: `Exchange Sale for ${originalTransactionId}`,
          customer_id: originalTx.customer_id,
          store_id: originalTx.store_id,
          userId,
          payment_method: parsedExchangeData.paymentMethod || PaymentMethod.cash,
          group_id: originalTx.group_id || undefined,
        },
        tx
      );

      return {
        netAmount: netAmount.toNumber(),
        newTransaction: newSaleTx,
      };
    };

    const result = "$transaction" in prismaClient
      ? await (prismaClient as PrismaClient).$transaction(execute)
      : await execute(prismaClient as Prisma.TransactionClient);

    serviceLogInfo("Exchange transaction completed", {
      originalTransactionId,
      userId,
      durationMs: Date.now() - startedAt,
      newTransactionId: result.newTransaction.id,
    });

    return result;
  } catch (error) {
    serviceLogError("Exchange transaction failed", error, {
      originalTransactionId,
      userId,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

export async function repayDebt(
  customerId: string,
  amount: number | string | Prisma.Decimal,
  storeId: string,
  userId: string,
  prismaClient: PrismaClientOrTransaction
) {
  const startedAt = Date.now();

  try {
    const repaymentAmount = DecimalSchema.parse(amount);

    validateRepaymentAmount(repaymentAmount);

    serviceLogInfo("Repay debt started", {
      customerId,
      storeId,
      userId,
      amount: repaymentAmount.toNumber(),
    });

    const execute = async (tx: Prisma.TransactionClient) => {
      // We need a transaction record for the repayment
      // Usually debt repayment is a financial transaction, not inventory.
      // product_variation_id is optional.

      const transaction = await tx.transaction.create({
        data: {
          transaction_type: "repayment",
          total_amount: repaymentAmount,
          quantity: 1, // Dummy quantity
          unit_price: repaymentAmount,
          customer_id: customerId,
          store_id: storeId,
          user_id: userId,
          selling_price: new Prisma.Decimal(0),
          delivery_cost: new Prisma.Decimal(0),
          remarks: "Debt repayment",
          transaction_date: new Date(),
          // product_variation_id is null
          // group_id is null
        },
      });

      // Create payment record
      await processPayments(
        tx,
        transaction.id,
        undefined, // no list of payments
        PaymentMethod.cash, // Default to cash, or pass it in if we extend API
        repaymentAmount
      );

      // Return complete transaction
      // We need to fetch it to match the return type structure (with empty relations)
      const fullTransaction = await tx.transaction.findUniqueOrThrow({
        where: { id: transaction.id },
        include: {
          product_variation: {
            include: {
              product: true,
              unit: true,
            },
          },
          customer: true,
          supplier: true,
          payments: true,
          returns: {
            include: {
              product_variation: {
                include: {
                  product: true,
                  unit: true,
                },
              },
              customer: true,
              supplier: true,
              payments: true,
            },
          },
        },
      });

      return mapTransactionResponse(fullTransaction);
    };

    const result = "$transaction" in prismaClient
      ? await (prismaClient as PrismaClient).$transaction(execute)
      : await execute(prismaClient as Prisma.TransactionClient);

    serviceLogInfo("Repay debt completed", {
      customerId,
      storeId,
      userId,
      amount: repaymentAmount.toNumber(),
      durationMs: Date.now() - startedAt,
      transactionId: result.id,
    });

    return result;
  } catch (error) {
    serviceLogError("Repay debt failed", error, {
      customerId,
      storeId,
      userId,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

export async function transferStock(
  sourceStoreId: string,
  targetStoreId: string,
  productVariationId: string,
  quantity: number,
  userId: string,
  prismaClient: PrismaClientOrTransaction
) {
  const startedAt = Date.now();

  serviceLogInfo("Transfer stock started", {
    sourceStoreId,
    targetStoreId,
    productVariationId,
    quantity,
    userId,
  });

  try {
    // Input validation
    if (quantity <= 0) {
      throw new Error("Transfer quantity must be positive");
    }

    if (sourceStoreId === targetStoreId) {
      throw new Error("Cannot transfer to the same store");
    }

    // Generate unique group_id to link transfer_in and transfer_out transactions
    const transferGroupId = `transfer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const execute = async (tx: Prisma.TransactionClient) => {
      // 1. Validate both stores exist
      const sourceStore = await validateStore(tx, sourceStoreId, "source");
      const targetStore = await validateStore(tx, targetStoreId, "destination");

      // 2. Verify Product Variation exists and get details
      const pv = await validateProductVariation(tx, productVariationId);
      const productDisplayName = `${pv.product.name} - ${pv.name}`;

      // 3. Pre-check inventory availability before starting transaction
      await checkInventoryAvailability(
        tx,
        sourceStoreId,
        productVariationId,
        quantity,
        productDisplayName
      );

      // 4. Validate product is available in target store (or is global)
      await validateProductInStore(tx, productVariationId, targetStoreId);

      // 5. Handle Outgoing from Source (FIFO cost calculation)
      const { totalCost, allocationsToCreate } = await handleOutgoingStock(
        tx,
        sourceStoreId,
        productVariationId,
        pv.product.name,
        pv.name,
        quantity,
        pv.price
      );

      // Calculate effective unit cost for this transfer
      const transferUnitCost = totalCost.div(quantity);

      // Prepare transfer metadata for audit trail
      const timestamp = new Date().toISOString();
      const transferOutRemarks = `Transfer OUT to "${targetStore.name}" (${targetStoreId}) | Product: ${productDisplayName} | Qty: ${quantity} | User: ${userId} | Time: ${timestamp}`;
      const transferInRemarks = `Transfer IN from "${sourceStore.name}" (${sourceStoreId}) | Product: ${productDisplayName} | Qty: ${quantity} | User: ${userId} | Time: ${timestamp}`;

      // 6. Create Transfer Out Record (Source)
      const transferOutTx = await createTransactionRecord(
        tx,
        {
          product_variation_id: productVariationId,
          store_id: sourceStoreId,
          transaction_type: "transfer_out",
          quantity: quantity,
          unit_price: transferUnitCost,
          total_amount: totalCost,
          userId,
          remarks: transferOutRemarks,
          group_id: transferGroupId, // Link to transfer
          customer_id: null,
          supplier_id: null,
          supplier_order_id: null,
          payment_method: undefined,
          payments: [],
          redeem_points: undefined,
          loyalty_discount_amount: undefined,
        },
        transferUnitCost, // cost price
        pv.selling_price,
        new Prisma.Decimal(0) // loyalty discount
      );

      // 7. Create batch allocations for outgoing stock
      await createPostTransactionRecords(
        tx,
        transferOutTx.id,
        {
          transaction_type: "transfer_out",
          product_variation_id: productVariationId,
          store_id: sourceStoreId,
          quantity: quantity,
          unit_price: transferUnitCost,
          total_amount: totalCost,
          userId,
        } as CreateTransactionData,
        allocationsToCreate,
        transferUnitCost,
        null
      );

      // 8. Handle Incoming to Target (updates aggregate inventory)
      await handleIncomingStock(
        tx,
        targetStoreId,
        productVariationId,
        quantity
      );

      // 9. Create Transfer In Record (Target)
      const transferInTx = await createTransactionRecord(
        tx,
        {
          product_variation_id: productVariationId,
          store_id: targetStoreId,
          transaction_type: "transfer_in",
          quantity: quantity,
          unit_price: transferUnitCost, // Same FIFO cost from source
          total_amount: totalCost,
          userId,
          remarks: transferInRemarks,
          group_id: transferGroupId, // Link to transfer
          customer_id: null,
          supplier_id: null,
          supplier_order_id: null,
          payment_method: undefined,
          payments: [],
          redeem_points: undefined,
          loyalty_discount_amount: undefined,
        },
        transferUnitCost, // cost price
        pv.selling_price,
        new Prisma.Decimal(0)
      );

      // 10. Create new batch for target store
      await createPostTransactionRecords(
        tx,
        transferInTx.id,
        {
          transaction_type: "transfer_in",
          product_variation_id: productVariationId,
          store_id: targetStoreId,
          quantity: quantity,
          unit_price: transferUnitCost,
          total_amount: totalCost,
          userId,
        } as CreateTransactionData,
        [], // No allocations for incoming
        transferUnitCost, // This becomes the cost_price of the new batch
        null
      );

      return {
        transferOut: transferOutTx,
        transferIn: transferInTx,
        groupId: transferGroupId,
        summary: {
          product: productDisplayName,
          quantity,
          fromStore: sourceStore.name,
          toStore: targetStore.name,
          unitCost: transferUnitCost.toNumber(),
          totalCost: totalCost.toNumber(),
        },
      };
    };

    // Execute within transaction
    const result = "$transaction" in prismaClient
      ? await (prismaClient as PrismaClient).$transaction(execute, {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
      : await execute(prismaClient as Prisma.TransactionClient);

    serviceLogInfo("Transfer stock completed", {
      sourceStoreId,
      targetStoreId,
      productVariationId,
      quantity,
      userId,
      durationMs: Date.now() - startedAt,
      transferGroupId: result.groupId,
    });

    return result;
  } catch (error) {
    serviceLogError("Transfer stock failed", error, {
      sourceStoreId,
      targetStoreId,
      productVariationId,
      quantity,
      userId,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}



// ============================================================================
// DASHBOARD STATS HELPERS
// ============================================================================

/** Type for transaction with product variation included */
type DashboardTransaction = Awaited<
  ReturnType<PrismaClientOrTransaction["transaction"]["findMany"]>
>[number] & {
  product_variation: { product: { name: string } | null } | null;
};

/** Accumulators for processing transactions */
interface StatsAccumulators {
  totalIn: Prisma.Decimal;
  totalOut: Prisma.Decimal;
  totalReturn: Prisma.Decimal;
  supplierCost: Prisma.Decimal;
  totalItemsSold: number;
  uniqueGroupIds: Set<string>;
  dailyMap: Map<string, { revenue: number; cogs: number; purchases: number }>;
  productRevenueMap: Map<string, { name: string; revenue: number; quantity: number }>;
  /** Breakdown by transaction type: amount, count, quantity */
  byType: Map<string, { amount: number; count: number; quantity: number }>;
  /** Daily breakdown by transaction type for charts */
  dailyByType: Map<string, Record<string, number>>;
  /** Transfer store information for display */
  transferStores: Map<string, { sourceStore?: string; targetStore?: string; count: number }>;
}

/**
 * Extract store names from transfer transaction remarks
 */
function extractTransferStores(remarks: string | null, transactionType: string): { sourceStore?: string; targetStore?: string } {
  if (!remarks) return {};

  if (transactionType === "transfer_out") {
    // Format: 'Transfer OUT to "Store Name" (store-id) | ...'
    const match = remarks.match(/Transfer OUT to "([^"]+)"/);
    return match ? { targetStore: match[1] } : {};
  } else if (transactionType === "transfer_in") {
    // Format: 'Transfer IN from "Store Name" (store-id) | ...'
    const match = remarks.match(/Transfer IN from "([^"]+)"/);
    return match ? { sourceStore: match[1] } : {};
  }

  return {};
}
async function fetchDashboardTransactions(
  prismaClient: PrismaClientOrTransaction,
  storeId: string,
  start: Date,
  end: Date
): Promise<DashboardTransaction[]> {
  return prismaClient.transaction.findMany({
    where: {
      store_id: storeId,
      transaction_date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      product_variation: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { transaction_date: "desc" },
  }) as Promise<DashboardTransaction[]>;
}

/**
 * Initialize empty accumulators for stats processing
 */
function initializeAccumulators(): StatsAccumulators {
  return {
    totalIn: new Prisma.Decimal(0),
    totalOut: new Prisma.Decimal(0),
    totalReturn: new Prisma.Decimal(0),
    supplierCost: new Prisma.Decimal(0),
    totalItemsSold: 0,
    uniqueGroupIds: new Set<string>(),
    dailyMap: new Map<string, { revenue: number; cogs: number; purchases: number }>(),
    productRevenueMap: new Map<string, { name: string; revenue: number; quantity: number }>(),
    byType: new Map<string, { amount: number; count: number; quantity: number }>(),
    dailyByType: new Map<string, Record<string, number>>(),
    transferStores: new Map<string, { sourceStore?: string; targetStore?: string; count: number }>(),
  };
}

/**
 * Process a single transaction and update accumulators
 */
function processTransactionForStats(
  tx: DashboardTransaction,
  acc: StatsAccumulators
): void {
  const txType = tx.transaction_type;
  const amount = tx.total_amount;
  const cost = tx.delivery_cost.times(tx.quantity);
  const dateKey = tx.transaction_date.toISOString().slice(0, 10);
  const productName = tx.product_variation?.product?.name ?? "Unknown";

  // Accumulate by transaction type (for ALL types)
  const typeEntry = acc.byType.get(txType) ?? { amount: 0, count: 0, quantity: 0 };
  typeEntry.amount += amount.toNumber();
  typeEntry.count += 1;
  typeEntry.quantity += tx.quantity;
  acc.byType.set(txType, typeEntry);

  // Extract transfer store information for transfer transactions
  if (txType === "transfer_in" || txType === "transfer_out") {
    const transferInfo = extractTransferStores(tx.remarks, txType);
    if (transferInfo.sourceStore || transferInfo.targetStore) {
      const existing = acc.transferStores.get(txType) ?? { count: 0 };
      existing.count += 1;
      if (transferInfo.sourceStore) existing.sourceStore = transferInfo.sourceStore;
      if (transferInfo.targetStore) existing.targetStore = transferInfo.targetStore;
      acc.transferStores.set(txType, existing);
    }
  }

  // Accumulate daily by transaction type (for chart)
  if (!acc.dailyByType.has(dateKey)) {
    acc.dailyByType.set(dateKey, {});
  }
  const dailyTypes = acc.dailyByType.get(dateKey)!;
  dailyTypes[txType] = (dailyTypes[txType] ?? 0) + amount.toNumber();

  // Initialize daily entry if not exists
  if (!acc.dailyMap.has(dateKey)) {
    acc.dailyMap.set(dateKey, { revenue: 0, cogs: 0, purchases: 0 });
  }
  const daily = acc.dailyMap.get(dateKey)!;

  // Process by transaction type
  if (txType === "import" || txType === "transfer_in" || (txType === "adjustment" && amount.toNumber() > 0)) {
    // "Purchases" / Added Stock Value
    acc.totalIn = acc.totalIn.plus(amount);
    daily.purchases += amount.toNumber();
  } else if (txType === "export" || txType === "debt") {
    // Sales (export and debt/credit sales)
    acc.totalOut = acc.totalOut.plus(amount);
    acc.supplierCost = acc.supplierCost.plus(cost); // Global COGS accumulator
    acc.totalItemsSold += tx.quantity;

    // Daily breakdown
    daily.revenue += amount.toNumber();
    daily.cogs += cost.toNumber();

    if (tx.group_id) {
      acc.uniqueGroupIds.add(tx.group_id);
    }

    // Aggregate product revenue
    const existing = acc.productRevenueMap.get(productName) ?? { name: productName, revenue: 0, quantity: 0 };
    existing.revenue += amount.toNumber();
    existing.quantity += tx.quantity;
    acc.productRevenueMap.set(productName, existing);
  } else if (txType === "return") {
    acc.totalReturn = acc.totalReturn.plus(amount);
    acc.totalOut = acc.totalOut.minus(amount);

    // Adjust daily revenue (subtract return)
    daily.revenue -= amount.toNumber();
    // Adjust daily COGS (subtract cost of returned items)
    daily.cogs -= cost.toNumber();
    // Adjust global COGS accumulator
    acc.supplierCost = acc.supplierCost.minus(cost);

    const existing = acc.productRevenueMap.get(productName);
    if (existing) {
      existing.revenue -= amount.toNumber();
      existing.quantity -= tx.quantity;
    }
  }
}

/**
 * Calculate derived metrics from accumulated totals
 */
function calculateDerivedMetrics(
  acc: StatsAccumulators,
  transactions: DashboardTransaction[]
): {
  profit: Prisma.Decimal;
  profitMargin: number;
  transactionCount: number;
  avgOrderValue: number;
} {
  const profit = acc.totalOut.minus(acc.supplierCost);
  const profitMargin = acc.totalOut.toNumber() > 0
    ? profit.toNumber() / acc.totalOut.toNumber() * 100
    : 0;
  const transactionCount = acc.uniqueGroupIds.size || transactions.filter(t =>
    t.transaction_type === "export" || t.transaction_type === "debt"
  ).length;
  const avgOrderValue = transactionCount > 0 ? acc.totalOut.toNumber() / transactionCount : 0;

  return { profit, profitMargin, transactionCount, avgOrderValue };
}

/**
 * Build the final dashboard response object
 */
function buildDashboardResponse(
  acc: StatsAccumulators,
  metrics: ReturnType<typeof calculateDerivedMetrics>
) {
  // Build daily breakdown array (sorted by date)
  const dailyBreakdown = Array.from(acc.dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      ...data,
    }));

  // Build daily by type breakdown for chart (sorted by date)
  const dailyByType = Array.from(acc.dailyByType.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, types]) => ({
      date,
      ...types,
    }));

  // Build top products arrays
  const allProducts = Array.from(acc.productRevenueMap.values());
  const topProductsByRevenue = [...allProducts]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(p => ({ name: p.name, revenue: p.revenue }));

  const topProductsByQuantity = [...allProducts]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map(p => ({ name: p.name, quantity: p.quantity }));

  // Build byType breakdown object (all transaction types with their totals)
  const byType: Record<string, { amount: number; count: number; quantity: number }> = {};
  for (const [type, data] of acc.byType.entries()) {
    byType[type] = data;
  }

  // Build transfer store information
  const transferStores: Record<string, { sourceStore?: string; targetStore?: string }> = {};
  for (const [type, data] of acc.transferStores.entries()) {
    transferStores[type] = {
      sourceStore: data.sourceStore,
      targetStore: data.targetStore,
    };
  }

  return {
    // Main stat cards
    totalIn: acc.totalIn.toNumber(),
    totalOut: acc.totalOut.toNumber(),
    profit: metrics.profit.toNumber(),
    supplierCost: acc.supplierCost.toNumber(),
    totalReturn: acc.totalReturn.toNumber(),

    // Detailed stats
    transactionCount: metrics.transactionCount,
    totalItemsSold: acc.totalItemsSold,
    avgOrderValue: metrics.avgOrderValue,
    profitMargin: Math.round(metrics.profitMargin * 100) / 100,

    // Breakdown by transaction type (ALL types)
    byType,

    // Transfer store information for legends
    transferStores,

    // Chart data
    dailyBreakdown,
    dailyByType, // NEW: daily breakdown by transaction type for colorful chart
    topProductsByRevenue,
    topProductsByQuantity,
  };
}

// ============================================================================
// DASHBOARD STATS API
// ============================================================================

/**
 * Dashboard Stats API - Single source of truth for dashboard
 * All calculations done on backend - frontend displays only
 *
 * Flow:
 * 1. fetchDashboardTransactions() - Get all transactions for period
 * 2. initializeAccumulators() - Setup empty counters and maps
 * 3. processTransactionForStats() - Process each transaction (loop)
 * 4. calculateDerivedMetrics() - Compute profit, margins, averages
 * 5. buildDashboardResponse() - Format final response object
 */
export async function getDashboardStats(
  storeId: string,
  startDate: string,
  endDate: string,
  prismaClient: PrismaClientOrTransaction
) {
  const startTime = Date.now();
  const start = new Date(startDate);
  const end = new Date(endDate);

  logger.info("Dashboard stats request started", {
    storeId,
    startDate: startDate.slice(0, 10),
    endDate: endDate.slice(0, 10),
  });

  // 1. Fetch all transactions for the period
  const transactions = await fetchDashboardTransactions(prismaClient, storeId, start, end);
  logger.info("Dashboard transactions fetched", { storeId, count: transactions.length });

  // 2. Initialize accumulators
  const acc = initializeAccumulators();

  // 3. Process each transaction
  for (const tx of transactions) {
    processTransactionForStats(tx, acc);
  }

  // 4. Calculate derived metrics
  const metrics = calculateDerivedMetrics(acc, transactions);

  // 5. Build response
  const response = buildDashboardResponse(acc, metrics);

  const executionTime = Date.now() - startTime;
  logger.info("Dashboard stats completed", {
    storeId,
    transactionCount: transactions.length,
    executionTimeMs: executionTime,
    totalOut: response.totalOut,
    profit: response.profit,
  });

  return response;
}

export const deleteTransaction = async (
  transactionId: string,
  storeId: string,
  tx: PrismaClientOrTransaction
) => {
  const startedAt = Date.now();

  try {
    serviceLogInfo("Delete transaction started", {
      transactionId,
      storeId,
    });

    const transaction = await tx.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.store_id !== storeId) {
      throw new Error("Transaction belongs to another store");
    }

    const result = await tx.transaction.delete({
      where: { id: transactionId },
    });

    serviceLogInfo("Delete transaction completed", {
      transactionId,
      storeId,
      durationMs: Date.now() - startedAt,
    });

    return result;
  } catch (error) {
    serviceLogError("Delete transaction failed", error, {
      transactionId,
      storeId,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
};
