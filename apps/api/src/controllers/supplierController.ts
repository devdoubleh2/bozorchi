import { Response } from "express";
import { Prisma } from "../generated/tenant/client";
import logger from "../../logs/log";
import { AuthRequest } from "../middleware/auth";

export class SupplierController {
  async getSuppliers(req: AuthRequest, res: Response) {
    try {
      const { search, limit, offset } = req.query;

      // Pawait getTenantPrisma(req.organizationId!).$transaction parameters
      const limitNum = limit ? parseInt(limit as string, 10) : 50;
      const offsetNum = offset ? parseInt(offset as string, 10) : 0;

      const storeId = req.store?.id!;

      if (!req.organization && !storeId) {
        return res
          .status(404)
          .json({ error: "No organization or store context found" });
      }

      // Build where conditions
      const whereConditions = {
        ...(req.organization && { organization_id: req.organization.id }),
        ...(storeId && { store_id: storeId }),
        ...(search && {
          OR: [
            {
              name: {
                contains: search as string,
                mode: "insensitive" as const,
              },
            },
            { phone: { contains: search as string } },
            {
              email: {
                contains: search as string,
                mode: "insensitive" as const,
              },
            },
          ],
        }),
      };

      // Get total count for pagination
      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const total = await req.tenantPrisma.supplier.count({
        where: whereConditions,
      });

      const suppliers = await req.tenantPrisma.supplier.findMany({
        where: whereConditions,
        include: {
          _count: {
            select: {
              supplier_payments: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: limitNum,
        skip: offsetNum,
      });

      return res.json({
        suppliers,
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + suppliers.length < total,
        },
      });
    } catch (error) {
      logger.error("Get suppliers error:", "supplierController", error);
      return res.status(500).json({
        error: "Failed to get suppliers",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getSupplier(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "Supplier ID is required" });
      }

      if (!req.organization) {
        return res.status(404).json({ error: "No organization found" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const supplier = await req.tenantPrisma.supplier.findUnique({
        where: { id },
        include: {
          supplier_payments: {
            orderBy: { payment_date: "desc" },
          },
        },
      });

      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      if (supplier.organization_id !== req.organization.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const totalPayments = supplier.supplier_payments.reduce(
        (sum: number, payment: { amount: Prisma.Decimal }) =>
          sum + payment.amount.toNumber(),
        0
      );

      return res.json({
        supplier: {
          ...supplier,
          totalPayments,
        },
      });
    } catch (error) {
      logger.error("Get supplier error:", "supplierController", error);
      return res.status(500).json({
        error: "Failed to get supplier",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async createSupplier(req: AuthRequest, res: Response) {
    try {
      const { name, contact, phone, email, address, notes } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Supplier name is required" });
      }

      // Get user's organization
      if (!req.organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const supplier = await req.tenantPrisma.supplier.create({
        data: {
          name,
          contact: contact || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          notes: notes || null,
          inn: req.body.inn || null,
          bank_account: req.body.bank_account || null,
          mfo: req.body.mfo || null,
          bank_name: req.body.bank_name || null,
          director_name: req.body.director_name || null,
          organization_id: req.organization.id,
          store_id: req.store?.id || null, // Optional link to store for legacy/tracking
        },
      });

      return res.status(201).json({
        message: "Supplier created successfully",
        supplier,
      });
    } catch (error) {
      logger.error("Create supplier error:", "supplierController", error);
      return res.status(500).json({
        error: "Failed to create supplier",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updateSupplier(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, contact, phone, email, address, notes } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Supplier ID is required" });
      }

      if (!req.organization) {
        return res.status(404).json({ error: "No organization found" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Verify supplier exists and user has access
      const supplier = await req.tenantPrisma.supplier.findUnique({
        where: { id },
      });

      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      if (supplier.organization_id !== req.organization.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedSupplier = await req.tenantPrisma.supplier.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(contact !== undefined && { contact }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(address !== undefined && { address }),
          ...(notes !== undefined && { notes }),
          ...(req.body.inn !== undefined && { inn: req.body.inn }),
          ...(req.body.bank_account !== undefined && {
            bank_account: req.body.bank_account,
          }),
          ...(req.body.mfo !== undefined && { mfo: req.body.mfo }),
          ...(req.body.bank_name !== undefined && {
            bank_name: req.body.bank_name,
          }),
          ...(req.body.director_name !== undefined && {
            director_name: req.body.director_name,
          }),
        },
      });
      return res.json({
        message: "Supplier updated successfully",
        supplier: updatedSupplier,
      });
    } catch (error) {
      logger.error("Update supplier error:", "supplierController", error);
      return res.status(500).json({
        error: "Failed to update supplier",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async deleteSupplier(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "Supplier ID is required" });
      }

      if (!req.organization) {
        return res.status(404).json({ error: "No organization found" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Verify supplier exists and user has access
      const supplier = await req.tenantPrisma.supplier.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              supplier_payments: true,
            },
          },
        },
      });

      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      if (supplier.organization_id !== req.organization.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await req.tenantPrisma.supplier.delete({
        where: { id },
      });

      return res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      logger.error("Delete supplier error:", "supplierController", error);
      return res.status(500).json({
        error: "Failed to delete supplier",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getStats(req: AuthRequest, res: Response) {
    try {
      const { store_id } = req.query;

      const effectiveStoreId =
        (store_id as string | undefined) ?? req.store?.id ?? undefined;

      if (!req.organization && !effectiveStoreId) {
        return res
          .status(404)
          .json({ error: "No organization or store context found" });
      }

      const whereConditions = {
        ...(req.organization && { organization_id: req.organization.id }),
        ...(effectiveStoreId && { store_id: effectiveStoreId }),
      };

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const suppliers = await req.tenantPrisma.supplier.findMany({
        where: whereConditions,
        include: {
          _count: {
            select: {
              supplier_payments: true,
            },
          },
        },
      });

      const summary = {
        totalSuppliers: suppliers.length,
        withPhone: suppliers.filter((s) => Boolean(s.phone)).length,
        withEmail: suppliers.filter((s) => Boolean(s.email)).length,
        totalOrders: 0, // We don't have supplier_orders in the schema yet
        totalPayments: suppliers.reduce(
          (
            sum: number,
            s: {
              _count: { supplier_payments?: number };
            }
          ) => sum + (s._count.supplier_payments || 0),
          0
        ),
      };

      return res.json({ summary });
    } catch (error) {
      logger.error("Get supplier stats error:", "supplierController", error);
      return res.status(500).json({
        error: "Failed to get supplier stats",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
