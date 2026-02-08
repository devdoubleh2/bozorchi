/**
 * Transaction Seeder
 * 
 * Creates realistic transaction history with ALL transaction types
 * distributed over 2 years:
 * - export (60%): Regular sales
 * - import (12%): Stock arrivals
 * - return (8%): Customer returns
 * - debt (6%): Unpaid sales
 * - repayment (4%): Debt payments
 * - exchange (4%): Product exchanges
 * - adjustment (3%): Inventory corrections
 * - supplier_return (2%): Returns to suppliers
 * - internal_use (1%): Internal consumption
 */

import { getTenantPrisma } from "../../../src/lib/prisma";
import { Prisma as TenantPrisma, TransactionType, PaymentMethod } from "../../../src/generated/tenant/client";
import { faker } from "@faker-js/faker";
import { SEED_CONFIG } from "../config";
import { logger } from "../logger";

const OPERATION = "Transactions";

interface TransactionSeedContext {
    organizationId: string;
    storeId: string;
    userIds: string[];
    supplierIds: string[];
}

const PAYMENT_METHODS: PaymentMethod[] = [PaymentMethod.cash, PaymentMethod.card, PaymentMethod.transfer];

// Transaction type distribution weights (matches config)
type TransactionTypeKey = keyof typeof SEED_CONFIG.transactionDistribution;

interface ProductInfo {
    id: string;
    price: TenantPrisma.Decimal;
    selling_price: TenantPrisma.Decimal;
}

interface CustomerInfo {
    id: string;
}

export async function seedTransactions(context: TransactionSeedContext): Promise<number> {
    logger.startOperation(OPERATION);

    try {
        const tenantPrisma = await getTenantPrisma(context.organizationId);

        // Check existing transactions
        const existingCount = await tenantPrisma.transaction.count({
            where: { store_id: context.storeId },
        });

        if (existingCount >= SEED_CONFIG.volumes.transactions) {
            logger.info(OPERATION, `Sufficient transactions exist (${existingCount}), skipping creation.`);
            logger.endOperation(OPERATION, existingCount, 0);
            return existingCount;
        }

        const transactionsToCreate = SEED_CONFIG.volumes.transactions - existingCount;
        logger.info(OPERATION, `Creating ${transactionsToCreate} new transactions with all types...`);

        // Load products and customers
        const products = await tenantPrisma.productVariation.findMany({
            where: { store_id: context.storeId },
            select: {
                id: true,
                price: true,
                selling_price: true,
            },
        });

        if (products.length === 0) {
            logger.warn(OPERATION, "No products found. Skipping transaction seeding.");
            logger.endOperation(OPERATION, 0, transactionsToCreate);
            return 0;
        }

        const customers = await tenantPrisma.customer.findMany({
            where: { store_id: context.storeId },
            select: { id: true },
        });

        if (customers.length === 0) {
            logger.warn(OPERATION, "No customers found. Skipping transaction seeding.");
            logger.endOperation(OPERATION, 0, transactionsToCreate);
            return 0;
        }

        logger.info(OPERATION, `Loaded ${products.length} products, ${customers.length} customers, ${context.supplierIds.length} suppliers.`);

        // Calculate distribution
        const distribution = calculateDistribution(transactionsToCreate);
        logger.info(OPERATION, `Distribution: ${JSON.stringify(distribution)}`);

        // Generate transactions
        const batchSize = SEED_CONFIG.batch.transactionBatchSize;
        const historyDays = SEED_CONFIG.volumes.transactionHistoryDays;
        const now = new Date();

        let totalCreated = 0;
        let groupCounter = existingCount;

        // Track created export transactions for returns
        const exportTransactionIds: string[] = [];

        // Build transaction queue with types
        const transactionQueue: TransactionType[] = [];
        for (const [type, count] of Object.entries(distribution)) {
            for (let i = 0; i < count; i++) {
                transactionQueue.push(type as TransactionType);
            }
        }
        // Shuffle for realistic distribution
        faker.helpers.shuffle(transactionQueue);

        for (let batch = 0; batch < Math.ceil(transactionQueue.length / batchSize); batch++) {
            const batchStart = batch * batchSize;
            const batchEnd = Math.min(batchStart + batchSize, transactionQueue.length);

            logger.progress(
                OPERATION,
                `Processing batch ${batch + 1}: transactions ${batchStart + 1} to ${batchEnd}`,
                totalCreated
            );

            for (let i = batchStart; i < batchEnd; i++) {
                const transactionType = transactionQueue[i]!;

                const txn = await createTransaction({
                    type: transactionType,
                    tenantPrisma,
                    context,
                    products,
                    customers,
                    now,
                    historyDays,
                    groupCounter: groupCounter++,
                    exportTransactionIds,
                });

                if (txn && transactionType === TransactionType.export) {
                    exportTransactionIds.push(txn.id);
                }

                totalCreated++;
            }
        }

        logger.info(OPERATION, `Created ${totalCreated} transactions with all types.`);
        logger.endOperation(OPERATION, totalCreated);

        return totalCreated;
    } catch (error) {
        logger.failOperation(OPERATION, error);
        throw error;
    }
}

