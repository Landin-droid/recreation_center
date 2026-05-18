import dayjs from "dayjs";

enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: any) {
    const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss");
    const metaStr = meta ? ` | meta: ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  info(message: string, meta?: any) {
    console.log(this.formatMessage(LogLevel.INFO, message, meta));
  }

  warn(message: string, meta?: any) {
    console.warn(this.formatMessage(LogLevel.WARN, message, meta));
  }

  error(message: string, error?: any, meta?: any) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      ...meta
    } : { error, ...meta };
    
    console.error(this.formatMessage(LogLevel.ERROR, message, errorDetails));
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }
}

export const logger = new Logger();
