import type { DecryptedVaultDomain, VaultItemEnvelope, LoginPayload } from '@/domain/vault/types';
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

/**
 * Evaluates the security posture and password health of all vault items locally.
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

  const loginItems = domain.items.filter((item) => item.type === 'login');
  const findings: SecurityFinding[] = [];

  // 1. Password Frequency Map for Duplicate / Reused Detection
  const passwordMap = new Map<string, VaultItemEnvelope[]>();
  for (const item of loginItems) {
    const payload = item.payload as Partial<LoginPayload>;
    if (payload.password) {
      const list = passwordMap.get(payload.password) ?? [];
      list.push(item);
      passwordMap.set(payload.password, list);
    }
  }

  // Track items that have at least one vulnerability
  const vulnerableItemIds = new Set<string>();

  let weakCount = 0;
  let reusedCount = 0;
  let oldCount = 0;
  let commonCount = 0;
  let missing2faCount = 0;
  let expiredCount = 0;
  let expiringSoonCount = 0;

  for (const item of loginItems) {
    const payload = item.payload as Partial<LoginPayload>;
    const password = payload.password ?? '';
    const username = payload.username;

    // Check Common Leaked Passwords
    if (password && isCommonPassword(password)) {
      commonCount++;
      vulnerableItemIds.add(item.id);
      findings.push({
        id: `finding-common-${item.id}`,
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.type,
        ...(username ? { username } : {}),
        vulnerability: 'common',
        severity: 'critical',
        title: 'Common / Compromised Password',
        description: `The password for "${item.title}" appears in known breach lists and is easily guessable by attackers.`,
        remediationAction: 'Generate a unique, high-entropy password immediately.',
      });
    }

    // Check Weak / Low Entropy
    if (password) {
      const entropy = calculatePasswordEntropy(password);
      if (password.length < 12 || entropy.entropyBits < 60) {
        weakCount++;
        vulnerableItemIds.add(item.id);
        findings.push({
          id: `finding-weak-${item.id}`,
          itemId: item.id,
          itemTitle: item.title,
          itemType: item.type,
          ...(username ? { username } : {}),
          vulnerability: 'weak',
          severity: 'high',
          title: 'Weak Password',
          description: `Password has low entropy (${entropy.entropyBits} bits) or length under 12 characters.`,
          remediationAction: 'Upgrade password length to at least 20 characters.',
        });
      } else if (isPredictablePattern(password)) {
        vulnerableItemIds.add(item.id);
        findings.push({
          id: `finding-predictable-${item.id}`,
          itemId: item.id,
          itemTitle: item.title,
          itemType: item.type,
          ...(username ? { username } : {}),
          vulnerability: 'predictable',
          severity: 'medium',
          title: 'Predictable Structure',
          description: 'Contains predictable sequences, repeating characters, or common year suffixes.',
          remediationAction: 'Use CSPRNG random generation instead of human-patterned passwords.',
        });
      }
    }

    // Check Reused / Duplicate Passwords
    if (password) {
      const sharedItems = passwordMap.get(password) ?? [];
      if (sharedItems.length > 1) {
        reusedCount++;
        vulnerableItemIds.add(item.id);
        const otherTitles = sharedItems
          .filter((i) => i.id !== item.id)
          .map((i) => i.title)
          .join(', ');

        findings.push({
          id: `finding-reused-${item.id}`,
          itemId: item.id,
          itemTitle: item.title,
          itemType: item.type,
          ...(username ? { username } : {}),
          vulnerability: 'reused',
          severity: 'critical',
          title: 'Reused Password',
          description: `This password is shared with other accounts (${otherTitles}). A single breach compromises all of them.`,
          remediationAction: 'Assign an independent, distinct password to this service.',
          relatedItemIds: sharedItems.map((i) => i.id),
        });
      }
    }

    // Check Age (>180 days)
    const updatedTime = new Date(item.updatedAt).getTime();
    const ageDays = Math.floor((now - updatedTime) / oneDayMs);
    if (ageDays > maxAgeDays) {
      oldCount++;
      findings.push({
        id: `finding-old-${item.id}`,
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.type,
        ...(username ? { username } : {}),
        vulnerability: 'old',
        severity: 'low',
        title: 'Old / Stale Password',
        description: `This password was last changed ${ageDays} days ago.`,
        remediationAction: 'Review and rotate credential if the service is sensitive.',
      });
    }

    // Check Password Expiration Policy
    const expiresAt = payload.expiresAt ?? (item as unknown as { expiresAt?: string }).expiresAt;
    if (expiresAt) {
      const expiryTime = new Date(expiresAt).getTime();
      if (!isNaN(expiryTime)) {
        if (expiryTime <= now) {
          expiredCount++;
          vulnerableItemIds.add(item.id);
          const daysAgo = Math.max(0, Math.floor((now - expiryTime) / oneDayMs));
          findings.push({
            id: `finding-expired-${item.id}`,
            itemId: item.id,
            itemTitle: item.title,
            itemType: item.type,
            ...(username ? { username } : {}),
            vulnerability: 'expired',
            severity: 'critical',
            title: 'Password Expired',
            description: `This password expired ${daysAgo === 0 ? 'today' : `${daysAgo} days ago`} according to its expiration policy.`,
            remediationAction: 'Rotate this password immediately and reset the expiration policy.',
          });
        } else if (expiryTime <= now + 14 * oneDayMs) {
          expiringSoonCount++;
          const daysLeft = Math.max(1, Math.ceil((expiryTime - now) / oneDayMs));
          findings.push({
            id: `finding-expiring-${item.id}`,
            itemId: item.id,
            itemTitle: item.title,
            itemType: item.type,
            ...(username ? { username } : {}),
            vulnerability: 'expiring_soon',
            severity: 'medium',
            title: 'Password Expiring Soon',
            description: `This password will expire in ${daysLeft} days.`,
            remediationAction: 'Plan to rotate this credential before it expires.',
          });
        }
      }
    }

    // Check Missing 2FA / TOTP
    if (!payload.totpSecret) {
      missing2faCount++;
      findings.push({
        id: `finding-2fa-${item.id}`,
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.type,
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

  if (loginItems.length > 0) {
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

  const healthyLogins = loginItems.length - vulnerableItemIds.size;

  return {
    overallScore: score,
    securityRating,
    scannedAt,
    totalLogins: loginItems.length,
    healthyLogins: Math.max(0, healthyLogins),
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
