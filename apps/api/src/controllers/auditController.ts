import { Response } from "express";
import {
  createTransaction,
  PrismaClientOrTransaction,
} from "../services/transactions";
import {
  AuditStatus,
  Prisma,
  InventoryAuditItem,
} from "../generated/tenant/client";
import { AuthRequest } from "../middleware/auth";
import logger from "../../logs/log";

export class AuditController {
  async getAudits(req: AuthRequest, res: Response) {
    try {
      const { status } = req.query;
      if (!req.store) {
        return res.status(404).json({ error: "Store not found" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const whereConditions = {
        store_id: req.store.id,
        ...(status && { status: status as AuditStatus }),
      };

      const audits = await req.tenantPrisma.inventoryAudit.findMany({
        where: whereConditions,
        include: {
          audit_items: {
            include: {
              product_variation: {
                include: {
                  product: true,
                  unit: true,
                },
              },
            },
          },
        },
        orderBy: { audit_date: "desc" },
      });

      return res.json({ data: { audits } });
    } catch (error) {
      logger.error("Get audits error:", "auditController", error);
      return res.status(500).json({
        error: "Failed to get audits",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getAudit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "Audit ID is required" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const audit = await req.tenantPrisma.inventoryAudit.findUnique({
        where: { id },
        include: {
          audit_items: {
            include: {
              product_variation: {
                include: {
                  product: true,
                  unit: true,
                },
              },
            },
          },
        },
      });

      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      // Verify user has access
      if (audit.store_id !== req.store!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Calculate discrepancies
      const totalDiscrepancies = audit.audit_items.reduce(
        (sum: number, item: InventoryAuditItem) =>
          sum + Math.abs(item.difference),
        0
      );

      const itemsWithDiscrepancies = audit.audit_items.filter(
        (item: InventoryAuditItem) => item.difference !== 0
      ).length;

      return res.json({
        data: {
          audit: {
            ...audit,
            totalDiscrepancies,
            itemsWithDiscrepancies,
          },
        },
      });
    } catch (error) {
      logger.error("Get audit error:", "auditController", error);
      return res.status(500).json({
        error: "Failed to get audit",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async startAudit(req: AuthRequest, res: Response) {
    try {
      const { notes } = req.body;

      // Get user's store
      if (!req.store) {
        return res.status(404).json({ error: "Store not found" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Check for existing in-progress audit
      const existingAudit = await req.tenantPrisma.inventoryAudit.findFirst({
        where: {
          store_id: req.store.id,
          status: "in_progress",
        },
      });

      if (existingAudit) {
        return res.status(400).json({
          error: "An audit is already in progress",
          auditId: existingAudit.id,
        });
      }

      // Create new audit
      const audit = await req.tenantPrisma.inventoryAudit.create({
        data: {
          store_id: req.store.id!,
          user_id: req.userId!,
          status: "in_progress",
          notes: notes,
        },
      });

      return res.status(201).json({
        data: {
          message: "Audit started successfully",
          audit,
        },
      });
    } catch (error) {
      logger.error("Start audit error:", "auditController", error);
      return res.status(500).json({
        error: "Failed to start audit",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async scanItem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { barcode } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Audit ID is required" });
      }

      if (!barcode) {
        return res.status(400).json({ error: "Barcode is required" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const audit = await req.tenantPrisma.inventoryAudit.findUnique({
        where: { id },
      });

      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      if (audit.status !== "in_progress") {
        return res.status(400).json({
          error: "Audit is not in progress",
        });
      }

      // Verify user has access
      if (audit.store_id !== req.store!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Find product variation by barcode
      const productVariation =
        await req.tenantPrisma.productVariation.findFirst({
          where: {
            barcode,
            store_id: req.store!.id,
          },
          include: {
            product: true,
            unit: true,
            inventory: {
              where: {
                store_id: req.store!.id,
              },
            },
          },
        });

      if (!productVariation) {
        return res.status(404).json({
          error: "Product not found with this barcode",
        });
      }

      const expectedQuantity =
        productVariation.inventory[0]?.quantity_in_stock || 0;

      // Check if item already exists in audit
      const existingItem = await req.tenantPrisma.inventoryAuditItem.findUnique(
        {
          where: {
            inventory_audit_id_product_variation_id: {
              inventory_audit_id: id,
              product_variation_id: productVariation.id,
            },
          },
        }
      );

      if (existingItem) {
        // Increment actual quantity
        const updatedItem = await req.tenantPrisma.inventoryAuditItem.update({
          where: { id: existingItem.id },
          data: {
            actual_quantity: {
              increment: 1,
            },
            difference: {
              increment: 1,
            },
          },
          include: {
            product_variation: {
              include: {
                product: true,
                unit: true,
              },
            },
          },
        });

        return res.json({
          data: {
            message: "Item quantity updated",
            auditItem: updatedItem,
          },
        });
      } else {
        // Create new audit item with actual_quantity = 1
        const auditItem = await req.tenantPrisma.inventoryAuditItem.create({
          data: {
            inventory_audit_id: id,
            product_variation_id: productVariation.id,
            expected_quantity: expectedQuantity,
            actual_quantity: 1,
            difference: 1 - expectedQuantity,
          },
          include: {
            product_variation: {
              include: {
                product: true,
                unit: true,
              },
            },
          },
        });

        return res.status(201).json({
          data: {
            message: "Item added to audit",
            auditItem,
          },
        });
      }
    } catch (error) {
      logger.error("Scan item error:", "auditController", error);
      return res.status(500).json({
        error: "Failed to scan item",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updateAuditItem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { productVariationId, actualQuantity, notes } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Audit ID is required" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      if (!productVariationId) {
        return res.status(400).json({
          error: "Product variation ID is required",
        });
      }

      if (actualQuantity === undefined || actualQuantity < 0) {
        return res.status(400).json({
          error: "Valid actual quantity is required",
        });
      }

      const audit = await req.tenantPrisma.inventoryAudit.findUnique({
        where: { id },
      });

      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      if (audit.status !== "in_progress") {
        return res.status(400).json({
          error: "Audit is not in progress",
        });
      }

      // Verify user has access
      if (audit.store_id !== req.store!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get product variation and expected quantity
      const productVariation =
        await req.tenantPrisma.productVariation.findUnique({
          where: {
            id: productVariationId,
          },
          include: {
            inventory: {
              where: {
                store_id: req.store!.id,
              },
            },
          },
        });

      if (!productVariation) {
        return res.status(404).json({ error: "Product variation not found" });
      }

      // Verify product belongs to the store
      if (productVariation.store_id !== req.store!.id) {
        return res
          .status(403)
          .json({ error: "Product does not belong to this store" });
      }

      const expectedQuantity =
        productVariation.inventory[0]?.quantity_in_stock || 0;

      // Upsert audit item
      const auditItem = await req.tenantPrisma.inventoryAuditItem.upsert({
        where: {
          inventory_audit_id_product_variation_id: {
            inventory_audit_id: id,
            product_variation_id: productVariationId,
          },
        },
        update: {
          actual_quantity: actualQuantity,
          difference: actualQuantity - expectedQuantity,
          notes: notes || null,
        },
        create: {
          inventory_audit_id: id,
          product_variation_id: productVariationId,
          expected_quantity: expectedQuantity,
          actual_quantity: actualQuantity,
          difference: actualQuantity - expectedQuantity,
          notes: notes || null,
        },
        include: {
          product_variation: {
            include: {
              product: true,
              unit: true,
            },
          },
        },
      });

      return res.json({
        data: {
          message: "Audit item updated successfully",
          auditItem,
        },
      });
    } catch (error) {
      logger.error("Update audit item error:", "auditController", error);
      return res.status(500).json({
        error: "Failed to update audit item",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async completeAudit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "Audit ID is required" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const audit = await req.tenantPrisma.inventoryAudit.findUnique({
        where: { id },
        include: {
          audit_items: {
            include: {
              product_variation: true,
            },
          },
        },
      });

      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      if (audit.status !== "in_progress") {
        return res.status(400).json({
          error: "Audit is not in progress",
        });
      }

      // Verify user has access
      if (audit.store_id !== req.store!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Complete audit and create adjustment transactions
      const result = await req.tenantPrisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const adjustments = [];

          // Create adjustment transactions for items with discrepancies
          for (const item of audit.audit_items) {
            if (item.difference !== 0) {
              const transaction = await createTransaction(
                {
                  product_variation_id: item.product_variation_id,
                  store_id: req.store!.id,
                  transaction_type: "adjustment",
                  quantity: item.difference,
                  unit_price: item.product_variation.price,
                  total_amount: item.product_variation.price.times(
                    Math.abs(item.difference)
                  ),
                  remarks: `Inventory audit adjustment - Audit ID: ${id}`,
                  userId: req.userId!,
                },
                tx as unknown as PrismaClientOrTransaction
              );
              adjustments.push(transaction);
            }
          }

          // Update audit status
          const updatedAudit = await tx.inventoryAudit.update({
            where: { id },
            data: {
              status: "completed",
            },
            include: {
              // user relation doesn't exist
              audit_items: {
                include: {
                  product_variation: {
                    include: {
                      product: true,
                      unit: true,
                    },
                  },
                },
              },
            },
          });

          return { audit: updatedAudit, adjustments };
        },
        {
          maxWait: 5000,
          timeout: 15000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      return res.json({
        data: {
          message: "Audit completed successfully",
          audit: result.audit,
          adjustmentsCreated: result.adjustments.length,
        },
      });
    } catch (error) {
      logger.error("Complete audit error:", "auditController", error);
      return res.status(500).json({
        error: "Failed to complete audit",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async cancelAudit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      if (!id) {
        return res.status(400).json({ error: "Audit ID is required" });
      }

      const audit = await req.tenantPrisma.inventoryAudit.findUnique({
        where: { id },
      });

      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      if (audit.status !== "in_progress") {
        return res.status(400).json({
          error: "Can only cancel in-progress audits",
        });
      }

      // Verify user has access
      if (audit.store_id !== req.store?.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedAudit = await req.tenantPrisma.inventoryAudit.update({
        where: { id },
        data: {
          status: "cancelled",
        },
      });

      return res.json({
        data: {
          message: "Audit cancelled successfully",
          audit: updatedAudit,
        },
      });
    } catch (error) {
      logger.error("Cancel audit error:", "auditController", error);
      return res.status(500).json({
        error: "Failed to cancel audit",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