function calculateDistribution(total: number): Record<TransactionTypeKey, number> {
    const dist = SEED_CONFIG.transactionDistribution;
    const result: Record<string, number> = {};

    let allocated = 0;
    const entries = Object.entries(dist) as Array<[TransactionTypeKey, number]>;

    for (let i = 0; i < entries.length; i++) {
        const [type, percentage] = entries[i]!;
        if (i === entries.length - 1) {
            // Last type gets remaining to avoid rounding errors
            result[type] = total - allocated;
        } else {
            const count = Math.round((percentage / 100) * total);
            result[type] = count;
            allocated += count;
        }
    }

    return result as Record<TransactionTypeKey, number>;
}

interface CreateTransactionParams {
    type: TransactionType;
    tenantPrisma: Awaited<ReturnType<typeof getTenantPrisma>>;
    context: TransactionSeedContext;
    products: ProductInfo[];
    customers: CustomerInfo[];
    now: Date;
    historyDays: number;
    groupCounter: number;
    exportTransactionIds: string[];
}

async function createTransaction(params: CreateTransactionParams) {
    const {
        type,
        tenantPrisma,
        context,
        products,
        customers,
        now,
        historyDays,
        groupCounter,
        exportTransactionIds,
    } = params;

    const product = faker.helpers.arrayElement(products);
    const customer = faker.helpers.arrayElement(customers);
    const userId = faker.helpers.arrayElement(context.userIds);
    const paymentMethod = faker.helpers.arrayElement(PAYMENT_METHODS);

    // Generate realistic date spread across history
    const daysAgo = faker.number.int({ min: 0, max: historyDays });
    const transactionDate = new Date(now);
    transactionDate.setDate(transactionDate.getDate() - daysAgo);
    transactionDate.setHours(faker.number.int({ min: 9, max: 21 }));
    transactionDate.setMinutes(faker.number.int({ min: 0, max: 59 }));

    const quantity = faker.number.int({ min: 1, max: 5 });
    const costPrice = new TenantPrisma.Decimal(product.price);
    const sellingPrice = new TenantPrisma.Decimal(product.selling_price);
    const totalAmount = sellingPrice.mul(quantity);

    // Group ID for multi-item receipts (30% of sales)
    let groupId: string | null = null;
    if (type === TransactionType.export && faker.number.int({ min: 1, max: 10 }) <= 3) {
        groupId = `GRP-${groupCounter}`;
    }

    // Type-specific logic
    let originalTransactionId: string | null = null;
    let supplierId: string | null = null;
    let remarks: string | null = null;

    switch (type) {
        case TransactionType.return:
            // Link to an existing export if available
            if (exportTransactionIds.length > 0) {
                originalTransactionId = faker.helpers.arrayElement(exportTransactionIds);
            }
            remarks = faker.helpers.arrayElement([
                "Size exchange",
                "Defective product",
                "Customer changed mind",
                "Wrong item delivered",
            ]);
            break;

        case TransactionType.import:
        case TransactionType.supplier_return:
            if (context.supplierIds.length > 0) {
                supplierId = faker.helpers.arrayElement(context.supplierIds);
            }
            remarks = type === TransactionType.import
                ? `Stock arrival - ${faker.commerce.productAdjective()}`
                : "Returned to supplier - defective batch";
            break;

        case TransactionType.debt:
            remarks = "Credit sale - payment pending";
            break;

        case TransactionType.repayment:
            remarks = "Debt payment received";
            break;

        case TransactionType.exchange:
            if (exportTransactionIds.length > 0) {
                originalTransactionId = faker.helpers.arrayElement(exportTransactionIds);
            }
            remarks = "Product exchange";
            break;

        case TransactionType.adjustment:
            remarks = faker.helpers.arrayElement([
                "Inventory correction",
                "Stock count adjustment",
                "System reconciliation",
            ]);
            break;

        case TransactionType.internal_use:
            remarks = faker.helpers.arrayElement([
                "Staff uniform",
                "Store display",
                "Photo shoot sample",
                "Marketing event",
            ]);
            break;
    }

    try {
        const created = await tenantPrisma.transaction.create({
            data: {
                transaction_type: type,
                store_id: context.storeId,
                product_variation_id: product.id,
                customer_id: (type === TransactionType.export || type === TransactionType.return || type === TransactionType.debt || type === TransactionType.repayment || type === TransactionType.exchange)
                    ? customer.id
                    : null,
                user_id: userId,
                supplier_id: supplierId,
                quantity,
                unit_price: sellingPrice,
                selling_price: sellingPrice,
                delivery_cost: costPrice,
                total_amount: totalAmount,
                payment_method: (type === TransactionType.export || type === TransactionType.repayment) ? paymentMethod : null,
                transaction_date: transactionDate,
                created_at: transactionDate,
                group_id: groupId,
                original_transaction_id: originalTransactionId,
                remarks,
            },
        });
        return created;
    } catch {
        // Skip constraint errors (e.g., missing original transaction)
        return null;
    }
}
