/**
 * Inventory Audit Seeder
 * 
 * Creates realistic inventory audits with discrepancies.
 */

import { getTenantPrisma } from "../../../src/lib/prisma";
import { AuditStatus } from "../../../src/generated/tenant/client";
import { faker } from "@faker-js/faker";
import { SEED_CONFIG } from "../config";
import { logger } from "../logger";

const OPERATION = "Inventory Audits";

interface AuditSeedContext {
    organizationId: string;
    storeId: string;
    userIds: string[];
}

export async function seedAudits(context: AuditSeedContext): Promise<number> {
    logger.startOperation(OPERATION);

    try {
        const tenantPrisma = await getTenantPrisma(context.organizationId);

        // Check existing audits
        const existingCount = await tenantPrisma.inventoryAudit.count({
            where: { store_id: context.storeId },
        });

        if (existingCount >= SEED_CONFIG.volumes.audits) {
            logger.info(OPERATION, `Sufficient audits exist (${existingCount}), skipping creation.`);
            logger.endOperation(OPERATION, existingCount, 0);
            return existingCount;
        }

        const auditsToCreate = SEED_CONFIG.volumes.audits - existingCount;
        logger.info(OPERATION, `Creating ${auditsToCreate} new inventory audits...`);

        // Load product variations for audit items
        const products = await tenantPrisma.productVariation.findMany({
            where: { store_id: context.storeId },
            include: { inventory: true },
            take: 500, // Sample of products to audit
        });

        if (products.length === 0) {
            logger.warn(OPERATION, "No products found. Skipping audit seeding.");
            logger.endOperation(OPERATION, 0, auditsToCreate);
            return 0;
        }

        const now = new Date();
        const historyDays = SEED_CONFIG.volumes.transactionHistoryDays;
        let totalCreated = 0;

        for (let i = 0; i < auditsToCreate; i++) {
            // Distribute audits across the time period
            const daysAgo = Math.floor((i / auditsToCreate) * historyDays);
            const auditDate = new Date(now);
            auditDate.setDate(auditDate.getDate() - daysAgo);

            // Set time during business hours
            auditDate.setHours(faker.number.int({ min: 9, max: 17 }));
            auditDate.setMinutes(faker.number.int({ min: 0, max: 59 }));

            // Most audits are completed, some in progress/cancelled
            const statusRand = faker.number.int({ min: 1, max: 100 });
            let status: AuditStatus;
            if (statusRand <= 85) {
                status = AuditStatus.completed;
            } else if (statusRand <= 95) {
                status = AuditStatus.in_progress;
            } else {
                status = AuditStatus.cancelled;
            }

            const userId = faker.helpers.arrayElement(context.userIds);

            // Create audit
            const audit = await tenantPrisma.inventoryAudit.create({
                data: {
                    store_id: context.storeId,
                    user_id: userId,
                    audit_date: auditDate,
                    status,
                    notes: faker.helpers.maybe(
                        () => faker.helpers.arrayElement([
                            "Monthly stock count",
                            "Quarterly inventory audit",
                            "Discrepancy investigation",
                            "Annual inventory review",
                            "Random spot check",
                        ]),
                        { probability: 0.5 }
                    ),
                    created_at: auditDate,
                },
            });

            // Create audit items (5-25 items per audit)
            const itemCount = faker.number.int({ min: 5, max: 25 });
            const selectedProducts = faker.helpers.arrayElements(products, itemCount);

            const auditItems = selectedProducts.map((product) => {
                const inventory = product.inventory[0];
                const expectedQuantity = inventory?.quantity_in_stock || faker.number.int({ min: 10, max: 100 });

                // Create realistic discrepancies (most match, some don't)
                const hasDiscrepancy = faker.number.int({ min: 1, max: 100 }) <= 20; // 20% have discrepancies
                let actualQuantity: number;
                let difference: number;

                if (hasDiscrepancy) {
                    // Discrepancy: usually small (1-5 items)
                    difference = faker.number.int({ min: -5, max: 5 });
                    if (difference === 0) difference = faker.datatype.boolean() ? 1 : -1;
                    actualQuantity = Math.max(0, expectedQuantity + difference);
                    difference = actualQuantity - expectedQuantity;
                } else {
                    actualQuantity = expectedQuantity;
                    difference = 0;
                }

                return {
                    inventory_audit_id: audit.id,
                    product_variation_id: product.id,
                    expected_quantity: expectedQuantity,
                    actual_quantity: actualQuantity,
                    difference,
                    notes: difference !== 0
                        ? faker.helpers.arrayElement([
                            "Possible theft",
                            "Counting error last time",
                            "Damaged items removed",
                            "Missing from display",
                            "Found extra stock in back",
                        ])
                        : null,
                    created_at: auditDate,
                };
            });

            await tenantPrisma.inventoryAuditItem.createMany({
                data: auditItems,
            });

            totalCreated++;

            if (totalCreated % 10 === 0) {
                logger.progress(OPERATION, `Created ${totalCreated} audits`, totalCreated);
            }
        }

        logger.info(OPERATION, `Created ${totalCreated} inventory audits with items.`);
        logger.endOperation(OPERATION, totalCreated);

        return totalCreated;
    } catch (error) {
        logger.failOperation(OPERATION, error);
        throw error;
    }
}
