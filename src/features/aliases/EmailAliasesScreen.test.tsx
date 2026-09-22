import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmailAliasesScreen } from './EmailAliasesScreen';
import { useAliasStore } from '@/state/aliasStore';
import { appVaultService } from '@/application/services/AppVaultService';
import type { DecryptedVaultDomain } from '@/domain/vault/types';

describe('EmailAliasesScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    useAliasStore.setState({
      forwardingEmail: 'alex.secure@example.com',
      customAliases: [
        {
          id: 'test-alias-1',
          alias: 'burner-news-4912@duck.com',
          tag: 'Tech Newsletter',
          createdAt: new Date().toISOString(),
          notes: 'Weekly digests',
        },
      ],
    });

    vi.spyOn(appVaultService, 'getDecryptedVault').mockReturnValue({
      metadata: {
        id: 'vault-1',
        name: 'Personal Vault',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        formatVersion: 1,
        cryptoProfile: 'standard',
      },
      settings: {} as unknown as DecryptedVaultDomain['settings'],
      vaults: [],
      items: [
        {
          id: 'item-github',
          vaultId: 'vault-1',
          type: 'login',
          title: 'GitHub Login',
          favorite: false,
          archived: false,
          createdAt: '2026-02-01T00:00:00Z',
          updatedAt: '2026-02-01T00:00:00Z',
          payload: {
            username: 'github-acc-9921@duck.com',
          },
        },
      ],
      auditLog: [],
    } as unknown as DecryptedVaultDomain);
  });

  it('renders screen title and statistics cards', () => {
    render(
      <MemoryRouter>
        <EmailAliasesScreen />
      </MemoryRouter>
    );

    expect(screen.getByText('Email Aliases & Disguises')).toBeInTheDocument();
    expect(screen.getByText('Total Active Disguises')).toBeInTheDocument();
    expect(screen.getByText('Vault Account Logins')).toBeInTheDocument();
    expect(screen.getByText('Standalone Burners')).toBeInTheDocument();
  });

  it('displays the configured forwarding email destination', () => {
    render(
      <MemoryRouter>
        <EmailAliasesScreen />
      </MemoryRouter>
    );

    expect(screen.getByText('DuckDuckGo Forwarding Destination')).toBeInTheDocument();
    expect(screen.getByText('alex.secure@example.com')).toBeInTheDocument();
    expect(screen.getByText('Change Destination')).toBeInTheDocument();
  });

  it('allows editing and saving forwarding email destination', () => {
    render(
      <MemoryRouter>
        <EmailAliasesScreen />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Change Destination'));
    const input = screen.getByPlaceholderText('your-clean-email@gmail.com');
    fireEvent.change(input, { target: { value: 'new.clean@proton.me' } });
    fireEvent.click(screen.getByText('Save Destination'));

    expect(useAliasStore.getState().forwardingEmail).toBe('new.clean@proton.me');
    expect(screen.getByText('new.clean@proton.me')).toBeInTheDocument();
  });

  it('displays both vault logins and standalone burner aliases in the directory', () => {
    render(
      <MemoryRouter>
        <EmailAliasesScreen />
      </MemoryRouter>
    );

    expect(screen.getByText('github-acc-9921@duck.com')).toBeInTheDocument();
    expect(screen.getByText('GitHub Login')).toBeInTheDocument();
    expect(screen.getByText('burner-news-4912@duck.com')).toBeInTheDocument();
    expect(screen.getByText('Tech Newsletter')).toBeInTheDocument();
  });

  it('allows saving a new standalone burner disguise', () => {
    render(
      <MemoryRouter>
        <EmailAliasesScreen />
      </MemoryRouter>
    );

    const tagInput = screen.getByPlaceholderText('e.g. Netflix, Spotify, Newsletter...');
    fireEvent.change(tagInput, { target: { value: 'Reddit Account' } });

    const saveButton = screen.getByRole('button', { name: /save burner/i });
    fireEvent.click(saveButton);

    expect(screen.getByText('Reddit Account')).toBeInTheDocument();
    expect(useAliasStore.getState().customAliases).toHaveLength(2);
  });
});
