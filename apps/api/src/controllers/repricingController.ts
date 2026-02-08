import { Response } from "express";
import { Prisma } from "../generated/tenant/client";
import logger from "../../logs/log";
import { AuthRequest } from "@/middleware/auth";
import { z } from "zod";

const Decimal = Prisma.Decimal;

const previewRepricingSchema = z.object({
  strategy: z.object({
    type: z.enum(["percentage", "fixed", "margin", "currency"]),
    value: z.number(),
    applyTo: z.enum(["sellingPrice", "price", "both"]),
  }),
  filters: z.object({
    categoryId: z.string().optional(),
    productCategoryId: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    productIds: z.array(z.string()).optional(),
  }),
});

const applyRepricingSchema = z.object({
  priceChanges: z
    .array(
      z.object({
        productVariationId: z.string(),
        productName: z.string(),
        variationName: z.string(),
        currentPrice: z.number(),
        currentSellingPrice: z.number(),
        newPrice: z.number(),
        newSellingPrice: z.number(),
        difference: z.number(),
        percentageChange: z.number(),
      })
    )
    .min(1),
  reason: z.string().optional(),
});

const getPriceHistorySchema = z.object({
  productVariationId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50)),
});

interface PriceChange {
  productVariationId: string;
  productName: string;
  variationName: string;
  currentPrice: number;
  currentSellingPrice: number;
  newPrice: number;
  newSellingPrice: number;
  difference: number;
  percentageChange: number;
}

