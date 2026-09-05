import type { SecureRandomPort } from '../ports/SecureRandomPort';

export class WebSecureRandomPort implements SecureRandomPort {
  getRandomValues<T extends ArrayBufferView | null>(array: T): T {
    if (!array) return array;
    return crypto.getRandomValues(array);
  }

  randomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }
}

export const webSecureRandom = new WebSecureRandomPort();
