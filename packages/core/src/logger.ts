export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  environment: 'development' | 'staging' | 'production';
  serviceName: string;
  version?: string;
  bufferSize?: number;
  flushInterval?: number;
}

export class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableRemote: false,
      environment: (process.env.NEXT_PUBLIC_ENV as any) || 'development',
      serviceName: 'madfam-web',
      version: process.env.NEXT_PUBLIC_VERSION || '0.1.0',
      bufferSize: 100,
      flushInterval: 30000, // 30 seconds
      ...config,
    };

    this.sessionId = this.generateSessionId();

    if (this.config.enableRemote && this.config.flushInterval) {
      this.startFlushTimer();
    }
  }

  private generateSessionId(): string {
    // Use crypto.randomUUID when available (Node 14.17+, all modern browsers).
    // Falls back to non-crypto random only if both crypto APIs are unavailable —
    // session IDs are non-security identifiers (no auth/authz decision uses them),
    // but we still prefer crypto sources to satisfy CodeQL js/insecure-randomness.
    const cryptoObj: Crypto | undefined =
      typeof globalThis !== 'undefined' ? (globalThis as { crypto?: Crypto }).crypto : undefined;
    if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
      return `session_${Date.now()}_${cryptoObj.randomUUID()}`;
    }
    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
      const bytes = new Uint8Array(9);
      cryptoObj.getRandomValues(bytes);
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      return `session_${Date.now()}_${hex}`;
    }
    // Last-resort fallback (should never trigger in supported runtimes).
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  /**
   * Strip CR/LF and other control characters from a value before it is rendered
   * into a single log line. Prevents log-injection (CWE-117) where a caller could
   * embed `\n` to forge additional log entries.
   */
  private sanitizeForLog(value: string): string {
    // Replace ASCII control chars (0x00-0x1F, 0x7F) and Unicode line separators
    // with a printable escape so they do not break log parsing.
    return value.replace(/[\x00-\x1F\x7F\u2028\u2029]/g, ch => {
      if (ch === '\n') return '\\n';
      if (ch === '\r') return '\\r';
      if (ch === '\t') return '\\t';
      const code = ch.charCodeAt(0).toString(16).padStart(2, '0');
      return `\\x${code}`;
    });
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelName = LogLevel[entry.level];
    const context = entry.context ? `[${this.sanitizeForLog(entry.context)}]` : '';
    const safeMessage = this.sanitizeForLog(entry.message);
    const metadata = entry.metadata
      ? ` ${this.sanitizeForLog(JSON.stringify(entry.metadata))}`
      : '';

    return `${timestamp} ${levelName} ${context} ${safeMessage}${metadata}`;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata: {
        ...metadata,
        environment: this.config.environment,
        serviceName: this.config.serviceName,
        version: this.config.version,
      },
      error,
      sessionId: this.sessionId,
    };
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, context, metadata, error);

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Buffer for remote logging
    if (this.config.enableRemote) {
      this.buffer.push(entry);

      if (this.buffer.length >= (this.config.bufferSize || 100)) {
        this.flush();
      }
    }
  }

  private logToConsole(entry: LogEntry): void {
    // Use a fixed `%s` format string so that user-controlled data in the
    // formatted message can never be interpreted as format directives
    // (CodeQL js/tainted-format-string). The sanitised message is also
    // already stripped of control chars (CodeQL js/log-injection).
    const formattedMessage = this.formatMessage(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error('%s', formattedMessage, entry.error);
        break;
      case LogLevel.WARN:
        console.warn('%s', formattedMessage);
        break;
      case LogLevel.INFO:
        console.info('%s', formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug('%s', formattedMessage);
        break;
      case LogLevel.TRACE:
        console.trace('%s', formattedMessage);
        break;
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0 || !this.config.remoteEndpoint) {
      return;
    }

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs,
          environment: this.config.environment,
          serviceName: this.config.serviceName,
          version: this.config.version,
        }),
      });
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send logs to remote endpoint:', error);
      // Re-add logs to buffer for retry (with limit to prevent memory issues)
      if (this.buffer.length < 1000) {
        this.buffer.unshift(...logs);
      }
    }
  }

  // Public logging methods
  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, metadata, error);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  trace(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context, metadata);
  }

  // Specialized logging methods
  userAction(action: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, 'USER_ACTION', metadata);
  }

  apiCall(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    metadata?: Record<string, any>
  ): void {
    this.info(`API ${method} ${endpoint} - ${status} (${duration}ms)`, 'API_CALL', {
      endpoint,
      method,
      duration,
      status,
      ...metadata,
    });
  }

  performanceMetric(
    metric: string,
    value: number,
    unit: string,
    metadata?: Record<string, any>
  ): void {
    this.info(`Performance: ${metric} = ${value}${unit}`, 'PERFORMANCE', {
      metric,
      value,
      unit,
      ...metadata,
    });
  }

  featureFlag(flag: string, enabled: boolean, metadata?: Record<string, any>): void {
    this.debug(`Feature flag: ${flag} = ${enabled}`, 'FEATURE_FLAG', {
      flag,
      enabled,
      ...metadata,
    });
  }

  businessEvent(event: string, metadata?: Record<string, any>): void {
    this.info(`Business event: ${event}`, 'BUSINESS', metadata);
  }

  // Context methods
  withContext(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }

  withUserId(userId: string): UserLogger {
    return new UserLogger(this, userId);
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}

