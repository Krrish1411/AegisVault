/**
 * Storage schema definition and container types for IndexedDB.
 * Persistent storage contains encrypted vault containers only.
 */

export const DB_NAME = 'aegisvault_db';
export const DB_VERSION = 1;

export interface EncryptedVaultRecord {
  readonly id: string;
  readonly formatVersion: number;
  readonly containerJson: string;
  readonly updatedAt: number;
}

export interface EncryptedAttachmentRecord {
  readonly id: string;
  readonly byteLength: number;
  readonly encryptedData: Uint8Array;
  readonly createdAt: number;
}

export interface EncryptedAuditRecord {
  readonly id: string;
  readonly timestamp: number;
  readonly encryptedPayload: Uint8Array;
}
