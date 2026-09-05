export interface EncryptedAuditEventRecord {
  readonly id: string;
  readonly timestamp: number;
  readonly encryptedPayload: Uint8Array;
}

/**
 * Storage port for encrypted audit log events.
 */
export interface AuditRepository {
  append(event: EncryptedAuditEventRecord): Promise<void>;
  readAll(): Promise<EncryptedAuditEventRecord[]>;
  clear(): Promise<void>;
}
