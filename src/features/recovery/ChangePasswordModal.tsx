import * as React from 'react';
import { Lock, KeyRound, Check } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';

export interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const addToast = useUiStore((state) => state.addToast);

  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isChanging, setIsChanging] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (open) {
      setNewPassword('');
      setConfirmPassword('');
      setError(undefined);
    }
  }, [open]);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsChanging(true);
    setError(undefined);

    try {
      await appVaultService.changeMasterPassword(newPassword);

      addToast({
        title: 'Master Password Updated',
        description: 'Your Vault Encryption Key has been re-wrapped with your new password.',
        variant: 'success',
      });

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Change Master Password"
      description="Re-wraps your Vault Encryption Key with a fresh Argon2id password-derived key. Your stored items and data are securely preserved."
    >
      <form onSubmit={handleChange} className="space-y-4 pt-2">
        <div className="space-y-1">
          <label htmlFor="new-master-password" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            <span>New Master Password</span>
          </label>
          <SecretInput
            id="new-master-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new master password..."
            disabled={isChanging}
            allowCopy={false}
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirm-new-master-password" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>Confirm New Password</span>
          </label>
          <SecretInput
            id="confirm-new-master-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new master password..."
            disabled={isChanging}
            allowCopy={false}
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isChanging}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            isLoading={isChanging}
            disabled={isChanging || !newPassword}
            className="gap-1.5 text-xs"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Update Password</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
