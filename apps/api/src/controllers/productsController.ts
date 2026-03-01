import { Response } from "express";
import log from "../../logs/log";
import {
  Product,
  ProductVariation,
  Inventory,
  Unit,
  Supplier,
  ProductCategory,
  ProductType,
  Prisma,
} from "../generated/tenant/client";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { createTransaction } from "@/services/transactions";
import { cache, CACHE_TTL } from "@/services/cache";
import FileUploadService from "@/services/fileUpload";

const Decimal = Prisma.Decimal;

const LOG_SOURCE = "ProductsController";

/**
 * Extracts the object name from a MinIO URL
 * Example: https://minio.bozorchi.store/uploads/uuid.jpg -> uuid.jpg
 */
function extractObjectNameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    // Remove empty strings and the bucket name (first part after leading slash)
    const filteredParts = pathParts.filter((p) => p);
    if (filteredParts.length >= 2) {
      // Return everything after the bucket name
      return filteredParts.slice(1).join("/");
    }
    return null;
  } catch {
    return null;
  }
}

type ProductWithRelations = Product & {
  product_category: ProductCategory | null;
  product_variations: (ProductVariation & {
    inventory: Inventory[];
    unit: Unit;
    supplier: Supplier | null;
  })[];
};

type ProductWithUnitRelations = Product & {
  product_category: ProductCategory | null;
  product_variations: (ProductVariation & {
    unit: Unit;
    inventory: Inventory[];
    supplier: Supplier | null;
  })[];
};

const getProductsSchema = z.object({
  search: z.string().optional(),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  category_id: z.string().min(1).optional().nullable(),
  product_category_id: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  type: z.nativeEnum(ProductType).default(ProductType.simple),
  variations: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional().nullable(),
        barcode: z.string().optional().nullable(),
        sku: z.string().optional().nullable(),
        price: z.number(),
        selling_price: z.number().optional(),
        wholesale_price: z.number().optional(),
        cost_price: z.number().optional(),
        unit_id: z.string().min(1),
        initial_stock: z.number().int().nonnegative().optional(),
        image_url: z.string().optional().nullable(),
      })
    )
    .min(1),
});

const updateProductSchema = z.object({
  name: z.string().optional(),
  category_id: z.string().optional(),
  product_category_id: z.string().optional(),
  image_url: z.string().optional(),
  variations: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        price: z.number(),
        selling_price: z.number(),
        delivery_cost: z.number().optional(),
        wholesale_price: z.number().optional(),
        unit_id: z.string().min(1),
        image_url: z.string().optional(),
      })
    )
    .optional(),
});

// Schema for bulk update of multiple products/variations
const bulkUpdateProductsSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      variationId: z.string().min(1),
      // Fields that can be updated
      productImageUrl: z.string().optional().nullable(),
      variationImageUrl: z.string().optional().nullable(),
      productCategoryId: z.string().optional().nullable(),
      sellingPrice: z.number().optional(),
      price: z.number().optional(),
      supplierId: z.string().optional().nullable(),
      unitId: z.string().optional().nullable(),
    })
  ).min(1, "At least one item is required for bulk update"),
});

// Schema for bulk delete
const bulkDeleteProductsSchema = z.object({
  ids: z.string().array().min(1, "At least one product ID is required for bulk delete"),
});

