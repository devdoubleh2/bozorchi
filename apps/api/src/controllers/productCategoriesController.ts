import { Response } from "express";
import logger from "../../logs/log";
import { AuthRequest } from "@/middleware/auth";
import { Prisma } from "@/generated/tenant/client/edge";
import { cache, CACHE_TTL } from "@/services/cache";

export class ProductCategoriesController {
  async getProductCategories(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      // Get user's store

      if (!req.store?.id) {
        return res.status(403).json({ error: "Store context required" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Check cache first
      const cacheKey = cache.key.categories(req.organization!.id);
      const cached = await cache.get<{ productCategories: unknown[] }>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const productCategories = await req.tenantPrisma.productCategory.findMany(
        {
          where: {
            store_id: req.store!.id,
          },
          orderBy: {
            created_at: "desc",
          },
        }
      );

      const response = { productCategories };
      await cache.set(cacheKey, response, CACHE_TTL.CATEGORIES);

      return res.json(response);
    } catch (error) {
      logger.error("Get product categories error:", "productCategoriesController", error);
      return res.status(500).json({
        error: "Failed to get product categories",
        message: (error as Error).message,
      });
    }
  }

  async createProductCategory(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const { name, color } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Name is required",
        });
      }

      // Get user's store

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const productCategory = await req.tenantPrisma.productCategory.create({
        data: {
          name,
          color: color || "#4fc3f7",
          store_id: req.store!.id,
        },
      });

      // Invalidate cache
      await cache.del(cache.key.categories(req.organization!.id));

      return res.status(201).json({
        message: "Product category created successfully",
        productCategory,
      });
    } catch (error) {
      logger.error("Create product category error:", "productCategoriesController", error);
      return res.status(500).json({
        error: "Failed to create product category",
        message: (error as Error).message,
      });
    }
  }

  async updateProductCategory(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const { id } = req.params;
      const { name, color } = req.body;

      if (!id) {
        return res.status(400).json({
          error: "Product category ID is required",
        });
      }

      // Get user's store

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const productCategory = await req.tenantPrisma.productCategory.findFirst({
        where: {
          id,
          store_id: req.store!.id,
        },
      });

      if (!productCategory) {
        return res.status(404).json({
          error: "Product category not found",
        });
      }

      const updateData: Record<string, unknown> = {};
      if (name) updateData["name"] = name;
      if (color) updateData["color"] = color;

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const updatedProductCategory =
        await req.tenantPrisma.productCategory.update({
          where: { id },
          data: updateData,
        });

      // Invalidate cache
      await cache.del(cache.key.categories(req.organization!.id));

      return res.json({
        message: "Product category updated successfully",
        productCategory: updatedProductCategory,
      });
    } catch (error) {
      logger.error("Update product category error:", "productCategoriesController", error);
      return res.status(500).json({
        error: "Failed to update product category",
        message: (error as Error).message,
      });
    }
  }

  async deleteProductCategory(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: "Product category ID is required",
        });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const productCategory = await req.tenantPrisma.productCategory.findFirst({
        where: {
          id,
          store_id: req.store!.id,
        },
      });

      if (!productCategory) {
        return res.status(404).json({
          error: "Product category not found",
        });
      }

      const deleteResult = await req.tenantPrisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const affectedProducts = await tx.product.updateMany({
            where: {
              product_category_id: id,
              store_id: req.store!.id,
            },
            data: {
              product_category_id: null,
            },
          });

          await tx.productCategory.delete({
            where: { id },
          });

          return affectedProducts.count;
        }
      );

      // Invalidate cache
      await cache.del(cache.key.categories(req.organization!.id));

      return res.json({
        message: "Product category deleted successfully",
        productsUpdated: deleteResult,
      });
    } catch (error) {
      logger.error("Delete product category error:", "productCategoriesController", error);
      return res.status(500).json({
        error: "Failed to delete product category",
        message: (error as Error).message,
      });
    }
  }

  async getCategoryNames(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.store?.id) {
        return res.status(403).json({ error: "Store context required" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const categories = await req.tenantPrisma.productCategory.findMany({
        where: {
          store_id: req.store.id,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      return res.json({ categories });
    } catch (error) {
      logger.error("Get category names error:", "productCategoriesController", error);
      return res.status(500).json({
        error: "Failed to get category names",
        message: (error as Error).message,
      });
    }
  }
}
