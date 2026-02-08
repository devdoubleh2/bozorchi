import { Response } from "express";
import logger from "../../logs/log";
import { AuthRequest } from "@/middleware/auth";
import { cache, CACHE_TTL } from "@/services/cache";

export class UnitsController {
  async getUnit(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: "Unit ID is required",
        });
      }

      if (!req.organization) {
        return res.status(404).json({ error: "No organization found" });
      }

      if (!id) {
        return res.status(400).json({ error: "Unit ID is required" });
      }

      if (!req.organization) {
        return res.status(404).json({ error: "No organization found" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "No tenant prisma found" });
      }

      const unit = await req.tenantPrisma.unit.findUnique({
        where: { id },
      });

      if (!unit) {
        return res.status(404).json({
          error: "Unit not found",
        });
      }

      if (unit.organization_id !== req.organization.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      return res.json({ unit });
    } catch (error) {
      logger.error("Get unit error:", "unitsController", error);
      return res.status(500).json({
        error: "Failed to get unit",
        message: (error as Error).message,
      });
    }
  }

  async getAllUnits(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.organization) {
        return res.status(400).json({ error: "Organization context required" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "No tenant prisma found" });
      }

      // Check cache first
      const cacheKey = cache.key.units(req.organization.id);
      const cached = await cache.get<{ units: unknown[] }>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const units = await req.tenantPrisma.unit.findMany({
        where: {
          organization_id: req.organization.id
        },
      });

      const response = { units };
      await cache.set(cacheKey, response, CACHE_TTL.UNITS);

      return res.json(response);
    } catch (error) {
      logger.error("Get units error:", "unitsController", error);
      return res.status(500).json({
        error: "Failed to get units",
        message: (error as Error).message,
      });
    }
  }

  async createUnit(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Unit name is required",
        });
      }

      if (!req.organization) {
        return res.status(404).json({
          error: "No organization found for user",
        });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "No tenant prisma found" });
      }

      const unit = await req.tenantPrisma.unit.create({
        data: {
          name,
          organization_id: req.organization.id,
        },
      });

      // Invalidate cache
      await cache.del(cache.key.units(req.organization.id));

      return res.status(201).json({
        message: "Unit created successfully",
        unit,
      });
    } catch (error) {
      logger.error("Create unit error:", "unitsController", error);
      return res.status(500).json({
        error: "Failed to create unit",
        message: (error as Error).message,
      });
    }
  }

  async updateUnit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Unit name is required for update",
        });
      }

      if (!req.organization) {
        return res.status(404).json({ error: "No organization found" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "No tenant prisma found" });
      }

      const unit = await req.tenantPrisma.unit.findUnique({
        where: { id: id! },
      });

      if (!unit) {
        return res.status(404).json({
          error: "Unit not found",
        });
      }

      if (unit.organization_id !== req.organization.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "No tenant prisma found" });
      }

      const updatedUnit = await req.tenantPrisma.unit.update({
        where: { id: id! },
        data: { name },
      });

      // Invalidate cache
      await cache.del(cache.key.units(req.organization.id));

      return res.json({
        message: "Unit updated successfully",
        unit: updatedUnit,
      });
    } catch (error) {
      logger.error("Update unit error:", "unitsController", error);
      return res.status(500).json({
        error: "Failed to update unit",
        message: (error as Error).message,
      });
    }
  }

  async deleteUnit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!req.organization) {
        return res.status(404).json({ error: "No organization found" });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "No tenant prisma found" });
      }

      const unit = await req.tenantPrisma.unit.findUnique({
        where: { id: id! },
      });

      if (!unit) {
        return res.status(404).json({
          error: "Unit not found",
        });
      }

      if (unit.organization_id !== req.organization.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const productVariationCount = await req.tenantPrisma.productVariation.count({
        where: { unit_id: id! },
      });

      if (productVariationCount > 0) {
        return res.status(400).json({
          error: "Cannot delete unit that is being used by product variations",
        });
      }

      await req.tenantPrisma.unit.delete({
        where: { id: id! },
      });

      // Invalidate cache
      await cache.del(cache.key.units(req.organization.id));

      return res.json({
        message: "Unit deleted successfully",
      });
    } catch (error) {
      logger.error("Delete unit error:", "unitsController", error);
      return res.status(500).json({
        error: "Failed to delete unit",
        message: (error as Error).message,
      });
    }
  }
}
