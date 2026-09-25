import { Router, Response } from "express";
import { createAuthHandler, AuthRequest } from "../middleware/auth";
import { runManualBackup } from "../lib/backupScheduler";
import logger from "../../logs/log";

const router: Router = Router();

/**
 * POST /api/backup/manual
 * Triggers a manual database backup
 * Only accessible by authenticated users (you can add owner check)
 */
router.post(
  "/manual",
  createAuthHandler(async (req: AuthRequest, res: Response) => {
    try {
      // Optional: Add owner check here
      // if (!req.user?.owned_organization) {
      //   return res.status(403).json({ error: "Forbidden" });
      // }

      logger.info("backupRoute", "Manual backup triggered", {
        userId: req.user?.id,
      });

      const targetChatIdRaw = req.user?.push_token;
      const targetChatId = targetChatIdRaw ? Number(targetChatIdRaw) : NaN;
      if (!Number.isFinite(targetChatId) || targetChatId <= 0) {
        return res.status(400).json({
          error: "Telegram account is not connected for this user",
          note: "Use Telegram login first, then retry manual backup",
        });
      }

      // Run backup asynchronously
      runManualBackup(targetChatId).catch((error) => {
        logger.error("backupRoute", "Manual backup failed", {
          error: error.message,
          userId: req.user?.id,
          chatId: targetChatId,
        });
      });

      return res.status(200).json({
        message: "Backup process started",
        note: "You will receive the backup on Telegram shortly",
      });
    } catch (error) {
      logger.error("backupRoute", "Error triggering manual backup", {
        error: (error as Error).message,
      });
      return res.status(500).json({
        error: "Failed to trigger backup",
      });
    }
  })
);

export default router;
