import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotesScreen } from './NotesScreen';
import { appVaultService } from '@/application/services/AppVaultService';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';

describe('NotesScreen UI with Folder Sidebar and 2-Way Linking', () => {
  beforeEach(async () => {
    const repo = new DexieVaultRepository();
    await repo.delete();
    await appVaultService.createVault({
      vaultName: 'Notes Test Vault',
      masterPassword: 'StrongPassword123!',
    });
  });

  it('should render header, sidebar filters, and empty state when no notes exist', () => {
    render(
      <MemoryRouter>
        <NotesScreen />
      </MemoryRouter>
    );

    expect(screen.getByText('Secure Notes')).toBeInTheDocument();
    expect(screen.getByText('All Notes')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText('Unorganized')).toBeInTheDocument();
    expect(screen.getByText('No notes in this view')).toBeInTheDocument();
  });

  it('should render folders and folder notes in sidebar dropdown and main grid', async () => {
    const folder = await appVaultService.createFolder('Work Projects');

    // Create a password item to link
    const pwdItem = {
      id: 'pwd-101',
      type: 'login' as const,
      title: 'Company AWS Portal',
      favorite: false,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: { username: 'admin@company.com' },
    };
    await appVaultService.saveItem(pwdItem);

    // Create a note in the folder linked to the password
    await appVaultService.saveItem({
      id: 'note-201',
      type: 'secure_note',
      title: 'AWS Root Recovery Keys',
      favorite: true,
      archived: false,
      folderId: folder.id,
      linkedItemIds: ['pwd-101'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: {
        content: 'Emergency procedure for recovering root IAM credentials.',
        checklist: [{ id: 'chk-1', text: 'Notify CISO', checked: true }],
      },
    });

    render(
      <MemoryRouter>
        <NotesScreen />
      </MemoryRouter>
    );

    // Folder and Note should be rendered
    expect(screen.getAllByText('Work Projects').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('AWS Root Recovery Keys').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Company AWS Portal')).toBeInTheDocument();
  });
});
