import type { DecryptedVaultDomain, VaultItemEnvelope } from '@/domain/vault/types';
import { calculatePasswordEntropy } from '@/domain/generator/secretGenerator';
import { isCommonPassword } from './commonPasswords';

export type VulnerabilityType =
  | 'weak'
  | 'reused'
  | 'old'
  | 'common'
  | 'predictable'
  | 'missing_2fa'
  | 'expired'
  | 'expiring_soon';

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecurityFinding {
  readonly id: string;
  readonly itemId: string;
  readonly itemTitle: string;
  readonly itemType: string;
  readonly username?: string;
  readonly vulnerability: VulnerabilityType;
  readonly severity: FindingSeverity;
  readonly title: string;
  readonly description: string;
  readonly remediationAction: string;
  readonly relatedItemIds?: readonly string[];
}

export interface SystemSecurityPosture {
  readonly autoLockActive: boolean;
  readonly autoLockMinutes: number;
  readonly lockOnVisibilityHidden: boolean;
  readonly recoveryWrapActive: boolean;
  readonly lastBackupDate?: string;
  readonly vaultCryptoProfile: string;
  readonly formatVersion: number;
}

export interface VaultSecurityReport {
  readonly overallScore: number; // 0-100
  readonly securityRating: 'excellent' | 'good' | 'needs_attention' | 'critical';
  readonly scannedAt: string;
  readonly totalLogins: number;
  readonly healthyLogins: number;
  readonly weakCount: number;
  readonly reusedCount: number;
  readonly oldCount: number;
  readonly commonCount: number;
  readonly missing2faCount: number;
  readonly expiredCount: number;
  readonly expiringSoonCount: number;
  readonly findings: readonly SecurityFinding[];
  readonly systemStatus: SystemSecurityPosture;
}

