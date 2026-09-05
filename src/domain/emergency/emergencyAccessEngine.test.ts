import { describe, it, expect, beforeAll } from 'vitest';
import {
  createEmergencyGrantPackage,
  inspectEmergencyGrant,
  unlockEmergencyGrant,
  calculateWaitPeriodStatus,
  generateBeneficiaryCertificateHtml,
} from './emergencyAccessEngine';
import { SodiumCryptoProvider } from '@/security/crypto/SodiumCryptoProvider';
import type { VaultItemEnvelope, EmergencyContact } from '@/domain/vault/types';

describe('emergencyAccessEngine (Zero-Knowledge Emergency Access & Digital Legacy)', () => {
  const crypto = new SodiumCryptoProvider();

  beforeAll(async () => {
    await crypto.init();
  });

  const mockItems: VaultItemEnvelope[] = [
    {
      id: 'emergency-item-1',
      type: 'bank_account',
      title: 'Family Primary Savings',
      favorite: true,
      archived: false,
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
      payload: {
        bankName: 'Chase Bank',
        accountNumber: '9876543210',
        routingNumber: '123456789',
      },
    },
    {
      id: 'emergency-item-2',
      type: 'secure_note',
      title: 'Will & Executor Instructions',
      favorite: false,
      archived: false,
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
      payload: {
        content: 'Safety deposit box is located at 123 Main St, Box 402. Key is with Attorney Jane.',
      },
    },
  ];

  const mockContact: EmergencyContact = {
    id: 'contact-alex-123',
    name: 'Alex Patel',
    email: 'alex.patel@example.com',
    relationship: 'Brother',
    accessLevel: 'full',
    waitPeriodDays: 7,
    status: 'active',
    createdAt: '2026-09-01T10:00:00.000Z',
  };

  it('should calculate wait period statuses correctly', () => {
    const now = new Date('2026-09-10T12:00:00.000Z').getTime();

    // 1. Instant access (waitPeriodDays = 0)
    const instant = calculateWaitPeriodStatus(0, 'active', undefined, now);
    expect(instant.canUnlock).toBe(true);
    expect(instant.state).toBe('immediate');

    // 2. Waiting period not yet requested
    const notRequested = calculateWaitPeriodStatus(7, 'active', undefined, now);
    expect(notRequested.canUnlock).toBe(false);
    expect(notRequested.state).toBe('waiting');
    expect(notRequested.remainingDays).toBe(7);

    // 3. Waiting period running (requested 3 days ago, 7 day wait)
    const requested3d = calculateWaitPeriodStatus(
      7,
      'requested',
      '2026-09-07T12:00:00.000Z',
      now
    );
    expect(requested3d.canUnlock).toBe(false);
    expect(requested3d.state).toBe('waiting');
    expect(requested3d.remainingDays).toBe(4);

    // 4. Waiting period elapsed (requested 8 days ago, 7 day wait)
    const elapsed = calculateWaitPeriodStatus(
      7,
      'requested',
      '2026-09-02T12:00:00.000Z',
      now
    );
    expect(elapsed.canUnlock).toBe(true);
    expect(elapsed.state).toBe('ready');

    // 5. Owner explicitly approved before wait period elapsed
    const approved = calculateWaitPeriodStatus(
      7,
      'approved',
      '2026-09-09T12:00:00.000Z',
      now
    );
    expect(approved.canUnlock).toBe(true);
    expect(approved.state).toBe('approved');

    // 6. Owner revoked
    const revoked = calculateWaitPeriodStatus(
      7,
      'revoked',
      '2026-09-09T12:00:00.000Z',
      now
    );
    expect(revoked.canUnlock).toBe(false);
    expect(revoked.state).toBe('revoked');
  });

  it('should create an encrypted grant, inspect metadata, and unlock with correct PIN', async () => {
    const pin = 'EmergencyPin#789';
    const grantJson = await createEmergencyGrantPackage(
      mockItems,
      mockContact,
      'Primary Life Vault',
      pin,
      crypto
    );

    expect(grantJson).toContain('grant_v1');
    expect(grantJson).toContain('Alex Patel');

    // Inspect without PIN
    const inspected = inspectEmergencyGrant(grantJson);
    expect(inspected.grantId).toBe('contact-alex-123');
    expect(inspected.vaultName).toBe('Primary Life Vault');
    expect(inspected.contactEmail).toBe('alex.patel@example.com');
    expect(inspected.waitPeriodDays).toBe(7);

    // Try unlock when owner explicitly approved
    const unlocked = await unlockEmergencyGrant(
      grantJson,
      pin,
      {
        status: 'approved',
        requestDate: '2026-09-05T10:00:00.000Z',
      },
      crypto
    );

    expect(unlocked.items).toHaveLength(2);
    expect(unlocked.items[0]?.title).toBe('Family Primary Savings');
    expect(unlocked.items[1]?.title).toBe('Will & Executor Instructions');
  });

  it('should reject unlocking if waiting period has not elapsed and not approved', async () => {
    const pin = 'EmergencyPin#789';
    const grantJson = await createEmergencyGrantPackage(
      mockItems,
      mockContact,
      'Primary Life Vault',
      pin,
      crypto
    );

    // Requested today with 7-day wait
    await expect(
      unlockEmergencyGrant(
        grantJson,
        pin,
        {
          status: 'requested',
          requestDate: new Date().toISOString(),
        },
        crypto
      )
    ).rejects.toThrow(/waiting period/i);
  });

  it('should reject unlocking with incorrect Emergency PIN', async () => {
    const pin = 'EmergencyPin#789';
    const grantJson = await createEmergencyGrantPackage(
      mockItems,
      mockContact,
      'Primary Life Vault',
      pin,
      crypto
    );

    await expect(
      unlockEmergencyGrant(
        grantJson,
        'WrongPin123!',
        {
          status: 'approved',
        },
        crypto
      )
    ).rejects.toThrow(/Incorrect Emergency PIN/i);
  });

  it('should reject unlocking if owner revoked the grant', async () => {
    const pin = 'EmergencyPin#789';
    const grantJson = await createEmergencyGrantPackage(
      mockItems,
      mockContact,
      'Primary Life Vault',
      pin,
      crypto
    );

    await expect(
      unlockEmergencyGrant(
        grantJson,
        pin,
        {
          status: 'revoked',
        },
        crypto
      )
    ).rejects.toThrow(/revoked by the vault owner/i);
  });

  it('should generate beneficiary HTML certificate containing contact and grant details', async () => {
    const pin = 'EmergencyPin#789';
    const grantJson = await createEmergencyGrantPackage(
      mockItems,
      mockContact,
      'Primary Life Vault',
      pin,
      crypto
    );

    const html = generateBeneficiaryCertificateHtml(mockContact, 'Primary Life Vault', grantJson);
    expect(html).toContain('Alex Patel');
    expect(html).toContain('Primary Life Vault');
    expect(html).toContain('grant_v1');
    expect(html).toContain('OFFICIAL EMERGENCY ACCESS GRANT CERTIFICATE');
  });
});
