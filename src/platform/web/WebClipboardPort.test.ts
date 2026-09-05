import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WebClipboardPort } from './WebClipboardPort';

describe('WebClipboardPort', () => {
  let clipboard: WebClipboardPort;
  let stored = '';

  beforeEach(() => {
    vi.useFakeTimers();
    clipboard = new WebClipboardPort();
    stored = '';

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(async (text: string) => {
          stored = text;
        }),
        readText: vi.fn(async () => stored),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should write text to clipboard and trigger auto-clear after timeout', async () => {
    await clipboard.writeText('SuperSecretKey123', { autoClearMs: 20000 });

    expect(clipboard.hasActiveClearTimer()).toBe(true);
    expect(await clipboard.readText()).toBe('SuperSecretKey123');

    // Fast-forward 10 seconds (not yet cleared)
    await vi.advanceTimersByTimeAsync(10000);
    expect(clipboard.hasActiveClearTimer()).toBe(true);
    expect(await clipboard.readText()).toBe('SuperSecretKey123');

    // Fast-forward remaining 10 seconds (total 20s)
    await vi.advanceTimersByTimeAsync(10000);
    expect(clipboard.hasActiveClearTimer()).toBe(false);
    expect(await clipboard.readText()).toBe('');
  });

  it('should cancel previous timer when new text is copied', async () => {
    await clipboard.writeText('Secret1', { autoClearMs: 20000 });
    await vi.advanceTimersByTimeAsync(10000);

    // Copy new text before timer fires
    await clipboard.writeText('Secret2', { autoClearMs: 20000 });
    expect(await clipboard.readText()).toBe('Secret2');

    // Advance 10 seconds (20s since Secret1, but only 10s since Secret2)
    await vi.advanceTimersByTimeAsync(10000);
    expect(await clipboard.readText()).toBe('Secret2');

    // Advance another 10s (20s since Secret2)
    await vi.advanceTimersByTimeAsync(10000);
    expect(await clipboard.readText()).toBe('');
  });
});
