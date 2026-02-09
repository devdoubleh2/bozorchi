import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import logger from "../../logs/log";
import TelegramBot from "node-telegram-bot-api";

/**
 * Service for creating and sending database backups to Telegram
 */
export class DatabaseBackupService {
  private bot: TelegramBot | null = null;
  private readonly YOUR_TELEGRAM_ID = 559366407;
  private readonly backupDir: string;

  constructor() {
    const token = process.env["TELEGRAM_BOT_TOKEN"];
    if (token) {
      this.bot = new TelegramBot(token);
    }

    // Create backup directory if it doesn't exist
    this.backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Creates a database backup and sends it to your Telegram
   */
  async createAndSendBackup(): Promise<void> {
    if (!this.bot) {
      logger.error("Telegram bot not configured", "databaseBackup");
      return;
    }

    const DATABASE_URL = process.env["DATABASE_URL"];
    if (!DATABASE_URL) {
      logger.error("DATABASE_URL not configured", "databaseBackup");
      return;
    }

    try {
      logger.info("Starting database backup...", "databaseBackup");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `bozorchi-backup-${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      // Parse DATABASE_URL to extract connection info
      const dbUrl = new URL(DATABASE_URL);
      const host = dbUrl.hostname;
      const port = dbUrl.port || "5432";
      const database = dbUrl.pathname.slice(1); // Remove leading slash
      const username = dbUrl.username;
      const password = dbUrl.password;

      // Set PGPASSWORD environment variable for pg_dump
      const env = {
        ...process.env,
        PGPASSWORD: password,
      };

      // Execute pg_dump command
      logger.info("Running pg_dump...", "databaseBackup", { filename });
      
      const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F c -f "${filepath}"`;
      
      execSync(pgDumpCommand, {
        env,
        encoding: "utf-8",
        stdio: "pipe",
      });

      logger.info("Backup created successfully", "databaseBackup", {
        filename,
        size: fs.statSync(filepath).size,
      });

      // Send backup to Telegram
      await this.sendBackupToTelegram(filepath, filename);

      // Clean up old backups (keep only last 7 days)
      await this.cleanupOldBackups();

      logger.info("Backup sent successfully to Telegram", "databaseBackup");
    } catch (error) {
      logger.error("Failed to create or send database backup", "databaseBackup", {
        error: (error as Error).message,
      });

      // Notify about error
      await this.notifyBackupError(error as Error);
    }
  }

  /**
   * Sends the backup file to Telegram
   */
  private async sendBackupToTelegram(
    filepath: string,
    filename: string
  ): Promise<void> {
    if (!this.bot) return;

    try {
      // Get file size in MB
      const stats = fs.statSync(filepath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Send a message first
      await this.bot.sendMessage(
        this.YOUR_TELEGRAM_ID,
        `📦 *Database Backup*\n\n` +
          `🗓 Date: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Tashkent" })}\n` +
          `📁 File: \`${filename}\`\n` +
          `💾 Size: ${fileSizeInMB} MB\n\n` +
          `Uploading...`,
        { parse_mode: "Markdown" }
      );

      // Send the backup file
      await this.bot.sendDocument(this.YOUR_TELEGRAM_ID, filepath, {
        caption: `Database backup for ${new Date().toLocaleDateString()}`,
      });

      logger.info("Backup file sent to Telegram", "databaseBackup", {
        chatId: this.YOUR_TELEGRAM_ID,
        filename,
      });
    } catch (error) {
      logger.error("Failed to send backup to Telegram", "databaseBackup", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Sends error notification to Telegram
   */
  private async notifyBackupError(error: Error): Promise<void> {
    if (!this.bot) return;

    try {
      await this.bot.sendMessage(
        this.YOUR_TELEGRAM_ID,
        `❌ *Database Backup Failed*\n\n` +
          `🗓 Date: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Tashkent" })}\n` +
          `⚠️ Error: ${error.message}\n\n` +
          `Please check the server logs for more details.`,
        { parse_mode: "Markdown" }
      );
    } catch (telegramError) {
      logger.error("Failed to send error notification", "databaseBackup", {
        error: (telegramError as Error).message,
      });
    }
  }

  /**
   * Cleans up old backup files (keeps last 7 days)
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);
        const fileAge = now - stats.mtimeMs;

        // Delete files older than 7 days
        if (fileAge > sevenDaysInMs) {
          fs.unlinkSync(filepath);
          logger.info("Deleted old backup file", "databaseBackup", { file });
        }
      }
    } catch (error) {
      logger.error("Failed to cleanup old backups", "databaseBackup", {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Tests the backup service (useful for initial setup)
   */
  async testBackup(): Promise<void> {
    logger.info("Running backup test...", "databaseBackup");
    await this.createAndSendBackup();
  }
}
