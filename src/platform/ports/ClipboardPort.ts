export interface ClipboardWriteOptions {
  /**
   * Timeout in milliseconds after which the copied value is wiped from the clipboard.
   * Useful for copied passwords / OTP codes.
   */
  readonly autoClearMs?: number;
}

export interface ClipboardPort {
  writeText(text: string, options?: ClipboardWriteOptions): Promise<void>;
  readText(): Promise<string>;
  clear(): Promise<void>;
}
