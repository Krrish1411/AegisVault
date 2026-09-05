import { describe, it, expect } from 'vitest';
import { generateEmergencyKitHtml } from './emergencyKit';
import type { VaultItemEnvelope } from '@/domain/vault/types';

describe('emergencyKit (Cold Storage Printable Emergency Kit)', () => {
  const mockItems: VaultItemEnvelope[] = [
    {
      id: 'item-1',
      type: 'bank_account',
      title: 'Emergency Savings Account',
      favorite: true,
      archived: false,
      tags: ['finance'],
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-02T10:00:00.000Z',
      payload: {
        bankName: 'HDFC Bank',
        accountNumber: '9876543210',
        accountHolderName: 'Jane Doe',
      },
    },
  ];

  it('should generate emergency kit HTML with instructions and recovery phrase', () => {
    const html = generateEmergencyKitHtml({
      vaultName: 'Personal Family Vault',
      ownerName: 'Jane Doe',
      instructions: 'Give this document to my legal executor.',
      recoveryPhrase:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      selectedItems: mockItems,
    });

    expect(html).toContain('AegisVault Emergency Access Kit — Personal Family Vault');
    expect(html).toContain('Jane Doe');
    expect(html).toContain('Give this document to my legal executor.');
    expect(html).toContain('abandon');
    expect(html).toContain('Emergency Savings Account');
    expect(html).toContain('HDFC Bank');
  });
});
