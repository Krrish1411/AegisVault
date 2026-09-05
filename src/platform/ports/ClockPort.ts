export interface ClockPort {
  now(): number;
  toISOString(): string;
  setTimeout(callback: () => void, ms: number): number | ReturnType<typeof globalThis.setTimeout>;
  clearTimeout(timeoutId: number | ReturnType<typeof globalThis.setTimeout>): void;
}
