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
import type { VaultItemEnvelope, EmergencyContact } from '@/domain/vault/types';

export interface EmergencyGrantPackage {
  readonly formatVersion: number;
  readonly aegisEmergencyType: 'grant_v1';
  readonly grantId: string;
  readonly vaultName: string;
  readonly contactName: string;
  readonly contactEmail: string;
  readonly accessLevel: 'full' | 'selected';
  readonly waitPeriodDays: number;
  readonly createdAt: string;
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

export const EmergencyGrantPackageSchema = z.object({
  formatVersion: z.number().int().positive(),
  aegisEmergencyType: z.literal('grant_v1'),
  grantId: z.string().min(1),
  vaultName: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  accessLevel: z.enum(['full', 'selected']),
  waitPeriodDays: z.number().int().min(0),
  createdAt: z.string(),
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

interface UnencryptedEmergencyPayload {
  readonly grantId: string;
  readonly vaultName: string;
  readonly contactName: string;
  readonly items: readonly VaultItemEnvelope[];
  readonly exportedAt: string;
}

const UnencryptedEmergencyPayloadSchema = z.object({
  grantId: z.string(),
  vaultName: z.string(),
  contactName: z.string(),
  items: z.array(VaultItemEnvelopeSchema),
  exportedAt: z.string(),
});

export interface WaitPeriodStatus {
  readonly canUnlock: boolean;
  readonly state: 'immediate' | 'waiting' | 'ready' | 'approved' | 'revoked';
  readonly remainingMs: number;
  readonly remainingHours: number;
  readonly remainingDays: number;
  readonly requestDate?: string | undefined;
  readonly unlockDate?: string | undefined;
}

/**
 * Calculates whether a contact's waiting period has elapsed.
 */
export function calculateWaitPeriodStatus(
  waitPeriodDays: number,
  status: EmergencyContact['status'],
  requestDate?: string | undefined,
  nowMs: number = Date.now()
): WaitPeriodStatus {
  if (status === 'revoked') {
    return {
      canUnlock: false,
      state: 'revoked',
      remainingMs: 0,
      remainingHours: 0,
      remainingDays: 0,
      requestDate,
    };
  }

  if (status === 'approved' || waitPeriodDays === 0) {
    return {
      canUnlock: true,
      state: status === 'approved' ? 'approved' : 'immediate',
      remainingMs: 0,
      remainingHours: 0,
      remainingDays: 0,
      requestDate,
    };
  }

  if (!requestDate) {
    return {
      canUnlock: false,
      state: 'waiting',
      remainingMs: waitPeriodDays * 24 * 3600 * 1000,
      remainingHours: waitPeriodDays * 24,
      remainingDays: waitPeriodDays,
      requestDate: undefined,
    };
  }

  const requestedAtMs = new Date(requestDate).getTime();
  const waitDurationMs = waitPeriodDays * 24 * 3600 * 1000;
  const unlockAtMs = requestedAtMs + waitDurationMs;
  const remainingMs = Math.max(0, unlockAtMs - nowMs);

  const canUnlock = remainingMs === 0;

  return {
    canUnlock,
    state: canUnlock ? 'ready' : 'waiting',
    remainingMs,
    remainingHours: Math.ceil(remainingMs / (3600 * 1000)),
    remainingDays: Math.ceil(remainingMs / (24 * 3600 * 1000)),
    requestDate,
    unlockDate: new Date(unlockAtMs).toISOString(),
  };
}

/**
 * Creates an encrypted emergency grant package with an emergency PIN.
 * Master password is never used or exported.
 */
export async function createEmergencyGrantPackage(
  items: readonly VaultItemEnvelope[],
  contact: {
    id: string;
    name: string;
    email: string;
    accessLevel: 'full' | 'selected';
    waitPeriodDays: number;
  },
  vaultName: string,
  emergencyPin: string,
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<string> {
  const cleanPin = emergencyPin.trim();
  if (cleanPin.length < 6) {
    throw new ValidationError('Emergency access PIN must be at least 6 characters or digits');
  }

  await crypto.init();

  const salt = crypto.randomBytes(16);
  const derivedKey = await crypto.deriveKeyFromPassword({
    password: cleanPin,
    salt,
    params: DEFAULT_ARGON2ID_PARAMS,
  });

  const payload: UnencryptedEmergencyPayload = {
    grantId: contact.id,
    vaultName,
    contactName: contact.name,
    items,
    exportedAt: new Date().toISOString(),
  };

  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = crypto.aeadEncrypt({
    plaintext: payloadBytes,
    key: derivedKey,
  });

  const pkg: EmergencyGrantPackage = {
    formatVersion: FORMAT_VERSION,
    aegisEmergencyType: 'grant_v1',
    grantId: contact.id,
    vaultName,
    contactName: contact.name,
    contactEmail: contact.email,
    accessLevel: contact.accessLevel,
    waitPeriodDays: contact.waitPeriodDays,
    createdAt: new Date().toISOString(),
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
 * Inspects an emergency grant package to extract public metadata without PIN.
 */
export function inspectEmergencyGrant(grantJson: string): EmergencyGrantPackage {
  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(grantJson);
  } catch (err) {
    throw new ImportValidationFailedError('Invalid JSON emergency grant package', err);
  }

  const parseResult = EmergencyGrantPackageSchema.safeParse(parsedRaw);
  if (!parseResult.success) {
    throw new ImportValidationFailedError(
      `Invalid emergency grant package schema: ${parseResult.error.issues.map((i) => i.message).join(', ')}`
    );
  }

  return parseResult.data;
}

/**
 * Decrypts an emergency grant package using the emergency PIN, respecting the contact's wait period state.
 */
export async function unlockEmergencyGrant(
  grantJson: string,
  emergencyPin: string,
  contactState?: {
    status: EmergencyContact['status'];
    requestDate?: string | undefined;
    nowMs?: number | undefined;
  },
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<{
  grantId: string;
  vaultName: string;
  contactName: string;
  items: VaultItemEnvelope[];
  waitStatus: WaitPeriodStatus;
}> {
  const pkg = inspectEmergencyGrant(grantJson);

  const status = contactState?.status ?? 'active';
  const requestDate = contactState?.requestDate;
  const nowMs = contactState?.nowMs ?? Date.now();

  const waitStatus = calculateWaitPeriodStatus(pkg.waitPeriodDays, status, requestDate, nowMs);

  if (waitStatus.state === 'revoked') {
    throw new AuthenticationFailedError('This emergency grant has been revoked by the vault owner.');
  }

  if (!waitStatus.canUnlock) {
    throw new AuthenticationFailedError(
      `Emergency access is in a waiting period (${waitStatus.remainingDays} days remaining) to protect vault owner privacy.`
    );
  }

  await crypto.init();

  const saltBytes = base64ToUint8Array(pkg.kdf.salt);
  const derivedKey = await crypto.deriveKeyFromPassword({
    password: emergencyPin.trim(),
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
    throw new AuthenticationFailedError('Incorrect Emergency PIN or corrupted grant package.');
  }

  let unencrypted: unknown;
  try {
    const text = new TextDecoder().decode(decryptedBytes);
    unencrypted = JSON.parse(text);
  } catch (err) {
    throw new ImportValidationFailedError('Failed to parse decrypted emergency data', err);
  }

  const validatedPayload = UnencryptedEmergencyPayloadSchema.safeParse(unencrypted);
  if (!validatedPayload.success) {
    throw new ImportValidationFailedError('Decrypted emergency payload failed schema validation');
  }

  return {
    grantId: pkg.grantId,
    vaultName: pkg.vaultName,
    contactName: pkg.contactName,
    items: validatedPayload.data.items as VaultItemEnvelope[],
    waitStatus,
  };
}

/**
 * Generates an exportable/printable Emergency Access Beneficiary Certificate.
 */
export function generateBeneficiaryCertificateHtml(
  contact: EmergencyContact,
  vaultName: string,
  grantJson: string
): string {
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AegisVault Emergency Grant Certificate — ${contact.name}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .logo span {
      color: #0284c7;
    }
    .badge {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      color: #0369a1;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .cert-box {
      border: 2px solid #e2e8f0;
      background: #f8fafc;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
    }
    .field-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .field-value {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 2px;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      word-break: break-all;
    }
    .notice {
      background: #fffbeb;
      border: 1px dashed #f59e0b;
      padding: 16px;
      border-radius: 8px;
      font-size: 12px;
      color: #92400e;
      margin-bottom: 20px;
    }
    .token-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 12px;
      border-radius: 6px;
      font-size: 10px;
      font-family: ui-monospace, monospace;
      max-height: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-wrap;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Aegis<span>Vault</span></div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">OFFICIAL EMERGENCY ACCESS GRANT CERTIFICATE</div>
    </div>
    <div class="badge">Issued: ${dateStr}</div>
  </div>

  <div class="notice">
    <strong>INSTRUCTIONS FOR BENEFICIARY:</strong><br>
    You have been designated as a trusted emergency contact for vault <strong>${vaultName}</strong>.
    To claim access, open any AegisVault instance, select <strong>Emergency Access</strong>, and enter this grant token along with the secret Emergency PIN provided separately to you.
  </div>

  <div class="cert-box">
    <div style="font-size: 16px; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 12px;">
      Emergency Grant Details
    </div>
    <div class="grid-2">
      <div>
        <div class="field-label">Beneficiary Name</div>
        <div class="field-value">${contact.name}</div>
      </div>
      <div>
        <div class="field-label">Beneficiary Email</div>
        <div class="field-value">${contact.email}</div>
      </div>
      <div>
        <div class="field-label">Vault Name</div>
        <div class="field-value">${vaultName}</div>
      </div>
      <div>
        <div class="field-label">Access Level</div>
        <div class="field-value" style="text-transform: capitalize;">${contact.accessLevel} Access</div>
      </div>
      <div>
        <div class="field-label">Waiting Period</div>
        <div class="field-value">${contact.waitPeriodDays === 0 ? 'Immediate Access' : `${contact.waitPeriodDays} Days Notice`}</div>
      </div>
      <div>
        <div class="field-label">Grant ID</div>
        <div class="field-value mono">${contact.id}</div>
      </div>
    </div>
  </div>

  <div style="font-size: 12px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; color: #475569;">
    Encrypted Grant Data Token
  </div>
  <div class="token-box">${grantJson}</div>

  <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center;">
    AegisVault Zero-Knowledge Cryptographic Suite • Encrypted with XChaCha20-Poly1305 & Argon2id
  </div>
</body>
</html>`;
}
