import { describe, it, expect, beforeAll } from 'vitest';
import {
  exportSharingPackage,
  importSharingPackage,
  type SharingRole,
} from './sharingEngine';
import { SodiumCryptoProvider } from '@/security/crypto/SodiumCryptoProvider';
import type { VaultItemEnvelope, VaultFolder } from '@/domain/vault/types';

describe('sharingEngine (Granular Family & Peer Encrypted Sharing)', () => {
  const crypto = new SodiumCryptoProvider();

  beforeAll(async () => {
    await crypto.init();
  });

  const mockItems: VaultItemEnvelope[] = [
    {
      id: 'item-1',
      type: 'login',
      title: 'Netflix Family Account',
      favorite: false,
      archived: false,
      tags: ['entertainment'],
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-02T10:00:00.000Z',
      payload: {
        username: 'family@example.com',
        password: 'SuperSecretPassword123!',
      },
    },
    {
      id: 'item-2',
      type: 'credit_card',
      title: 'Shared Grocery Card',
      favorite: true,
      archived: false,
      tags: ['finance'],
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-02T10:00:00.000Z',
      payload: {
        cardholderName: 'Jane Doe',
        cardNumber: '4532123456789012',
      },
    },
  ];

  const mockFolders: VaultFolder[] = [
    {
      id: 'folder-1',
      name: 'Family Shared',
      createdAt: '2026-09-02T10:00:00.000Z',
    },
  ];

  it('should export and import an encrypted package with an independent passphrase and role', async () => {
    const sharingPassphrase = 'OneTimeSharingPassphrase99!';
    const role: SharingRole = 'member';

    const packageJson = await exportSharingPackage(mockItems, mockFolders, sharingPassphrase, {
      packageType: 'items',
      role,
      crypto,
    });

    expect(packageJson).toBeDefined();
    expect(packageJson).not.toContain('SuperSecretPassword123!');
    expect(packageJson).not.toContain('4532123456789012');

    const imported = await importSharingPackage(packageJson, sharingPassphrase, crypto);
    expect(imported.items.length).toBe(2);
    expect(imported.folders.length).toBe(1);
    expect(imported.exportedByRole).toBe('member');
    expect((imported.items[0]?.payload as Record<string, unknown>).username).toBe('family@example.com');
  });

  it('should reject incorrect sharing passphrase', async () => {
    const packageJson = await exportSharingPackage(
      mockItems,
      mockFolders,
      'ValidSharingPassphrase123!',
      { crypto }
    );

    await expect(
      importSharingPackage(packageJson, 'WrongPassphrase123!', crypto)
    ).rejects.toThrow(/Incorrect sharing passphrase/);
  });

  it('should reject short sharing passphrase during export', async () => {
    await expect(
      exportSharingPackage(mockItems, mockFolders, 'short', { crypto })
    ).rejects.toThrow(/at least 8 characters/);
  });
});
