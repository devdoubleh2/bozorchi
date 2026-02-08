import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma, getTenantPrisma } from "../lib/prisma";
import { log,  } from "../../logs/log";

export class OrganizationsController {
    async getMyOrganization(req: AuthRequest, res: Response) {
        const { organization } = req;

        if (!organization) {
            res.status(404).json({ error: "Organization not found" });
            return
        }

        res.json({ organization });
    }

    async getBySlug(req: AuthRequest, res: Response) {
        try {
            const { slug } = req.params;

            if (!slug) {
                res.status(400).json({ error: "Slug is required" });
                return;
            }

            const organization = await prisma.organization.findUnique({
                where: { slug },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    ecommerce_enabled: true,
                },
            });

            if (!organization) {
                res.status(404).json({ error: "Organization not found" });
                return;
            }

            // Check if e-commerce is enabled
            if (!organization.ecommerce_enabled) {
                res.status(403).json({ error: "E-commerce is not enabled for this organization" });
                return;
            }

            res.json(organization);
        } catch (error) {
            console.error("Error fetching organization:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getProducts(req: AuthRequest, res: Response) {
        try {
            const { organizationId } = req.params;
            const { search, category, cursor, limit: limitParam } = req.query;
            
            await log.info("EcommerceProducts", `Fetching e-commerce products for org: ${organizationId}`);

            if (!organizationId) {
                res.status(400).json({ error: "Organization ID is required" });
                return;
            }

            // Get tenant prisma client for this organization
            const tenantPrisma = await getTenantPrisma(organizationId);

            // Fetch all stores for this organization
            const stores = await tenantPrisma.store.findMany({
                where: { organization_id: organizationId },
                select: { id: true },
            });

            await log.info("EcommerceProducts", `Found ${stores.length} stores for org`, { stores: stores.map((s: { id: string }) => s.id) });

            if (stores.length === 0) {
                await log.warn("EcommerceProducts", `No stores found for org: ${organizationId}`);
                res.json({
                    inventory: [],
                    pagination: { total: 0, limit: 50, hasNextPage: false, nextCursor: null }
                });
                return;
            }

            const storeIds = stores.map((s: { id: string }) => s.id);

            // Parse pagination params (same as inventoryController)
            const parsedLimit = parseInt(String(limitParam || "50"), 10);
            const take = Number.isNaN(parsedLimit) ? 50 : Math.min(Math.max(parsedLimit, 1), 100);

            // Build where conditions (matching inventoryController pattern)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const productVariationConditions: any = {};

            // Search filter
            if (search && typeof search === "string") {
                productVariationConditions.OR = [
                    { name: { contains: search, mode: "insensitive" } },
                    { sku: { contains: search, mode: "insensitive" } },
                    { barcode: { contains: search, mode: "insensitive" } },
                    { product: { name: { contains: search, mode: "insensitive" } } },
                ];
            }

            // Category filter
            if (category && typeof category === "string") {
                productVariationConditions.product = {
                    ...(productVariationConditions.product || {}),
                    product_category: {
                        name: { equals: category, mode: "insensitive" },
                    },
                };
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const whereConditions: any = {
                store_id: { in: storeIds },
                quantity_in_stock: { gt: 0 }, // Only show items in stock
                product_variation: productVariationConditions,
            };

            // Debug: Check total inventory count without filters
            const totalInventoryCount = await tenantPrisma.inventory.count({
                where: { store_id: { in: storeIds } }
            });
            await log.info("EcommerceProducts", `Total inventory in stores: ${totalInventoryCount}`);

            // Get total count for pagination
            const totalCount = await tenantPrisma.inventory.count({ where: whereConditions });
            await log.info("EcommerceProducts", `Filtered inventory count: ${totalCount}, whereConditions:`, { whereConditions });

            // Build query with same includes as inventoryController
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const queryOptions: any = {
                where: whereConditions,
                include: {
                    product_variation: {
                        include: {
                            product: {
                                include: {
                                    product_category: true,
                                },
                            },
                            unit: true,
                            supplier: true,
                        },
                    },
                },
                orderBy: { updated_at: "desc" },
                take: take + 1, // Fetch one extra to determine if there's a next page
            };

            // Apply cursor-based pagination
            if (cursor && typeof cursor === "string") {
                queryOptions.cursor = { id: cursor };
                queryOptions.skip = 1;
            }

            const inventoryItems = await tenantPrisma.inventory.findMany(queryOptions);

            // Check if there's more data
            const hasNextPage = inventoryItems.length > take;
            const items = hasNextPage ? inventoryItems.slice(0, -1) : inventoryItems;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nextCursor = hasNextPage ? (items[items.length - 1] as any)?.id : null;

            await log.info("EcommerceProducts", `Fetched ${items.length} inventory items from database`);

            // Format inventory for frontend (matching InventoryItem interface from POS)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedInventory = items.map((item: any) => ({
                id: item.id,
                quantity_in_stock: item.quantity_in_stock,
                created_at: item.created_at?.toISOString() ?? new Date().toISOString(),
                updated_at: item.updated_at?.toISOString() ?? null,
                is_service: item.product_variation.product.type === "service",
                product_variation: {
                    id: item.product_variation.id,
                    name: item.product_variation.name,
                    barcode: item.product_variation.barcode,
                    sku: item.product_variation.sku,
                    price: Number(item.product_variation.price),
                    selling_price: Number(item.product_variation.selling_price),
                    description: item.product_variation.description ?? "",
                    color: item.product_variation.color ?? null,
                    image_url: item.product_variation.image_url ?? null,
                    unit: item.product_variation.unit
                        ? {
                            id: item.product_variation.unit.id,
                            name: item.product_variation.unit.name,
                        }
                        : null,
                    product: {
                        id: item.product_variation.product.id,
                        name: item.product_variation.product.name,
                        image_url: item.product_variation.product.image_url ?? null,
                        type: item.product_variation.product.type,
                        category: item.product_variation.product.product_category
                            ? {
                                id: item.product_variation.product.product_category.id,
                                name: item.product_variation.product.product_category.name,
                            }
                            : null,
                        product_category: item.product_variation.product.product_category
                            ? {
                                id: item.product_variation.product.product_category.id,
                                name: item.product_variation.product.product_category.name,
                                color: item.product_variation.product.product_category.color ?? null,
                            }
                            : null,
                    },
                },
            }));

            await log.info("EcommerceProducts", `Returning ${formattedInventory.length} formatted inventory items`);

            res.json({
                inventory: formattedInventory,
                pagination: {
                    total: totalCount,
                    limit: take,
                    hasNextPage,
                    nextCursor,
                },
            });
        } catch (error) {
            await log.error("EcommerceProducts", `Error fetching products for org: ${req.organizationId}`, { error: String(error) });
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateEcommerceStatus(req: AuthRequest, res: Response) {
        try {
            const { organizationId } = req;
            const { enabled } = req.body;

            if (!organizationId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            if (typeof enabled !== "boolean") {
                res.status(400).json({ error: "Enabled must be a boolean" });
                return;
            }

            const organization = await prisma.organization.update({
                where: { id: organizationId },
                data: { ecommerce_enabled: enabled },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    ecommerce_enabled: true,
                },
            });

            res.json(organization);
        } catch (error) {
            console.error("Error updating e-commerce status:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}
