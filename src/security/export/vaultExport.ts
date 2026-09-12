import { z } from 'zod';
import { SodiumCryptoProvider, cryptoProvider } from '@/security/crypto/SodiumCryptoProvider';
import type { DecryptedVaultDomain } from '@/domain/vault/types';
import type { EncryptedAttachmentRecord } from '@/storage/ports/VaultRepository';
import {
  serializeDecryptedVault,
  validateDecryptedVault,
} from '@/security/serialization/vaultSerializer';
import {
  AuthenticationFailedError,
  ImportValidationFailedError,
  UnsupportedVaultVersionError,
  VaultCorruptedError,
} from '@/lib/errors/VaultError';

export const EXPORT_FORMAT = 'aegisvault-export';
export const EXPORT_VERSION = 1;

export const ExportContainerSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  version: z.number().int().positive(),
  exportedAt: z.string(),
  kdf: z.object({
    algorithm: z.literal('argon2id'),
    salt: z.string().min(1),
    memoryCost: z.number().int().positive(),
    timeCost: z.number().int().positive(),
    parallelism: z.number().int().positive(),
  }),
  cipher: z.literal('xchacha20poly1305'),
  nonce: z.string().min(1),
  ciphertext: z.string().min(1),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        nonce: z.string(),
        ciphertext: z.string(),
        sizeBytes: z.number(),
        checksumSha256: z.string(),
        updatedAt: z.number(),
      })
    )
    .optional(),
});

export type ExportVaultContainer = z.infer<typeof ExportContainerSchema>;

export type ImportedVaultResult = DecryptedVaultDomain & {
  bundledAttachments?: EncryptedAttachmentRecord[] | undefined;
};

/**
 * Encrypts full vault domain into an exportable standalone `.aegisvault` container.
 */
export async function exportEncryptedVault(
  domain: DecryptedVaultDomain,
  password: string,
  crypto: SodiumCryptoProvider = cryptoProvider,
  attachmentRecords?: EncryptedAttachmentRecord[]
): Promise<string> {
  if (!password) {
    throw new ImportValidationFailedError('Password is required to encrypt backup');
  }

  await crypto.init();

  const salt = crypto.randomBytes(16);
  const kdfParams = {
    algorithm: 'argon2id' as const,
    memoryCost: 67108864, // 64 MB
    timeCost: 2,
    parallelism: 1,
  };

  const exportKey = await crypto.deriveKeyFromPassword({
    password,
    salt,
    params: kdfParams,
  });

  const serialized = serializeDecryptedVault(domain);
  const plaintext = crypto.fromString(serialized);

  const encrypted = crypto.aeadEncrypt({
    plaintext,
    key: exportKey,
  });

  const container: ExportVaultContainer = {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    kdf: {
      algorithm: 'argon2id',
      salt: crypto.toBase64(salt),
      memoryCost: kdfParams.memoryCost,
      timeCost: kdfParams.timeCost,
      parallelism: kdfParams.parallelism,
    },
    cipher: 'xchacha20poly1305',
    nonce: crypto.toBase64(encrypted.nonce),
    ciphertext: crypto.toBase64(encrypted.ciphertext),
    ...(attachmentRecords?.length ? { attachments: attachmentRecords } : {}),
  };

  return JSON.stringify(container, null, 2);
}

/**
 * Decrypts and validates an encrypted backup container.
 * Rejects unsupported versions, malformed structures, wrong passwords, and tampered bytes.
 */
export async function importEncryptedVault(
  backupJson: string,
  password: string,
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<ImportedVaultResult> {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(backupJson);
  } catch (err) {
    throw new ImportValidationFailedError('Malformed backup file: invalid JSON format', err);
  }

  const parseResult = ExportContainerSchema.safeParse(parsedJson);
  if (!parseResult.success) {
    throw new ImportValidationFailedError(
      `Invalid backup schema: ${parseResult.error.message}`,
      parseResult.error
    );
  }

  const container = parseResult.data;

  if (container.version > EXPORT_VERSION) {
    throw new UnsupportedVaultVersionError(container.version);
  }

  await crypto.init();

  const salt = crypto.fromBase64(container.kdf.salt);
  let exportKey: Uint8Array;
  try {
    exportKey = await crypto.deriveKeyFromPassword({
      password,
      salt,
      params: container.kdf,
    });
  } catch (err) {
    throw new AuthenticationFailedError('Failed to derive key from backup password', err);
  }

  let decryptedJson: string;
  try {
    const nonce = crypto.fromBase64(container.nonce);
    const ciphertext = crypto.fromBase64(container.ciphertext);
    const decryptedBytes = crypto.aeadDecrypt({
      ciphertext,
      nonce,
      key: exportKey,
    });
    decryptedJson = crypto.toString(decryptedBytes);
  } catch (err) {
    throw new VaultCorruptedError(
      'Failed to decrypt backup. Incorrect password or tampered backup file.',
      err
    );
  }

  const validatedDomain = validateDecryptedVault(decryptedJson);
  const result: ImportedVaultResult = {
    ...validatedDomain,
    ...(container.attachments?.length ? { bundledAttachments: container.attachments } : {}),
  };
  return result;
}
