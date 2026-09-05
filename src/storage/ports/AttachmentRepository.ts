export interface EncryptedAttachmentStream {
  readonly id: string;
  readonly byteLength: number;
  readonly data: AsyncIterable<Uint8Array>;
}

/**
 * Storage port for encrypted attachments.
 */
export interface AttachmentRepository {
  put(id: string, encryptedBytes: AsyncIterable<Uint8Array>, totalBytes: number): Promise<void>;
  get(id: string): Promise<EncryptedAttachmentStream | null>;
  delete(id: string): Promise<void>;
  listIds(): Promise<string[]>;
}
