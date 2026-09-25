import { Response } from "express";
import logger from "../../logs/log";
import { createTransaction } from "../services/transactions";
import { Prisma, WriteOffReason } from "../generated/tenant/client";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";

// Constants
const MAX_WRITE_OFF_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_QUANTITY = 1000000; // Reasonable upper limit

// Zod Schemas
const WriteOffReasonSchema = z.nativeEnum(WriteOffReason);

const GetWriteOffsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reason: WriteOffReasonSchema.optional(),
  productVariationId: z.string().optional(),
});

const CreateWriteOffSchema = z.object({
  productVariationId: z.string().min(1, "Product variation ID is required"),
  quantity: z.coerce
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be positive")
    .max(MAX_QUANTITY, `Quantity cannot exceed ${MAX_QUANTITY}`),
  reason: WriteOffReasonSchema,
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

const GetWriteOffSummarySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const DeleteWriteOffSchema = z.object({
  id: z.string().min(1, "Write-off ID is required"),
});

export class WriteOffController {
  /**
   * Get write-offs with proper filtering and security checks
   */
  async getWriteOffs(req: AuthRequest, res: Response) {
    try {
      if (!req.tenantPrisma) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate store access
      if (!req.store?.id) {
        return res.status(401).json({ error: "Unauthorized: Store not found" });
      }

      // Validate query params
      const validationResult = GetWriteOffsSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: validationResult.error.format(),
        });
      }

      const { startDate, endDate, reason, productVariationId } =
        validationResult.data;

      // Validate date range logic
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({ error: "Invalid date format" });
        }

        if (start > end) {
          return res.status(400).json({
            error: "Start date must be before or equal to end date",
          });
        }
      }

      const whereConditions = {
        store_id: req.store.id,
        ...(reason && { reason }),
        ...(productVariationId && {
          product_variation_id: productVariationId,
        }),
        ...(startDate &&
          endDate && {
          write_off_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      };

      const writeOffs = await req.tenantPrisma.writeOff.findMany({
        where: whereConditions,
        include: {
          product_variation: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image_url: true,
                },
              },
              unit: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { write_off_date: "desc" },
        take: 1000, // Limit results to prevent memory issues
      });

      return res.json({
        writeOffs,
        count: writeOffs.length,
      });
    } catch (error) {
      logger.error("Get write-offs error:", "writeOffController", {
        error,
        storeId: req.store?.id,
        userId: req.userId,
      });

      return res.status(500).json({
        error: "Failed to retrieve write-offs",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create a write-off with proper validation and atomic operations
   */
  async createWriteOff(req: AuthRequest, res: Response) {
    try {
      // Validate authentication
      if (!req.store?.id || !req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.tenantPrisma) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate body
      const validationResult = CreateWriteOffSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: validationResult.error.format(),
        });
      }

      const { productVariationId, quantity, reason, notes } =
        validationResult.data;

      // Perform write-off in an atomic transaction with proper locking
      const result = await req.tenantPrisma.$transaction(
        async (tx) => {
          // Lock and verify product variation with proper query
          const productVariation = await tx.productVariation.findFirst({
            where: {
              id: productVariationId,
              store_id: req.store!.id,
            },
            select: {
              id: true,
              name: true,
              price: true,
              store_id: true,
            },
          });

          if (!productVariation) {
            throw new Error("Product variation not found or access denied");
          }

          // Get current inventory with explicit query (avoid array access vulnerability)
          const inventory = await tx.inventory.findFirst({
            where: {
              product_variation_id: productVariationId,
              store_id: req.store!.id,
            },
            select: {
              id: true,
              quantity_in_stock: true,
            },
          });

          const currentStock = inventory?.quantity_in_stock ?? 0;

          // Validate sufficient stock
          if (currentStock < quantity) {
            throw new Error(
              `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`
            );
          }

          // Create write-off record
          const writeOff = await tx.writeOff.create({
            data: {
              product_variation_id: productVariationId,
              store_id: req.store!.id,
              user_id: req.userId!,
              quantity: quantity,
              reason: reason,
              notes: notes ? notes.trim() : null,
              write_off_date: new Date(),
            },
            include: {
              product_variation: {
                select: {
                  name: true,
                  barcode: true,
                },
              },
            },
          });

          await createTransaction(
            {
              product_variation_id: productVariationId,
              store_id: req.store!.id,
              transaction_type: "internal_use", // Mapping write-off to internal_use (outgoing)
              quantity: quantity,
              unit_price: productVariation.price,
              total_amount: productVariation.price.times(quantity),
              remarks: `Write-off [${writeOff.id}]: ${reason}${notes ? ` - ${notes.substring(0, 100)}` : ""
                }`,
              userId: req.userId!,
            },
            tx as unknown as Prisma.TransactionClient
          );

          return writeOff;
        },
        {
          maxWait: 5000, // Maximum time to wait for a transaction slot
          timeout: 10000, // Maximum transaction execution time
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      return res.status(201).json({
        message: "Write-off created successfully",
        writeOff: result,
      });
    } catch (error) {
      logger.error("Create write-off error:", "writeOffController", {
        error,
        body: req.body,
        userId: req.userId,
        storeId: req.store?.id,
      });

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return res.status(500).json({
        error: "Failed to create write-off",
        message: errorMessage,
      });
    }
  }

  /**
   * Get write-off summary with aggregated statistics
   */
  async getWriteOffSummary(req: AuthRequest, res: Response) {
    try {
      // Validate store access
      if (!req.store?.id) {
        return res.status(401).json({ error: "Unauthorized: Store not found" });
      }

      // Validate query params
      const validationResult = GetWriteOffSummarySchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: validationResult.error.format(),
        });
      }

      const { startDate, endDate } = validationResult.data;

      // Validate date range logic
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({ error: "Invalid date format" });
        }

        if (start > end) {
          return res.status(400).json({
            error: "Start date must be before or equal to end date",
          });
        }
      }

      const whereConditions = {
        store_id: req.store.id,
        ...(startDate &&
          endDate && {
          write_off_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      };

      if (!req.tenantPrisma) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const writeOffs = await req.tenantPrisma.writeOff.findMany({
        where: whereConditions,
        include: {
          product_variation: {
            select: {
              price: true,
            },
          },
        },
      });

      // Explicitly type the result to avoid inference issues
      type WriteOffWithVariation = Prisma.WriteOffGetPayload<{
        include: {
          product_variation: {
            select: {
              price: true;
            };
          };
        };
      }>;

      const typedWriteOffs = writeOffs as unknown as WriteOffWithVariation[];

      // Calculate summary by reason
      const summaryByReason: Record<
        string,
        { count: number; totalQuantity: number; totalValue: Prisma.Decimal }
      > = {};

      let totalValue = new Prisma.Decimal(0);
      let totalQuantity = 0;

      for (const writeOff of typedWriteOffs) {
        const reason = writeOff.reason;
        const value = writeOff.product_variation.price.times(
          writeOff.quantity
        );

        if (!summaryByReason[reason]) {
          summaryByReason[reason] = {
            count: 0,
            totalQuantity: 0,
            totalValue: new Prisma.Decimal(0),
          };
        }

        summaryByReason[reason].count += 1;
        summaryByReason[reason].totalQuantity += writeOff.quantity;
        summaryByReason[reason].totalValue =
          summaryByReason[reason].totalValue.plus(value);

        totalValue = totalValue.plus(value);
        totalQuantity += writeOff.quantity;
      }

      return res.json({
        totalWriteOffs: writeOffs.length,
        totalQuantity,
        totalValue: totalValue.toNumber(), // Round to 2 decimals
        summaryByReason: Object.entries(summaryByReason).reduce(
          (acc, [reason, data]) => ({
            ...acc,
            [reason]: {
              ...data,
              totalValue: data.totalValue.toNumber(),
            },
          }),
          {}
        ),
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      });
    } catch (error) {
      logger.error("Get write-off summary error:", "writeOffController", {
        error,
        storeId: req.store?.id,
        userId: req.userId,
      });

      return res.status(500).json({
        error: "Failed to get write-off summary",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delete (reverse) a write-off with strict validation
   */
  async deleteWriteOff(req: AuthRequest, res: Response) {
    try {
      // Validate authentication and authorization
      if (!req.store?.id || !req.userId || !req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate params
      const validationResult = DeleteWriteOffSchema.safeParse(req.params);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid parameters",
          details: validationResult.error.format(),
        });
      }

      const { id } = validationResult.data;

      // Owner-only delete
      if (!req.user?.owned_organization) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only owners can delete write-offs",
        });
      }

      if (!req.tenantPrisma) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Fetch and validate write-off
      const writeOff = await req.tenantPrisma.writeOff.findUnique({
        where: { id },
        include: {
          product_variation: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      });

      if (!writeOff) {
        return res.status(404).json({ error: "Write-off not found" });
      }

      // Verify store access
      if (writeOff.store_id !== req.store.id) {
        return res.status(403).json({
          error: "Access denied",
          message: "Write-off belongs to a different store",
        });
      }

      // Check write-off age (within 24 hours)
      const writeOffAge =
        Date.now() - new Date(writeOff.write_off_date).getTime();

      if (writeOffAge > MAX_WRITE_OFF_AGE_MS) {
        const hoursOld = Math.floor(writeOffAge / (60 * 60 * 1000));
        return res.status(400).json({
          error: "Write-off too old to delete",
          message: `Write-offs can only be deleted within 24 hours. This write-off is ${hoursOld} hours old.`,
        });
      }

      if (!req.tenantPrisma) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Reverse the write-off in an atomic transaction
      await req.tenantPrisma.$transaction(
        async (tx) => {
          // Find the associated write-off transaction with stricter matching
          const writeOffTransaction = await tx.transaction.findFirst({
            where: {
              product_variation_id: writeOff.product_variation_id,
              store_id: writeOff.store_id,
              transaction_type: "internal_use",
              quantity: writeOff.quantity,
              transaction_date: {
                gte: new Date(writeOff.write_off_date.getTime() - 1000), // 1 second tolerance
                lte: new Date(writeOff.write_off_date.getTime() + 1000),
              },
              remarks: {
                contains: `[${writeOff.id}]`,
              },
            },
          });

          if (!writeOffTransaction) {
            logger.warn("Write-off transaction not found for reversal", "writeOffController", {
              writeOffId: id,
              productVariationId: writeOff.product_variation_id,
            });
          }

          // Create adjustment transaction to restore inventory
          const reversalAmount =
            writeOff.product_variation.price.times(writeOff.quantity);

          await createTransaction(
            {
              product_variation_id: writeOff.product_variation_id,
              store_id: writeOff.store_id,
              transaction_type: "adjustment",
              quantity: writeOff.quantity,
              unit_price: writeOff.product_variation.price,
              total_amount: reversalAmount,
              remarks: `Reversal of write-off [${id}] - ${writeOff.reason}.`,
              userId: req.userId!,
            },
            tx as unknown as Prisma.TransactionClient
          );

          // Delete the write-off record
          await tx.writeOff.delete({
            where: { id },
          });
        },
        {
          maxWait: 5000,
          timeout: 10000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      return res.json({
        message: "Write-off deleted and inventory restored successfully",
        writeOff: {
          id: writeOff.id,
          quantity: writeOff.quantity,
          reason: writeOff.reason,
          productName: writeOff.product_variation.name,
        },
      });
    } catch (error) {
      logger.error("Delete write-off error:", "writeOffController", {
        error,
        userId: req.userId,
        storeId: req.store?.id,
      });

      return res.status(500).json({
        error: "Failed to delete write-off",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
