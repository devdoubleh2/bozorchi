import { Response } from "express";
import { prisma } from "../lib/prisma";
import logger from "../../logs/log";
import { AuthRequest } from "../middleware/auth";
import { Permission } from "../generated/public/client";

const ALLOWED_PERMISSIONS = new Set<Permission>([
  Permission.POS_ACCESS,
  Permission.MANAGE_PRODUCTS,
  Permission.MANAGE_INVENTORY,
  Permission.VIEW_COST_PRICE,
  Permission.VIEW_ANALYTICS,
  Permission.VIEW_DASHBOARD,
]);

export class StaffController {
  async listAssignments(req: AuthRequest, res: Response) {
    try {
      if (!req.store) {
        return res.status(404).json({
          error: "Store not found",
        });
      }

      const assignments = await prisma.userOrganization.findMany({
        where: { store_id: req.store.id },
        orderBy: { created_at: "asc" },
        select: {
          id: true,
          user_id: true,
          role: true,
          approved: true,
          permissions: true,
          created_at: true,
        },
      });

      const userIds = assignments.map((a) => a.user_id);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      const formatted = assignments.map((assignment) => {
        const user = userMap.get(assignment.user_id);
        return {
          id: assignment.id,
          user: {
            email: user?.email || "Unknown",
            name: user?.name || null,
          },
          role: assignment.role,
          approved: assignment.approved,
          permissions: assignment.permissions,
          created_at: assignment.created_at,
        };
      });

      return res.json({
        pending: formatted.filter((assignment) => !assignment.approved),
        approved: formatted.filter((assignment) => assignment.approved),
      });
    } catch (error) {
      logger.error("List staff assignments error:", "staffController", error);
      return res.status(500).json({
        error: "Failed to fetch staff assignments",
        message: (error as Error).message,
      });
    }
  }

  async updateAssignment(req: AuthRequest, res: Response) {
    try {
      if (!req.store) {
        return res.status(404).json({
          error: "Store not found",
        });
      }

      const { assignmentId } = req.params;
      const { permissions } = req.body as { permissions?: unknown };

      if (!assignmentId) {
        return res.status(400).json({
          error: "Assignment ID is required",
        });
      }

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          error: "Permissions array is required",
        });
      }

      const normalizedPermissions = [...new Set(permissions)];
      const hasInvalidPermissions = normalizedPermissions.some(
        (permission) =>
          typeof permission !== "string" ||
          !ALLOWED_PERMISSIONS.has(permission as Permission)
      );

      if (hasInvalidPermissions) {
        return res.status(400).json({
          error: "Invalid permissions provided",
        });
      }

      const assignment = await prisma.userOrganization.findUnique({
        where: { id: assignmentId },
        select: { id: true, store_id: true },
      });

      if (!assignment || assignment.store_id !== req.store.id) {
        return res.status(404).json({
          error: "Staff assignment not found",
        });
      }

      await prisma.userOrganization.update({
        where: { id: assignmentId },
        data: {
          permissions: normalizedPermissions as Permission[],
        },
        select: { id: true },
      });

      return res.json({
        message: "Staff assignment updated successfully",
      });
    } catch (error) {
      logger.error("Update staff assignment error:", "staffController", error);
      return res.status(500).json({
        error: "Failed to update staff assignment",
        message: (error as Error).message,
      });
    }
  }

  async approveAssignment(req: AuthRequest, res: Response) {
    try {
      if (!req.store) {
        return res.status(404).json({
          error: "Store not found",
        });
      }

      const { assignmentId } = req.params;
      if (!assignmentId) {
        return res.status(400).json({
          error: "Assignment ID is required",
        });
      }

      const assignment = await prisma.userOrganization.findUnique({
        where: { id: assignmentId },
        select: { id: true, store_id: true, approved: true },
      });

      if (!assignment || assignment.store_id !== req.store.id) {
        return res.status(404).json({
          error: "Staff assignment not found",
        });
      }

      if (assignment.approved) {
        return res.status(400).json({
          error: "Staff member is already approved",
        });
      }

      await prisma.userOrganization.update({
        where: { id: assignmentId },
        data: { approved: true },
        select: { id: true },
      });

      return res.json({
        message: "Staff member approved successfully",
      });
    } catch (error) {
      logger.error("Approve staff assignment error:", "staffController", error);
      return res.status(500).json({
        error: "Failed to approve staff assignment",
        message: (error as Error).message,
      });
    }
  }

  async removeAssignment(req: AuthRequest, res: Response) {
    try {
      if (!req.store) {
        return res.status(404).json({
          error: "Store not found",
        });
      }

      const { assignmentId } = req.params;
      if (!assignmentId) {
        return res.status(400).json({
          error: "Assignment ID is required",
        });
      }

      const assignment = await prisma.userOrganization.findUnique({
        where: { id: assignmentId },
        select: { id: true, store_id: true },
      });

      if (!assignment || assignment.store_id !== req.store.id) {
        return res.status(404).json({
          error: "Staff assignment not found",
        });
      }

      await prisma.userOrganization.delete({
        where: { id: assignmentId },
        select: { id: true },
      });


      return res.json({
        message: "Staff member removed successfully",
      });
    } catch (error) {
      logger.error("Remove staff assignment error:", "staffController", error);
      return res.status(500).json({
        error: "Failed to remove staff assignment",
        message: (error as Error).message,
      });
    }
  }
}
