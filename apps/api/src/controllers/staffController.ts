import { Response } from "express";
import { prisma } from "../lib/prisma";
import logger from "../../logs/log";
import { AuthRequest } from "../middleware/auth";

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
          transaction_view_limit_days: assignment.transaction_view_limit_days,
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
      const { transaction_view_limit_days } = req.body;

      if (!assignmentId) {
        return res.status(400).json({
          error: "Assignment ID is required",
        });
      }

      const assignment = await prisma.userOrganization.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment || assignment.store_id !== req.store.id) {
        return res.status(404).json({
          error: "Staff assignment not found",
        });
      }

      await prisma.userOrganization.update({
        where: { id: assignmentId },
        data: {
          transaction_view_limit_days: transaction_view_limit_days !== undefined ? transaction_view_limit_days : undefined,
        },
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
      });

      if (!assignment || assignment.store_id !== req.store.id) {
        return res.status(404).json({
          error: "Staff assignment not found",
        });
      }

      await prisma.userOrganization.delete({
        where: { id: assignmentId },
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
