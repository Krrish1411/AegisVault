import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickPinModal } from './QuickPinModal';
import { appVaultService } from '@/application/services/AppVaultService';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';

describe('QuickPinModal UI', () => {
  beforeEach(async () => {
    localStorage.clear();
    const repo = new DexieVaultRepository();
    await repo.delete();
    await appVaultService.createVault({
      vaultName: 'Quick PIN Test Vault',
      masterPassword: 'MasterPassword123!',
    });
  });

  it('renders Enable Quick Device PIN modal when no PIN is set', () => {
    render(<QuickPinModal open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText('Enable Quick Device PIN')).toBeInTheDocument();
    expect(screen.getByText(/New Device PIN/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm Device PIN/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save PIN/i })).toBeInTheDocument();
  });

  it('shows error when PIN is too short or non-numeric', async () => {
    render(<QuickPinModal open={true} onOpenChange={vi.fn()} />);

    const pinInput = screen.getByLabelText(/New Device PIN/i);
    const confirmInput = screen.getByLabelText(/Confirm Device PIN/i);
    const submitBtn = screen.getByRole('button', { name: /Save PIN/i });

    fireEvent.change(pinInput, { target: { value: '12' } });
    fireEvent.change(confirmInput, { target: { value: '12' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('PIN must be between 4 and 12 digits')).toBeInTheDocument();
  });

  it('successfully configures Quick PIN and updates state', async () => {
    const onPinChanged = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <QuickPinModal open={true} onOpenChange={onOpenChange} onPinChanged={onPinChanged} />
    );

    const pinInput = screen.getByLabelText(/New Device PIN/i);
    const confirmInput = screen.getByLabelText(/Confirm Device PIN/i);
    const submitBtn = screen.getByRole('button', { name: /Save PIN/i });

    fireEvent.change(pinInput, { target: { value: '1234' } });
    fireEvent.change(confirmInput, { target: { value: '1234' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(appVaultService.hasQuickPin()).toBe(true);
      expect(onPinChanged).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
