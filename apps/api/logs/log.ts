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
  constructor() {}

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

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(entry);
        break;
      case LogLevel.INFO:
        console.info(entry);
        break;
      case LogLevel.WARN:
        console.warn(entry);
        break;
      case LogLevel.ERROR:
        console.error(entry);
        break;
    }
  }

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
}

export const log = new Logger();
export default log;