export class RepricingController {
  async previewRepricing(req: AuthRequest, res: Response) {
    try {
      const validation = previewRepricingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
      }
      const { strategy, filters } = validation.data;

      if (!req.store?.id) {
        return res.status(400).json({ error: "Store context is required" });
      }

      // Build where conditions
      const whereConditions: Prisma.ProductVariationWhereInput = {
        store_id: req.store.id,
        ...(filters.categoryId && {}),
        ...(filters.productCategoryId && {
          product_category_id: filters.productCategoryId,
        }),
        ...(filters.productIds &&
          filters.productIds.length > 0 && {
          product_id: {
            in: filters.productIds,
          },
        }),
        ...((filters.minPrice || filters.maxPrice) && {
          selling_price: {
            ...(filters.minPrice && { gte: new Decimal(filters.minPrice) }),
            ...(filters.maxPrice && { lte: new Decimal(filters.maxPrice) }),
          },
        }),
      };

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const productVariations =
        await req.tenantPrisma.productVariation.findMany({
          where: whereConditions,
          include: {
            product: {
              include: {
                product_category: true,
              },
            },
            unit: true,
          },
        });

      // Calculate new prices
      const priceChanges: PriceChange[] = productVariations.map((pv: any) => {
        let newPrice = pv.price;
        let newSellingPrice = pv.selling_price;
        const strategyValue = new Decimal(strategy.value);

        switch (strategy.type) {
          case "percentage":
            const multiplier = new Decimal(1).add(strategyValue.div(100));
            if (strategy.applyTo === "price" || strategy.applyTo === "both") {
              newPrice = pv.price.mul(multiplier);
            }
            if (
              strategy.applyTo === "sellingPrice" ||
              strategy.applyTo === "both"
            ) {
              newSellingPrice = pv.selling_price.mul(multiplier);
            }
            break;

          case "fixed":
            if (strategy.applyTo === "price" || strategy.applyTo === "both") {
              newPrice = pv.price.add(strategyValue);
            }
            if (
              strategy.applyTo === "sellingPrice" ||
              strategy.applyTo === "both"
            ) {
              newSellingPrice = pv.selling_price.add(strategyValue);
            }
            break;

          case "margin":
            // Set margin based on product price
            const marginMultiplier = new Decimal(1).add(strategyValue.div(100));
            if (strategy.applyTo === "price" || strategy.applyTo === "both") {
              newPrice = pv.price.mul(marginMultiplier);
            }
            if (
              strategy.applyTo === "sellingPrice" ||
              strategy.applyTo === "both"
            ) {
              newSellingPrice = pv.price.mul(marginMultiplier);
            }
            break;

          case "currency":
            // Multiply by currency rate
            if (strategy.applyTo === "price" || strategy.applyTo === "both") {
              newPrice = pv.price.mul(strategyValue);
            }
            if (
              strategy.applyTo === "sellingPrice" ||
              strategy.applyTo === "both"
            ) {
              newSellingPrice = pv.selling_price.mul(strategyValue);
            }
            break;
        }

        // Round to 2 decimal places (using Number conversion for simplicity as Decimal.round() might vary in behavior depending on version/config)
        // Actually, let's use Decimal methods if possible, but to maintain the exact logic as before:
        // newPrice = Math.round(newPrice * 100) / 100;

        const newPriceNum = Number(newPrice.toFixed(2));
        const newSellingPriceNum = Number(newSellingPrice.toFixed(2));
        const currentSellingPriceNum = Number(pv.selling_price.toFixed(2));

        const difference = newSellingPriceNum - currentSellingPriceNum;
        const percentageChange =
          currentSellingPriceNum !== 0
            ? (difference / currentSellingPriceNum) * 100
            : 0;

        return {
          productVariationId: pv.id,
          productName: pv.product.name,
          variationName: pv.name,
          currentPrice: Number(pv.price.toFixed(2)),
          currentSellingPrice: currentSellingPriceNum,
          newPrice: newPriceNum,
          newSellingPrice: newSellingPriceNum,
          difference: Number(difference.toFixed(2)),
          percentageChange: Number(percentageChange.toFixed(2)),
        };
      });

      const summary = {
        totalProducts: priceChanges.length,
        averageIncrease:
          priceChanges.length > 0
            ? priceChanges.reduce((sum, pc) => sum + pc.difference, 0) /
            priceChanges.length
            : 0,
        averagePercentageChange:
          priceChanges.length > 0
            ? priceChanges.reduce((sum, pc) => sum + pc.percentageChange, 0) /
            priceChanges.length
            : 0,
        minIncrease:
          priceChanges.length > 0
            ? Math.min(...priceChanges.map((pc) => pc.difference))
            : 0,
        maxIncrease:
          priceChanges.length > 0
            ? Math.max(...priceChanges.map((pc) => pc.difference))
            : 0,
      };

      return res.json({
        priceChanges,
        summary,
      });
    } catch (error) {
      logger.error("Preview repricing error:", "repricingController", error);
      return res.status(500).json({
        error: "Failed to preview repricing",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async applyRepricing(req: AuthRequest, res: Response) {
    try {
      const validation = applyRepricingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: validation.error.issues,
        });
      }
      const { priceChanges, reason } = validation.data;

      if (!req.store?.id) {
        return res.status(400).json({ error: "Store context is required" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Apply price changes in transaction
      const result = await req.tenantPrisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const updates = [];

          for (const change of priceChanges) {
            // Verify product variation belongs to store
            const pv = await tx.productVariation.findFirst({
              where: {
                id: change.productVariationId,
                store_id: req.store!.id,
              },
              include: {
                product: true,
              },
            });

            if (!pv) {
              throw new Error(
                `Product variation ${change.productVariationId} not found or access denied`
              );
            }

            // Create price history record
            // Compare Decimals properly
            if (!pv.selling_price.equals(new Decimal(change.newSellingPrice))) {
              await tx.priceHistory.create({
                data: {
                  product_variation_id: change.productVariationId,
                  old_price: pv.selling_price,
                  new_price: new Decimal(change.newSellingPrice),
                  changed_by: req.userId!,
                  reason: reason || "Bulk repricing",
                },
              });
            }

            // Update product variation prices
            const updated = await tx.productVariation.update({
              where: { id: change.productVariationId },
              data: {
                price: new Decimal(change.newPrice),
                selling_price: new Decimal(change.newSellingPrice),
              },
            });

            updates.push(updated);
          }

          return updates;
        }
      );

      return res.json({
        message: "Repricing applied successfully",
        productsUpdated: result.length,
      });
    } catch (error) {
      logger.error("Apply repricing error:", "repricingController", error);
      return res.status(500).json({
        error: "Failed to apply repricing",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getPriceHistory(req: AuthRequest, res: Response) {
    try {
      const validation = getPriceHistorySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: validation.error.issues,
        });
      }
      const { productVariationId, startDate, endDate, limit } = validation.data;

      if (!req.store?.id) {
        return res.status(400).json({ error: "Store context is required" });
      }

      const whereConditions: Prisma.PriceHistoryWhereInput = {
        product_variation: {
          store_id: req.store.id,
        },
        ...(productVariationId && {
          product_variation_id: productVariationId,
        }),
        ...(startDate &&
          endDate && {
          change_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      };

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const priceHistory = await req.tenantPrisma.priceHistory.findMany({
        where: whereConditions,
        include: {
          product_variation: {
            include: {
              product: true,
              unit: true,
            },
          },
        },
        orderBy: { change_date: "desc" },
        take: limit,
      });

      return res.json({ priceHistory });
    } catch (error) {
      logger.error("Get price history error:", "repricingController", error);
      return res.status(500).json({
        error: "Failed to get price history",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
