/**
 * Write-off Seeder
 * 
 * Creates realistic write-off records for inventory losses.
 */

import { getTenantPrisma } from "../../../src/lib/prisma";
import { WriteOffReason } from "../../../src/generated/tenant/client";
import { faker } from "@faker-js/faker";
import { SEED_CONFIG } from "../config";
import { logger } from "../logger";

const OPERATION = "Write-offs";

interface WriteOffSeedContext {
    organizationId: string;
    storeId: string;
    userIds: string[];
}

// Reason distribution (more common reasons have higher probability)
const REASON_DISTRIBUTION: Array<{ reason: WriteOffReason; weight: number }> = [
    { reason: WriteOffReason.damage, weight: 40 },     // Most common
    { reason: WriteOffReason.defect, weight: 25 },     // Manufacturing defects
    { reason: WriteOffReason.theft, weight: 15 },      // Shoplifting/shrinkage
    { reason: WriteOffReason.expiry, weight: 5 },      // Not common for clothing
    { reason: WriteOffReason.other, weight: 15 },      // Other reasons
];

function getWeightedReason(): WriteOffReason {
    const totalWeight = REASON_DISTRIBUTION.reduce((sum, r) => sum + r.weight, 0);
    let random = faker.number.int({ min: 1, max: totalWeight });

    for (const item of REASON_DISTRIBUTION) {
        random -= item.weight;
        if (random <= 0) {
            return item.reason;
        }
    }
    return WriteOffReason.other;
}

// Reason-specific notes
const REASON_NOTES: Record<WriteOffReason, string[]> = {
    damage: [
        "Water damage from leak",
        "Stained beyond repair",
        "Torn during unpacking",
        "Customer returned - damaged",
        "Display sample worn out",
        "Faded from sun exposure",
    ],
    defect: [
        "Manufacturing defect - stitching",
        "Zipper malfunction",
        "Color inconsistency",
        "Size labeling error",
        "Missing buttons",
        "Fabric defect",
    ],
    theft: [
        "Suspected shoplifting",
        "Missing from inventory",
        "Security tag removed",
        "Discovered during audit",
    ],
    expiry: [
        "End of season clearance",
        "Style discontinued",
        "Promotional period ended",
    ],
    other: [
        "Personal use - staff uniform",
        "Donated to charity",
        "Sample/photo shoot",
        "Customer complaint resolution",
        "Promotional giveaway",
    ],
};

export async function seedWriteOffs(context: WriteOffSeedContext): Promise<number> {
    logger.startOperation(OPERATION);

    try {
        const tenantPrisma = await getTenantPrisma(context.organizationId);

        // Check existing write-offs
        const existingCount = await tenantPrisma.writeOff.count({
            where: { store_id: context.storeId },
        });

        if (existingCount >= SEED_CONFIG.volumes.writeOffs) {
            logger.info(OPERATION, `Sufficient write-offs exist (${existingCount}), skipping creation.`);
            logger.endOperation(OPERATION, existingCount, 0);
            return existingCount;
        }

        const writeOffsToCreate = SEED_CONFIG.volumes.writeOffs - existingCount;
        logger.info(OPERATION, `Creating ${writeOffsToCreate} new write-offs...`);

        // Load product variations
        const products = await tenantPrisma.productVariation.findMany({
            where: { store_id: context.storeId },
            select: { id: true },
        });

        if (products.length === 0) {
            logger.warn(OPERATION, "No products found. Skipping write-off seeding.");
            logger.endOperation(OPERATION, 0, writeOffsToCreate);
            return 0;
        }

        const now = new Date();
        const historyDays = SEED_CONFIG.volumes.transactionHistoryDays;
        const batchSize = 100;
        let totalCreated = 0;

        for (let batch = 0; batch < Math.ceil(writeOffsToCreate / batchSize); batch++) {
            const batchStart = batch * batchSize;
            const batchEnd = Math.min(batchStart + batchSize, writeOffsToCreate);
            const currentBatchSize = batchEnd - batchStart;

            logger.progress(
                OPERATION,
                `Processing batch ${batch + 1}: write-offs ${batchStart + 1} to ${batchEnd}`,
                totalCreated
            );

            const writeOffData = [];

            for (let i = 0; i < currentBatchSize; i++) {
                const product = faker.helpers.arrayElement(products);
                const userId = faker.helpers.arrayElement(context.userIds);
                const reason = getWeightedReason();

                // Distribute write-offs across the time period
                const daysAgo = faker.number.int({ min: 0, max: historyDays });
                const writeOffDate = new Date(now);
                writeOffDate.setDate(writeOffDate.getDate() - daysAgo);

                // Set time during business hours
                writeOffDate.setHours(faker.number.int({ min: 9, max: 18 }));
                writeOffDate.setMinutes(faker.number.int({ min: 0, max: 59 }));

                // Quantity usually small (1-3), occasionally more
                const quantity = faker.helpers.weightedArrayElement([
                    { value: 1, weight: 60 },
                    { value: 2, weight: 25 },
                    { value: 3, weight: 10 },
                    { value: faker.number.int({ min: 4, max: 10 }), weight: 5 },
                ]);

                writeOffData.push({
                    product_variation_id: product.id,
                    store_id: context.storeId,
                    user_id: userId,
                    quantity,
                    reason,
                    notes: faker.helpers.maybe(
                        () => faker.helpers.arrayElement(REASON_NOTES[reason]),
                        { probability: 0.7 }
                    ),
                    write_off_date: writeOffDate,
                    created_at: writeOffDate,
                });
            }

            await tenantPrisma.writeOff.createMany({
                data: writeOffData,
            });

            totalCreated += currentBatchSize;
        }

        logger.info(OPERATION, `Created ${totalCreated} write-offs.`);
        logger.endOperation(OPERATION, totalCreated);

        return totalCreated;
    } catch (error) {
        logger.failOperation(OPERATION, error);
        throw error;
    }
}
