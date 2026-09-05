/**
 * Security-conscious logger for AegisVault.
 * Invariant: Never log plaintext passwords, keys, tokens, recovery phrases, or decrypted vault items.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  readonly component?: string;
  readonly operation?: string;
  readonly vaultId?: string;
  readonly [key: string]: unknown;
}

// Patterns of keys that may contain sensitive data and must be sanitized if passed in context
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /key/i,
  /token/i,
  /phrase/i,
  /pin/i,
  /credential/i,
  /card/i,
  /cvv/i,
  /seed/i,
  /payload/i,
  /ciphertext/i,
  /plaintext/i,
];

function sanitizeContext(context?: LogContext): Record<string, unknown> | undefined {
  if (!context) return undefined;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      sanitized[key] = '[REDACTED_SECRET]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = '[OBJECT]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

class Logger {
  private level: LogLevel = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test' ? 'debug' : 'info';

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.level];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const comp = context?.component ? `[${context.component}]` : '';
    const op = context?.operation ? `<${context.operation}>` : '';
    const prefix = `[AegisVault][${level.toUpperCase()}] ${timestamp} ${comp}${op}`.trim();
    return `${prefix}: ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    const sanitized = sanitizeContext(context);
    console.debug(this.formatMessage('debug', message, context), sanitized ?? '');
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    const sanitized = sanitizeContext(context);
    console.info(this.formatMessage('info', message, context), sanitized ?? '');
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    const sanitized = sanitizeContext(context);
    console.warn(this.formatMessage('warn', message, context), sanitized ?? '');
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    const sanitized = sanitizeContext(context);
    const errMessage = error instanceof Error ? error.message : String(error ?? '');
    console.error(this.formatMessage('error', `${message} - ${errMessage}`, context), sanitized ?? '');
  }
}

export const logger = new Logger();
