import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SecurityCenterScreen } from './SecurityCenterScreen';
import { appVaultService } from '@/application/services/AppVaultService';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';

describe('SecurityCenterScreen UI', () => {
  beforeEach(async () => {
    const repo = new DexieVaultRepository();
    await repo.delete();
    await appVaultService.createVault({
      vaultName: 'Audit Test Vault',
      masterPassword: 'MasterPassword123!',
    });
  });

  it('should render Security Center dashboard with score metrics and system status', () => {
    render(<SecurityCenterScreen />);

    expect(screen.getByText('Security Center')).toBeInTheDocument();
    expect(screen.getByText('Re-Scan Vault')).toBeInTheDocument();
    expect(screen.getByText('Export Backup')).toBeInTheDocument();
    expect(screen.getByText(/Optimal Security Posture|Action Required/i)).toBeInTheDocument();
  });

  it('should render consolidated merged cards for accounts with multiple security findings', async () => {
    await appVaultService.saveItem({
      id: 'login-1',
      type: 'login',
      title: 'Google Personal',
      favorite: false,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: {
        username: 'user@example.com',
        password: 'password123',
      },
    });

    await appVaultService.saveItem({
      id: 'login-2',
      type: 'login',
      title: 'GitHub Work',
      favorite: false,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: {
        username: 'work@company.com',
        password: 'password123', // Reused & Weak
      },
    });

    render(<SecurityCenterScreen />);

    // Should find the merged cards for Google Personal and GitHub Work
    expect(await screen.findByText('Google Personal')).toBeInTheDocument();
    expect(screen.getByText('GitHub Work')).toBeInTheDocument();

    // The cards should display multiple warnings inside the single merged card
    expect(screen.getAllByText(/Fix Credential/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Common Password|Predictable Structure|Reused Password/i).length).toBeGreaterThanOrEqual(2);
  });
});
