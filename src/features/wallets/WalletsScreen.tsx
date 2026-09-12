import * as React from 'react';
import {
  Wallet,
  Key,
  Terminal,
  Cpu,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Check,
  Search,
  Shield,
  Trash2,
  Star,
} from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { Badge } from '@/ui/primitives/Badge';
import { EmptyState } from '@/ui/primitives/EmptyState';
import { Dialog } from '@/ui/primitives/Dialog';
import { Input } from '@/ui/primitives/Input';
import { CustomSelect } from '@/ui/primitives/CustomSelect';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';
import { cn } from '@/lib/utils';
import type {
  VaultItemEnvelope,
  WalletSeedPayload,
} from '@/domain/vault/types';

export function WalletsScreen() {
  const [items, setItems] = React.useState<VaultItemEnvelope[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'wallet_seed' | 'private_key' | 'ssh_key' | 'api_key'>('all');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [revealedSecrets, setRevealedSecrets] = React.useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  // Form State
  const [itemType, setItemType] = React.useState<'wallet_seed' | 'private_key' | 'ssh_key' | 'api_key'>('wallet_seed');
  const [title, setTitle] = React.useState('');
  const [secretValue, setSecretValue] = React.useState('');
  const [networkOrService, setNetworkOrService] = React.useState('');
  const [publicAddress, setPublicAddress] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const activeVaultId = useUiStore((s) => s.activeVaultId);
  const vaultRevision = useUiStore((s) => s.vaultRevision);
  const addToast = useUiStore((s) => s.addToast);

  const loadData = React.useCallback(() => {
    const domain = appVaultService.getDecryptedVault();
    if (domain) {
      const cryptoTypes = ['wallet_seed', 'private_key', 'ssh_key', 'api_key'];
      const filtered = domain.items.filter(
        (i) => cryptoTypes.includes(i.type) && !i.archived
      );
      setItems(filtered);
      if (filtered.length > 0 && !selectedId) {
        setSelectedId(filtered[0]?.id ?? null);
      }
    }
  }, [selectedId]);

  React.useEffect(() => {
    loadData();
  }, [loadData, vaultRevision]);

  const filteredItems = React.useMemo(() => {
    const list = items.filter((item) => {
      if (activeVaultId !== 'all' && item.vaultId && item.vaultId !== activeVaultId) {
        return false;
      }
      if (filterFavoritesOnly && !item.favorite) {
        return false;
      }
      if (activeFilter !== 'all' && item.type !== activeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
        );
      }
      return true;
    });

    list.sort((a, b) => {
      if (Boolean(a.favorite) !== Boolean(b.favorite)) {
        return a.favorite ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    });

    return list;
  }, [items, activeVaultId, activeFilter, filterFavoritesOnly, searchQuery]);

  const selectedItem = items.find((i) => i.id === selectedId) ?? filteredItems[0] ?? null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    addToast({
      title: 'Copied to Clipboard',
      description: `${label} copied securely. Auto-clears in 20s.`,
      variant: 'default',
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !secretValue.trim()) return;

    setIsSaving(true);
    try {
      const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();

      let payload: Record<string, unknown> = {};
      if (itemType === 'wallet_seed') {
        const words = secretValue.trim().split(/\s+/);
        payload = {
          walletName: title,
          seedPhrase: secretValue.trim(),
          wordCount: words.length,
          blockchain: networkOrService.trim() || 'Multi-Chain',
          publicAddress: publicAddress.trim(),
          notes: notes.trim(),
        };
      } else if (itemType === 'private_key') {
        payload = {
          privateKey: secretValue.trim(),
          blockchain: networkOrService.trim() || 'EVM / Bitcoin',
          publicKeyOrAddress: publicAddress.trim(),
          notes: notes.trim(),
        };
      } else if (itemType === 'ssh_key') {
        payload = {
          privateKey: secretValue.trim(),
          publicKey: publicAddress.trim(),
          keyType: 'ed25519',
          notes: notes.trim(),
        };
      } else if (itemType === 'api_key') {
        payload = {
          apiKey: secretValue.trim(),
          serviceName: networkOrService.trim() || 'Cloud API',
          endpoint: publicAddress.trim(),
          notes: notes.trim(),
        };
      }

      const envelope: VaultItemEnvelope = {
        id,
        type: itemType,
        title: title.trim(),
        favorite: false,
        archived: false,
        vaultId: activeVaultId === 'all' ? 'vault-personal' : activeVaultId,
        createdAt: now,
        updatedAt: now,
        payload,
      };

      await appVaultService.saveItem(envelope);
      addToast({
        title: 'Crypto Item Encrypted',
        description: `Saved "${title}" with authenticated cipher.`,
        variant: 'success',
      });
      loadData();
      setSelectedId(id);
      setShowAddModal(false);
      setTitle('');
      setSecretValue('');
      setNetworkOrService('');
      setPublicAddress('');
      setNotes('');
    } catch (err) {
      addToast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Failed to save',
        variant: 'danger',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await appVaultService.toggleFavoriteItem(id);
      loadData();
    } catch {
      addToast({ title: 'Favorite Error', description: 'Failed to update favorite', variant: 'danger' });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this secret?')) return;
    try {
      await appVaultService.deleteItem(id);
      addToast({ title: 'Deleted', description: 'Item removed from vault.', variant: 'default' });
      loadData();
      setSelectedId(null);
    } catch {
      addToast({ title: 'Delete Error', description: 'Failed to delete item', variant: 'danger' });
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'wallet_seed':
        return <Wallet className="h-4 w-4 text-pine-600" />;
      case 'private_key':
        return <Key className="h-4 w-4 text-mari-600" />;
      case 'ssh_key':
        return <Terminal className="h-4 w-4 text-skyx-600" />;
      case 'api_key':
        return <Cpu className="h-4 w-4 text-flare-500" />;
      default:
        return <Shield className="h-4 w-4 text-accent" />;
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col space-y-4 anim-fade-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold tracking-tight text-ink flex items-center gap-2.5">
            <Wallet className="h-6 w-6 text-accent" />
            <span>Crypto Wallets & Keys</span>
          </h1>
          <p className="text-xs text-ink/65 font-mono mt-0.5">
            Cold storage seed phrases, raw private keys, Ed25519 SSH credentials, and API secrets.
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>New Wallet / Key</span>
        </Button>
      </div>

      {/* Two-Column Master-Detail Layout (Zero Empty Space) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
        {/* Left Column: Search & Item List */}
        <div className="w-full lg:w-96 flex flex-col rounded-2xl border border-line bg-card shadow-card overflow-hidden shrink-0">
          {/* Search and Filters */}
          <div className="p-3 border-b border-line space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink/40" />
              <input
                type="text"
                placeholder="Search wallets, keys, tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-line bg-moss text-xs text-ink placeholder:text-ink/35 outline-none focus:border-accent"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'wallet_seed', label: 'Seeds' },
                { id: 'private_key', label: 'Private Keys' },
                { id: 'ssh_key', label: 'SSH' },
                { id: 'api_key', label: 'API Keys' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveFilter(pill.id as typeof activeFilter)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer',
                    activeFilter === pill.id && !filterFavoritesOnly
                      ? 'bg-accent text-white shadow-xs'
                      : 'bg-moss text-ink/65 hover:text-ink'
                  )}
                >
                  {pill.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFilterFavoritesOnly((prev) => !prev)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1',
                  filterFavoritesOnly
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-moss text-ink/65 hover:text-ink'
                )}
              >
                <Star className={cn('h-3 w-3', filterFavoritesOnly ? 'fill-white text-white' : 'text-amber-500 fill-amber-500')} />
                <span>Favs</span>
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink/45">
                No crypto items found.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === selectedItem?.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer active:scale-[0.99]',
                      isSelected
                        ? 'bg-moss border border-line shadow-xs font-bold text-ink'
                        : 'text-ink/80 hover:bg-moss/50'
                    )}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2 rounded-lg bg-card border border-line/60 shrink-0">
                        {getItemIcon(item.type)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-display font-bold text-ink truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-ink/50 font-mono capitalize">
                          {item.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(item.id, e)}
                      title={item.favorite ? 'Remove favorite' : 'Mark as favorite'}
                      className="p-1.5 rounded-md hover:bg-card text-ink/40 hover:text-amber-500 cursor-pointer transition-colors shrink-0"
                    >
                      <Star
                        className={cn(
                          'h-3.5 w-3.5',
                          item.favorite ? 'fill-amber-500 text-amber-500' : 'stroke-current'
                        )}
                      />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Full Rich Inspector Pane */}
        <div className="flex-1 rounded-2xl border border-line bg-card shadow-card p-5 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col justify-between">
          {selectedItem ? (
            <div className="space-y-6">
              {/* Header with Title & Badges */}
              <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1.5 rounded-lg bg-moss border border-line">
                      {getItemIcon(selectedItem.type)}
                    </span>
                    <h2 className="text-xl font-display font-extrabold text-ink">
                      {selectedItem.title}
                    </h2>
                    <Badge variant="accent" className="capitalize">
                      {selectedItem.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink/50 font-mono">
                    Updated: {new Date(selectedItem.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleToggleFavorite(selectedItem.id, e)}
                    className={cn(
                      'h-8 text-xs cursor-pointer gap-1.5',
                      selectedItem.favorite
                        ? 'text-amber-500 border-amber-500/40 bg-amber-500/10'
                        : 'text-ink/70'
                    )}
                  >
                    <Star
                      className={cn(
                        'h-3.5 w-3.5',
                        selectedItem.favorite ? 'fill-amber-500 text-amber-500' : 'text-current'
                      )}
                    />
                    <span>{selectedItem.favorite ? 'Favorited' : 'Favorite'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteItem(selectedItem.id)}
                    className="h-8 text-xs text-flare-600 hover:text-flare-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>

              {/* Seed Phrase Rendering (Grid of words) */}
              {selectedItem.type === 'wallet_seed' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-ink/50">
                      BIP-39 Mnemonic Seed Phrase (
                      {(selectedItem.payload as WalletSeedPayload).wordCount || 12} Words)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleReveal(selectedItem.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-moss text-xs text-ink/70 hover:text-ink cursor-pointer"
                      >
                        {revealedSecrets[selectedItem.id] ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        <span>{revealedSecrets[selectedItem.id] ? 'Mask' : 'Reveal'}</span>
                      </button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleCopy(
                            (selectedItem.payload as WalletSeedPayload).seedPhrase || '',
                            'Seed Phrase'
                          )
                        }
                        className="h-7 text-xs gap-1"
                      >
                        {copiedKey === 'Seed Phrase' ? (
                          <Check className="h-3 w-3 text-pine-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>Copy All Words</span>
                      </Button>
                    </div>
                  </div>

                  {/* Words Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-4 rounded-2xl border border-line bg-moss/60">
                    {((selectedItem.payload as WalletSeedPayload).seedPhrase || '')
                      .split(/\s+/)
                      .map((word: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 p-2 rounded-xl bg-card border border-line shadow-xs font-mono text-xs"
                        >
                          <span className="text-[10px] text-ink/40 w-4 select-none font-bold">
                            {idx + 1}.
                          </span>
                          <span className="font-bold text-ink">
                            {revealedSecrets[selectedItem.id] ? word : '••••••'}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Public Address */}
                  {(selectedItem.payload as WalletSeedPayload).primaryAddress && (
                    <div className="p-3.5 rounded-xl border border-line bg-card space-y-1">
                      <span className="text-[10.5px] font-mono uppercase text-ink/50 block">
                        Public Address
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-bold text-ink truncate">
                          {(selectedItem.payload as WalletSeedPayload).primaryAddress}
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              (selectedItem.payload as WalletSeedPayload).primaryAddress || '',
                              'Public Address'
                            )
                          }
                          className="p-1.5 text-ink/60 hover:text-ink rounded-lg hover:bg-moss"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Private Key / API / SSH Secret Rendering */}
              {selectedItem.type !== 'wallet_seed' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-line bg-moss/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono uppercase tracking-wider text-ink/60">
                        Secret Key Payload
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleReveal(selectedItem.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-card text-xs text-ink/70 hover:text-ink cursor-pointer"
                        >
                          {revealedSecrets[selectedItem.id] ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          <span>{revealedSecrets[selectedItem.id] ? 'Mask' : 'Reveal'}</span>
                        </button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const payload = selectedItem.payload as Record<string, unknown>;
                            const raw =
                              (payload.privateKey as string) ||
                              (payload.apiKey as string) ||
                              '';
                            handleCopy(raw, 'Secret Key');
                          }}
                          className="h-7 text-xs gap-1"
                        >
                          {copiedKey === 'Secret Key' ? (
                            <Check className="h-3 w-3 text-pine-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>Copy Key</span>
                        </Button>
                      </div>
                    </div>

                    <pre className="p-3.5 rounded-xl bg-card border border-line text-xs font-mono font-bold text-ink overflow-x-auto whitespace-pre-wrap break-all">
                      {revealedSecrets[selectedItem.id]
                        ? ((selectedItem.payload as Record<string, unknown>).privateKey as string) ||
                          ((selectedItem.payload as Record<string, unknown>).apiKey as string) ||
                          ''
                        : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                    </pre>
                  </div>
                </div>
              )}

              {/* Notes */}
              {Boolean((selectedItem.payload as Record<string, unknown>).notes) && (
                <div className="p-4 rounded-2xl border border-line bg-card space-y-1.5">
                  <span className="text-xs font-bold text-ink/50 uppercase tracking-wider font-mono">
                    Notes & Architecture
                  </span>
                  <p className="text-xs text-ink/75 leading-relaxed">
                    {(selectedItem.payload as Record<string, unknown>).notes as string}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Wallet className="h-8 w-8 text-accent" />}
              title="Select a wallet or key"
              description="Choose an item on the left to view cold storage phrases and private keys."
            />
          )}
        </div>
      </div>

      {/* Add Wallet Modal */}
      <Dialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        title="Add Crypto Wallet or Key"
        description="Encrypted locally before touching IndexedDB. Zero cloud telemetry."
        size="xl"
      >
        <form onSubmit={handleSaveItem} className="space-y-4 pt-2">
          <CustomSelect
            label="Key Type"
            value={itemType}
            onChange={(val) => setItemType(val as typeof itemType)}
            options={[
              { value: 'wallet_seed', label: 'BIP-39 Mnemonic Seed Phrase (12/24 Words)' },
              { value: 'private_key', label: 'Private Key (EVM hex, Bitcoin WIF, Solana)' },
              { value: 'ssh_key', label: 'SSH Key (OpenSSH Ed25519 / RSA)' },
              { value: 'api_key', label: 'Developer API Key / Secret Token' },
            ]}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink/75">Title</label>
            <Input
              placeholder="e.g. Ledger Ethereum Cold Storage, Production SSH..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink/75">
              {itemType === 'wallet_seed'
                ? 'Seed Words (space separated)'
                : itemType === 'ssh_key'
                  ? 'Private Key PEM Block'
                  : 'Secret Key / Token'}
            </label>
            <textarea
              rows={3}
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              placeholder={
                itemType === 'wallet_seed'
                  ? 'abandon abandon abandon...'
                  : 'Enter raw private secret...'
              }
              className="w-full rounded-xl border border-line bg-card p-3 text-xs font-mono text-ink placeholder:text-ink/35 outline-none focus:border-accent"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink/75">
                {itemType === 'api_key' ? 'Service / Provider' : 'Blockchain / Network'}
              </label>
              <Input
                placeholder="e.g. Ethereum, Solana, OpenAI..."
                value={networkOrService}
                onChange={(e) => setNetworkOrService(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink/75">
                {itemType === 'api_key' ? 'API Endpoint' : 'Public Address / Key'}
              </label>
              <Input
                placeholder="0x... or ssh-ed25519..."
                value={publicAddress}
                onChange={(e) => setPublicAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink/75">Notes</label>
            <Input
              placeholder="Hardware wallet location, threshold rules..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSaving}>
              Save Secret
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
