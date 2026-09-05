/**
 * Key wrapping and key lifecycle types.
 */
export interface WrappedKey {
  readonly scheme: string;
  readonly nonce: Uint8Array;
  readonly ciphertext: Uint8Array;
}

export interface UnlockedKeyBundle {
  readonly vaultKey: Uint8Array;
  readonly createdAt: number;
}
