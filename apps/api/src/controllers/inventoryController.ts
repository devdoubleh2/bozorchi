import { Response } from "express";
import logger from "../../logs/log";
import {
  Inventory,
  ProductVariation,
  Product,
  ProductCategory,
  Unit,
  Supplier,
  Prisma,
} from "../generated/tenant/client";
import { z } from "zod";
import { AuthRequest } from "@/middleware/auth";
import { createTransaction, transferStock } from "@/services/transactions";

const Decimal = Prisma.Decimal;

type InventoryWithRelations = Inventory & {
  product_variation: ProductVariation & {
    product: Product & {
      product_category: ProductCategory | null;
    };
    unit: Unit;
    supplier: Supplier | null;
  };
};

const getInventorySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  price_min: z.string().optional(),
  price_max: z.string().optional(),
  stock_level: z.enum(["low", "out", "in_stock"]).optional(),
  // Pagination parameters for virtualized list support
  cursor: z.string().optional(), // Cursor-based pagination (inventory ID)
  limit: z.string().optional().default("50"), // Items per page
  page: z.string().optional(), // Offset-based pagination alternative
});

const restockSchema = z.object({
  variationId: z.string().min(1),
  quantity: z.number().int().positive(),
  cost_price: z.number().optional(),
  price: z.number().optional(),
  selling_price: z.number().optional(),
});

const stockReportSchema = z.object({
  store_id: z.string().optional(),
});

