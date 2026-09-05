import * as React from 'react';
import { ArrowUpCircle } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { Badge } from '@/ui/primitives/Badge';
import { upgradeVaultKdfParams } from '@/domain/migration/migrationEngine';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';
import { useUiStore } from '@/state/uiStore';
import type { KdfParams } from '@/security/crypto/types';

export interface VaultUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VaultUpgradeModal({
  open,
  onOpenChange,
}: VaultUpgradeModalProps) {
  const addToast = useUiStore((s) => s.addToast);

  const [password, setPassword] = React.useState('');
  const [selectedProfile, setSelectedProfile] = React.useState<'standard' | 'high' | 'maximum'>('high');
  const [isUpgrading, setIsUpgrading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsUpgrading(true);
    setError(null);

    try {
      const repository = new DexieVaultRepository();
      const container = await repository.read();
      if (!container) {
        throw new Error('No encrypted vault container found');
      }

      const memoryCost =
        selectedProfile === 'maximum'
          ? 134217728 // 128 MB
          : selectedProfile === 'high'
            ? 67108864 // 64 MB
            : 33554432; // 32 MB

      const newParams: KdfParams = {
        algorithm: 'argon2id',
        memoryCost,
        timeCost: 3,
        parallelism: 1,
      };

      const upgradedContainer = await upgradeVaultKdfParams(
        container,
        password,
        newParams
      );

      await repository.replaceAtomically(upgradedContainer);

      addToast({
        title: 'KDF Parameters Upgraded',
        description: `Upgraded Argon2id KDF to ${(memoryCost / (1024 * 1024)).toFixed(0)} MB memory cost. Vault key re-wrapped with zero data loss.`,
        variant: 'success',
      });

      setPassword('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Upgrade Vault Cryptographic Parameters"
      description="Strengthen Argon2id key derivation parameters without re-encrypting your vault items."
    >
      <form onSubmit={handleUpgrade} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-md">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-border bg-surface-subtle p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">Current Cryptographic Profile</span>
            <Badge variant="accent">Argon2id + XChaCha20</Badge>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Zero-payload re-wrapping allows upgrading KDF memory parameters instantly while preserving your existing encrypted records intact.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary">Target Security Profile</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'standard', name: 'Standard', desc: '32 MB / 2 iter' },
              { id: 'high', name: 'High (Rec)', desc: '64 MB / 3 iter' },
              { id: 'maximum', name: 'Maximum', desc: '128 MB / 3 iter' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProfile(p.id as typeof selectedProfile)}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  selectedProfile === p.id
                    ? 'border-accent bg-accent/10 text-accent font-semibold'
                    : 'border-border bg-surface text-text-secondary hover:text-text-primary'
                }`}
              >
                <div className="text-xs">{p.name}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary">Master Passphrase Verification</label>
          <SecretInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Confirm master passphrase to re-wrap key..."
            disabled={isUpgrading}
            allowCopy={false}
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isUpgrading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={!password || isUpgrading}
            className="gap-1.5"
          >
            <ArrowUpCircle className="h-3.5 w-3.5" />
            <span>{isUpgrading ? 'Upgrading KDF...' : 'Apply KDF Upgrade'}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
