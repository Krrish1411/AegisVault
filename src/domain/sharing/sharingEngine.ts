import { z } from 'zod';
import { SodiumCryptoProvider, cryptoProvider } from '@/security/crypto/SodiumCryptoProvider';
import { DEFAULT_ARGON2ID_PARAMS } from '@/security/crypto/vaultCrypto';
import { uint8ArrayToBase64, base64ToUint8Array } from '@/domain/attachments/attachmentEngine';
import {
  VaultItemEnvelopeSchema,
  FORMAT_VERSION,
} from '@/security/serialization/vaultSerializer';
import {
  AuthenticationFailedError,
  ImportValidationFailedError,
  ValidationError,
} from '@/lib/errors/VaultError';
import type { VaultItemEnvelope, VaultFolder } from '@/domain/vault/types';

export type SharingRole = 'owner' | 'admin' | 'member' | 'view_only' | 'restricted';

export interface EncryptedSharingPackage {
  readonly formatVersion: number;
  readonly packageType: 'full_vault' | 'folder' | 'items' | 'emergency_kit';
  readonly createdAt: string;
  readonly exportedByRole: SharingRole;
  readonly kdf: {
    readonly algorithm: 'argon2id';
    readonly salt: string;
    readonly memoryCost: number;
    readonly timeCost: number;
    readonly parallelism: number;
  };
  readonly payload: {
    readonly nonce: string;
    readonly ciphertext: string;
  };
}

export const EncryptedSharingPackageSchema = z.object({
  formatVersion: z.number().int().positive(),
  packageType: z.enum(['full_vault', 'folder', 'items', 'emergency_kit']),
  createdAt: z.string(),
  exportedByRole: z.enum(['owner', 'admin', 'member', 'view_only', 'restricted']),
  kdf: z.object({
    algorithm: z.literal('argon2id'),
    salt: z.string().min(1),
    memoryCost: z.number().int().positive(),
    timeCost: z.number().int().positive(),
    parallelism: z.number().int().positive(),
  }),
  payload: z.object({
    nonce: z.string().min(1),
    ciphertext: z.string().min(1),
  }),
});

interface UnencryptedSharingPayload {
  readonly items: readonly VaultItemEnvelope[];
  readonly folders: readonly VaultFolder[];
  readonly exportedAt: string;
}

const UnencryptedSharingPayloadSchema = z.object({
  items: z.array(VaultItemEnvelopeSchema),
  folders: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      parentId: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string().optional(),
    })
  ),
  exportedAt: z.string(),
});

/**
 * Creates an encrypted sharing package with custom sharing passphrase (does NOT require master password).
 */
export async function exportSharingPackage(
  items: readonly VaultItemEnvelope[],
  folders: readonly VaultFolder[] = [],
  sharingPassphrase: string,
  options: {
    packageType?: 'full_vault' | 'folder' | 'items' | 'emergency_kit';
    role?: SharingRole;
    crypto?: SodiumCryptoProvider;
  } = {}
): Promise<string> {
  const cleanPassphrase = sharingPassphrase.trim();
  if (cleanPassphrase.length < 8) {
    throw new ValidationError('Sharing passphrase must be at least 8 characters');
  }

  const crypto = options.crypto ?? cryptoProvider;
  await crypto.init();

  const salt = crypto.randomBytes(16);
  const derivedKey = await crypto.deriveKeyFromPassword({
    password: cleanPassphrase,
    salt,
    params: DEFAULT_ARGON2ID_PARAMS,
  });

  const payload: UnencryptedSharingPayload = {
    items,
    folders,
    exportedAt: new Date().toISOString(),
  };

  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = crypto.aeadEncrypt({
    plaintext: payloadBytes,
    key: derivedKey,
  });

  const pkg: EncryptedSharingPackage = {
    formatVersion: FORMAT_VERSION,
    packageType: options.packageType ?? 'items',
    createdAt: new Date().toISOString(),
    exportedByRole: options.role ?? 'member',
    kdf: {
      algorithm: 'argon2id',
      salt: uint8ArrayToBase64(salt),
      memoryCost: DEFAULT_ARGON2ID_PARAMS.memoryCost,
      timeCost: DEFAULT_ARGON2ID_PARAMS.timeCost,
      parallelism: DEFAULT_ARGON2ID_PARAMS.parallelism,
    },
    payload: {
      nonce: uint8ArrayToBase64(encrypted.nonce),
      ciphertext: uint8ArrayToBase64(encrypted.ciphertext),
    },
  };

  return JSON.stringify(pkg, null, 2);
}

/**
 * Decrypts and validates an encrypted sharing package using the sharing passphrase.
 */
export async function importSharingPackage(
  packageJson: string,
  sharingPassphrase: string,
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<{
  items: VaultItemEnvelope[];
  folders: VaultFolder[];
  packageType: string;
  exportedByRole: SharingRole;
}> {
  await crypto.init();

  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(packageJson);
  } catch (err) {
    throw new ImportValidationFailedError('Invalid JSON sharing package', err);
  }

  const parseResult = EncryptedSharingPackageSchema.safeParse(parsedRaw);
  if (!parseResult.success) {
    throw new ImportValidationFailedError(
      `Package schema validation failed: ${parseResult.error.issues.map((i) => i.message).join(', ')}`
    );
  }

  const pkg = parseResult.data;
  const saltBytes = base64ToUint8Array(pkg.kdf.salt);

  const derivedKey = await crypto.deriveKeyFromPassword({
    password: sharingPassphrase.trim(),
    salt: saltBytes,
    params: {
      algorithm: 'argon2id',
      memoryCost: pkg.kdf.memoryCost,
      timeCost: pkg.kdf.timeCost,
      parallelism: pkg.kdf.parallelism,
    },
  });

  let decryptedBytes: Uint8Array;
  try {
    decryptedBytes = crypto.aeadDecrypt({
      ciphertext: base64ToUint8Array(pkg.payload.ciphertext),
      nonce: base64ToUint8Array(pkg.payload.nonce),
      key: derivedKey,
    });
  } catch {
    throw new AuthenticationFailedError('Incorrect sharing passphrase or corrupted sharing package');
  }

  let unencrypted: unknown;
  try {
    const text = new TextDecoder().decode(decryptedBytes);
    unencrypted = JSON.parse(text);
  } catch (err) {
    throw new ImportValidationFailedError('Failed to parse decrypted sharing payload', err);
  }

  const validatedPayload = UnencryptedSharingPayloadSchema.safeParse(unencrypted);
  if (!validatedPayload.success) {
    throw new ImportValidationFailedError('Decrypted package failed internal item validation');
  }

  return {
    items: validatedPayload.data.items as VaultItemEnvelope[],
    folders: validatedPayload.data.folders as VaultFolder[],
    packageType: pkg.packageType,
    exportedByRole: pkg.exportedByRole,
  };
}
