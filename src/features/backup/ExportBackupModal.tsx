import * as React from 'react';
import { Download, Lock, FileArchive } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';

export interface ExportBackupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportBackupModal({ open, onOpenChange }: ExportBackupModalProps) {
  const addToast = useUiStore((state) => state.addToast);

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isExporting, setIsExporting] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (open) {
      setPassword('');
      setConfirmPassword('');
      setError(undefined);
    }
  }, [open]);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter a password to encrypt this backup file');
      return;
    }
    if (password.length < 8) {
      setError('Backup password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsExporting(true);
    setError(undefined);

    try {
      const backupJson = await appVaultService.exportVault(password);

      // Trigger file download
      const blob = new Blob([backupJson], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aegisvault-backup-${new Date().toISOString().slice(0, 10)}.aegisvault`;
      link.click();
      URL.revokeObjectURL(url);

      addToast({
        title: 'Backup Exported Successfully',
        description: 'Encrypted backup (.aegisvault) downloaded. Store in a safe location.',
        variant: 'success',
      });

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export backup');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Export Encrypted Backup"
      description="Create a standalone encrypted .aegisvault backup file protected by Argon2id and XChaCha20-Poly1305."
    >
      <form onSubmit={handleExport} className="space-y-4 pt-2">
        <div className="rounded-lg border border-border bg-surface-subtle p-3 text-xs text-text-secondary flex items-start gap-2.5">
          <FileArchive className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p>
            This backup file is encrypted end-to-end. It cannot be opened or decrypted without the backup password specified below.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="backup-password" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-accent" />
            <span>Backup Password</span>
          </label>
          <SecretInput
            id="backup-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose password to encrypt backup..."
            disabled={isExporting}
            allowCopy={false}
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="backup-confirm-password" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-accent" />
            <span>Confirm Backup Password</span>
          </label>
          <SecretInput
            id="backup-confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter backup password..."
            disabled={isExporting}
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
            disabled={isExporting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            isLoading={isExporting}
            disabled={isExporting || !password}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Encrypt & Download</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
