import AsyncStorage from "@react-native-async-storage/async-storage";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: number;
  source: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private logs: LogEntry[] = [];
  private readonly LOGS_KEY = "app_logs";
  private readonly MAX_LOGS = 1000;
  private initialized = false;

  constructor() {
    // Initialize asynchronously
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadLogs();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize logger:", error);
      this.initialized = true; // Still allow logging even if initialization fails
    }
  }

  private async loadLogs(): Promise<void> {
    try {
      const logsJson = await AsyncStorage.getItem(this.LOGS_KEY);
      if (logsJson) {
        this.logs = JSON.parse(logsJson);
      }
    } catch (error) {
      console.error("Failed to load logs:", error);
      this.logs = [];
    }
  }

  private async saveLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.LOGS_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error("Failed to save logs:", error);
    }
  }

  private async addLog(
    source: string,
    level: LogLevel,
    message: string,
    data?: unknown
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: Date.now(),
      source,
      level,
      message,
      data,
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Save logs asynchronously (don't await to avoid blocking)
    this.saveLogs().catch((error) => {
      console.error("Failed to save logs in background:", error);
    });

    // Console output
    const timestamp = new Date(entry.timestamp).toLocaleString();
    const levelName = LogLevel[level];
    console.log(
      `[${timestamp}] [${levelName}] [${source}] ${message}`,
      data || ""
    );
  }

  // Public methods
  async debug(source: string, message: string, data?: unknown): Promise<void> {
    await this.addLog(source, LogLevel.DEBUG, message, data);
  }

  async info(source: string, message: string, data?: unknown): Promise<void> {
    await this.addLog(source, LogLevel.INFO, message, data);
  }

  async warn(source: string, message: string, data?: unknown): Promise<void> {
    await this.addLog(source, LogLevel.WARN, message, data);
  }

  async error(source: string, message: string, data?: unknown): Promise<void> {
    await this.addLog(source, LogLevel.ERROR, message, data);
  }

  // Synchronous methods for immediate access to in-memory logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  getErrorLogs(): LogEntry[] {
    return this.logs.filter((log) => log.level === LogLevel.ERROR);
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
    try {
      await AsyncStorage.removeItem(this.LOGS_KEY);
    } catch (error) {
      console.error("Failed to clear logs from storage:", error);
    }
  }

  exportJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  exportText(): string {
    return this.logs
      .map((log) => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const levelName = LogLevel[log.level];
        const dataStr = log.data ? ` | Data: ${JSON.stringify(log.data)}` : "";
        return `[${timestamp}] [${levelName}] ${log.message}${dataStr}`;
      })
      .join("\n");
  }

  getLogCount(): number {
    return this.logs.length;
  }

  // Wait for initialization to complete
  async waitForInitialization(): Promise<void> {
    while (!this.initialized) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

// Export singleton instance
export const log = new Logger();
export default Logger;
