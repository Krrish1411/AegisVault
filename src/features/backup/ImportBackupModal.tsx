import * as React from 'react';
import { Upload, Lock, FileArchive, Check, ShieldAlert } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';

export interface ImportBackupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export function ImportBackupModal({
  open,
  onOpenChange,
  onImported,
}: ImportBackupModalProps) {
  const addToast = useUiStore((state) => state.addToast);

  const [backupFile, setBackupFile] = React.useState<File | null>(null);
  const [fileContent, setFileContent] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState('');
  const [mode, setMode] = React.useState<'replace' | 'merge'>('merge');
  const [isImporting, setIsImporting] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (open) {
      setBackupFile(null);
      setFileContent(null);
      setPassword('');
      setMode('merge');
      setError(undefined);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupFile(file);
    setError(undefined);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileContent) {
      setError('Please select a valid .aegisvault backup file');
      return;
    }
    if (!password) {
      setError('Please enter the backup decryption password');
      return;
    }

    setIsImporting(true);
    setError(undefined);

    try {
      await appVaultService.importVault(fileContent, password, mode);

      addToast({
        title: 'Vault Imported Successfully',
        description:
          mode === 'replace'
            ? 'Vault has been replaced with imported backup.'
            : 'Imported items merged into your active vault.',
        variant: 'success',
      });

      onImported();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Import Encrypted Backup"
      description="Restore an encrypted .aegisvault backup file. Your active vault is preserved until imported data is fully verified."
    >
      <form onSubmit={handleImport} className="space-y-4 pt-2">
        {/* File Selector */}
        <div className="space-y-1">
          <label htmlFor="backup-file-input" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <FileArchive className="h-3.5 w-3.5 text-accent" />
            <span>Select Backup File (.aegisvault or .json)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id="backup-file-input"
              type="file"
              accept=".aegisvault,.json"
              onChange={handleFileChange}
              disabled={isImporting}
              className="block w-full text-xs text-text-muted file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-surface-subtle file:text-text-primary hover:file:bg-border cursor-pointer"
            />
          </div>
          {backupFile && (
            <p className="text-[11px] text-text-secondary font-mono pt-1">
              Selected: {backupFile.name} ({(backupFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="import-password" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-accent" />
            <span>Backup Password</span>
          </label>
          <SecretInput
            id="import-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password used to encrypt this backup..."
            disabled={isImporting}
            allowCopy={false}
          />
        </div>

        {/* Mode Selector */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-medium text-text-secondary">Import Strategy</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode('merge')}
              className={`p-3 rounded-lg border text-left transition-all ${
                mode === 'merge'
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-border bg-surface-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span>Merge Items</span>
                {mode === 'merge' && <Check className="h-3.5 w-3.5" />}
              </div>
              <p className="text-[10px] font-normal text-text-muted">
                Add non-duplicate items while preserving existing entries.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('replace')}
              className={`p-3 rounded-lg border text-left transition-all ${
                mode === 'replace'
                  ? 'border-danger bg-danger/10 text-danger font-semibold'
                  : 'border-border bg-surface-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span>Replace Vault</span>
                {mode === 'replace' && <Check className="h-3.5 w-3.5" />}
              </div>
              <p className="text-[10px] font-normal text-text-muted">
                Overwrite active vault items with the backup contents.
              </p>
            </button>
          </div>
        </div>

        {mode === 'replace' && (
          <div className="flex items-center gap-2 p-2 rounded bg-danger/10 border border-danger/20 text-danger text-[11px]">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Warning: Replacing your vault will overwrite your current items.</span>
          </div>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            isLoading={isImporting}
            disabled={isImporting || !fileContent || !password}
            className="gap-1.5 text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Decrypt & Import</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
