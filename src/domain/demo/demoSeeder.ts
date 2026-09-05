import { appVaultService } from '@/application/services/AppVaultService';
import { SodiumCryptoProvider, cryptoProvider } from '@/security/crypto/SodiumCryptoProvider';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';
import {
  DEMO_FOLDERS,
  DEMO_ATTACHMENTS,
  generateDemoVaultItems,
} from './demoVaultData';
import { logger } from '@/lib/logger';

/**
 * Generates dummy binary content for mock attachments.
 */
function createMockBinaryBlob(name: string, sizeBytes: number): Uint8Array {
  const bytes = new Uint8Array(sizeBytes);
  const header = `AegisVault Encrypted Mock Document: ${name}\nGenerated: ${new Date().toISOString()}\n---BEGIN PROTECTED BLOB---\n`;
  for (let i = 0; i < header.length && i < sizeBytes; i++) {
    bytes[i] = header.charCodeAt(i);
  }
  for (let i = header.length; i < sizeBytes; i++) {
    bytes[i] = (i * 31 + 17) % 256;
  }
  return bytes;
}

/**
 * Populates the current active unlocked vault with the 150+ realistic demo records,
 * folders, and fake encrypted attachments.
 */
export async function seedActiveVaultWithDemoData(
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<{ itemCount: number; attachmentCount: number; folderCount: number }> {
  await crypto.init();
  const repository = new DexieVaultRepository();
  const demoItems = generateDemoVaultItems();

  const isCreated = await appVaultService.isVaultCreated();

  if (!isCreated) {
    // 1. No vault exists: create a new demo vault and unlock it
    const demoPassword = 'DemoPassword123!';
    await appVaultService.createVault({
      vaultName: 'Krish Sharma (Personal & Work)',
      masterPassword: demoPassword,
    });
  }

  // Ensure vault is unlocked
  let decryptedVault = appVaultService.getDecryptedVault();
  if (!decryptedVault) {
    // Try unlocking with standard demo password if locked
    await appVaultService.unlockVault({ masterPassword: 'DemoPassword123!' });
    decryptedVault = appVaultService.getDecryptedVault();
  }

  if (decryptedVault) {
    // Save folders
    for (const folder of DEMO_FOLDERS) {
      try {
        await appVaultService.createFolder(folder.name);
      } catch {
        // Folder may already exist
      }
    }

    // Save attachments in Dexie
    for (const a of DEMO_ATTACHMENTS) {
      try {
        const rawBlob = createMockBinaryBlob(a.filename, a.sizeBytes);
        const nonce = crypto.randomBytes(24);
        const encrypted = crypto.aeadEncrypt({
          plaintext: rawBlob,
          key: crypto.randomBytes(32),
          nonce,
        });

        await repository.saveAttachment({
          id: a.id,
          nonce: crypto.toBase64(nonce),
          ciphertext: crypto.toBase64(encrypted.ciphertext),
          sizeBytes: a.sizeBytes,
          checksumSha256: 'mock-sha256-demo-checksum',
          updatedAt: Date.now(),
        });
      } catch {
        // Safe skip if attachment exists
      }
    }

    // Save all demo items
    for (const item of demoItems) {
      await appVaultService.saveItem(item);
    }

    logger.info('Demo records successfully seeded into vault', {
      component: 'DemoSeeder',
      itemsCount: demoItems.length,
    });
  }

  return {
    itemCount: demoItems.length,
    attachmentCount: DEMO_ATTACHMENTS.length,
    folderCount: DEMO_FOLDERS.length,
  };
}