// Context-aware logger
export class ContextLogger {
  constructor(
    private logger: Logger,
    private context: string
  ) {}

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.logger.error(message, error, this.context, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.logger.warn(message, this.context, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.logger.info(message, this.context, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.logger.debug(message, this.context, metadata);
  }

  trace(message: string, metadata?: Record<string, any>): void {
    this.logger.trace(message, this.context, metadata);
  }
}

// User-aware logger
export class UserLogger {
  constructor(
    private logger: Logger,
    private userId: string
  ) {}

  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    this.logger.error(message, error, context, { ...metadata, userId: this.userId });
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.logger.warn(message, context, { ...metadata, userId: this.userId });
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.logger.info(message, context, { ...metadata, userId: this.userId });
  }

  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.logger.debug(message, context, { ...metadata, userId: this.userId });
  }

  trace(message: string, context?: string, metadata?: Record<string, any>): void {
    this.logger.trace(message, context, { ...metadata, userId: this.userId });
  }

  userAction(action: string, metadata?: Record<string, any>): void {
    this.logger.userAction(action, { ...metadata, userId: this.userId });
  }
}

// Default logger instance
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
});

// Logger factory for different environments
export function createLogger(config: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

// Utility functions
export function withPerformanceLogging<T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  context?: string
): T {
  return ((...args: any[]) => {
    const start = performance.now();
    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result
          .then(value => {
            const duration = performance.now() - start;
            logger.performanceMetric(name, duration, 'ms', { context, success: true });
            return value;
          })
          .catch(error => {
            const duration = performance.now() - start;
            logger.performanceMetric(name, duration, 'ms', { context, success: false });
            logger.error(`Performance tracked function failed: ${name}`, error, context);
            throw error;
          });
      }

      // Handle sync functions
      const duration = performance.now() - start;
      logger.performanceMetric(name, duration, 'ms', { context, success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.performanceMetric(name, duration, 'ms', { context, success: false });
      logger.error(`Performance tracked function failed: ${name}`, error as Error, context);
      throw error;
    }
  }) as T;
}

// React hook for logging
export function useLogger(context?: string) {
  return context ? logger.withContext(context) : logger;
}

// Error boundary logger
export function logErrorBoundary(error: Error, errorInfo: any, context?: string): void {
  logger.error('React Error Boundary caught an error', error, context || 'ERROR_BOUNDARY', {
    errorInfo,
    componentStack: errorInfo.componentStack,
  });
}
