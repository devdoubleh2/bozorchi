/**
 * Customer Seeder
 * 
 * Creates customers with Uzbek names and optional loyalty cards.
 * Uses batch processing for performance.
 */

import { getTenantPrisma } from "../../../src/lib/prisma";
import { faker } from "@faker-js/faker";
import { SEED_CONFIG } from "../config";
import { logger } from "../logger";
import {
    UZBEK_FIRST_NAMES,
    UZBEK_LAST_NAMES,
    UZBEK_PHONE_PREFIXES,
} from "../data/clothing";

const OPERATION = "Customers";

interface CustomerSeedContext {
    organizationId: string;
    storeId: string;
}

export async function seedCustomers(context: CustomerSeedContext): Promise<number> {
    logger.startOperation(OPERATION);

    try {
        const tenantPrisma = await getTenantPrisma(context.organizationId);

        // Check existing customers
        const existingCount = await tenantPrisma.customer.count({
            where: { store_id: context.storeId },
        });

        if (existingCount >= SEED_CONFIG.volumes.customers) {
            logger.info(OPERATION, `Sufficient customers exist (${existingCount}), skipping creation.`);
            logger.endOperation(OPERATION, existingCount, 0);
            return existingCount;
        }

        const customersToCreate = SEED_CONFIG.volumes.customers - existingCount;
        logger.info(OPERATION, `Creating ${customersToCreate} new customers...`);

        // Generate customers in batches
        let totalCreated = 0;
        const batchSize = SEED_CONFIG.batch.customerBatchSize;

        for (let batch = 0; batch < Math.ceil(customersToCreate / batchSize); batch++) {
            const batchStart = batch * batchSize;
            const batchEnd = Math.min(batchStart + batchSize, customersToCreate);
            const currentBatchSize = batchEnd - batchStart;

            logger.progress(
                OPERATION,
                `Processing batch ${batch + 1}: customers ${batchStart + 1} to ${batchEnd}`,
                totalCreated
            );

            const customerData = [];
            for (let i = 0; i < currentBatchSize; i++) {
                const isMale = faker.datatype.boolean();
                const firstName = faker.helpers.arrayElement(
                    isMale ? UZBEK_FIRST_NAMES.male : UZBEK_FIRST_NAMES.female
                );
                const baseName = faker.helpers.arrayElement(UZBEK_LAST_NAMES);

                // Adjust last name suffix for females
                let lastName: string = baseName;
                if (!isMale && baseName.endsWith("ov")) {
                    lastName = baseName.replace(/ov$/, "ova");
                } else if (!isMale && baseName.endsWith("ev")) {
                    lastName = baseName.replace(/ev$/, "eva");
                }

                const phonePrefix = faker.helpers.arrayElement(UZBEK_PHONE_PREFIXES);
                const phoneNumber = `${phonePrefix} ${faker.string.numeric(3)} ${faker.string.numeric(2)} ${faker.string.numeric(2)}`;

                customerData.push({
                    name: `${firstName} ${lastName}`,
                    phone: phoneNumber,
                    gender: isMale ? "male" : "female",
                    language: "uz",
                    organization_id: context.organizationId,
                    store_id: context.storeId,
                    created_at: faker.date.past({ years: 2 }),
                });
            }

            // Batch insert
            await tenantPrisma.customer.createMany({
                data: customerData,
            });

            totalCreated += currentBatchSize;
        }

        // Create loyalty cards for a portion of customers
        logger.info(OPERATION, "Creating loyalty cards for customers...");
        const customersWithoutCards = await tenantPrisma.customer.findMany({
            where: {
                store_id: context.storeId,
                loyalty_card: null,
            },
            take: Math.floor(totalCreated * 0.6), // 60% get loyalty cards
        });

        let loyaltyCardsCreated = 0;
        for (const customer of customersWithoutCards) {
            try {
                await tenantPrisma.loyaltyCard.create({
                    data: {
                        customer_id: customer.id,
                        card_number: `LC${faker.string.numeric(10)}`,
                        points: faker.number.int({ min: 0, max: 5000 }),
                    },
                });
                loyaltyCardsCreated++;
            } catch {
                // Skip if loyalty card already exists
            }
        }

        logger.info(OPERATION, `Created ${loyaltyCardsCreated} loyalty cards.`);
        logger.endOperation(OPERATION, totalCreated);

        return totalCreated;
    } catch (error) {
        logger.failOperation(OPERATION, error);
        throw error;
    }
}
