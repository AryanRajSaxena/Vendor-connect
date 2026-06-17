export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  duration?: number;
}

class Logger {
  private isServer = typeof window === 'undefined';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase().padEnd(5);
    const parts = [timestamp, level, entry.message];

    if (entry.path) {
      parts.push(`path=${entry.path}`);
    }
    if (entry.method) {
      parts.push(`method=${entry.method}`);
    }
    if (entry.userId) {
      parts.push(`userId=${entry.userId}`);
    }
    if (entry.requestId) {
      parts.push(`reqId=${entry.requestId}`);
    }
    if (entry.duration !== undefined) {
      parts.push(`duration=${entry.duration}ms`);
    }
    if (entry.context) {
      parts.push(`context=${JSON.stringify(entry.context)}`);
    }
    if (entry.error) {
      parts.push(`error=${entry.error.name}: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`\nStack: ${entry.error.stack}`);
      }
    }

    return parts.join(' ');
  }

  private log(entry: Omit<LogEntry, 'timestamp'>) {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    const formatted = this.formatEntry(fullEntry);

    if (this.isServer) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          if (!this.isProduction) console.debug(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formatted);
          break;
      }
    } else {
      switch (entry.level) {
        case LogLevel.DEBUG:
          if (!this.isProduction) console.debug(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.ERROR:
          console.error(formatted);
          break;
        case LogLevel.FATAL:
          console.error(formatted);
          break;
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log({ level: LogLevel.DEBUG, message, context });
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log({ level: LogLevel.INFO, message, context });
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log({ level: LogLevel.WARN, message, context });
  }

  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ) {
    const errorObj = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error
      ? { name: 'Unknown', message: String(error) }
      : undefined;

    this.log({ level: LogLevel.ERROR, message, error: errorObj, context });
  }

  fatal(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ) {
    const errorObj = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error
      ? { name: 'Unknown', message: String(error) }
      : undefined;

    this.log({ level: LogLevel.FATAL, message, error: errorObj, context });
  }

  api(
    message: string,
    options: {
      method?: string;
      path?: string;
      userId?: string;
      requestId?: string;
      duration?: number;
      statusCode?: number;
    }
  ) {
    this.log({
      level: LogLevel.INFO,
      message,
      context: { statusCode: options.statusCode },
      method: options.method,
      path: options.path,
      userId: options.userId,
      requestId: options.requestId,
      duration: options.duration,
    });
  }

  auth(
    event: 'login_success' | 'login_failed' | 'signup' | 'logout' | 'password_reset',
    context?: { userId?: string; email?: string; reason?: string }
  ) {
    this.log({
      level: event.includes('failed') ? LogLevel.WARN : LogLevel.INFO,
      message: `Auth: ${event}`,
      context,
    });
  }

  order(
    event: 'created' | 'updated' | 'cancelled' | 'delivered' | 'refunded',
    context: { orderId: string; userId?: string; amount?: number }
  ) {
    this.log({
      level: LogLevel.INFO,
      message: `Order: ${event}`,
      context,
    });
  }

  payment(
    event: 'initiated' | 'completed' | 'failed' | 'refunded',
    context: { orderId: string; amount: number; method?: string; errorCode?: string }
  ) {
    this.log({
      level: event === 'failed' ? LogLevel.ERROR : LogLevel.INFO,
      message: `Payment: ${event}`,
      context,
    });
  }
}

export const logger = new Logger();

export function withLogging<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  const startTime = Date.now();

  return fn()
    .then((result) => {
      logger.debug(`${operation} completed`, {
        ...context,
        duration: Date.now() - startTime,
      });
      return result;
    })
    .catch((error) => {
      logger.error(`${operation} failed`, error, {
        ...context,
        duration: Date.now() - startTime,
      });
      throw error;
    });
}

export function createRequestLogger() {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  return {
    requestId,
    log: (message: string, context?: Record<string, unknown>) => {
      logger.debug(message, { requestId, ...context });
    },
    api: (message: string, options?: Omit<Parameters<typeof logger.api>[1], 'requestId'>) => {
      logger.api(message, { ...options, requestId });
    },
  };
}
