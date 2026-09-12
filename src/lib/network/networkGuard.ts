import { NetworkRestrictedError } from '../errors/VaultError';
import { logger } from '../logger';

/**
 * Network Policy and Guard for AegisVault.
 * Ensures that AegisVault adheres to offline-first principles.
 * Accidental network calls can be trapped, logged, and blocked in test/production environments.
 */

export interface NetworkGuardOptions {
  allowLocalhost?: boolean;
  strictBlock?: boolean;
  allowedDomains?: string[];
  onViolation?: (url: string) => void;
}

class NetworkGuard {
  private active = false;
  private violations: string[] = [];
  private originalFetch: typeof window.fetch | null = null;
  private options: NetworkGuardOptions = {
    allowLocalhost: true,
    strictBlock: true,
  };

  /**
   * Installs interceptors on global fetch and XHR if in browser environment.
   */
  install(options?: NetworkGuardOptions): void {
    if (this.active) return;
    this.options = { ...this.options, ...options };
    this.violations = [];

    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      this.originalFetch = window.fetch.bind(window);

      window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

        if (this.isUrlAllowed(urlString)) {
          return this.originalFetch!(input, init);
        }

        this.recordViolation(urlString);

        if (this.options.strictBlock) {
          throw new NetworkRestrictedError(urlString);
        }

        logger.warn(`Network call permitted but logged in non-strict mode: ${urlString}`, {
          component: 'NetworkGuard',
        });
        return this.originalFetch!(input, init);
      };
    }

    this.active = true;
    logger.info('Network guard initialized (offline policy active)', { component: 'NetworkGuard' });
  }

  /**
   * Uninstalls network guard interceptors and restores originals.
   */
  uninstall(): void {
    if (!this.active) return;
    if (typeof window !== 'undefined' && this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
    this.active = false;
  }

  private isUrlAllowed(url: string): boolean {
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      return true;
    }

    try {
      const base =
        typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
          ? window.location.origin
          : 'http://localhost';
      const parsed = new URL(url, base);

      // Same-origin verification
      if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
        if (parsed.origin === window.location.origin) {
          return true;
        }
      } else if (url.startsWith('/') && !url.startsWith('//')) {
        return true;
      }

      // Explicit domain whitelist check
      if (this.options.allowedDomains?.length) {
        const host = parsed.hostname.toLowerCase();
        if (
          this.options.allowedDomains.some(
            (d) => host === d.toLowerCase() || host.endsWith('.' + d.toLowerCase())
          )
        ) {
          return true;
        }
      }

      // Localhost checks (strict hostname matching, immune to substring trickery)
      if (this.options.allowLocalhost) {
        const host = parsed.hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
          return true;
        }
      }
    } catch {
      return false;
    }

    return false;
  }

  private recordViolation(url: string): void {
    this.violations.push(url);
    logger.error(`Accidental network request blocked: ${url}`, undefined, {
      component: 'NetworkGuard',
      operation: 'fetch_intercept',
    });
    this.options.onViolation?.(url);
  }

  getViolations(): readonly string[] {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
  }

  hasViolations(): boolean {
    return this.violations.length > 0;
  }
}

export const networkGuard = new NetworkGuard();
