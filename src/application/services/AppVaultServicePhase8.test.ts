import { describe, it, expect, beforeEach } from 'vitest';
import { AppVaultService } from './AppVaultService';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';
import { useSessionStore } from '@/state/sessionStore';
import type { TotpPayload, WalletSeedPayload, PrivateKeyPayload } from '@/domain/vault/types';

describe('AppVaultService Phase 8 (TOTP, Wallets & Recovery Materials)', () => {
  let repository: DexieVaultRepository;
  let service: AppVaultService;

  beforeEach(async () => {
    repository = new DexieVaultRepository();
    await repository.delete();
    service = new AppVaultService(repository);
    useSessionStore.getState().reset();
  });

  it('should encrypt and persist TOTP authenticator secrets', async () => {
    await service.createVault({
      vaultName: 'Crypto & 2FA Vault',
      masterPassword: 'MasterPassword123!',
    });

    const totpPayload: TotpPayload = {
      secret: 'JBSWY3DPEHPK3PXP',
      issuer: 'GitHub',
      account: 'developer@example.com',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    };

    await service.saveItem({
      id: 'totp-1',
      type: 'totp',
      title: 'GitHub 2FA',
      favorite: true,
      archived: false,
      tags: ['2fa', 'dev'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: totpPayload as unknown as Record<string, unknown>,
    });

    const domain = service.getDecryptedVault();
    expect(domain?.items.length).toBe(1);
    const item = domain?.items[0];
    expect(item?.type).toBe('totp');
    expect((item?.payload as unknown as TotpPayload).secret).toBe('JBSWY3DPEHPK3PXP');
  });

  it('should encrypt and persist Cryptocurrency Wallet Seeds and Private Keys', async () => {
    await service.createVault({
      vaultName: 'Crypto Vault',
      masterPassword: 'MasterPassword123!',
    });

    const seedPayload: WalletSeedPayload = {
      seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      wordCount: 12,
      blockchain: 'ethereum',
      primaryAddress: '0x1234567890abcdef1234567890abcdef12345678',
    };

    await service.saveItem({
      id: 'seed-1',
      type: 'wallet_seed',
      title: 'MetaMask Cold Seed',
      favorite: true,
      archived: false,
      tags: ['crypto', 'eth'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: seedPayload as unknown as Record<string, unknown>,
    });

    const keyPayload: PrivateKeyPayload = {
      privateKey: '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      keyType: 'ethereum',
      publicKeyOrAddress: '0x1234567890abcdef1234567890abcdef12345678',
    };

    await service.saveItem({
      id: 'key-1',
      type: 'private_key',
      title: 'Deployer Private Key',
      favorite: false,
      archived: false,
      tags: ['crypto'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: keyPayload as unknown as Record<string, unknown>,
    });

    const domain = service.getDecryptedVault();
    expect(domain?.items.length).toBe(2);

    // Verify lock clears memory
    await service.lockVault();
    expect(service.getDecryptedVault()).toBeNull();
  });
});
