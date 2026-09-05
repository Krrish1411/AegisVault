import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('Security-Conscious Logger', () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger.setLevel('debug');
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should redact sensitive keys in context objects', () => {
    logger.info('User action', {
      component: 'AuthService',
      password: 'super-secret-password-123',
      secretKey: 'key-material-bytes',
      recoveryPhrase: 'twelve secret words',
      safeParam: 'item-1234',
    });

    expect(consoleInfoSpy).toHaveBeenCalled();
    const passedContext = consoleInfoSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(passedContext.password).toBe('[REDACTED_SECRET]');
    expect(passedContext.secretKey).toBe('[REDACTED_SECRET]');
    expect(passedContext.recoveryPhrase).toBe('[REDACTED_SECRET]');
    expect(passedContext.safeParam).toBe('item-1234');
  });

  it('should respect log levels', () => {
    logger.setLevel('warn');
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warn message');

    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should log errors with error message string', () => {
    const error = new Error('Database locked');
    logger.error('Failed to open database', error, { component: 'IndexedDB' });

    expect(consoleErrorSpy).toHaveBeenCalled();
    const loggedMessage = consoleErrorSpy.mock.calls[0]?.[0] as string;
    expect(loggedMessage).toContain('Failed to open database - Database locked');
  });
});
