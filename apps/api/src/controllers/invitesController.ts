import { Response } from "express";
import inviteService from "../services/invites";
import logger from "../../logs/log";
import { AuthRequest } from "../middleware/auth";

export class InvitesController {
  async createInvite(req: AuthRequest, res: Response) {
    try {
      if (!req.organizationId || !req.userId) {
        return res.status(400).json({ error: "Organization context required" });
      }
      const { store_id, expires_in_days } = req.body as {
        store_id?: string;
        expires_in_days?: number;
      };

      const { invite, token } = await inviteService.createInvite({
        organizationId: req.organizationId,
        storeId: store_id as string,
        createdBy: req.userId,
        expiresInDays: expires_in_days,
      });

      return res.status(201).json({ invite, token });
    } catch (error) {
      logger.error("Create invite error", "invitesController", {
        error: (error as Error).message,
      });
      const status =
        (error as Error).message === "Store not found in this organization"
          ? 404
          : 400;
      return res.status(status).json({ error: (error as Error).message });
    }
  }

  async listInvites(req: AuthRequest, res: Response) {
    try {
      if (!req.organizationId) {
        return res.status(400).json({ error: "Organization context required" });
      }
      const invites = await inviteService.listInvites(req.organizationId);
      return res.json({ invites });
    } catch (error) {
      logger.error("List invites error", "invitesController", {
        error: (error as Error).message,
      });
      return res.status(500).json({ error: (error as Error).message });
    }
  }

  async revokeInvite(req: AuthRequest, res: Response) {
    try {
      if (!req.organizationId) {
        return res.status(400).json({ error: "Organization context required" });
      }
      const { inviteId } = req.params;
      await inviteService.revokeInvite({
        inviteId: inviteId as string,
        organizationId: req.organizationId,
      });
      return res.json({ message: "Invite revoked successfully" });
    } catch (error) {
      logger.error("Revoke invite error", "invitesController", {
        error: (error as Error).message,
      });
      const status =
        (error as Error).message === "Invite not found" ? 404 : 400;
      return res.status(status).json({ error: (error as Error).message });
    }
  }
}
