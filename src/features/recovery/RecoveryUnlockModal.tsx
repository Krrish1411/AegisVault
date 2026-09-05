import * as React from 'react';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { validateRecoveryPhrase, normalizeRecoveryPhrase } from '@/security/crypto/bip39';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';

export interface RecoveryUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecovered: () => void;
}

export function RecoveryUnlockModal({
  open,
  onOpenChange,
  onRecovered,
}: RecoveryUnlockModalProps) {
  const addToast = useUiStore((state) => state.addToast);

  const [phrase, setPhrase] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isRecovering, setIsRecovering] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (open) {
      setPhrase('');
      setNewPassword('');
      setConfirmPassword('');
      setError(undefined);
    }
  }, [open]);

  const wordCount = React.useMemo(() => {
    const trimmed = phrase.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [phrase]);

  const isValidPhrase = React.useMemo(() => {
    return validateRecoveryPhrase(phrase);
  }, [phrase]);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeRecoveryPhrase(phrase);

    if (!isValidPhrase) {
      setError('Invalid 24-word recovery phrase. Please check for spelling mistakes or missing words.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New master password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsRecovering(true);
    setError(undefined);

    try {
      await appVaultService.recoverVault({
        recoveryPhrase: normalized,
        newMasterPassword: newPassword,
      });

      addToast({
        title: 'Vault Recovered',
        description: 'Your vault has been decrypted and re-wrapped with your new master password.',
        variant: 'success',
      });

      onRecovered();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery failed');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Unlock with Recovery Phrase"
      description="Enter your 24-word BIP39 emergency recovery phrase and establish a new master password."
    >
      <form onSubmit={handleRecover} className="space-y-4 pt-2">
        {/* Recovery Phrase Textarea */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="recovery-phrase-input" className="font-medium text-text-secondary flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-accent" />
              <span>24-Word Recovery Phrase</span>
            </label>
            <span className={`text-[11px] font-mono ${wordCount === 24 ? 'text-success font-semibold' : 'text-text-muted'}`}>
              {wordCount}/24 words {isValidPhrase && '✓ Valid Checksum'}
            </span>
          </div>
          <textarea
            id="recovery-phrase-input"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="paste your twenty four recovery words separated by spaces..."
            rows={4}
            disabled={isRecovering}
            className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:opacity-50"
            required
            autoFocus
          />
        </div>

        {/* New Master Password */}
        <div className="space-y-1">
          <label htmlFor="recovery-new-password" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>New Master Password</span>
          </label>
          <SecretInput
            id="recovery-new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Choose new master password..."
            disabled={isRecovering}
            allowCopy={false}
          />
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1">
          <label htmlFor="recovery-confirm-password" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>Confirm New Password</span>
          </label>
          <SecretInput
            id="recovery-confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new master password..."
            disabled={isRecovering}
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
            disabled={isRecovering}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            isLoading={isRecovering}
            disabled={isRecovering || !isValidPhrase || !newPassword}
            className="gap-1.5 text-xs"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Recover & Reset Password</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