const transferSchema = z.object({
  items: z
    .array(
      z.object({
        variationId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  destinationStoreId: z.string().min(1),
});

export class InventoryController {
  async getInventory(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      if (!req.store?.id) {
        return res.status(400).json({ error: "Store context is required" });
      }

      const validation = getInventorySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: validation.error.issues,
        });
      }
      const {
        search,
        category,
        price_min,
        price_max,
        stock_level,
        cursor,
        limit,
        page,
      } = validation.data;

      // Parse pagination params
      const take = Math.min(Math.max(parseInt(limit || "50", 10), 1), 100); // Max 100, min 1
      const pageNum = page ? Math.max(parseInt(page, 10), 1) : undefined;
      const skip = pageNum ? (pageNum - 1) * take : undefined;

      // NOTE: We intentionally do NOT filter by product_variation.store_id here.
      // The inventory.store_id filter already ensures we only get items with stock
      // in the current store. Products can exist organization-wide with inventory
      // records in multiple stores (e.g., after stock transfers between stores).
      const productVariationConditions: Prisma.ProductVariationWhereInput = {};

      // Search filter
      if (search) {
        productVariationConditions.OR = [
          { name: { contains: search as string, mode: "insensitive" } },
          { sku: { contains: search as string, mode: "insensitive" } },
          { barcode: { contains: search as string, mode: "insensitive" } },
          {
            product: {
              name: { contains: search as string, mode: "insensitive" },
            },
          },
        ];
      }

      // Category filter
      if (category) {
        productVariationConditions.product = {
          ...((productVariationConditions.product as Prisma.ProductWhereInput) || {}),
          product_category: {
            name: { equals: category, mode: "insensitive" },
          },
        };
      }

      // Price filter
      if (price_min || price_max) {
        productVariationConditions.selling_price = {
          ...(price_min && { gte: new Decimal(price_min) }),
          ...(price_max && { lte: new Decimal(price_max) }),
        };
      }

      const whereConditions: Prisma.InventoryWhereInput = {
        store_id: req.store.id, // This is the key filter - only inventory for current store
        product_variation: productVariationConditions,
      };

      // Stock level filter
      if (stock_level) {
        if (stock_level === "low") {
          whereConditions.quantity_in_stock = { lte: 10, gt: 0 };
        } else if (stock_level === "out") {
          whereConditions.quantity_in_stock = { lte: 0 };
        } else if (stock_level === "in_stock") {
          whereConditions.quantity_in_stock = { gt: 0 };
        }
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Get total count for pagination metadata
      const totalCount = await req.tenantPrisma.inventory.count({
        where: whereConditions,
      });

      // Build query options with pagination
      const queryOptions: Prisma.InventoryFindManyArgs = {
        where: whereConditions,
        include: {
          product_variation: {
            include: {
              product: {
                include: {
                  product_category: true, // Include category for frontend filtering
                },
              },
              unit: true,
              supplier: true,
            },
          },
        },
        orderBy: {
          updated_at: "desc",
        },
        take: take + 1, // Fetch one extra to determine if there's a next page
      };

      // Apply cursor-based pagination
      if (cursor) {
        queryOptions.cursor = { id: cursor };
        queryOptions.skip = 1; // Skip the cursor item itself
      } else if (skip !== undefined) {
        queryOptions.skip = skip;
      }

      const inventory = (await req.tenantPrisma.inventory.findMany(
        queryOptions
      )) as InventoryWithRelations[];

      // Check if there's more data
      const hasNextPage = inventory.length > take;
      const items = hasNextPage ? inventory.slice(0, -1) : inventory;
      const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

      // Fetch service products (they don't have inventory records but should appear in POS)
      // Build service query conditions
      const serviceProductConditions: Prisma.ProductVariationWhereInput = {
        product: {
          type: "service",
          organization_id: req.organization?.id,
          OR: [
            { store_id: req.store?.id },
            { store_id: null }, // Org-wide products
          ],
        },
      };

      // Apply search filter to services
      if (search) {
        serviceProductConditions.OR = [
          { name: { contains: search as string, mode: "insensitive" } },
          { sku: { contains: search as string, mode: "insensitive" } },
          { barcode: { contains: search as string, mode: "insensitive" } },
          {
            product: {
              name: { contains: search as string, mode: "insensitive" },
              type: "service",
            },
          },
        ];
      }

      // Apply category filter to services
      if (category) {
        serviceProductConditions.product = {
          ...(serviceProductConditions.product as Prisma.ProductWhereInput),
          product_category: {
            name: { equals: category, mode: "insensitive" },
          },
        };
      }

      // Apply price filter to services
      if (price_min || price_max) {
        serviceProductConditions.selling_price = {
          ...(price_min && { gte: new Decimal(price_min) }),
          ...(price_max && { lte: new Decimal(price_max) }),
        };
      }

      // Don't apply stock_level filter to services (they're always "available")
      const shouldIncludeServices = !stock_level || stock_level === "in_stock";

      let serviceProducts: Array<ProductVariation & {
        product: Product & { product_category: ProductCategory | null };
        unit: Unit;
        supplier: Supplier | null;
      }> = [];

      if (shouldIncludeServices) {
        serviceProducts = await req.tenantPrisma.productVariation.findMany({
          where: serviceProductConditions,
          include: {
            product: {
              include: {
                product_category: true,
              },
            },
            unit: true,
            supplier: true,
          },
          orderBy: { created_at: "desc" },
        });
      }

      // Format inventory for POS frontend (matching InventoryItem interface)
      const formattedInventory = items.map((item) => ({
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
                color:
                  item.product_variation.product.product_category.color ??
                  null,
              }
              : null,
          },
        },
      }));

      // Format service products as inventory items (with unlimited virtual stock)
      const formattedServices = serviceProducts.map((variation) => ({
        id: `service-${variation.id}`, // Unique ID to avoid conflicts with inventory IDs
        quantity_in_stock: 999999, // Services have unlimited "stock"
        created_at: variation.created_at?.toISOString() ?? new Date().toISOString(),
        updated_at: variation.updated_at?.toISOString() ?? null,
        is_service: true,
        product_variation: {
          id: variation.id,
          name: variation.name,
          barcode: variation.barcode,
          sku: variation.sku,
          price: Number(variation.price),
          selling_price: Number(variation.selling_price),
          description: variation.description ?? "",
          color: variation.color ?? null,
          image_url: variation.image_url ?? null,
          unit: variation.unit
            ? {
              id: variation.unit.id,
              name: variation.unit.name,
            }
            : null,
          product: {
            id: variation.product.id,
            name: variation.product.name,
            image_url: variation.product.image_url ?? null,
            type: variation.product.type,
            category: variation.product.product_category
              ? {
                id: variation.product.product_category.id,
                name: variation.product.product_category.name,
              }
              : null,
            product_category: variation.product.product_category
              ? {
                id: variation.product.product_category.id,
                name: variation.product.product_category.name,
                color: variation.product.product_category.color ?? null,
              }
              : null,
          },
        },
      }));

      // Combine inventory items with services (services first for visibility)
      const combinedInventory = [...formattedServices, ...formattedInventory];

      return res.json({
        inventory: combinedInventory,
        pagination: {
          total: totalCount + serviceProducts.length,
          limit: take,
          hasNextPage,
          nextCursor,
          ...(pageNum && {
            page: pageNum,
            totalPages: Math.ceil((totalCount + serviceProducts.length) / take),
          }),
        },
      });
    } catch (error) {
      logger.error("Get inventory error:", "inventoryController", error);
      return res.status(500).json({
        error: "Failed to get inventory",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async restock(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const validation = restockSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
      }
      const {
        variationId,
        quantity,
        cost_price,
        price,
        selling_price,
      } = validation.data;

      if (!req.store?.id) {
        return res.status(403).json({ error: "Store context required" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const result = await req.tenantPrisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 2. Create transaction record (handles inventory update and batch creation)
          await createTransaction(
            {
              product_variation_id: variationId,
              store_id: req.store!.id,
              transaction_type: "import",
              quantity: quantity,
              unit_price: cost_price ? new Decimal(cost_price) : new Decimal(0),
              total_amount: (cost_price
                ? new Decimal(cost_price)
                : new Decimal(0)
              ).mul(quantity),
              userId: req.userId!,
            },
            tx
          );

          // 3. Update product variation prices if provided
          const variationUpdateData: Prisma.ProductVariationUpdateInput = {};
          const resolvedPrice =
            price !== undefined ? price : cost_price;
          if (resolvedPrice !== undefined) {
            const priceDecimal = new Decimal(resolvedPrice);
            variationUpdateData.price = priceDecimal;
            // Keep delivery_cost aligned with product price (legacy column)
            variationUpdateData.delivery_cost = priceDecimal;
            variationUpdateData.delivery_cost_base = priceDecimal;
          }
          if (selling_price !== undefined) {
            variationUpdateData.selling_price = new Decimal(selling_price);
          }

          if (Object.keys(variationUpdateData).length > 0) {
            await tx.productVariation.update({
              where: { id: variationId },
              data: variationUpdateData,
            });
          }

          return { success: true };
        },
        {
          maxWait: 5000,
          timeout: 10000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      return res.json({ message: "Stock updated successfully", result });
    } catch (error) {
      logger.error("Restock error:", "inventoryController", error);
      return res.status(500).json({
        error: "Failed to update stock",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getLowStockItems(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.store?.id) {
        return res.status(400).json({ error: "Store context is required" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const lowStockItems = await req.tenantPrisma.inventory.findMany({
        where: {
          store_id: req.store.id,
          quantity_in_stock: {
            lte: 10, // Threshold
          },
        },
        include: {
          product_variation: {
            include: {
              product: true,
              unit: true,
              supplier: true,
            },
          },
        },
        take: 5,
        orderBy: {
          quantity_in_stock: "asc",
        },
      });

      const formattedItems = lowStockItems.map(
        (item: (typeof lowStockItems)[number]) => ({
          id: item.product_variation.id,
          name: item.product_variation.name,
          quantity: item.quantity_in_stock,
          unit: item.product_variation.unit.name,
          image_url:
            item.product_variation.image_url ||
            item.product_variation.product.image_url,
        })
      );

      return res.json({ items: formattedItems });
    } catch (error) {
      logger.error("Get low stock items error:", "inventoryController", error);
      return res.status(500).json({
        error: "Failed to get low stock items",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getStockReport(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const validation = stockReportSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: validation.error.issues,
        });
      }
      const { store_id } = validation.data;

      if (!store_id) {
        return res.status(400).json({
          error: "Store ID is required",
        });
      }

      // 1. Total Inventory Value (Cost Price * Quantity)
      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const [result] = await req.tenantPrisma.$queryRaw<
        [{ total_value: typeof Decimal | null }]
      >`
        SELECT SUM(pv.price * i.quantity_in_stock) as total_value
        FROM inventory i
        JOIN product_variations pv ON i.product_variation_id = pv.id
        WHERE i.store_id = ${store_id}
      `;

      const totalValue = result?.total_value ? Number(result.total_value) : 0;

      // 2. Low Stock Count
      const lowStockCount = await req.tenantPrisma.inventory.count({
        where: {
          store_id,
          quantity_in_stock: { lte: 10 },
        },
      });

      // 3. Out of Stock Count
      const outOfStockCount = await req.tenantPrisma.inventory.count({
        where: {
          store_id,
          quantity_in_stock: { lte: 0 },
        },
      });

      // 4. Most Stocked Items (by quantity)
      const mostStocked = await req.tenantPrisma.inventory.findMany({
        where: { store_id },
        include: {
          product_variation: {
            include: { product: true },
          },
        },
        orderBy: { quantity_in_stock: "desc" },
        take: 5,
      });

      return res.json({
        total_value: totalValue,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        most_stocked: mostStocked.map((item: (typeof mostStocked)[number]) => ({
          name: item.product_variation.name,
          quantity: item.quantity_in_stock,
        })),
      });
    } catch (error) {
      logger.error("Get stock report error:", "inventoryController", error);
      return res.status(500).json({
        error: "Failed to get stock report",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async transfer(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const validation = transferSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
      }
      const { items, destinationStoreId } = validation.data;

      if (!req.store?.id) {
        return res.status(403).json({ error: "Source store context required" });
      }

      if (req.store.id === destinationStoreId) {
        return res
          .status(400)
          .json({ error: "Cannot transfer to the same store" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Process transfers using the enhanced transferStock service
      const results = [];
      const errors = [];

      for (const [index, item] of items.entries()) {
        try {
          const result = await transferStock(
            req.store.id,
            destinationStoreId,
            item.variationId,
            item.quantity,
            req.userId!,
            req.tenantPrisma
          );
          results.push({
            item: index,
            success: true,
            groupId: result.groupId,
            summary: result.summary,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          errors.push({
            item: index,
            variationId: item.variationId,
            quantity: item.quantity,
            error: errorMessage,
          });
          logger.error(`Transfer error for item ${index}:`, "inventoryController", error);

          // For bulk transfers, stop on first error to maintain atomicity
          break;
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: "Transfer failed",
          message: `Failed to transfer item(s). ${errors.length} error(s) occurred.`,
          failures: errors,
          completed: results,
        });
      }

      return res.json({
        message: "Transfer completed successfully",
        transferred: items.length,
        results,
      });
    } catch (error) {
      logger.error("Transfer error:", "inventoryController", error);
      return res.status(500).json({
        error: "Failed to transfer items",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
