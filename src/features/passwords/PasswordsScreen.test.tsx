import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PasswordsScreen } from './PasswordsScreen';
import { appVaultService } from '@/application/services/AppVaultService';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';

describe('PasswordsScreen UI', () => {
  beforeEach(async () => {
    const repo = new DexieVaultRepository();
    await repo.delete();
    await appVaultService.createVault({
      vaultName: 'UI Test Vault',
      masterPassword: 'StrongPassword123!',
    });
  });

  it('should render empty state when no passwords are in the vault', () => {
    render(
      <MemoryRouter>
        <PasswordsScreen />
      </MemoryRouter>
    );

    expect(screen.getByText('Passwords & Logins')).toBeInTheDocument();
    expect(screen.getByText('No passwords in vault yet')).toBeInTheDocument();
  });

  it('should render password items when populated in decrypted vault', async () => {
    await appVaultService.saveItem({
      id: 'test-1',
      type: 'login',
      title: 'GitHub Dev',
      favorite: true,
      archived: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: {
        username: 'alice_github',
        password: 'Password123!',
        urls: ['https://github.com'],
      },
    });

    render(
      <MemoryRouter>
        <PasswordsScreen />
      </MemoryRouter>
    );

    expect(screen.getAllByText('GitHub Dev').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('alice_github').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('github.com')).toBeInTheDocument();
  });
});
