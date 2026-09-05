import { describe, it, expect } from 'vitest';
import { analyzeVaultHealth } from './securityAnalyzer';
import type { DecryptedVaultDomain, VaultItemEnvelope } from '@/domain/vault/types';
import { DEFAULT_VAULT_SETTINGS } from '@/domain/vault/types';

function createMockDomain(items: VaultItemEnvelope[]): DecryptedVaultDomain {
  return {
    metadata: {
      id: 'vault-sec-test',
      name: 'Security Test Vault',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      formatVersion: 1,
      cryptoProfile: 'aegis-v1',
    },
    settings: DEFAULT_VAULT_SETTINGS,
    items,
    folders: [],
    attachments: [],
    auditEvents: [],
  };
}

describe('securityAnalyzer Local Password Health Engine', () => {
  it('should compute 100% score for strong, unique, and recent secrets', () => {
    const domain = createMockDomain([
      {
        id: 'strong-1',
        type: 'login',
        title: 'GitHub Enterprise',
        favorite: false,
        archived: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payload: {
          username: 'octocat',
          password: 'K#9mX2$vL8!pQ4@zN5*wR7&y', // 24 chars, >120 bits entropy
          totpSecret: 'JBSWY3DPEHPK3PXP',
        },
      },
      {
        id: 'strong-2',
        type: 'login',
        title: 'ProtonMail Secure',
        favorite: false,
        archived: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payload: {
          username: 'user@proton.me',
          password: 'V!8qW4#tZ2$mP9*kL5&sN3@b', // 24 chars, >120 bits entropy
          totpSecret: 'JBSWY3DPEHPK3PXP',
        },
      },
    ]);

    const report = analyzeVaultHealth(domain);
    expect(report.overallScore).toBe(100);
    expect(report.securityRating).toBe('excellent');
    expect(report.weakCount).toBe(0);
    expect(report.reusedCount).toBe(0);
    expect(report.commonCount).toBe(0);
    expect(report.healthyLogins).toBe(2);
    expect(report.findings.length).toBe(0);
  });

  it('should detect weak passwords with low entropy or short length', () => {
    const domain = createMockDomain([
      {
        id: 'weak-1',
        type: 'login',
        title: 'Simple Forum',
        favorite: false,
        archived: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payload: {
          username: 'forumuser',
          password: 'abc', // 3 chars
        },
      },
    ]);

    const report = analyzeVaultHealth(domain);
    expect(report.weakCount).toBe(1);
    expect(report.overallScore).toBeLessThan(100);
    const weakFinding = report.findings.find((f) => f.vulnerability === 'weak');
    expect(weakFinding).toBeDefined();
    expect(weakFinding?.severity).toBe('high');
  });

  it('should detect common compromised dictionary passwords', () => {
    const domain = createMockDomain([
      {
        id: 'common-1',
        type: 'login',
        title: 'Legacy Account',
        favorite: false,
        archived: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payload: {
          username: 'admin',
          password: 'password123',
        },
      },
    ]);

    const report = analyzeVaultHealth(domain);
    expect(report.commonCount).toBe(1);
    const commonFinding = report.findings.find((f) => f.vulnerability === 'common');
    expect(commonFinding).toBeDefined();
    expect(commonFinding?.severity).toBe('critical');
  });

  it('should detect reused / duplicate passwords across accounts', () => {
    const sharedPassword = 'SharedSuperComplexPassword99!#';
    const domain = createMockDomain([
      {
        id: 'reused-1',
        type: 'login',
        title: 'Service Alpha',
        favorite: false,
        archived: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payload: { username: 'alpha_user', password: sharedPassword },
      },
      {
        id: 'reused-2',
        type: 'login',
        title: 'Service Beta',
        favorite: false,
        archived: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payload: { username: 'beta_user', password: sharedPassword },
      },
    ]);

    const report = analyzeVaultHealth(domain);
    expect(report.reusedCount).toBe(2);
    const reusedFindings = report.findings.filter((f) => f.vulnerability === 'reused');
    expect(reusedFindings.length).toBe(2);
    expect(reusedFindings[0]?.severity).toBe('critical');
  });

  it('should detect stale passwords older than 180 days', () => {
    const oldDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
    const domain = createMockDomain([
      {
        id: 'old-1',
        type: 'login',
        title: 'Ancient Service',
        favorite: false,
        archived: false,
        tags: [],
        createdAt: oldDate,
        updatedAt: oldDate,
        payload: {
          username: 'ancient',
          password: 'VeryLongUniquePassword99!#@$',
        },
      },
    ]);

    const report = analyzeVaultHealth(domain);
    expect(report.oldCount).toBe(1);
    const oldFinding = report.findings.find((f) => f.vulnerability === 'old');
    expect(oldFinding).toBeDefined();
  });

  it('should detect expired passwords and passwords expiring soon', () => {
    const expiredDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const expiringSoonDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const domain = createMockDomain([
      {
        id: 'expired-1',
        type: 'login',
        title: 'Corporate VPN',
        favorite: false,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payload: {
          username: 'corpuser',
          password: 'SuperStrongPassword2026!#@$',
          expiresAt: expiredDate,
          totpSecret: 'JBSWY3DPEHPK3PXP',
        },
      },
      {
        id: 'expiring-1',
        type: 'login',
        title: 'Banking Portal',
        favorite: false,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payload: {
          username: 'bankuser',
          password: 'AnotherStrongPassword2026!#@$',
          expiresAt: expiringSoonDate,
          totpSecret: 'JBSWY3DPEHPK3PXP',
        },
      },
    ]);

    const report = analyzeVaultHealth(domain);
    expect(report.expiredCount).toBe(1);
    expect(report.expiringSoonCount).toBe(1);

    const expiredFinding = report.findings.find((f) => f.vulnerability === 'expired');
    expect(expiredFinding).toBeDefined();
    expect(expiredFinding?.severity).toBe('critical');

    const expiringFinding = report.findings.find((f) => f.vulnerability === 'expiring_soon');
    expect(expiringFinding).toBeDefined();
    expect(expiringFinding?.severity).toBe('medium');
  });
});
