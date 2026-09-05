import { describe, it, expect, beforeAll } from 'vitest';
import { generateDemoVaultItems, DEMO_FOLDERS, DEMO_ATTACHMENTS } from './demoVaultData';
import { seedActiveVaultWithDemoData } from './demoSeeder';
import { SodiumCryptoProvider } from '@/security/crypto/SodiumCryptoProvider';

describe('demoVaultData & demoSeeder (150+ Realistic Demo Entries)', () => {
  const crypto = new SodiumCryptoProvider();

  beforeAll(async () => {
    await crypto.init();
  });

  it('should generate at least 150 unique realistic records across all categories', () => {
    const items = generateDemoVaultItems();
    expect(items.length).toBeGreaterThanOrEqual(150);

    const ids = new Set(items.map((i) => i.id));
    expect(ids.size).toBe(items.length); // All IDs must be unique

    const categories = new Set(items.map((i) => i.type));
    expect(categories.has('login')).toBe(true);
    expect(categories.has('credit_card')).toBe(true);
    expect(categories.has('debit_card')).toBe(true);
    expect(categories.has('bank_account')).toBe(true);
    expect(categories.has('upi')).toBe(true);
    expect(categories.has('pan')).toBe(true);
    expect(categories.has('aadhaar')).toBe(true);
    expect(categories.has('passport')).toBe(true);
    expect(categories.has('insurance')).toBe(true);
    expect(categories.has('emergency_contact')).toBe(true);
    expect(categories.has('secure_note')).toBe(true);
    expect(categories.has('wallet_seed')).toBe(true);
    expect(categories.has('private_key')).toBe(true);
    expect(categories.has('api_key')).toBe(true);
  });

  it('should have mock attachments and folders configured', () => {
    expect(DEMO_FOLDERS.length).toBeGreaterThanOrEqual(5);
    expect(DEMO_ATTACHMENTS.length).toBeGreaterThanOrEqual(8);
  });

  it('should seed demo data into vault and return correct counts', async () => {
    const res = await seedActiveVaultWithDemoData(crypto);
    expect(res.itemCount).toBeGreaterThanOrEqual(150);
    expect(res.folderCount).toBe(DEMO_FOLDERS.length);
    expect(res.attachmentCount).toBe(DEMO_ATTACHMENTS.length);
  });
});
