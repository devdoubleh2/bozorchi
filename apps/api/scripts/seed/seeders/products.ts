/**
 * Product Seeder
 * 
 * Creates products with variations (sizes) and initial inventory.
 * Uses batch processing for performance with large datasets.
 */

import { getTenantPrisma } from "../../../src/lib/prisma";
import { Prisma as TenantPrisma } from "../../../src/generated/tenant/client";
import { faker } from "@faker-js/faker";
import { SEED_CONFIG } from "../config";
import { logger } from "../logger";
import {
    CLOTHING_CATEGORIES,
    PRODUCT_TEMPLATES,
    SIZES,
    COLORS,
    generateBarcode,
    generateSku,
} from "../data/clothing";
import { getFashionImageUrl } from "../data/images";

const OPERATION = "Products & Inventory";

interface ProductSeedContext {
    organizationId: string;
    storeId: string;
}

export async function seedProducts(context: ProductSeedContext): Promise<number> {
    logger.startOperation(OPERATION);

    try {
        const tenantPrisma = await getTenantPrisma(context.organizationId);

        // 1. Ensure categories exist
        logger.info(OPERATION, "Setting up product categories...");
        const categoryMap = new Map<string, string>();

        for (const cat of CLOTHING_CATEGORIES) {
            let category = await tenantPrisma.productCategory.findFirst({
                where: { name: cat.name, store_id: context.storeId },
            });

            if (!category) {
                category = await tenantPrisma.productCategory.create({
                    data: {
                        name: cat.name,
                        color: cat.color,
                        store_id: context.storeId,
                    },
                });
            }
            categoryMap.set(cat.name, category.id);
        }
        logger.info(OPERATION, `Initialized ${categoryMap.size} categories.`);

        // 2. Ensure unit exists
        let unit = await tenantPrisma.unit.findFirst({
            where: { organization_id: context.organizationId },
        });

        if (!unit) {
            unit = await tenantPrisma.unit.create({
                data: {
                    name: "pc",
                    organization_id: context.organizationId,
                    store_id: context.storeId,
                },
            });
        }

        // 3. Check existing products
        const existingCount = await tenantPrisma.product.count({
            where: { store_id: context.storeId },
        });

        if (existingCount >= SEED_CONFIG.volumes.baseProducts) {
            logger.info(OPERATION, `Sufficient products exist (${existingCount}), skipping creation.`);
            logger.endOperation(OPERATION, existingCount, 0);
            return existingCount;
        }

        const productsToCreate = SEED_CONFIG.volumes.baseProducts - existingCount;
        logger.info(OPERATION, `Creating ${productsToCreate} new products with variations...`);

        // 4. Generate products in batches
        let totalCreated = 0;
        let barcodeIndex = existingCount + 1;
        const batchSize = SEED_CONFIG.batch.productBatchSize;

        // Flatten product templates for random selection
        const allTemplates: Array<{ name: string; category: string }> = [];
        for (const [category, products] of Object.entries(PRODUCT_TEMPLATES)) {
            for (const product of products) {
                allTemplates.push({ name: product, category });
            }
        }

        for (let batch = 0; batch < Math.ceil(productsToCreate / batchSize); batch++) {
            const batchStart = batch * batchSize;
            const batchEnd = Math.min(batchStart + batchSize, productsToCreate);
            const currentBatchSize = batchEnd - batchStart;

            logger.progress(
                OPERATION,
                `Processing batch ${batch + 1}: products ${batchStart + 1} to ${batchEnd}`,
                totalCreated
            );

            // Process batch
            for (let i = 0; i < currentBatchSize; i++) {
                const template = faker.helpers.arrayElement(allTemplates);
                const color = faker.helpers.arrayElement(COLORS);
                const productName = `${template.name} - ${color.name}`;
                const categoryId = categoryMap.get(template.category);

                if (!categoryId) continue;

                // Calculate prices
                const costPrice = faker.number.int({
                    min: SEED_CONFIG.pricing.minCostPrice,
                    max: SEED_CONFIG.pricing.maxCostPrice,
                });
                const margin = faker.number.float({
                    min: SEED_CONFIG.pricing.marginMin,
                    max: SEED_CONFIG.pricing.marginMax,
                    fractionDigits: 2,
                });
                const sellingPrice = Math.round(costPrice * margin);
                const wholesalePrice = Math.round(sellingPrice * 0.85);

                // Create product with variations
                try {
                    await tenantPrisma.product.create({
                        data: {
                            name: productName,
                            organization_id: context.organizationId,
                            store_id: context.storeId,
                            product_category_id: categoryId,
                            image_url: getFashionImageUrl(productName, template.category),
                            type: "variable",
                            product_variations: {
                                create: SIZES.map((size, sizeIdx) => {
                                    const barcode = generateBarcode(barcodeIndex++);
                                    const sku = generateSku(productName, size, barcodeIndex);

                                    return {
                                        name: `${productName} - ${size}`,
                                        barcode,
                                        sku,
                                        price: new TenantPrisma.Decimal(costPrice),
                                        selling_price: new TenantPrisma.Decimal(sellingPrice),
                                        delivery_cost: new TenantPrisma.Decimal(costPrice),
                                        delivery_cost_base: new TenantPrisma.Decimal(costPrice),
                                        delivery_cost_currency: "UZS",
                                        wholesale_price: new TenantPrisma.Decimal(wholesalePrice),
                                        unit_id: unit!.id,
                                        store_id: context.storeId,
                                        color: color.hex,
                                        image_url: getFashionImageUrl(productName, template.category),
                                        inventory: {
                                            create: {
                                                store_id: context.storeId,
                                                quantity_in_stock: faker.number.int({ min: 5, max: 100 }),
                                            },
                                        },
                                    };
                                }),
                            },
                        },
                    });
                    totalCreated++;
                } catch (err) {
                    logger.error(OPERATION, `Failed to create product: ${productName}`, err);
                }
            }
        }

        const totalVariations = totalCreated * SIZES.length;
        logger.info(OPERATION, `Created ${totalCreated} products with ${totalVariations} variations.`);
        logger.endOperation(OPERATION, totalVariations);

        return totalVariations;
    } catch (error) {
        logger.failOperation(OPERATION, error);
        throw error;
    }
}
