import { Router, Response } from "express";
import { createAuthHandler, AuthRequest } from "../middleware/auth";
import { runManualBackup } from "../lib/backupScheduler";
import logger from "../../logs/log";

const router: Router = Router();

/**
 * POST /api/backup/manual
 * Triggers a manual database backup
 * Only accessible by authenticated users (you can add admin check)
 */
router.post(
  "/manual",
  createAuthHandler(async (req: AuthRequest, res: Response) => {
    try {
      // Optional: Add admin check here
      // if (req.user.role !== 'admin') {
      //   return res.status(403).json({ error: "Forbidden" });
      // }

      logger.info("Manual backup triggered", "backupRoute", {
        userId: req.user?.id,
      });

      // Run backup asynchronously
      runManualBackup().catch((error) => {
        logger.error("Manual backup failed", "backupRoute", {
          error: error.message,
        });
      });

      return res.status(200).json({
        message: "Backup process started",
        note: "You will receive the backup on Telegram shortly",
      });
    } catch (error) {
      logger.error("Error triggering manual backup", "backupRoute", {
        error: (error as Error).message,
      });
      return res.status(500).json({
        error: "Failed to trigger backup",
      });
    }
  })
);

export default router;