export class ProductsController {
  async getProducts(req: AuthRequest, res: Response): Promise<Response> {
    const startTime = Date.now();
    log.info(LOG_SOURCE, "getProducts called", {
      userId: req.userId,
      storeId: req.store?.id,
      organizationId: req.organization?.id,
      search: req.query["search"],
    });

    try {
      if (!req.userId) {
        log.warn(LOG_SOURCE, "getProducts: User ID missing");
        return res.status(400).json({ error: "User ID is required" });
      }

      if (!req.organization && !req.store) {
        return res
          .status(404)
          .json({ error: "No organization or store found for user" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const validation = getProductsSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: validation.error.issues,
        });
      }
      const { search } = validation.data;

      // Check cache first (only for non-search queries)
      const cacheKey = cache.key.products(req.organization!.id, req.store?.id || "all");
      if (!search) {
        const cached = await cache.get<{ products: unknown[] }>(cacheKey);
        if (cached) {
          log.info(LOG_SOURCE, "getProducts cache hit", {
            userId: req.userId,
            storeId: req.store?.id,
            durationMs: Date.now() - startTime,
          });
          return res.json(cached);
        }
      }

      const whereClause: Prisma.ProductWhereInput = {};

      // Show all products in the organization (not just current store)
      // This allows products with inventory in other stores to be visible
      if (req.organization) {
        whereClause.organization_id = req.organization.id;
      }

      if (search) {
        whereClause.AND = {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            {
              product_variations: {
                some: {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { barcode: { contains: search, mode: "insensitive" } },
                    { sku: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        };
      }

      const products = (await req.tenantPrisma.product.findMany({
        where: { ...whereClause },
        include: {
          product_category: true,
          product_variations: {
            include: {
              inventory: {
                where: req.store?.id ? { store_id: req.store.id } : {}, // Only fetch inventory for current store if selected
              },
              unit: true,
              supplier: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      })) as ProductWithRelations[];

      const productsWithStats = products.map((product) => {
        const variationCount = product.product_variations.length;
        const totalStock = product.product_variations.reduce((sum, pv) => {
          // Sum all inventory quantities for this variation (filtered by store above)
          const inventoryQuantity = pv.inventory.reduce(
            (invSum, inv) => invSum + (inv.quantity_in_stock || 0),
            0
          );
          return sum + inventoryQuantity;
        }, 0);

        return {
          ...product,
          variation_count: variationCount,
          total_stock: totalStock,
          image_url: product.image_url,
        };
      });

      const response = { products: productsWithStats };

      // Cache the result (only for non-search queries)
      if (!search) {
        await cache.set(cacheKey, response, CACHE_TTL.PRODUCTS);
      }

      log.info(LOG_SOURCE, "getProducts succeeded", {
        userId: req.userId,
        storeId: req.store?.id,
        productCount: productsWithStats.length,
        cached: !search,
        durationMs: Date.now() - startTime,
      });

      return res.json(response);
    } catch (error) {
      log.error(LOG_SOURCE, "getProducts failed", {
        userId: req.userId,
        storeId: req.store?.id,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: Date.now() - startTime,
      });
      return res.status(500).json({
        error: "Failed to get products",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async searchProducts(req: AuthRequest, res: Response): Promise<Response> {
    const startTime = Date.now();
    log.info(LOG_SOURCE, "searchProducts called", {
      userId: req.userId,
      storeId: req.store?.id,
      query: req.query["q"],
      limit: req.query["limit"],
    });

    try {
      if (!req.store) {
        log.warn(LOG_SOURCE, "searchProducts: Store context missing", { userId: req.userId });
        return res.status(400).json({ error: "Store context is required" });
      }

      if (!req.tenantPrisma) {
        log.warn(LOG_SOURCE, "searchProducts: Tenant not found", { userId: req.userId });
        return res.status(404).json({ error: "Tenant not found" });
      }

      const { q, limit = "20" } = req.query;
      const searchLimit = Math.min(parseInt(limit as string) || 20, 50);

      const products = await req.tenantPrisma.product.findMany({
        where: {
          store_id: req.store.id,
          ...(q ? { name: { contains: q as string, mode: "insensitive" as const } } : {}),
        },
        take: searchLimit,
        include: {
          product_category: { select: { id: true, name: true } },
          _count: { select: { product_variations: true } },
        },
        orderBy: { name: "asc" },
      });

      log.info(LOG_SOURCE, "searchProducts succeeded", {
        userId: req.userId,
        storeId: req.store?.id,
        resultCount: products.length,
        durationMs: Date.now() - startTime,
      });

      return res.json(products);
    } catch (error) {
      log.error(LOG_SOURCE, "searchProducts failed", {
        userId: req.userId,
        storeId: req.store?.id,
        query: req.query["q"],
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: Date.now() - startTime,
      });
      return res.status(500).json({
        error: "Failed to search products",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getProduct(req: AuthRequest, res: Response): Promise<Response> {
    const startTime = Date.now();
    const { id } = req.params;

    log.info(LOG_SOURCE, "getProduct called", {
      userId: req.userId,
      storeId: req.store?.id,
      productId: id,
    });

    try {
      if (!id) {
        log.warn(LOG_SOURCE, "getProduct: Product ID missing", { userId: req.userId });
        return res.status(400).json({ error: "Product ID is required" });
      }

      if (!req.tenantPrisma) {
        log.warn(LOG_SOURCE, "getProduct: Tenant not found", { userId: req.userId, productId: id });
        return res.status(404).json({ error: "Tenant not found" });
      }

      const product = (await req.tenantPrisma.product.findUnique({
        where: { id },
        include: {
          product_category: true,
          product_variations: {
            include: {
              unit: true,
              inventory: {
                where: req.store?.id ? { store_id: req.store.id } : {},
              },
              supplier: true,
            },
            orderBy: { created_at: "desc" },
          },
        },
      })) as ProductWithUnitRelations | null;

      if (!product) {
        log.warn(LOG_SOURCE, "getProduct: Product not found", { userId: req.userId, productId: id });
        return res.status(404).json({ error: "Product not found" });
      }

      const hasAccess =
        !req.store || // Org admin can see all
        product.store_id === req.store.id || // Product belongs to store
        product.store_id === null; // Product is org-wide

      if (!hasAccess) {
        log.warn(LOG_SOURCE, "getProduct: Access denied", {
          userId: req.userId,
          storeId: req.store?.id,
          productId: id,
          productStoreId: product.store_id,
        });
        return res.status(403).json({ error: "Access denied to this product" });
      }

      log.info(LOG_SOURCE, "getProduct succeeded", {
        userId: req.userId,
        productId: id,
        variationsCount: product.product_variations.length,
        durationMs: Date.now() - startTime,
      });

      return res.json({ product });
    } catch (error) {
      log.error(LOG_SOURCE, "getProduct failed", {
        userId: req.userId,
        productId: id,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: Date.now() - startTime,
      });
      return res.status(500).json({
        error: "Failed to get product",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getProductByBarcode(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const startTime = Date.now();
    const { barcode } = req.params;

    log.info(LOG_SOURCE, "getProductByBarcode called", {
      userId: req.userId,
      storeId: req.store?.id,
      barcode,
    });

    try {
      if (!barcode) {
        log.warn(LOG_SOURCE, "getProductByBarcode: Barcode missing", { userId: req.userId });
        return res.status(400).json({ error: "Barcode is required" });
      }

      if (!req.tenantPrisma) {
        log.warn(LOG_SOURCE, "getProductByBarcode: Tenant not found", { userId: req.userId, barcode });
        return res.status(404).json({ error: "Tenant not found" });
      }

      const variation = (await req.tenantPrisma.productVariation.findFirst({
        where: { barcode },
        include: {
          product: true,
          unit: true,
          inventory: {
            where: req.store?.id ? { store_id: req.store.id } : {},
          },
        },
      })) as
        | (ProductVariation & {
          product: Product;
          unit: Unit;
          inventory: Inventory[];
        })
        | null;

      if (!variation) {
        log.warn(LOG_SOURCE, "getProductByBarcode: Product not found", {
          userId: req.userId,
          barcode,
        });
        return res.status(404).json({ error: "Product not found" });
      }

      const hasAccess =
        !req.store ||
        variation.product.store_id === req.store.id ||
        variation.product.store_id === null;

      if (!hasAccess) {
        log.warn(LOG_SOURCE, "getProductByBarcode: Access denied", {
          userId: req.userId,
          storeId: req.store?.id,
          barcode,
          productStoreId: variation.product.store_id,
        });
        return res.status(403).json({ error: "Access denied to this product" });
      }

      log.info(LOG_SOURCE, "getProductByBarcode succeeded", {
        userId: req.userId,
        barcode,
        productVariationId: variation.id,
        durationMs: Date.now() - startTime,
      });

      return res.json({ product: variation });
    } catch (error) {
      log.error(LOG_SOURCE, "getProductByBarcode failed", {
        userId: req.userId,
        barcode,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: Date.now() - startTime,
      });
      return res.status(500).json({
        error: "Failed to get product by barcode",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }


  async createProduct(req: AuthRequest, res: Response): Promise<Response> {
    const startTime = Date.now();
    log.info(LOG_SOURCE, "createProduct called", {
      userId: req.userId,
      storeId: req.store?.id,
      organizationId: req.organization?.id,
      productName: req.body?.name,
      variationsCount: req.body?.variations?.length,
    });

    try {
      if (!req.organization || !req.userId) {
        log.warn(LOG_SOURCE, "createProduct: Organization or user ID missing", { userId: req.userId });
        return res
          .status(404)
          .json({ error: "No organization found for user" });
      }

      const store = req.store;

      const validation = createProductSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
      }
      const { name, product_category_id, image_url, variations, type } =
        validation.data;

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const result = await req.tenantPrisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const product = await tx.product.create({
            data: {
              name,
              image_url: image_url || null,
              product_category_id: product_category_id || null,
              user_id: req.userId!,
              organization_id: req.organization!.id,
              store_id: store.id,
              type,
            },
          });

          const createdVariations: ProductVariation[] = [];
          for (const variation of variations) {
            // Debug logging to diagnose null constraint violations
            log.debug(LOG_SOURCE, "Creating product variation", {
              variationName: variation.name,
              price: variation.price,
              selling_price: variation.selling_price,
              unit_id: variation.unit_id,
              hasUnitId: !!variation.unit_id,
              storeId: store?.id,
              priceType: typeof variation.price,
            });

            // Defensive validation - ensure required fields are present
            if (!variation.unit_id) {
              throw new Error(`Product variation "${variation.name}" is missing unit_id`);
            }
            if (!store?.id) {
              throw new Error(`Store ID is required to create product variation`);
            }
            if (typeof variation.price !== 'number' || !Number.isFinite(variation.price)) {
              throw new Error(`Product variation "${variation.name}" has invalid price: ${variation.price}`);
            }

            const basePrice = new Decimal(variation.price);
            const costPrice = variation.cost_price !== undefined
              ? new Decimal(variation.cost_price)
              : undefined;

            // Ensure selling_price is a valid number, default to 0
            const sellingPrice = typeof variation.selling_price === 'number' && Number.isFinite(variation.selling_price)
              ? new Decimal(variation.selling_price)
              : new Decimal(0);

            // Ensure wholesale_price is a valid number, default to 0
            const wholesalePrice = typeof variation.wholesale_price === 'number' && Number.isFinite(variation.wholesale_price)
              ? new Decimal(variation.wholesale_price)
              : new Decimal(0);

            // Complete payload logging for debugging null constraint violations
            const createPayload = {
              name: variation.name,
              sku: variation.sku ?? null,
              price: basePrice,
              unit_id: variation.unit_id,
              product_id: product.id,
              store_id: store.id,
              barcode: variation.barcode || null,
              description: variation.description ?? null,
              selling_price: sellingPrice,
              delivery_cost_currency: "UZS",
              wholesale_price: wholesalePrice,
              image_url: variation.image_url || null,
            };

            log.info(LOG_SOURCE, "ProductVariation create payload", {
              payload: JSON.stringify(createPayload),
              nameIsNull: createPayload.name === null,
              nameIsUndefined: createPayload.name === undefined,
              nameIsEmpty: createPayload.name === "",
              unitIdIsNull: createPayload.unit_id === null,
              unitIdIsUndefined: createPayload.unit_id === undefined,
              unitIdIsEmpty: createPayload.unit_id === "",
              productIdIsNull: createPayload.product_id === null,
              productIdIsUndefined: createPayload.product_id === undefined,
            });

            const productVariation = await tx.productVariation.create({
              data: createPayload,
            });

            if (store && type !== "service") {
              await tx.inventory.create({
                data: {
                  quantity_in_stock: variation.initial_stock ?? 0,
                  product_variation_id: productVariation.id,
                  store_id: store.id,
                },
              });

              if (variation.initial_stock && variation.initial_stock > 0) {
                const unitCost = costPrice ?? basePrice;
                await createTransaction(
                  {
                    product_variation_id: productVariation.id,
                    store_id: store.id,
                    transaction_type: "import",
                    quantity: variation.initial_stock,
                    unit_price: unitCost,
                    total_amount: unitCost.mul(variation.initial_stock),
                    userId: req.userId!,
                  },
                  tx
                );

              }
            }

            createdVariations.push(productVariation);
          }

          return { product, variations: createdVariations };
        }
      );

      // Invalidate products cache
      await cache.del(cache.key.products(req.organization!.id, store.id));
      await cache.del(cache.key.products(req.organization!.id, "all"));

      log.info(LOG_SOURCE, "createProduct succeeded", {
        userId: req.userId,
        storeId: req.store?.id,
        productId: result.product.id,
        productName: result.product.name,
        variationsCreated: result.variations.length,
        durationMs: Date.now() - startTime,
      });

      return res.status(201).json({
        message: "Product created successfully",
        product: {
          ...result.product,
          image_url: result.product.image_url,
          variations: result.variations,
        },
      });
    } catch (error) {
      log.error(LOG_SOURCE, "createProduct failed", {
        userId: req.userId,
        storeId: req.store?.id,
        productName: req.body?.name,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: Date.now() - startTime,
      });
      return res.status(500).json({
        error: "Failed to create product",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updateProduct(req: AuthRequest, res: Response): Promise<Response> {
    const startTime = Date.now();
    const { id } = req.params;

    log.info(LOG_SOURCE, "updateProduct called", {
      userId: req.userId,
      storeId: req.store?.id,
      productId: id,
      updateFields: Object.keys(req.body || {}),
    });

    try {
      if (!id) {
        log.warn(LOG_SOURCE, "updateProduct: Product ID missing", { userId: req.userId });
        return res.status(400).json({ error: "Product ID is required" });
      }

      const validation = updateProductSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
      }
      const { name, product_category_id, image_url, variations } =
        validation.data;

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      const product = await req.tenantPrisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        log.warn(LOG_SOURCE, "updateProduct: Product not found", { userId: req.userId, productId: id });
        return res.status(404).json({ error: "Product not found" });
      }

      const hasAccess =
        !req.store ||
        product.store_id === req.store.id ||
        product.store_id === null;

      if (!hasAccess) {
        log.warn(LOG_SOURCE, "updateProduct: Access denied", {
          userId: req.userId,
          storeId: req.store?.id,
          productId: id,
          productStoreId: product.store_id,
        });
        return res.status(403).json({ error: "Access denied to this product" });
      }

      const updateData: Partial<Product> = {};
      if (name) updateData.name = name;
      if (product_category_id)
        updateData.product_category_id = product_category_id;
      if (image_url) updateData.image_url = image_url;

      const updatedProduct = await req.tenantPrisma.product.update({
        where: { id },
        data: updateData,
      });

      if (variations && variations.length > 0) {
        await req.tenantPrisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            for (const variation of variations) {
              const updateData: Prisma.ProductVariationUpdateInput = {
                name: variation.name,
                price: new Decimal(variation.price),
                selling_price: new Decimal(variation.selling_price),
                unit: { connect: { id: variation.unit_id } },
                image_url: variation.image_url || null,
              };

              // Only update delivery_cost if explicitly provided
              if (variation.delivery_cost !== undefined) {
                const deliveryCost = new Decimal(variation.delivery_cost);
                updateData.delivery_cost = deliveryCost;
                updateData.delivery_cost_base = deliveryCost;
              }

              if (variation.wholesale_price !== undefined) {
                updateData.wholesale_price = new Decimal(variation.wholesale_price);
              }

              await tx.productVariation.update({
                where: { id: variation.id },
                data: updateData,
              });
            }
          }
        );
      }

      // Invalidate products cache
      if (req.organization) {
        await cache.del(cache.key.products(req.organization.id, req.store?.id || "all"));
        await cache.del(cache.key.products(req.organization.id, "all"));
      }

      log.info(LOG_SOURCE, "updateProduct succeeded", {
        userId: req.userId,
        productId: id,
        variationsUpdated: variations?.length ?? 0,
        durationMs: Date.now() - startTime,
      });

      return res.json({
        message: "Product updated successfully",
        product: {
          ...updatedProduct,
          image_url: updatedProduct.image_url,
        },
      });
    } catch (error) {
      log.error(LOG_SOURCE, "updateProduct failed", {
        userId: req.userId,
        productId: id,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: Date.now() - startTime,
      });
      return res.status(500).json({
        error: "Failed to update product",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async deleteProduct(req: AuthRequest, res: Response): Promise<Response> {
    const startTime = Date.now();
    const { id } = req.params;

    log.info(LOG_SOURCE, "deleteProduct called", {
      userId: req.userId,
      storeId: req.store?.id,
      productId: id,
    });

    try {
      if (!id) {
        log.warn(LOG_SOURCE, "deleteProduct: Product ID missing", { userId: req.userId });
        return res.status(400).json({ error: "Product ID is required" });
      }

      if (!req.tenantPrisma) {
        log.warn(LOG_SOURCE, "deleteProduct: Tenant not found", { userId: req.userId, productId: id });
        return res.status(404).json({ error: "Tenant not found" });
      }

      const product = await req.tenantPrisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        log.warn(LOG_SOURCE, "deleteProduct: Product not found", { userId: req.userId, productId: id });
        return res.status(404).json({ error: "Product not found" });
      }

      const hasAccess =
        !req.store ||
        product.store_id === req.store.id ||
        product.store_id === null;

      if (!hasAccess) {
        log.warn(LOG_SOURCE, "deleteProduct: Access denied", {
          userId: req.userId,
          storeId: req.store?.id,
          productId: id,
          productStoreId: product.store_id,
        });
        return res.status(403).json({ error: "Access denied to this product" });
      }

      // Collect image URLs before deleting the product and variations
      const productImageUrl = product.image_url;
      const variations = await req.tenantPrisma.productVariation.findMany({
        where: { product_id: id },
      });
      const variationIds = variations.map((variation) => variation.id);
      const variationImageUrls = variations
        .map((v) => v.image_url)
        .filter((url): url is string => !!url);

      await req.tenantPrisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          if (variationIds.length > 0) {
            await tx.transaction.deleteMany({
              where: { product_variation_id: { in: variationIds } },
            });
          }

          for (const variation of variations) {
            await tx.inventory.deleteMany({
              where: { product_variation_id: variation.id },
            });
          }


          // Hard delete variations (cascade will handle related records)
          await tx.productVariation.deleteMany({
            where: { product_id: id },
          });

          // Hard delete product
          await tx.product.delete({
            where: { id },
          });
        }
      );

      // Delete images from storage after successful database deletion
      const imagesToDelete: string[] = [];
      if (productImageUrl) {
        const objectName = extractObjectNameFromUrl(productImageUrl);
        if (objectName) imagesToDelete.push(objectName);
      }
      for (const url of variationImageUrls) {
        const objectName = extractObjectNameFromUrl(url);
        if (objectName) imagesToDelete.push(objectName);
      }

      for (const objectName of imagesToDelete) {
        try {
          await FileUploadService.deleteFile(objectName);
          log.info(LOG_SOURCE, "deleteProduct: Image deleted", { objectName });
        } catch (imageError) {
          // Log but don't fail the request if image deletion fails
          log.warn(LOG_SOURCE, "deleteProduct: Failed to delete image", {
            objectName,
            error: imageError instanceof Error ? imageError.message : "Unknown error",
          });
        }
      }

      // Invalidate products cache
      if (req.organization) {
        await cache.del(cache.key.products(req.organization.id, req.store?.id || "all"));
        await cache.del(cache.key.products(req.organization.id, "all"));
      }

      log.info(LOG_SOURCE, "deleteProduct succeeded", {
        userId: req.userId,
        productId: id,
        durationMs: Date.now() - startTime,
      });

      return res.json({ message: "Product deleted successfully" });
    } catch (error) {
      log.error(LOG_SOURCE, "deleteProduct failed", {
        userId: req.userId,
        productId: id,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: Date.now() - startTime,
      });
      return res.status(500).json({
        error: "Failed to delete product",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async bulkUpdateProducts(req: AuthRequest, res: Response): Promise<Response> {
    const startTime = Date.now();
    log.info(LOG_SOURCE, "bulkUpdateProducts called", {
      userId: req.userId,
      storeId: req.store?.id,
      organizationId: req.organization?.id,
      itemsCount: req.body?.items?.length,
    });

    try {
      if (!req.organization || !req.userId) {
        log.warn(LOG_SOURCE, "bulkUpdateProducts: Organization or user ID missing", { userId: req.userId });
        return res.status(404).json({ error: "No organization found for user" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const validation = bulkUpdateProductsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
      }

      const { items } = validation.data;

      // Group items by productId to batch product updates
      const productUpdates = new Map<string, {
        imageUrl?: string | null;
        categoryId?: string | null;
      }>();

      const variationUpdates = new Map<string, {
        imageUrl?: string | null;
        sellingPrice?: number;
        price?: number;
        supplierId?: string | null;
        unitId?: string | null;
      }>();

      for (const item of items) {
        // Collect product-level updates
        if (item.productImageUrl !== undefined || item.productCategoryId !== undefined) {
          const existing = productUpdates.get(item.productId) || {};
          if (item.productImageUrl !== undefined) {
            existing.imageUrl = item.productImageUrl;
          }
          if (item.productCategoryId !== undefined) {
            existing.categoryId = item.productCategoryId;
          }
          productUpdates.set(item.productId, existing);
        }

        // Collect variation-level updates
        if (
          item.variationImageUrl !== undefined ||
          item.sellingPrice !== undefined ||
          item.price !== undefined ||
          item.supplierId !== undefined ||
          item.unitId !== undefined
        ) {
          variationUpdates.set(item.variationId, {
            imageUrl: item.variationImageUrl,
            sellingPrice: item.sellingPrice,
            price: item.price,
            supplierId: item.supplierId,
            unitId: item.unitId,
          });
        }
      }

      // Verify access to products
      const productIds = Array.from(productUpdates.keys());
      if (productIds.length > 0) {
        const products = await req.tenantPrisma.product.findMany({
          where: {
            id: { in: productIds },
          },
          select: { id: true, store_id: true },
        });

        for (const product of products) {
          const hasAccess =
            !req.store ||
            product.store_id === req.store.id ||
            product.store_id === null;

          if (!hasAccess) {
            log.warn(LOG_SOURCE, "bulkUpdateProducts: Access denied to product", {
              userId: req.userId,
              storeId: req.store?.id,
              productId: product.id,
            });
            return res.status(403).json({
              error: "Access denied to one or more products",
            });
          }
        }
      }

      // Perform updates in a transaction
      await req.tenantPrisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Update products
        for (const [productId, updates] of productUpdates) {
          const data: Record<string, unknown> = {};
          if (updates.imageUrl !== undefined) {
            data["image_url"] = updates.imageUrl;
          }
          if (updates.categoryId !== undefined) {
            data["product_category_id"] = updates.categoryId;
          }

          if (Object.keys(data).length > 0) {
            await tx.product.update({
              where: { id: productId },
              data,
            });
          }
        }

        // Update variations
        for (const [variationId, updates] of variationUpdates) {
          const data: Record<string, unknown> = {};
          if (updates.imageUrl !== undefined) {
            data["image_url"] = updates.imageUrl;
          }
          if (updates.sellingPrice !== undefined) {
            data["selling_price"] = new Decimal(updates.sellingPrice);
          }
          if (updates.price !== undefined) {
            const price = new Decimal(updates.price);
            data["price"] = price;
            // Keep delivery_cost aligned with product price (legacy column)
            data["delivery_cost"] = price;
            data["delivery_cost_base"] = price;
          }
          if (updates.supplierId !== undefined) {
            data["supplier_id"] = updates.supplierId;
          }
          if (updates.unitId !== undefined) {
            data["unit_id"] = updates.unitId;
          }

          if (Object.keys(data).length > 0) {
            await tx.productVariation.update({
              where: { id: variationId },
              data,
            });
          }
        }
      });

      // Invalidate products cache
      await cache.del(cache.key.products(req.organization!.id, req.store?.id || "all"));
      await cache.del(cache.key.products(req.organization!.id, "all"));

      log.info(LOG_SOURCE, "bulkUpdateProducts succeeded", {
        userId: req.userId,
        storeId: req.store?.id,
        productsUpdated: productUpdates.size,
        variationsUpdated: variationUpdates.size,
        durationMs: Date.now() - startTime,
      });

      return res.json({
        message: "Products updated successfully",
        productsUpdated: productUpdates.size,
        variationsUpdated: variationUpdates.size,
      });
    } catch (error) {
      log.error(LOG_SOURCE, "bulkUpdateProducts failed", {
        userId: req.userId,
        storeId: req.store?.id,
        itemsCount: req.body?.items?.length,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: Date.now() - startTime,
      });
      return res.status(500).json({
        error: "Failed to bulk update products",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async bulkDeleteProducts(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const validation = bulkDeleteProductsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: validation.error.issues,
        });
      }
      const { ids } = validation.data;

      if (!req.userId) {
        log.warn(LOG_SOURCE, "bulkDeleteProducts: User ID missing");
        return res.status(400).json({ error: "User ID is required" });
      }

      if (!req.organization && !req.store) {
        return res
          .status(404)
          .json({ error: "No organization or store found for user" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const whereClause: Prisma.ProductWhereInput = {
        id: {
          in: ids,
        },
      };

      if (req.organization) {
        whereClause.organization_id = req.organization.id;
      }

      if (req.store) {
        whereClause.store_id = req.store.id;
      }

      // Fetch products and their variations to get image URLs before deletion
      const productsToDelete = await req.tenantPrisma.product.findMany({
        where: whereClause,
        include: {
          product_variations: {
            select: { id: true, image_url: true },
          },
        },
      });

      // Collect all image URLs to delete and variation IDs for inventory cleanup
      const imagesToDelete: string[] = [];
      const variationIds: string[] = [];
      for (const product of productsToDelete) {
        if (product.image_url) {
          const objectName = extractObjectNameFromUrl(product.image_url);
          if (objectName) imagesToDelete.push(objectName);
        }
        for (const variation of product.product_variations) {
          variationIds.push(variation.id);
          if (variation.image_url) {
            const objectName = extractObjectNameFromUrl(variation.image_url);
            if (objectName) imagesToDelete.push(objectName);
          }
        }
      }

      // Delete related records in a transaction to avoid foreign key constraint errors
      await req.tenantPrisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Delete transactions for all variations first (due to onDelete: Restrict)
        if (variationIds.length > 0) {
          await tx.transaction.deleteMany({
            where: { product_variation_id: { in: variationIds } },
          });
        }

        // Delete inventory records for all variations
        if (variationIds.length > 0) {
          await tx.inventory.deleteMany({
            where: { product_variation_id: { in: variationIds } },
          });
        }

        // Delete variations (cascade will handle other related records)
        await tx.productVariation.deleteMany({
          where: { product_id: { in: ids } },
        });

        // Delete products
        await tx.product.deleteMany({
          where: whereClause,
        });
      });

      const deletedCount = productsToDelete.length;

      // Delete images from storage after successful database deletion
      for (const objectName of imagesToDelete) {
        try {
          await FileUploadService.deleteFile(objectName);
          log.info(LOG_SOURCE, "bulkDeleteProducts: Image deleted", { objectName });
        } catch (imageError) {
          // Log but don't fail the request if image deletion fails
          log.warn(LOG_SOURCE, "bulkDeleteProducts: Failed to delete image", {
            objectName,
            error: imageError instanceof Error ? imageError.message : "Unknown error",
          });
        }
      }

      log.info(LOG_SOURCE, "bulkDeleteProducts succeeded", {
        userId: req.userId,
        storeId: req.store?.id,
        productsDeleted: deletedCount,
      });

      return res.json({
        message: "Products deleted successfully",
        productsDeleted: deletedCount,
      });
    } catch (error) {
      log.error(LOG_SOURCE, "bulkDeleteProducts failed", {
        userId: req.userId,
        storeId: req.store?.id,
        idsCount: req.body?.ids?.length,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return res.status(500).json({
        error: "Failed to bulk delete products",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
