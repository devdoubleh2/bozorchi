/**
 * Clear Seed Data
 * 
 * Cleans up all seeded data in the correct order to respect foreign key constraints.
 */

import { prisma, getTenantPrisma } from "../../src/lib/prisma";
import { logger } from "./logger";
import { SEED_CONFIG } from "./config";

const OPERATION = "Clear Seed Data";

export async function clearSeedData(): Promise<void> {
    logger.startOperation(OPERATION);

    try {
        // Find organization by slug
        const org = await prisma.organization.findUnique({
            where: { slug: SEED_CONFIG.organization.slug },
        });

        if (!org) {
            logger.info(OPERATION, "No organization found to clear. Skipping.");
            logger.endOperation(OPERATION, 0);
            return;
        }

        logger.info(OPERATION, `Clearing data for organization: ${org.id}`);

        const tenantPrisma = await getTenantPrisma(org.id);

        // Get store
        const store = await tenantPrisma.store.findFirst({
            where: { organization_id: org.id },
        });

        if (!store) {
            logger.info(OPERATION, "No store found. Nothing to clear.");
            logger.endOperation(OPERATION, 0);
            return;
        }

        const storeId = store.id;
        let totalCleared = 0;

        // Clear in order (respecting FK constraints - children first)

        // 1. Clear WriteOffs
        const writeOffsDeleted = await tenantPrisma.writeOff.deleteMany({
            where: { store_id: storeId },
        });
        logger.info(OPERATION, `Deleted ${writeOffsDeleted.count} write-offs`);
        totalCleared += writeOffsDeleted.count;

        // 2. Clear InventoryAuditItems (via cascade from InventoryAudit)
        const auditsDeleted = await tenantPrisma.inventoryAudit.deleteMany({
            where: { store_id: storeId },
        });
        logger.info(OPERATION, `Deleted ${auditsDeleted.count} inventory audits`);
        totalCleared += auditsDeleted.count;

        // 3. Clear Payments (cascade from transactions)
        // 4. Clear Transactions
        const transactionsDeleted = await tenantPrisma.transaction.deleteMany({
            where: { store_id: storeId },
        });
        logger.info(OPERATION, `Deleted ${transactionsDeleted.count} transactions`);
        totalCleared += transactionsDeleted.count;

        // 5. Clear LoyaltyCards (cascade from customers)
        // 6. Clear Customers
        const customersDeleted = await tenantPrisma.customer.deleteMany({
            where: { store_id: storeId },
        });
        logger.info(OPERATION, `Deleted ${customersDeleted.count} customers`);
        totalCleared += customersDeleted.count;

        // 7. Clear Inventory
        const inventoryDeleted = await tenantPrisma.inventory.deleteMany({
            where: { store_id: storeId },
        });
        logger.info(OPERATION, `Deleted ${inventoryDeleted.count} inventory records`);
        totalCleared += inventoryDeleted.count;

        // 8. Clear ProductVariations (cascade from products)
        // 9. Clear Products
        const productsDeleted = await tenantPrisma.product.deleteMany({
            where: { store_id: storeId },
        });
        logger.info(OPERATION, `Deleted ${productsDeleted.count} products`);
        totalCleared += productsDeleted.count;

        // 10. Clear ProductCategories
        const categoriesDeleted = await tenantPrisma.productCategory.deleteMany({
            where: { store_id: storeId },
        });
        logger.info(OPERATION, `Deleted ${categoriesDeleted.count} product categories`);
        totalCleared += categoriesDeleted.count;

        // 11. Clear Suppliers
        const suppliersDeleted = await tenantPrisma.supplier.deleteMany({
            where: { store_id: storeId },
        });
        logger.info(OPERATION, `Deleted ${suppliersDeleted.count} suppliers`);
        totalCleared += suppliersDeleted.count;

        // 12. Clear Units
        const unitsDeleted = await tenantPrisma.unit.deleteMany({
            where: { store_id: storeId },
        });
        logger.info(OPERATION, `Deleted ${unitsDeleted.count} units`);
        totalCleared += unitsDeleted.count;

        logger.info(OPERATION, `Total records cleared: ${totalCleared}`);
        logger.endOperation(OPERATION, totalCleared);

    } catch (error) {
        logger.failOperation(OPERATION, error);
        throw error;
    }
}
