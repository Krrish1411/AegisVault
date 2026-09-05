import * as React from 'react';
import { Share2, Lock, Shield } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { exportSharingPackage, type SharingRole } from '@/domain/sharing/sharingEngine';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';
import type { VaultItemEnvelope } from '@/domain/vault/types';

export interface ExportShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems?: readonly VaultItemEnvelope[];
}

export function ExportShareModal({
  open,
  onOpenChange,
  selectedItems,
}: ExportShareModalProps) {
  const addToast = useUiStore((s) => s.addToast);

  const [scope, setScope] = React.useState<'full' | 'selected'>('full');
  const [passphrase, setPassphrase] = React.useState('');
  const [confirmPassphrase, setConfirmPassphrase] = React.useState('');
  const [role, setRole] = React.useState<SharingRole>('member');
  const [isExporting, setIsExporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const decryptedVault = appVaultService.getDecryptedVault();

  const itemsToExport = React.useMemo(() => {
    if (!decryptedVault) return [];
    if (scope === 'selected' && selectedItems && selectedItems.length > 0) {
      return selectedItems;
    }
    return decryptedVault.items;
  }, [decryptedVault, scope, selectedItems]);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.length < 8) {
      setError('Sharing passphrase must be at least 8 characters');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }
    if (itemsToExport.length === 0) {
      setError('No items available to export');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const packageJson = await exportSharingPackage(
        itemsToExport,
        decryptedVault?.folders ?? [],
        passphrase,
        {
          packageType: scope === 'full' ? 'full_vault' : 'items',
          role,
        }
      );

      const blob = new Blob([packageJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aegisvault-share-${new Date().toISOString().slice(0, 10)}.aegispkg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast({
        title: 'Package Exported',
        description: `Exported ${itemsToExport.length} items securely. Share the file and passphrase out-of-band.`,
        variant: 'success',
      });

      setPassphrase('');
      setConfirmPassphrase('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Export Encrypted Sharing Package"
      description="Create an encrypted .aegispkg bundle with an independent sharing password. Your master password is never exposed."
    >
      <form onSubmit={handleExport} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary">Export Scope</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope('full')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                scope === 'full'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Full Vault ({decryptedVault?.items.length ?? 0} items)</span>
            </button>

            <button
              type="button"
              onClick={() => setScope('selected')}
              disabled={!selectedItems || selectedItems.length === 0}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                scope === 'selected'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-surface text-text-secondary hover:text-text-primary disabled:opacity-40'
              }`}
            >
              <Share2 className="h-4 w-4" />
              <span>Selected ({selectedItems?.length ?? 0} items)</span>
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary">Recipient Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as SharingRole)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="member">Member (Can use and edit items)</option>
            <option value="view_only">View Only (Read-only access)</option>
            <option value="admin">Admin (Full administrative access)</option>
            <option value="restricted">Restricted (Minimal access)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary">
            Independent Sharing Passphrase (Min 8 chars)
          </label>
          <SecretInput
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Passphrase for decrypting this package..."
            disabled={isExporting}
            allowCopy={false}
          />
          <p className="text-[10px] text-text-muted">
            Do NOT use your AegisVault master password. Create a unique one-time passphrase.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary">Confirm Sharing Passphrase</label>
          <Input
            type="password"
            value={confirmPassphrase}
            onChange={(e) => setConfirmPassphrase(e.target.value)}
            placeholder="Confirm passphrase..."
            disabled={isExporting}
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
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
            variant="default"
            size="sm"
            disabled={isExporting || passphrase.length < 8}
            className="gap-1.5"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{isExporting ? 'Encrypting...' : 'Export Package (.aegispkg)'}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
