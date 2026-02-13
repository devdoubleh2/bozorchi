import cron from "node-cron";
import { DatabaseBackupService } from "../services/databaseBackup";
import logger from "../../logs/log";

/**
 * Initializes the database backup cron job
 * Runs every hour
 */
export function initializeBackupScheduler(): void {
  const backupService = new DatabaseBackupService();

  // Schedule backup to run at minute 0 of every hour
  // Cron format: '0 * * * *' means "at minute 0 of every hour"
  const schedule = "0 * * * *";

  cron.schedule(
    schedule,
    async () => {
      logger.info("backupScheduler", "Starting scheduled database backup");
      try {
        await backupService.createAndSendBackup();
        logger.info("backupScheduler", "Scheduled backup completed successfully");
      } catch (error) {
        logger.error("backupScheduler", "Scheduled backup failed", {
          error: (error as Error).message,
        });
      }
    },
    {
      timezone: "Asia/Tashkent", // Set your timezone here
    }
  );

  logger.info("backupScheduler", "Database backup scheduler initialized", {
    schedule: "Every hour at minute 0 (Asia/Tashkent)",
    nextRun: "Next backup at the top of the hour",
  });
}

/**
 * Runs a manual backup immediately (useful for testing)
 */
export async function runManualBackup(targetChatId?: number): Promise<void> {
  const backupService = new DatabaseBackupService();
  logger.info("backupScheduler", "Running manual backup");
  await backupService.testBackup(targetChatId);
}
