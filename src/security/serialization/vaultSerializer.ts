import { z } from 'zod';
import type { DecryptedVaultDomain, VaultItemEnvelope } from '@/domain/vault/types';
import type { EncryptedVaultContainer } from '@/security/crypto/types';
import { ImportValidationFailedError } from '@/lib/errors/VaultError';

export const FORMAT_VERSION = 1;
export const CRYPTO_PROFILE = 'aegis-v1';

// Zod schema for encrypted vault container
export const EncryptedVaultContainerSchema = z.object({
  formatVersion: z.number().int().positive(),
  cryptoProfile: z.string().min(1),
  kdf: z.object({
    algorithm: z.literal('argon2id'),
    salt: z.string().min(1),
    memoryCost: z.number().int().positive(),
    timeCost: z.number().int().positive(),
    parallelism: z.number().int().positive(),
  }),
  keyWrap: z.object({
    scheme: z.string().min(1),
    nonce: z.string().min(1),
    wrappedVaultKey: z.string().min(1),
  }),
  payload: z.object({
    nonce: z.string().min(1),
    ciphertext: z.string().min(1),
  }),
  recoveryWrap: z
    .object({
      scheme: z.string().min(1),
      salt: z.string().min(1),
      nonce: z.string().min(1),
      wrappedVaultKey: z.string().min(1),
      verificationHash: z.string().optional(),
    })
    .optional(),
});

// Zod schema for items
export const CustomFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'secret', 'number', 'date', 'boolean', 'url', 'email', 'phone', 'multiline']),
  value: z.string(),
});

export const PasswordHistoryEntrySchema = z.object({
  id: z.string(),
  password: z.string(),
  archivedAt: z.string(),
});

export const VaultItemEnvelopeSchema = z.object({
  id: z.string(),
  vaultId: z.string().optional(),
  type: z.string() as z.ZodType<VaultItemEnvelope['type']>,
  title: z.string(),
  favorite: z.boolean(),
  archived: z.boolean(),
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  payload: z.record(z.unknown()),
  customFields: z.array(CustomFieldSchema).optional(),
  passwordHistory: z.array(PasswordHistoryEntrySchema).optional(),
  attachmentIds: z.array(z.string()).optional(),
  linkedItemIds: z.array(z.string()).optional(),
  expiresAt: z.string().optional(),
});

export const DecryptedVaultDomainSchema = z.object({
  metadata: z.object({
    id: z.string(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    formatVersion: z.number().int().positive(),
    cryptoProfile: z.string(),
  }),
  settings: z.object({
    autoLockMinutes: z.number(),
    lockOnVisibilityHidden: z.boolean(),
    clearClipboardSeconds: z.number(),
    appMode: z.enum(['simple', 'advanced']).optional().default('simple'),
    theme: z.enum(['dark', 'light', 'system']),
    defaultPasswordLength: z.number().optional().default(16),
  }),
  items: z.array(VaultItemEnvelopeSchema),
  vaults: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        isDefault: z.boolean().optional(),
        createdAt: z.string(),
      })
    )
    .optional()
    .default([]),
  folders: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        parentId: z.string().optional(),
        createdAt: z.string(),
        updatedAt: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        filename: z.string(),
        mediaType: z.string(),
        sizeBytes: z.number(),
        createdAt: z.string(),
        favorite: z.boolean().optional(),
        linkedItemId: z.string().optional(),
        linkedItemTitle: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  auditEvents: z
    .array(
      z.object({
        id: z.string(),
        action: z.string(),
        timestamp: z.string(),
        details: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
      })
    )
    .optional()
    .default([]),
  emergencyContacts: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        relationship: z.string().optional(),
        accessLevel: z.enum(['full', 'selected']),
        waitPeriodDays: z.number().int().min(0),
        status: z.enum(['active', 'pending', 'requested', 'approved', 'revoked']),
        requestDate: z.string().optional(),
        grantKeyHash: z.string().optional(),
        grantData: z.string().optional(),
        createdAt: z.string(),
      })
    )
    .optional()
    .default([]),
});

/**
 * Validates untrusted or decrypted JSON data against the domain schema.
 */
export function validateDecryptedVault(jsonString: string): DecryptedVaultDomain {
  try {
    const raw = JSON.parse(jsonString);
    const parsed = DecryptedVaultDomainSchema.parse(raw);
    return parsed as DecryptedVaultDomain;
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new ImportValidationFailedError(issues, err);
    }
    throw new ImportValidationFailedError(err instanceof Error ? err.message : 'Invalid vault domain structure', err);
  }
}

/**
 * Validates an encrypted vault container.
 */
export function validateEncryptedContainer(container: unknown): EncryptedVaultContainer {
  const result = EncryptedVaultContainerSchema.safeParse(container);
  if (!result.success) {
    throw new ImportValidationFailedError(result.error.message, result.error);
  }
  return result.data as EncryptedVaultContainer;
}

/**
 * Deterministically serializes domain vault data to JSON.
 */
export function serializeDecryptedVault(domain: DecryptedVaultDomain): string {
  return JSON.stringify(domain);
}
