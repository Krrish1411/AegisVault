import type { ClockPort } from '../ports/ClockPort';

export class SystemClockPort implements ClockPort {
  now(): number {
    return Date.now();
  }

  toISOString(): string {
    return new Date().toISOString();
  }

  setTimeout(callback: () => void, ms: number): number | ReturnType<typeof globalThis.setTimeout> {
    return setTimeout(callback, ms);
  }

  clearTimeout(timeoutId: number | ReturnType<typeof globalThis.setTimeout>): void {
    clearTimeout(timeoutId);
  }
}

export const systemClock = new SystemClockPort();