const PREDICTABLE_PATTERNS = [
  /^(.)\1+$/, // repeating single char e.g. "aaaa"
  /^(123|abc|qwerty|password|admin)/i,
  /(19\d\d|20\d\d)[!@#$%^&*]?$/, // year suffix e.g. "2024!"
  /^[a-zA-Z]+\d{1,2}$/, // word followed by 1 or 2 digits e.g. "Secret1"
];

function isPredictablePattern(password: string): boolean {
  return PREDICTABLE_PATTERNS.some((pattern) => pattern.test(password));
}

interface ExtractedSecret {
  readonly itemId: string;
  readonly itemTitle: string;
  readonly itemType: string;
  readonly label: string;
  readonly secret: string;
  readonly username?: string | undefined;
  readonly updatedAt: string;
  readonly expiresAt?: string | undefined;
  readonly isTotpConfigured?: boolean | undefined;
  readonly minSafeLength: number;
  readonly minSafeEntropy: number;
}

/**
 * Extracts all passwords, PINs, and credentials across all vault item types:
 * logins, banking portals, bank accounts, UPI PINs, ATM PINs, cards, applications, and email.
 */
function extractSecretsFromItem(item: VaultItemEnvelope): ExtractedSecret[] {
  const p = (item.payload ?? {}) as Record<string, unknown>;
  const results: ExtractedSecret[] = [];

  const add = (
    label: string,
    secretVal: unknown,
    opts: {
      username?: string | undefined;
      expiresAt?: string | undefined;
      isTotpConfigured?: boolean | undefined;
      minSafeLength?: number | undefined;
      minSafeEntropy?: number | undefined;
    } = {}
  ) => {
    if (typeof secretVal === 'string' && secretVal.trim().length > 0) {
      results.push({
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.type,
        label,
        secret: secretVal,
        username: opts.username,
        updatedAt: item.updatedAt,
        expiresAt: opts.expiresAt ?? (p.expiresAt as string | undefined),
        isTotpConfigured: opts.isTotpConfigured,
        minSafeLength: opts.minSafeLength ?? 12,
        minSafeEntropy: opts.minSafeEntropy ?? 60,
      });
    }
  };

  switch (item.type) {
    case 'login':
      add('Password', p.password, {
        username: p.username as string | undefined,
        isTotpConfigured: Boolean(p.totpSecret || p.totp),
      });
      break;

    case 'bank_login':
      add('Login Password', p.password, { username: p.username as string | undefined });
      add('Transaction Password', p.transactionPassword);
      break;

    case 'bank_account':
      add('Net Banking Password', p.netBankingPassword ?? p.loginPassword);
      add('Transaction Password', p.transactionPassword);
      add('Profile Password', p.profilePassword);
      add('MPIN', p.mpin, { minSafeLength: 6, minSafeEntropy: 19 });
      break;

    case 'bank_profile':
      add('Profile Password', p.profilePassword);
      add('Transaction PIN', p.transactionPin, { minSafeLength: 6, minSafeEntropy: 19 });
      break;

    case 'upi':
      add('UPI PIN', p.upiPin, { minSafeLength: 4, minSafeEntropy: 13 });
      break;

    case 'upi_pin':
      add('UPI PIN', p.pin, { minSafeLength: 4, minSafeEntropy: 13 });
      break;

    case 'atm_pin':
      add('ATM PIN', p.pin, { minSafeLength: 4, minSafeEntropy: 13 });
      break;

    case 'debit_card':
    case 'credit_card':
      add('Card PIN', p.pin, { minSafeLength: 4, minSafeEntropy: 13 });
      break;

    case 'application':
      add('Application Password', p.password, { username: p.username as string | undefined });
      break;

    case 'email':
      add('Email Password', p.password, { username: p.email as string | undefined });
      break;

    default:
      if (typeof p.password === 'string' && p.password.length > 0) {
        add('Password', p.password);
      }
      break;
  }

  return results;
}

/**
 * Evaluates the security posture and credential health of all vault items locally.
 * Invariant: 100% offline, zero network requests, zero telemetry.
 */
export function analyzeVaultHealth(
  domain: DecryptedVaultDomain,
  lastBackupDate?: string
): VaultSecurityReport {
  const scannedAt = new Date().toISOString();
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const maxAgeDays = 180;

  const findings: SecurityFinding[] = [];
  const vulnerableItemIds = new Set<string>();

  // Extract all credentials across all items
  const allExtracted: ExtractedSecret[] = [];
  const scannedItemIds = new Set<string>();

  for (const item of domain.items) {
    if (item.archived) continue;
    const secrets = extractSecretsFromItem(item);
    if (secrets.length > 0) {
      scannedItemIds.add(item.id);
      allExtracted.push(...secrets);
    }
  }

  // 1. Password Frequency Map for Cross-Account Duplicate / Reused Detection
  const passwordMap = new Map<string, ExtractedSecret[]>();
  for (const entry of allExtracted) {
    const list = passwordMap.get(entry.secret) ?? [];
    list.push(entry);
    passwordMap.set(entry.secret, list);
  }

  let weakCount = 0;
  let reusedCount = 0;
  let oldCount = 0;
  let commonCount = 0;
  let missing2faCount = 0;
  let expiredCount = 0;
  let expiringSoonCount = 0;

  for (const entry of allExtracted) {
    const { secret, itemId, itemTitle, itemType, label, username, minSafeLength, minSafeEntropy } = entry;

    // Check Common Leaked Passwords
    if (isCommonPassword(secret)) {
      commonCount++;
      vulnerableItemIds.add(itemId);
      findings.push({
        id: `finding-common-${itemId}-${label.toLowerCase().replace(/\s+/g, '-')}`,
        itemId,
        itemTitle: label === 'Password' ? itemTitle : `${itemTitle} (${label})`,
        itemType,
        ...(username ? { username } : {}),
        vulnerability: 'common',
        severity: 'critical',
        title: `Common / Compromised ${label}`,
        description: `The ${label.toLowerCase()} for "${itemTitle}" appears in known breach lists and is easily guessable.`,
        remediationAction: 'Generate a unique, high-entropy secret immediately.',
      });
    }

    // Check Weak / Low Entropy
    const entropy = calculatePasswordEntropy(secret);
    if (secret.length < minSafeLength || entropy.entropyBits < minSafeEntropy) {
      weakCount++;
      vulnerableItemIds.add(itemId);
      findings.push({
        id: `finding-weak-${itemId}-${label.toLowerCase().replace(/\s+/g, '-')}`,
        itemId,
        itemTitle: label === 'Password' ? itemTitle : `${itemTitle} (${label})`,
        itemType,
        ...(username ? { username } : {}),
        vulnerability: 'weak',
        severity: 'high',
        title: `Weak ${label}`,
        description: `${label} has low entropy (${entropy.entropyBits} bits) or length under ${minSafeLength} characters.`,
        remediationAction: `Upgrade ${label.toLowerCase()} length to at least ${minSafeLength} characters.`,
      });
    } else if (isPredictablePattern(secret)) {
      vulnerableItemIds.add(itemId);
      findings.push({
        id: `finding-predictable-${itemId}-${label.toLowerCase().replace(/\s+/g, '-')}`,
        itemId,
        itemTitle: label === 'Password' ? itemTitle : `${itemTitle} (${label})`,
        itemType,
        ...(username ? { username } : {}),
        vulnerability: 'predictable',
        severity: 'medium',
        title: `Predictable ${label}`,
        description: 'Contains repeating sequences, common year numbers, or basic patterns.',
        remediationAction: 'Use random CSPRNG generation instead of human-patterned secrets.',
      });
    }

    // Check Reused / Duplicate Credentials across items
    const shared = passwordMap.get(secret) ?? [];
    if (shared.length > 1) {
      const otherItems = shared.filter((s) => s.itemId !== itemId);
      if (otherItems.length > 0) {
        reusedCount++;
        vulnerableItemIds.add(itemId);
        const otherNames = otherItems
          .map((s) => (s.label === 'Password' ? s.itemTitle : `${s.itemTitle} (${s.label})`))
          .join(', ');

        findings.push({
          id: `finding-reused-${itemId}-${label.toLowerCase().replace(/\s+/g, '-')}`,
          itemId,
          itemTitle: label === 'Password' ? itemTitle : `${itemTitle} (${label})`,
          itemType,
          ...(username ? { username } : {}),
          vulnerability: 'reused',
          severity: 'critical',
          title: `Reused ${label}`,
          description: `This ${label.toLowerCase()} is shared with other accounts (${otherNames}). A breach of one compromises all.`,
          remediationAction: 'Assign an independent, unique secret to this service.',
          relatedItemIds: shared.map((s) => s.itemId),
        });
      }
    }

    // Check Age (>180 days)
    const updatedTime = new Date(entry.updatedAt).getTime();
    const ageDays = Math.floor((now - updatedTime) / oneDayMs);
    if (ageDays > maxAgeDays) {
      oldCount++;
      findings.push({
        id: `finding-old-${itemId}-${label.toLowerCase().replace(/\s+/g, '-')}`,
        itemId,
        itemTitle: label === 'Password' ? itemTitle : `${itemTitle} (${label})`,
        itemType,
        ...(username ? { username } : {}),
        vulnerability: 'old',
        severity: 'low',
        title: `Stale ${label}`,
        description: `This ${label.toLowerCase()} was last rotated ${ageDays} days ago.`,
        remediationAction: 'Review and rotate credential if the service is sensitive.',
      });
    }

    // Check Expiration Policy
    if (entry.expiresAt) {
      const expiryTime = new Date(entry.expiresAt).getTime();
      if (!isNaN(expiryTime)) {
        if (expiryTime <= now) {
          expiredCount++;
          vulnerableItemIds.add(itemId);
          const daysAgo = Math.max(0, Math.floor((now - expiryTime) / oneDayMs));
          findings.push({
            id: `finding-expired-${itemId}-${label.toLowerCase().replace(/\s+/g, '-')}`,
            itemId,
            itemTitle: label === 'Password' ? itemTitle : `${itemTitle} (${label})`,
            itemType,
            ...(username ? { username } : {}),
            vulnerability: 'expired',
            severity: 'critical',
            title: `${label} Expired`,
            description: `This ${label.toLowerCase()} expired ${daysAgo === 0 ? 'today' : `${daysAgo} days ago`}.`,
            remediationAction: 'Rotate this secret immediately.',
          });
        } else if (expiryTime <= now + 14 * oneDayMs) {
          expiringSoonCount++;
          const daysLeft = Math.max(1, Math.ceil((expiryTime - now) / oneDayMs));
          findings.push({
            id: `finding-expiring-${itemId}-${label.toLowerCase().replace(/\s+/g, '-')}`,
            itemId,
            itemTitle: label === 'Password' ? itemTitle : `${itemTitle} (${label})`,
            itemType,
            ...(username ? { username } : {}),
            vulnerability: 'expiring_soon',
            severity: 'medium',
            title: `${label} Expiring Soon`,
            description: `This ${label.toLowerCase()} will expire in ${daysLeft} days.`,
            remediationAction: 'Prepare to rotate this credential before expiration.',
          });
        }
      }
    }

    // Check Missing 2FA for logins
    if (itemType === 'login' && !entry.isTotpConfigured) {
      missing2faCount++;
      findings.push({
        id: `finding-2fa-${itemId}`,
        itemId,
        itemTitle,
        itemType,
        ...(username ? { username } : {}),
        vulnerability: 'missing_2fa',
        severity: 'low',
        title: 'Two-Factor Authentication Not Configured',
        description: 'No TOTP authenticator key is attached to this login credential.',
        remediationAction: 'Enable two-factor authentication on the service and store the TOTP secret here.',
      });
    }
  }

  // System Security Posture
  const autoLockActive = domain.settings.autoLockMinutes > 0;
  const systemStatus: SystemSecurityPosture = {
    autoLockActive,
    autoLockMinutes: domain.settings.autoLockMinutes,
    lockOnVisibilityHidden: domain.settings.lockOnVisibilityHidden,
    recoveryWrapActive: true,
    ...(lastBackupDate ? { lastBackupDate } : {}),
    vaultCryptoProfile: domain.metadata.cryptoProfile,
    formatVersion: domain.metadata.formatVersion,
  };

  // Calculate Overall Score (0-100)
  let score = 100;
  const totalScanned = scannedItemIds.size;

  if (totalScanned > 0) {
    const commonDeduction = Math.min(30, commonCount * 15);
    const weakDeduction = Math.min(25, weakCount * 10);
    const reusedDeduction = Math.min(30, reusedCount * 10);
    const oldDeduction = Math.min(10, oldCount * 2);
    const expiredDeduction = Math.min(25, expiredCount * 10);

    score -= (commonDeduction + weakDeduction + reusedDeduction + oldDeduction + expiredDeduction);
  }

  if (!autoLockActive) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  let securityRating: VaultSecurityReport['securityRating'];
  if (score >= 90) securityRating = 'excellent';
  else if (score >= 75) securityRating = 'good';
  else if (score >= 50) securityRating = 'needs_attention';
  else securityRating = 'critical';

  const healthyLogins = Math.max(0, totalScanned - vulnerableItemIds.size);

  return {
    overallScore: score,
    securityRating,
    scannedAt,
    totalLogins: totalScanned,
    healthyLogins,
    weakCount,
    reusedCount,
    oldCount,
    commonCount,
    missing2faCount,
    expiredCount,
    expiringSoonCount,
    findings,
    systemStatus,
  };
}
