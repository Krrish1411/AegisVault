export interface SecureRandomPort {
  getRandomValues<T extends ArrayBufferView | null>(array: T): T;
  randomBytes(length: number): Uint8Array;
}
