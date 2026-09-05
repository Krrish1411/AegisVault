import type { KdfParams } from './CryptoProvider';

/**
 * Encrypted container metadata and payload layout as defined in ARCHITECTURE.md §7
 */
export interface EncryptedVaultContainer {
  readonly formatVersion: number;
  readonly cryptoProfile: string;
  readonly kdf: {
    readonly algorithm: 'argon2id';
    readonly salt: string; // base64 / hex
    readonly memoryCost: number;
    readonly timeCost: number;
    readonly parallelism: number;
  };
  readonly keyWrap: {
    readonly scheme: string;
    readonly nonce: string;
    readonly wrappedVaultKey: string;
  };
  readonly payload: {
    readonly nonce: string;
    readonly ciphertext: string;
  };
  readonly recoveryWrap?: {
    readonly scheme: string;
    readonly salt: string;
    readonly nonce: string;
    readonly wrappedVaultKey: string;
    readonly verificationHash?: string;
  };
}

export type { KdfParams };
