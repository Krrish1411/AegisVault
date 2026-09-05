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
});
