import * as React from 'react';
import {
  Shield,
  Layers,
  Plus,
  Check,
  ChevronDown,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { cn } from '@/lib/utils';
import type { VaultRecord } from '@/domain/vault/types';

export function VaultSwitcher() {
  const [open, setOpen] = React.useState(false);
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [newVaultName, setNewVaultName] = React.useState('');
  const [newVaultColor, setNewVaultColor] = React.useState('#6d4aff');
  const [isCreating, setIsCreating] = React.useState(false);
  const [vaultToDelete, setVaultToDelete] = React.useState<VaultRecord | null>(null);
  const [isDeletingVault, setIsDeletingVault] = React.useState(false);

  const activeVaultId = useUiStore((s) => s.activeVaultId);
  const setActiveVaultId = useUiStore((s) => s.setActiveVaultId);
  const addToast = useUiStore((s) => s.addToast);
  const vaultRevision = useUiStore((s) => s.vaultRevision);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const decryptedVault = React.useMemo(() => {
    void vaultRevision;
    return appVaultService.getDecryptedVault();
  }, [vaultRevision]);

  const vaults = React.useMemo(() => {
    void vaultRevision;
    return appVaultService.getVaultRecords();
  }, [vaultRevision]);

  const items = decryptedVault?.items ?? [];

  const activeVault = vaults.find((v) => v.id === activeVaultId);

  // Click outside listener
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultName.trim()) return;
    setIsCreating(true);
    try {
      const created = await appVaultService.createVaultRecord({
        name: newVaultName.trim(),
        color: newVaultColor,
      });
      addToast({
        title: 'Vault Created',
        description: `Created new vault "${created.name}".`,
        variant: 'success',
      });
      setActiveVaultId(created.id);
      setNewVaultName('');
      setShowNewModal(false);
    } catch (err) {
      addToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create vault',
        variant: 'danger',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteVault = async () => {
    if (!vaultToDelete) return;
    setIsDeletingVault(true);
    try {
      await appVaultService.deleteVaultRecord(vaultToDelete.id);
      if (activeVaultId === vaultToDelete.id) {
        setActiveVaultId('vault-personal');
      }
      addToast({
        title: 'Vault Deleted',
        description: `Vault "${vaultToDelete.name}" deleted. Items reassigned to Personal Vault.`,
        variant: 'default',
      });
      setVaultToDelete(null);
    } catch (err) {
      addToast({
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Failed to delete vault',
        variant: 'danger',
      });
    } finally {
      setIsDeletingVault(false);
    }
  };

  const getVaultCount = (vId: string) => {
    return items.filter((i) => i.vaultId === vId || (!i.vaultId && vId === 'vault-personal')).length;
  };

  const colors = [
    { label: 'Violet', value: '#6d4aff' },
    { label: 'Indigo', value: '#5865f2' },
    { label: 'Emerald', value: '#12855a' },
    { label: 'Amber', value: '#d97706' },
    { label: 'Rose', value: '#dc2626' },
    { label: 'Sky', value: '#0284c7' },
    { label: 'Pink', value: '#ec4899' },
  ];

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Proton Pass Style Vault Selector Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-2 rounded-xl border border-line bg-card hover:bg-moss/80 hover:border-accent/40 text-ink transition-all shadow-xs cursor-pointer select-none active:scale-[0.98]"
        aria-label="Switch Vault"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold shrink-0 shadow-xs transition-transform"
            style={{ backgroundColor: activeVaultId === 'all' ? 'var(--accent)' : (activeVault?.color ?? '#6d4aff') }}
          >
            {activeVaultId === 'all' ? <Layers className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
          </div>
          <div className="text-left min-w-0 truncate">
            <div className="text-xs font-bold leading-tight truncate text-ink">
              {activeVaultId === 'all' ? 'All Vaults' : activeVault?.name ?? 'Personal Vault'}
            </div>
            <div className="text-[10.5px] text-ink/50 font-mono leading-tight truncate">
              {activeVaultId === 'all' ? `${items.length} items total` : `${getVaultCount(activeVaultId)} items`}
            </div>
          </div>
        </div>
        <ChevronDown
          className={cn('h-4 w-4 text-ink/40 transition-transform duration-200 shrink-0 ml-1', open && 'rotate-180')}
        />
      </button>

      {/* Proton Pass Style Dropdown Popover */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl border border-line bg-card p-1.5 shadow-modal backdrop-blur-md anim-pop">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink/40 font-mono flex items-center justify-between">
            <span>Vaults</span>
            <span>{vaults.length} Total</span>
          </div>

          {/* Option: All Vaults */}
          <button
            type="button"
            onClick={() => {
              setActiveVaultId('all');
              setOpen(false);
            }}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer active:scale-[0.98]',
              activeVaultId === 'all'
                ? 'bg-accent/15 text-accent font-bold border border-accent/25 shadow-xs'
                : 'text-ink/80 hover:bg-moss hover:text-ink'
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/20 text-accent shrink-0">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <div className="font-semibold">All Vaults</div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-moss border border-line/60 text-ink/60">
                {items.length}
              </span>
              {activeVaultId === 'all' && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
            </div>
          </button>

          <div className="my-1 border-t border-line/60" />

          {/* Individual Vaults List */}
          <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-0.5">
            {vaults.map((vault) => {
              const isSelected = activeVaultId === vault.id;
              const count = getVaultCount(vault.id);
              const isDeletable = !vault.isDefault && vault.id !== 'vault-personal';

              return (
                <div
                  key={vault.id}
                  onClick={() => {
                    setActiveVaultId(vault.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer active:scale-[0.98]',
                    isSelected
                      ? 'bg-accent/15 text-accent font-bold border border-accent/25 shadow-xs'
                      : 'text-ink/80 hover:bg-moss hover:text-ink'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-md text-white font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: vault.color ?? '#6d4aff' }}
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </div>
                    <span className="truncate font-medium">{vault.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] shrink-0 ml-2">
                    <span className="px-1.5 py-0.5 rounded bg-moss border border-line/60 text-ink/60">
                      {count}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
                    {isDeletable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen(false);
                          setVaultToDelete(vault);
                        }}
                        className="p-1 rounded hover:bg-danger/10 text-ink/30 hover:text-danger transition-colors cursor-pointer ml-1"
                        title="Delete vault"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="my-1 border-t border-line/60" />

          {/* Create New Vault Button */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setShowNewModal(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-accent font-semibold hover:bg-accent/10 transition-colors cursor-pointer active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Vault</span>
          </button>
        </div>
      )}

      {/* Modal for creating a new vault */}
      <Dialog
        open={showNewModal}
        onOpenChange={setShowNewModal}
        title="Create New Vault"
        description="Protected automatically by your unified Master Password. No separate passwords required."
        size="md"
      >
        <form onSubmit={handleCreateVault} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink/75">Vault Name</label>
            <Input
              placeholder="e.g. Work & Clients, Finances, Crypto..."
              value={newVaultName}
              onChange={(e) => setNewVaultName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink/75">Vault Accent Color</label>
            <div className="flex items-center gap-2 pt-1">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setNewVaultColor(c.value)}
                  className={cn(
                    'h-7 w-7 rounded-xl border-2 transition-transform cursor-pointer shadow-xs',
                    newVaultColor === c.value
                      ? 'scale-110 border-ink ring-2 ring-accent/40'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 flex items-start gap-2.5 text-xs text-ink/80">
            <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              All items in this vault are encrypted with your zero-knowledge Master Password. You never need to manage multiple passwords.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isCreating}>
              Create Vault
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal for deleting a vault */}
      <Dialog
        open={!!vaultToDelete}
        onOpenChange={(isOpen) => !isOpen && setVaultToDelete(null)}
        title={`Delete Vault "${vaultToDelete?.name}"?`}
        description="Any items and credentials currently in this vault will be safely reassigned to your primary Personal Vault. The vault container itself will be removed."
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVaultToDelete(null)}
            disabled={isDeletingVault}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={isDeletingVault}
            onClick={handleDeleteVault}
          >
            Delete Vault
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
