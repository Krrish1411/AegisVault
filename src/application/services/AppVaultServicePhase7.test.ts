import { describe, it, expect, beforeEach } from 'vitest';
import { AppVaultService } from './AppVaultService';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';
import { useSessionStore } from '@/state/sessionStore';
import type { SecureNotePayload } from '@/domain/vault/types';

describe('AppVaultService Phase 7 (Documents, Attachments & Secure Notes)', () => {
  let repository: DexieVaultRepository;
  let service: AppVaultService;

  beforeEach(async () => {
    repository = new DexieVaultRepository();
    await repository.delete();
    service = new AppVaultService(repository);
    useSessionStore.getState().reset();
  });

  it('should encrypt, retrieve, and delete binary file attachments', async () => {
    await service.createVault({
      vaultName: 'Document Vault',
      masterPassword: 'MasterPassword123!',
    });

    const fileContent = new TextEncoder().encode('Confidential Contract PDF Bytes 9999');
    const attachment = await service.addAttachment({
      filename: 'contract.pdf',
      mediaType: 'application/pdf',
      data: fileContent,
    });

    expect(attachment.id).toBeDefined();
    expect(attachment.filename).toBe('contract.pdf');
    expect(attachment.sizeBytes).toBe(fileContent.byteLength);

    // Verify manifest metadata
    const domain = service.getDecryptedVault();
    expect(domain?.attachments.length).toBe(1);
    expect(domain?.attachments[0]?.id).toBe(attachment.id);

    // Retrieve and decrypt
    const decrypted = await service.getDecryptedAttachment(attachment.id);
    expect(decrypted.metadata.filename).toBe('contract.pdf');
    expect(new TextDecoder().decode(decrypted.data)).toBe('Confidential Contract PDF Bytes 9999');

    // Delete attachment
    await service.deleteAttachment(attachment.id);
    const domainAfterDelete = service.getDecryptedVault();
    expect(domainAfterDelete?.attachments.length).toBe(0);
    await expect(service.getDecryptedAttachment(attachment.id)).rejects.toThrow();
  });

  it('should encrypt and persist Secure Notes with markdown and interactive checklists', async () => {
    await service.createVault({
      vaultName: 'Notes Vault',
      masterPassword: 'MasterPassword123!',
    });

    const notePayload: SecureNotePayload = {
      content: '# Master Server Setup\n\n1. Enable Firewall\n2. Configure SSH keys',
      isMarkdown: true,
      checklist: [
        { id: 'c1', text: 'Enable 2FA', checked: true },
        { id: 'c2', text: 'Backup recovery phrase', checked: false },
      ],
    };

    await service.saveItem({
      id: 'note-1',
      type: 'secure_note',
      title: 'Server Deployment Notes',
      favorite: true,
      archived: false,
      tags: ['devops', 'security'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: notePayload as unknown as Record<string, unknown>,
    });

    const domain = service.getDecryptedVault();
    expect(domain?.items.length).toBe(1);
    const item = domain?.items[0];
    expect(item?.type).toBe('secure_note');
    const payload = item?.payload as unknown as SecureNotePayload;
    expect(payload.checklist?.length).toBe(2);
    expect(payload.checklist?.[0]?.checked).toBe(true);

    // Lock vault wipes memory
    await service.lockVault();
    expect(service.getDecryptedVault()).toBeNull();
  });
});
