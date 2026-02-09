import cron from "node-cron";
import { DatabaseBackupService } from "../services/databaseBackup";
import logger from "../../logs/log";

/**
 * Initializes the database backup cron job
 * Runs every day at 2:00 AM
 */
export function initializeBackupScheduler(): void {
  const backupService = new DatabaseBackupService();

  // Schedule backup to run daily at 2:00 AM
  // Cron format: '0 2 * * *' means "at 02:00 every day"
  const schedule = "0 2 * * *";

  cron.schedule(
    schedule,
    async () => {
      logger.info("Starting scheduled database backup", "backupScheduler");
      try {
        await backupService.createAndSendBackup();
        logger.info("Scheduled backup completed successfully", "backupScheduler");
      } catch (error) {
        logger.error("Scheduled backup failed", "backupScheduler", {
          error: (error as Error).message,
        });
      }
    },
    {
      timezone: "Asia/Tashkent", // Set your timezone here
    }
  );

  logger.info("Database backup scheduler initialized", "backupScheduler", {
    schedule: "Daily at 2:00 AM (Asia/Tashkent)",
    nextRun: "Next backup at 2:00 AM",
  });
}

/**
 * Runs a manual backup immediately (useful for testing)
 */
export async function runManualBackup(): Promise<void> {
  const backupService = new DatabaseBackupService();
  logger.info("Running manual backup", "backupScheduler");
  await backupService.testBackup();
}
