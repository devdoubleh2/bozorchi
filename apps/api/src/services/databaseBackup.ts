import { spawnSync } from "child_process";
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
  private readonly timezone = "Asia/Tashkent";

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
      logger.error("databaseBackup", "Telegram bot not configured");
      return;
    }

    const DATABASE_URL = process.env["DATABASE_URL"];
    if (!DATABASE_URL) {
      logger.error("databaseBackup", "DATABASE_URL not configured");
      return;
    }

    try {
      logger.info("databaseBackup", "Starting database backup...");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `bozorchi-backup-${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      // Parse DATABASE_URL to extract connection info
      const dbUrl = new URL(DATABASE_URL);
      const host = dbUrl.hostname;
      const port = dbUrl.port || "5432";
      const database = decodeURIComponent(dbUrl.pathname.slice(1)); // Remove leading slash
      const username = decodeURIComponent(dbUrl.username);
      const password = decodeURIComponent(dbUrl.password);

      // Execute pg_dump command
      logger.info("databaseBackup", "Running pg_dump...", { filename });
      this.runPgDump({
        host,
        port,
        username,
        password,
        database,
        filepath,
      });

      logger.info("databaseBackup", "Backup created successfully", {
        filename,
        size: fs.statSync(filepath).size,
      });

      // Send backup to Telegram
      await this.sendBackupToTelegram(filepath, filename);

      // Clean up old backups (keep only last 7 days)
      await this.cleanupOldBackups();

      logger.info("databaseBackup", "Backup sent successfully to Telegram");
    } catch (error) {
      logger.error("databaseBackup", "Failed to create or send database backup", {
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
        `📦 <b>Database Backup</b>\n\n` +
          `🗓 Date: ${this.escapeHtml(this.getCurrentDate())}\n` +
          `📁 File: <code>${this.escapeHtml(filename)}</code>\n` +
          `💾 Size: ${fileSizeInMB} MB\n\n` +
          `Uploading...`,
        { parse_mode: "HTML" }
      );

      // Send the backup file
      await this.bot.sendDocument(this.YOUR_TELEGRAM_ID, filepath, {
        caption: `Database backup for ${new Date().toLocaleDateString()}`,
      });

      logger.info("databaseBackup", "Backup file sent to Telegram", {
        chatId: this.YOUR_TELEGRAM_ID,
        filename,
      });
    } catch (error) {
      logger.error("databaseBackup", "Failed to send backup to Telegram", {
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
        `❌ <b>Database Backup Failed</b>\n\n` +
          `🗓 Date: ${this.escapeHtml(this.getCurrentDate())}\n` +
          `⚠️ Error:\n<code>${this.escapeHtml(error.message)}</code>\n\n` +
          `Please check the server logs for more details.`,
        { parse_mode: "HTML" }
      );
    } catch (telegramError) {
      logger.error("databaseBackup", "Failed to send error notification", {
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
          logger.info("databaseBackup", "Deleted old backup file", { file });
        }
      }
    } catch (error) {
      logger.error("databaseBackup", "Failed to cleanup old backups", {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Tests the backup service (useful for initial setup)
   */
  async testBackup(): Promise<void> {
    logger.info("databaseBackup", "Running backup test...");
    await this.createAndSendBackup();
  }

  private runPgDump(params: {
    host: string;
    port: string;
    username: string;
    password: string;
    database: string;
    filepath: string;
  }): void {
    const pgDumpBinary = process.env["PG_DUMP_PATH"] || "pg_dump";
    const result = spawnSync(
      pgDumpBinary,
      [
        "-h",
        params.host,
        "-p",
        params.port,
        "-U",
        params.username,
        "-d",
        params.database,
        "-F",
        "c",
        "-f",
        params.filepath,
      ],
      {
        env: {
          ...process.env,
          PGPASSWORD: params.password,
        },
        encoding: "utf-8",
        stdio: "pipe",
      }
    );

    if (result.error) {
      const code = (result.error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        throw new Error(
          "pg_dump is not installed or not in PATH. Install PostgreSQL client tools or set PG_DUMP_PATH."
        );
      }
      throw new Error(`pg_dump failed to start: ${(result.error as Error).message}`);
    }

    if (result.status !== 0) {
      const stderr = result.stderr?.trim();
      const stdout = result.stdout?.trim();
      const details =
        stderr || stdout || `pg_dump exited with code ${result.status ?? "unknown"}`;
      throw new Error(`pg_dump failed: ${details}`);
    }
  }

  private getCurrentDate(): string {
    return new Date().toLocaleString("en-US", { timeZone: this.timezone });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}
