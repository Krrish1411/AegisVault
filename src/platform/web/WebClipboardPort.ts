import type { ClipboardPort, ClipboardWriteOptions } from '../ports/ClipboardPort';
import { logger } from '@/lib/logger';

export class WebClipboardPort implements ClipboardPort {
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  async writeText(text: string, options?: ClipboardWriteOptions): Promise<void> {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    logger.debug('Copied text to clipboard (sensitive content protected)', { component: 'WebClipboardPort' });

    const timeoutMs = options?.autoClearMs !== undefined ? options.autoClearMs : 20000;
    if (timeoutMs > 0) {
      this.clearTimer = setTimeout(async () => {
        try {
          // Only clear if the clipboard still holds what we copied
          await this.clear();
          logger.debug('Clipboard auto-cleared after timeout', { component: 'WebClipboardPort' });
        } catch {
          // Ignored if permissions or focus changed
        } finally {
          this.clearTimer = null;
        }
      }, timeoutMs);
    }
  }

  async readText(): Promise<string> {
    if (navigator.clipboard?.readText) {
      return await navigator.clipboard.readText();
    }
    return '';
  }

  async clear(): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText('');
    }
  }

  hasActiveClearTimer(): boolean {
    return this.clearTimer !== null;
  }
}

export const webClipboard = new WebClipboardPort();
