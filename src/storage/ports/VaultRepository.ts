import type { EncryptedVaultContainer } from '@/security/crypto/types';

export interface EncryptedAttachmentRecord {
  readonly id: string;
  readonly nonce: string;
  readonly ciphertext: string;
  readonly sizeBytes: number;
  readonly checksumSha256: string;
  readonly updatedAt: number;
}

/**
 * Storage port for the encrypted vault container and file attachments.
 * Implementations (e.g. IndexedDB via Dexie, filesystem, native keystore) must preserve atomicity.
 */
export interface VaultRepository {
  /**
   * Initializes or creates a new vault container in storage.
   */
  create(container: EncryptedVaultContainer): Promise<void>;

  /**
   * Reads the current encrypted vault container, or null if no vault exists.
   */
  read(): Promise<EncryptedVaultContainer | null>;

  /**
   * Atomically replaces the current vault container with an updated version.
   * Rolls back if replacement fails.
   */
  replaceAtomically(next: EncryptedVaultContainer): Promise<void>;

  /**
   * Deletes the local vault container and all stored attachments.
   */
  delete(): Promise<void>;

  /**
   * Checks whether a vault exists without reading the full container.
   */
  exists(): Promise<boolean>;

  /**
   * Saves an encrypted attachment record.
   */
  saveAttachment?(record: EncryptedAttachmentRecord): Promise<void>;

  /**
   * Reads an encrypted attachment record by id.
   */
  readAttachment?(id: string): Promise<EncryptedAttachmentRecord | null>;

  /**
   * Deletes an encrypted attachment record by id.
   */
  deleteAttachment?(id: string): Promise<void>;

  /**
   * Lists all attachment IDs currently in storage.
   */
  listAttachmentIds?(): Promise<string[]>;

  /**
   * Calculates total byte size of all stored attachments.
   */
  getTotalAttachmentBytes?(): Promise<number>;
}
