import { describe, it, expect, beforeEach } from 'vitest';
import { AppVaultService } from './AppVaultService';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';
import { useSessionStore } from '@/state/sessionStore';
import { inMemorySearchIndex } from '@/domain/organization/searchIndex';
import type { CardPayload, BankAccountPayload, PanPayload, PassportPayload } from '@/domain/vault/types';

describe('AppVaultService Phase 6 (Personal Data, Banking & Cards)', () => {
  let repository: DexieVaultRepository;
  let service: AppVaultService;

  beforeEach(async () => {
    repository = new DexieVaultRepository();
    await repository.delete();
    service = new AppVaultService(repository);
    useSessionStore.getState().reset();
  });

  it('should encrypt and persist Credit Cards with masked fields and full recovery', async () => {
    await service.createVault({
      vaultName: 'Financial Vault',
      masterPassword: 'MasterPassword123!',
    });

    const cardPayload: CardPayload = {
      cardholderName: 'JOHN DOE',
      cardNumber: '4111 2222 3333 4444',
      expiryMonth: '12',
      expiryYear: '2028',
      cvv: '999',
      pin: '1234',
      cardType: 'visa',
    };

    await service.saveItem({
      id: 'card-1',
      type: 'credit_card',
      title: 'Sapphire Preferred',
      favorite: true,
      archived: false,
      tags: ['travel', 'finance'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: cardPayload as unknown as Record<string, unknown>,
    });

    const domain = service.getDecryptedVault();
    expect(domain?.items.length).toBe(1);
    const item = domain?.items[0];
    expect(item?.type).toBe('credit_card');
    expect((item?.payload as unknown as CardPayload).cvv).toBe('999');

    // Verify search index includes card
    const searchResults = inMemorySearchIndex.search({ query: 'sapphire' });
    expect(searchResults.length).toBe(1);
    expect(searchResults[0]?.title).toBe('Sapphire Preferred');
  });

  it('should encrypt and persist Bank Accounts and UPI handles', async () => {
    await service.createVault({
      vaultName: 'Banking Vault',
      masterPassword: 'MasterPassword123!',
    });

    const bankPayload: BankAccountPayload = {
      bankName: 'HDFC Bank',
      accountHolderName: 'Krish Demo',
      accountNumber: '50100234567890',
      ifscCode: 'HDFC0001234',
      accountType: 'savings',
    };

    await service.saveItem({
      id: 'bank-1',
      type: 'bank_account',
      title: 'Salary Account',
      favorite: false,
      archived: false,
      tags: ['salary'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: bankPayload as unknown as Record<string, unknown>,
    });

    await service.saveItem({
      id: 'upi-1',
      type: 'upi',
      title: 'Primary UPI Handle',
      favorite: false,
      archived: false,
      tags: ['upi'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: {
        upiId: 'krish@okhdfcbank',
        linkedBank: 'HDFC Bank',
        upiPin: '123456',
      },
    });

    const domain = service.getDecryptedVault();
    expect(domain?.items.length).toBe(2);
    expect(inMemorySearchIndex.search({ query: 'HDFC' }).length).toBe(2);
  });

  it('should encrypt and persist Indian Government & International Identity records', async () => {
    await service.createVault({
      vaultName: 'Identity Vault',
      masterPassword: 'MasterPassword123!',
    });

    const panPayload: PanPayload = {
      panNumber: 'ABCDE1234F',
      fullName: 'KRISH DEMO',
      fatherName: 'FATHER DEMO',
      dateOfBirth: '1995-05-15',
    };

    await service.saveItem({
      id: 'pan-1',
      type: 'pan',
      title: 'Personal PAN Card',
      favorite: true,
      archived: false,
      tags: ['tax', 'india'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: panPayload as unknown as Record<string, unknown>,
    });

    const passportPayload: PassportPayload = {
      passportNumber: 'Z1234567',
      country: 'India',
      fullName: 'KRISH DEMO',
      expiryDate: '2032-01-01',
    };

    await service.saveItem({
      id: 'passport-1',
      type: 'passport',
      title: 'Indian Passport',
      favorite: false,
      archived: false,
      tags: ['travel'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: passportPayload as unknown as Record<string, unknown>,
    });

    const domain = service.getDecryptedVault();
    expect(domain?.items.length).toBe(2);

    // Verify lock wipes memory
    await service.lockVault();
    expect(service.getDecryptedVault()).toBeNull();
    expect(inMemorySearchIndex.search({ query: 'ABCDE1234F' }).length).toBe(0);
  });
});
