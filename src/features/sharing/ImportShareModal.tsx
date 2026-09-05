import * as React from 'react';
import { Upload, KeyRound, CheckCircle2 } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { Badge } from '@/ui/primitives/Badge';
import { importSharingPackage } from '@/domain/sharing/sharingEngine';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';
import type { VaultItemEnvelope, VaultFolder } from '@/domain/vault/types';

export interface ImportShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export function ImportShareModal({
  open,
  onOpenChange,
  onImportComplete,
}: ImportShareModalProps) {
  const addToast = useUiStore((s) => s.addToast);

  const [packageJson, setPackageJson] = React.useState<string | null>(null);
  const [filename, setFilename] = React.useState<string | null>(null);
  const [passphrase, setPassphrase] = React.useState('');
  const [isDecrypting, setIsDecrypting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [decryptedPackage, setDecryptedPackage] = React.useState<{
    items: VaultItemEnvelope[];
    folders: VaultFolder[];
    packageType: string;
    exportedByRole: string;
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setPackageJson(content);
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageJson || !passphrase) return;

    setIsDecrypting(true);
    setError(null);

    try {
      const result = await importSharingPackage(packageJson, passphrase);
      setDecryptedPackage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decryption failed');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCommitImport = async () => {
    if (!decryptedPackage) return;
    setIsImporting(true);
    setError(null);

    try {
      // Import items into vault
      for (const item of decryptedPackage.items) {
        await appVaultService.saveItem(item);
      }

      addToast({
        title: 'Items Imported Successfully',
        description: `Imported ${decryptedPackage.items.length} items from sharing package.`,
        variant: 'success',
      });

      setPackageJson(null);
      setFilename(null);
      setPassphrase('');
      setDecryptedPackage(null);
      onOpenChange(false);
      onImportComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import items into vault');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setPackageJson(null);
    setFilename(null);
    setPassphrase('');
    setDecryptedPackage(null);
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) handleReset();
        onOpenChange(newOpen);
      }}
      title="Import Encrypted Sharing Package"
      description="Decrypt an incoming .aegispkg bundle with the sender's sharing passphrase."
    >
      <div className="space-y-4 pt-2">
        {error && (
          <div className="p-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-md">
            {error}
          </div>
        )}

        {!decryptedPackage ? (
          <form onSubmit={handleDecrypt} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">Sharing Package (.aegispkg)</label>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-5 text-center hover:border-accent transition-colors">
                <label className="cursor-pointer space-y-1">
                  <Upload className="mx-auto h-7 w-7 text-text-muted" />
                  <div className="text-xs text-text-primary font-medium">
                    {filename ? filename : 'Click to select .aegispkg file'}
                  </div>
                  <input
                    type="file"
                    accept=".aegispkg,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {packageJson && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Package Sharing Passphrase</label>
                <SecretInput
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Passphrase provided by the sender..."
                  disabled={isDecrypting}
                  allowCopy={false}
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isDecrypting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={!packageJson || !passphrase || isDecrypting}
                className="gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>{isDecrypting ? 'Decrypting...' : 'Decrypt Package'}</span>
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface-subtle p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">Package Contents</span>
                <Badge variant="accent" className="capitalize">
                  {decryptedPackage.exportedByRole} Role
                </Badge>
              </div>
              <div className="text-xs text-text-secondary">
                Contains <strong>{decryptedPackage.items.length}</strong> items and{' '}
                <strong>{decryptedPackage.folders.length}</strong> folders.
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-border rounded-md p-2 bg-surface">
              {decryptedPackage.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-1.5 rounded text-xs bg-surface-subtle"
                >
                  <span className="font-medium text-text-primary truncate max-w-[200px]">
                    {item.title}
                  </span>
                  <Badge variant="default" className="text-[10px]">
                    {item.type.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isImporting}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleCommitImport}
                disabled={isImporting}
                className="gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{isImporting ? 'Importing...' : 'Import into Vault'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
