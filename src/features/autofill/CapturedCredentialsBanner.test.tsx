import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CapturedCredentialsBanner } from './CapturedCredentialsBanner';
import { appVaultService } from '@/application/services/AppVaultService';
import { useSessionStore } from '@/state/sessionStore';

vi.mock('@/application/services/AppVaultService', () => ({
  appVaultService: {
    getCapturedCredentials: vi.fn(),
    dismissCapturedCredential: vi.fn(),
    getVaultRecords: vi.fn(() => [{ id: 'vault-personal', name: 'Personal Vault' }]),
    saveItem: vi.fn(),
  },
}));

describe('CapturedCredentialsBanner UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({ status: 'unlocked' });
  });

  it('renders nothing when there are no captured credentials', async () => {
    vi.mocked(appVaultService.getCapturedCredentials).mockResolvedValue([]);
    const { container } = render(<CapturedCredentialsBanner />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders alert banner with captured website and email when credentials exist', async () => {
    vi.mocked(appVaultService.getCapturedCredentials).mockResolvedValue([
      {
        id: 'cap-1',
        domain: 'github.com',
        packageId: '',
        title: 'GitHub',
        username: 'user-shadow@duck.com',
        password: 'securePassword123!',
        createdAt: Date.now(),
      },
    ]);

    render(<CapturedCredentialsBanner />);

    await waitFor(() => {
      expect(screen.getByText('Captured Login Found:')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('(user-shadow@duck.com)')).toBeInTheDocument();
      expect(screen.getByText('Review & Save')).toBeInTheDocument();
    });
  });

  it('calls dismissCapturedCredential when dismiss button is clicked', async () => {
    vi.mocked(appVaultService.getCapturedCredentials).mockResolvedValue([
      {
        id: 'cap-99',
        domain: 'duckduckgo.com',
        packageId: '',
        title: 'DuckDuckGo',
        username: 'test@duck.com',
        password: 'pwd',
        createdAt: Date.now(),
      },
    ]);

    render(<CapturedCredentialsBanner />);

    await waitFor(() => {
      expect(screen.getByLabelText('Dismiss captured login')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Dismiss captured login'));

    await waitFor(() => {
      expect(appVaultService.dismissCapturedCredential).toHaveBeenCalledWith('cap-99');
    });
  });
});
