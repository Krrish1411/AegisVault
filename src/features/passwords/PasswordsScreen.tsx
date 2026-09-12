import * as React from 'react';
import {
  Key,
  Plus,
  Search,
  Star,
  User,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Layers,
  Archive,
  Globe,
  FileText,
  History,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { Badge } from '@/ui/primitives/Badge';
import { CustomSelect, type SelectOption } from '@/ui/primitives/CustomSelect';
import { Dialog } from '@/ui/primitives/Dialog';
import { AddEditPasswordModal } from './AddEditPasswordModal';
import { PasswordDetailSheet } from './PasswordDetailSheet';
import { appVaultService } from '@/application/services/AppVaultService';
import { inMemorySearchIndex, type SortOrder } from '@/domain/organization/searchIndex';
import { generateTotp, formatTotpCode } from '@/domain/totp/totpEngine';
import { calculatePasswordEntropy } from '@/domain/generator/secretGenerator';
import { webClipboard } from '@/platform/web/WebClipboardPort';
import { useSessionStore } from '@/state/sessionStore';
import { useUiStore } from '@/state/uiStore';
import { cn } from '@/lib/utils';
import type { VaultItemEnvelope, LoginPayload } from '@/domain/vault/types';

export function PasswordsScreen() {
  const [items, setItems] = React.useState<VaultItemEnvelope[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<VaultItemEnvelope | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterFavoriteOnly, setFilterFavoriteOnly] = React.useState(false);
  const [filterArchivedOnly, setFilterArchivedOnly] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('recently_updated');

  // Modals
  const [showAddEdit, setShowAddEdit] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<VaultItemEnvelope | null>(null);
  const [showDetailSheet, setShowDetailSheet] = React.useState(false); // for mobile
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Detail pane transient state
  const [showPassword, setShowPassword] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showTotpSecret, setShowTotpSecret] = React.useState(false);
  const [revealedHistoryIds, setRevealedHistoryIds] = React.useState<Record<string, boolean>>({});

  // TOTP live state
  const [totpData, setTotpData] = React.useState<{
    code: string;
    secondsRemaining: number;
    progress: number;
  } | null>(null);

  const activeVaultId = useUiStore((state) => state.activeVaultId);
  const vaultRevision = useUiStore((state) => state.vaultRevision);
  const addToast = useUiStore((state) => state.addToast);
  const clipboardClearSeconds = useSessionStore((state) => state.clipboardClearSeconds);

  const vaults = appVaultService.getVaultRecords();

  const refreshVault = React.useCallback(() => {
    const domain = appVaultService.getDecryptedVault();
    if (domain) {
      let results = inMemorySearchIndex.search({
        query: searchQuery,
        favoriteOnly: filterFavoriteOnly,
        archivedOnly: filterArchivedOnly,
        itemType: 'login',
        sortOrder,
      });

      // Filter by active vault
      if (activeVaultId !== 'all') {
        results = results.filter(
          (i) => i.vaultId === activeVaultId || (!i.vaultId && activeVaultId === 'vault-personal')
        );
      }

      setItems(results);

      // Keep selected item up to date or select the first item if none selected on desktop
      setSelectedItem((prev) => {
        if (!prev) return results[0] ?? null;
        const found = results.find((r) => r.id === prev.id);
        return found ?? results[0] ?? null;
      });
    }
  }, [searchQuery, filterFavoriteOnly, filterArchivedOnly, sortOrder, activeVaultId]);

  React.useEffect(() => {
    refreshVault();
  }, [refreshVault, vaultRevision]);

  // Handle live TOTP updates for selected item
  React.useEffect(() => {
    if (!selectedItem) {
      setTotpData(null);
      return;
    }

    const payload = selectedItem.payload as Record<string, unknown>;
    const secret = (payload.totpSecret as string) || (payload.totp as string);
    if (!secret) {
      setTotpData(null);
      return;
    }

    let active = true;
    const updateTotp = async () => {
      try {
        const res = await generateTotp(secret);
        if (active) {
          setTotpData({
            code: res.code,
            secondsRemaining: res.secondsRemaining,
            progress: res.progress,
          });
        }
      } catch {
        if (active) setTotpData(null);
      }
    };

    updateTotp();
    const interval = setInterval(updateTotp, 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedItem]);

  // Reset showPassword and history states when changing selectedItem
  React.useEffect(() => {
    setShowPassword(false);
    setShowHistory(false);
    setRevealedHistoryIds({});
  }, [selectedItem?.id]);

  const handleCopy = async (fieldId: string, text: string, label: string) => {
    if (!text) return;
    const clearMs = clipboardClearSeconds > 0 ? clipboardClearSeconds * 1000 : 0;
    await webClipboard.writeText(text, { autoClearMs: clearMs });
    setCopiedField(fieldId);
    addToast({
      title: `${label} Copied`,
      description:
        clipboardClearSeconds > 0
          ? `Auto-clears clipboard in ${clipboardClearSeconds}s.`
          : 'Copied to clipboard.',
      variant: 'default',
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleFavorite = async (item: VaultItemEnvelope) => {
    try {
      await appVaultService.toggleFavoriteItem(item.id);
      refreshVault();
      addToast({
        title: item.favorite ? 'Removed from Favorites' : 'Marked as Favorite',
        variant: 'default',
      });
    } catch (err) {
      addToast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const handleToggleArchive = async (item: VaultItemEnvelope) => {
    try {
      await appVaultService.toggleArchiveItem(item.id);
      refreshVault();
      addToast({
        title: item.archived ? 'Restored from Archive' : 'Archived Login',
        description: `"${item.title}" status updated.`,
        variant: 'default',
      });
    } catch (err) {
      addToast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const handleRestorePassword = async (historyEntryId: string) => {
    if (!selectedItem) return;
    try {
      await appVaultService.restorePasswordFromHistory(selectedItem.id, historyEntryId);
      addToast({
        title: 'Password Restored',
        description: 'Selected historical password has been restored.',
        variant: 'default',
      });
      refreshVault();
    } catch (err) {
      addToast({
        title: 'Restore Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const handleDeleteHistoryEntry = async (historyEntryId: string) => {
    if (!selectedItem) return;
    try {
      await appVaultService.deletePasswordHistoryEntry(selectedItem.id, historyEntryId);
      addToast({
        title: 'History Entry Deleted',
        description: 'Password revision removed from history.',
        variant: 'default',
      });
      refreshVault();
    } catch (err) {
      addToast({
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const handleClearHistory = async () => {
    if (!selectedItem) return;
    try {
      await appVaultService.clearPasswordHistory(selectedItem.id);
      addToast({
        title: 'History Cleared',
        description: 'All past password revisions deleted.',
        variant: 'default',
      });
      refreshVault();
    } catch (err) {
      addToast({
        title: 'Clear Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      await appVaultService.deleteItem(selectedItem.id);
      addToast({
        title: 'Item Deleted',
        description: `"${selectedItem.title}" has been permanently removed.`,
        variant: 'default',
      });
      setShowDeleteConfirm(false);
      setSelectedItem(null);
      refreshVault();
    } catch (err) {
      addToast({
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const sortOptions: SelectOption<SortOrder>[] = [
    { value: 'recently_updated', label: 'Recently Updated' },
    { value: 'title_asc', label: 'Name (A to Z)' },
    { value: 'title_desc', label: 'Name (Z to A)' },
    { value: 'created_newest', label: 'Recently Created' },
  ];

  const selectedPayload = (selectedItem?.payload ?? {}) as Partial<LoginPayload> & Record<string, unknown>;
  const selectedVaultName =
    vaults.find((v) => v.id === selectedItem?.vaultId)?.name ||
    (selectedItem?.vaultId === 'vault-work' ? 'Work Vault' : 'Personal Vault');

  // Password entropy & strength calculation
  const passwordEntropy = calculatePasswordEntropy(selectedPayload.password ?? '');
  const history = selectedItem?.passwordHistory ?? [];
  const websiteUrl = selectedPayload.urls?.[0];
  const rawTotpSecret =
    (selectedPayload.totpSecret as string) || (selectedPayload.totp as string) || '';

  const domain = appVaultService.getDecryptedVault();
  const linkedNotes = React.useMemo(() => {
    if (!domain || !selectedItem) return [];
    return domain.items.filter((i) => {
      if (i.type !== 'secure_note') return false;
      const notePayload = i.payload as Record<string, unknown>;
      const linked =
        (i.linkedItemIds as string[]) || (notePayload.linkedItemIds as string[]) || [];
      return linked.includes(selectedItem.id);
    });
  }, [domain, selectedItem]);

  const segmentScore =
    passwordEntropy.strength === 'very_strong'
      ? 4
      : passwordEntropy.strength === 'strong'
      ? 4
      : passwordEntropy.strength === 'good'
      ? 3
      : passwordEntropy.strength === 'fair'
      ? 2
      : 1;

  return (
    <div className="flex flex-col h-[calc(100vh-10.5rem)] md:h-[calc(100vh-6.75rem)] w-full gap-4 overflow-hidden animate-fade-in">
      {/* Top Action & Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">Passwords & Logins</h1>
            <Badge variant="default" className="font-mono text-xs">
              {items.length} records
            </Badge>
            {activeVaultId !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                <Layers className="h-3 w-3" />
                <span>{vaults.find((v) => v.id === activeVaultId)?.name || activeVaultId}</span>
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-ink/60">
            Encrypted with 256-bit XChaCha20-Poly1305. Fast in-memory search and instant 1-click clipboard copy.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingItem(null);
            setShowAddEdit(true);
          }}
          className="gap-2 shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add Password</span>
        </Button>
      </div>

      {/* Main Two-Pane Master-Detail Layout */}
      <div className="flex flex-1 min-h-0 gap-6 overflow-hidden">
        {/* LEFT PANE: Master List */}
        <div className="w-full lg:w-[380px] xl:w-[420px] lg:shrink-0 flex flex-col rounded-2xl border border-line bg-card/60 backdrop-blur-md overflow-hidden shadow-xs h-full">
          {/* Filters & Search */}
          <div className="shrink-0 p-3.5 border-b border-line space-y-3 bg-card/80">
            {/* Filter Pills */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setFilterFavoriteOnly(false);
                  setFilterArchivedOnly(false);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  !filterFavoriteOnly && !filterArchivedOnly
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-ink/60 hover:text-ink hover:bg-moss'
                )}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterFavoriteOnly(true);
                  setFilterArchivedOnly(false);
                }}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  filterFavoriteOnly
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-ink/60 hover:text-ink hover:bg-moss'
                )}
              >
                <Star className={cn('h-3.5 w-3.5', filterFavoriteOnly ? 'fill-current' : 'text-warning')} />
                <span>Favorites</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterArchivedOnly(true);
                  setFilterFavoriteOnly(false);
                }}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  filterArchivedOnly
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-ink/60 hover:text-ink hover:bg-moss'
                )}
              >
                <Archive className="h-3.5 w-3.5" />
                <span>Archive</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink/45" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, username, URL..."
                className="pl-9 h-9 text-xs bg-moss/50 border-line"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-[11px] font-mono text-ink/45 uppercase tracking-wider">Sort by</span>
              <div className="w-48">
                <CustomSelect
                  value={sortOrder}
                  onChange={setSortOrder}
                  options={sortOptions}
                />
              </div>
            </div>
          </div>

          {/* List Rows - Scrollable independent list */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-line/60">
            {items.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Key className="h-8 w-8 mx-auto text-ink/30" />
                <p className="text-sm font-semibold text-ink">No passwords in vault yet</p>
                <p className="text-xs text-ink/50">
                  {searchQuery ? 'Try clearing search filters' : 'Add your first login password to this vault.'}
                </p>
              </div>
            ) : (
              items.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const payload = (item.payload ?? {}) as Partial<LoginPayload> & {
                  totp?: string;
                  totpSecret?: string;
                };
                const itemVault =
                  vaults.find((v) => v.id === item.vaultId)?.name ||
                  (item.vaultId === 'vault-work' ? 'Work' : 'Personal');

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      if (window.innerWidth < 1024) {
                        setShowDetailSheet(true);
                      }
                    }}
                    className={cn(
                      'p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors select-none',
                      isSelected
                        ? 'bg-accent/15 border-l-4 border-l-accent'
                        : 'hover:bg-moss/70'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-moss border border-line text-ink/75">
                        <Key className="h-4 w-4 text-accent" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-ink truncate">{item.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-moss text-ink/60 border border-line shrink-0">
                            {itemVault}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink/50 truncate">
                          {payload.username || 'No username'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {payload.expiresAt && (() => {
                        const expMs = new Date(payload.expiresAt).getTime();
                        const nowMs = Date.now();
                        const isExpired = expMs <= nowMs;
                        const daysLeft = Math.ceil((expMs - nowMs) / (1000 * 60 * 60 * 24));
                        if (isExpired) {
                          return (
                            <span className="text-[10px] font-mono font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                              Expired
                            </span>
                          );
                        }
                        if (daysLeft <= 14) {
                          return (
                            <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Exp {daysLeft}d
                            </span>
                          );
                        }
                        return null;
                      })()}

                      {(payload.totp || payload.totpSecret) && (
                        <span className="text-[10px] font-mono font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
                          2FA
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item);
                        }}
                        className="p-1 text-ink/40 hover:text-warning cursor-pointer"
                        aria-label="Toggle favorite"
                      >
                        <Star
                          className={cn('h-3.5 w-3.5', item.favorite && 'fill-warning text-warning')}
                        />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Proton Pass Detail Inspector (Desktop View) */}
        <div className="hidden lg:flex flex-1 flex-col rounded-2xl border border-line bg-card/75 backdrop-blur-md overflow-hidden shadow-xs h-full">
          {selectedItem ? (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-5">
              {/* Detail Header */}
              <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 text-accent border border-accent/25 shadow-xs font-bold text-xl">
                    {selectedItem.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-ink truncate">{selectedItem.title}</h2>
                      <Badge variant="outline" className="text-xs font-mono shrink-0">
                        {selectedVaultName}
                      </Badge>
                      {selectedItem.archived && (
                        <Badge variant="warning" className="text-xs font-mono shrink-0">
                          Archived
                        </Badge>
                      )}
                    </div>
                    {websiteUrl && (
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline mt-1 font-medium truncate"
                      >
                        <Globe className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleFavorite(selectedItem)}
                    className="h-8 gap-1.5 text-xs text-ink/75 cursor-pointer"
                  >
                    <Star
                      className={cn(
                        'h-3.5 w-3.5',
                        selectedItem.favorite && 'fill-warning text-warning'
                      )}
                    />
                    <span>{selectedItem.favorite ? 'Favorited' : 'Favorite'}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleArchive(selectedItem)}
                    title={selectedItem.archived ? 'Unarchive' : 'Archive'}
                    className="h-8 gap-1 text-xs text-ink/75 cursor-pointer"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>{selectedItem.archived ? 'Unarchive' : 'Archive'}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingItem(selectedItem);
                      setShowAddEdit(true);
                    }}
                    className="h-8 gap-1.5 text-xs text-ink cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-8 gap-1.5 text-xs text-danger hover:bg-danger/10 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>

              {/* Proton Pass Security Health & Entropy Meter */}
              <div className="rounded-xl border border-line bg-card/60 p-3.5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ink/50 uppercase text-[11px] tracking-wider">Password Health:</span>
                    <span
                      className={cn(
                        'font-bold capitalize',
                        passwordEntropy.strength === 'very_strong' || passwordEntropy.strength === 'strong'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : passwordEntropy.strength === 'good'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : passwordEntropy.strength === 'fair'
                          ? 'text-amber-500'
                          : 'text-red-500'
                      )}
                    >
                      {passwordEntropy.strength.replace('_', ' ')}
                    </span>
                    <span className="text-ink/40 font-mono text-[11px]">
                      • {passwordEntropy.entropyBits} bits entropy
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3 w-3" />
                    <span>0 Breaches Detected</span>
                  </span>
                </div>

                {/* 4-Segment Strength Bar */}
                <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                  <div
                    className={cn(
                      'h-full rounded-full transition-colors',
                      segmentScore >= 1
                        ? segmentScore === 1
                          ? 'bg-red-500'
                          : segmentScore === 2
                          ? 'bg-amber-500'
                          : segmentScore === 3
                          ? 'bg-yellow-400'
                          : 'bg-emerald-500'
                        : 'bg-line/60'
                    )}
                  />
                  <div
                    className={cn(
                      'h-full rounded-full transition-colors',
                      segmentScore >= 2
                        ? segmentScore === 2
                          ? 'bg-amber-500'
                          : segmentScore === 3
                          ? 'bg-yellow-400'
                          : 'bg-emerald-500'
                        : 'bg-line/60'
                    )}
                  />
                  <div
                    className={cn(
                      'h-full rounded-full transition-colors',
                      segmentScore >= 3
                        ? segmentScore === 3
                          ? 'bg-yellow-400'
                          : 'bg-emerald-500'
                        : 'bg-line/60'
                    )}
                  />
                  <div
                    className={cn(
                      'h-full rounded-full transition-colors',
                      segmentScore >= 4 ? 'bg-emerald-500' : 'bg-line/60'
                    )}
                  />
                </div>
              </div>

              {/* Password Expiration & Age Tracker Card */}
              {(() => {
                const lastRotated = selectedPayload.lastPasswordRotatedAt || selectedItem.updatedAt || selectedItem.createdAt;
                const ageInDays = Math.max(0, Math.floor((Date.now() - new Date(lastRotated).getTime()) / (1000 * 60 * 60 * 24)));
                const expMs = selectedPayload.expiresAt ? new Date(selectedPayload.expiresAt).getTime() : null;
                const isExpired = expMs !== null && expMs <= Date.now();
                const daysUntilExpiry = expMs !== null ? Math.ceil((expMs - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 14;

                return (
                  <div
                    className={cn(
                      'rounded-xl border p-3.5 space-y-2 shadow-xs transition-colors',
                      isExpired
                        ? 'border-red-500/40 bg-red-500/10'
                        : isExpiringSoon
                        ? 'border-amber-500/40 bg-amber-500/10'
                        : 'border-line bg-card/60'
                    )}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className={cn('h-4 w-4 shrink-0', isExpired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-accent')} />
                        <span className={cn('font-semibold', isExpired ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-ink')}>
                          {isExpired
                            ? 'Password Expired!'
                            : isExpiringSoon
                            ? 'Password Expiring Soon'
                            : 'Password Age & Expiration Policy'}
                        </span>
                      </div>

                      {isExpired ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setEditingItem(selectedItem);
                            setShowAddEdit(true);
                          }}
                          className="h-7 text-xs gap-1 py-0 px-2.5"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Rotate Now</span>
                        </Button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(selectedItem);
                            setShowAddEdit(true);
                          }}
                          className="text-[11px] text-accent hover:underline cursor-pointer font-medium"
                        >
                          {selectedPayload.expiresAt ? 'Change Policy' : 'Set Expiry'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 rounded-lg bg-moss/40 border border-line/40">
                        <span className="text-[10px] uppercase font-mono text-ink/50 block tracking-wider">Credential Age</span>
                        <span className="font-mono font-semibold text-ink">
                          {ageInDays} {ageInDays === 1 ? 'day' : 'days'} old
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-moss/40 border border-line/40">
                        <span className="text-[10px] uppercase font-mono text-ink/50 block tracking-wider">Expiry Status</span>
                        <span className="font-mono font-semibold">
                          {isExpired ? (
                            <span className="text-red-500">Expired {Math.abs(daysUntilExpiry!)}d ago</span>
                          ) : daysUntilExpiry !== null ? (
                            <span className={daysUntilExpiry <= 14 ? 'text-amber-500' : 'text-emerald-500'}>
                              Expires in {daysUntilExpiry}d
                            </span>
                          ) : (
                            <span className="text-ink/60">No expiry policy</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Credentials Group (Username & Password) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username / Email Field */}
                <div className="rounded-xl border border-line bg-card/60 p-3.5 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-ink/50 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>Username / Email</span>
                    </span>
                    {selectedPayload.username && (
                      <button
                        type="button"
                        onClick={() => handleCopy('user', selectedPayload.username || '', 'Username')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
                      >
                        {copiedField === 'user' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-ink select-all break-all">
                    {selectedPayload.username || '—'}
                  </p>
                </div>

                {/* Password Field */}
                <div className="rounded-xl border border-line bg-card/60 p-3.5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-ink/50 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Password</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-ink/60 hover:text-ink cursor-pointer p-0.5"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>

                      {selectedPayload.password && (
                        <button
                          type="button"
                          onClick={() => handleCopy('pass', selectedPayload.password || '', 'Password')}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
                        >
                          {copiedField === 'pass' ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-mono font-semibold text-ink select-all tracking-wider break-all">
                    {showPassword
                      ? selectedPayload.password || '—'
                      : selectedPayload.password
                      ? '••••••••••••••••'
                      : '—'}
                  </p>

                  {/* Password History Section if revisions exist */}
                  {history.length > 0 && (
                    <div className="pt-2 border-t border-line/60">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowHistory(!showHistory)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-ink/75 hover:text-ink cursor-pointer"
                        >
                          <History className="h-3.5 w-3.5 text-accent" />
                          <span>Password History ({history.length} {history.length === 1 ? 'revision' : 'revisions'})</span>
                          <span className="text-[10px] text-accent font-mono">({showHistory ? 'Hide' : 'View'})</span>
                        </button>
                        {showHistory && (
                          <button
                            type="button"
                            onClick={handleClearHistory}
                            className="text-[11px] text-danger hover:underline cursor-pointer"
                          >
                            Clear History
                          </button>
                        )}
                      </div>

                      {showHistory && (
                        <div className="mt-2.5 space-y-2">
                          {history.map((h) => {
                            const isRevealed = Boolean(revealedHistoryIds[h.id]);
                            return (
                              <div
                                key={h.id}
                                className="rounded-lg border border-line bg-moss/40 p-2.5 space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between text-[11px] text-ink/50 font-mono">
                                  <span>Replaced on {new Date(h.archivedAt).toLocaleDateString()}</span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleRestorePassword(h.id)}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                      <span>Restore</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteHistoryEntry(h.id)}
                                      className="text-[11px] text-danger hover:underline cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between font-mono text-xs bg-card px-2.5 py-1.5 rounded border border-line">
                                  <span className="truncate tracking-wider">
                                    {isRevealed ? h.password : '••••••••••••••••'}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRevealedHistoryIds((prev) => ({ ...prev, [h.id]: !prev[h.id] }))
                                      }
                                      className="text-ink/50 hover:text-ink cursor-pointer"
                                      title={isRevealed ? 'Hide password' : 'Show password'}
                                    >
                                      {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(`hist-${h.id}`, h.password, 'Historical Password')}
                                      className="text-accent hover:underline cursor-pointer inline-flex items-center gap-1"
                                      title="Copy historical password"
                                    >
                                      {copiedField === `hist-${h.id}` ? (
                                        <Check className="h-3 w-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Website & Apps Card */}
              {selectedPayload.urls && selectedPayload.urls.length > 0 && (
                <div className="rounded-xl border border-line bg-card/60 p-3.5 space-y-2 shadow-xs">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-ink/50 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Websites & Apps</span>
                  </span>
                  <div className="space-y-2">
                    {selectedPayload.urls.map((url, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-moss/40 border border-line/60"
                      >
                        <span className="text-xs font-mono text-ink truncate select-all">{url}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium cursor-pointer"
                          >
                            <span>Launch</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(`url-${idx}`, url, 'Website URL')}
                            className="text-ink/60 hover:text-ink cursor-pointer p-1"
                            title="Copy URL"
                          >
                            {copiedField === `url-${idx}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TOTP 2FA Token & Secret Key Card */}
              {(rawTotpSecret || totpData) && (
                <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent">
                        Two-Factor Authenticator (TOTP)
                      </span>
                    </div>
                    {totpData && (
                      <span className="text-xs font-mono font-bold text-accent px-2 py-0.5 rounded bg-accent/15 border border-accent/20">
                        {totpData.secondsRemaining}s
                      </span>
                    )}
                  </div>

                  {totpData ? (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-3xl font-mono font-extrabold tracking-widest text-ink select-all">
                        {formatTotpCode(totpData.code)}
                      </span>

                      <Button
                        size="sm"
                        onClick={() => handleCopy('totp', totpData.code, '2FA Code')}
                        className="gap-1.5 text-xs font-semibold cursor-pointer active:scale-95"
                      >
                        {copiedField === 'totp' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedField === 'totp' ? 'Copied' : 'Copy Code'}</span>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-ink/60">Computing live verification code...</p>
                  )}

                  {/* Countdown Progress Bar */}
                  {totpData && (
                    <div className="w-full bg-moss rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-accent h-1.5 transition-all duration-1000 ease-linear"
                        style={{ width: `${(totpData.secondsRemaining / 30) * 100}%` }}
                      />
                    </div>
                  )}

                  {/* 2FA Secret Key / URI display */}
                  {rawTotpSecret && (
                    <div className="pt-2 border-t border-accent/20 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-ink/60">
                        <span className="font-mono uppercase tracking-wider">2FA Secret Key / URI</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowTotpSecret(!showTotpSecret)}
                            className="text-ink/60 hover:text-ink cursor-pointer"
                            title={showTotpSecret ? 'Hide secret' : 'Show secret'}
                          >
                            {showTotpSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy('totpSecret', rawTotpSecret, '2FA Secret')}
                            className="text-accent hover:underline cursor-pointer inline-flex items-center gap-1 font-semibold text-xs"
                          >
                            {copiedField === 'totpSecret' ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span>{copiedField === 'totpSecret' ? 'Copied' : 'Copy Secret'}</span>
                          </button>
                        </div>
                      </div>
                      <p className="font-mono text-xs text-ink bg-card/80 p-2 rounded-lg border border-line/60 break-all select-all">
                        {showTotpSecret ? rawTotpSecret : '••••••••••••••••••••••••'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Secure Notes Section */}
              {selectedPayload.notes && (
                <div className="rounded-xl border border-line bg-card/60 p-3.5 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-ink/50 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      <span>Secure Notes</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('notes', selectedPayload.notes || '', 'Notes')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
                    >
                      {copiedField === 'notes' ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-ink whitespace-pre-wrap leading-relaxed font-sans bg-moss/30 p-2.5 rounded-lg border border-line/40 select-all">
                    {selectedPayload.notes}
                  </p>
                </div>
              )}

              {/* Comprehensive Password Change & Rotation History Log */}
              <div className="rounded-xl border border-line bg-card/60 p-4 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-ink/75 uppercase tracking-wider">
                    <History className="h-4 w-4 text-accent" />
                    <span>Password Change & History Log</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-moss text-ink/70 border border-line">
                      {history.length > 0 ? `${history.length} change${history.length === 1 ? '' : 's'}` : 'Original password active'}
                    </span>
                    {history.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        className="text-[11px] text-danger hover:underline cursor-pointer"
                      >
                        Clear History
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {/* Active / Current Password Status */}
                  <div className="p-3 rounded-lg border border-accent/25 bg-accent/5 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-semibold text-accent text-xs">
                      <span>Active Password (Current)</span>
                      <span className="font-mono text-[11px]">
                        Active since {new Date(selectedPayload.lastPasswordRotatedAt || selectedItem.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink/60">
                      {history.length > 0
                        ? 'Active credential currently used for this login (displayed above).'
                        : 'Initial password created for this credential. No password rotations recorded yet.'}
                    </p>
                  </div>

                  {/* Historical Password Rotations Timeline */}
                  {history.map((h, idx) => {
                    const isRevealed = Boolean(revealedHistoryIds[h.id]);
                    const isOriginal = idx === history.length - 1;
                    return (
                      <div
                        key={h.id}
                        className="rounded-lg border border-line bg-moss/40 p-3 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-ink">
                            {isOriginal ? 'Original Password' : `Previous Password #${history.length - idx}`}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRestorePassword(h.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteHistoryEntry(h.id)}
                              className="text-[11px] text-danger hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-ink/60 font-mono">
                          <span>
                            {isOriginal
                              ? `Created on: ${new Date(selectedItem.createdAt).toLocaleString()}`
                              : `Changed on: ${new Date(h.archivedAt).toLocaleString()}`}
                          </span>
                          <span className="sm:text-right">
                            Replaced by: {idx === 0 ? 'Active Password (above)' : `Password #${history.length - idx + 1}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between font-mono text-xs bg-card px-2.5 py-1.5 rounded-lg border border-line">
                          <span className="truncate tracking-wider select-all font-mono">
                            {isRevealed ? h.password : '••••••••••••••••'}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedHistoryIds((prev) => ({ ...prev, [h.id]: !prev[h.id] }))
                              }
                              className="text-ink/50 hover:text-ink cursor-pointer"
                              title={isRevealed ? 'Hide password' : 'Show password'}
                            >
                              {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(`hist-${h.id}`, h.password, 'Historical Password')}
                              className="text-accent hover:underline cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                              title="Copy historical password"
                            >
                              {copiedField === `hist-${h.id}` ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Linked Secure Notes Section */}
              {linkedNotes.length > 0 && (
                <div className="rounded-xl border border-line bg-card/60 p-3.5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-ink/50 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-accent" />
                      <span>Linked Secure Notes ({linkedNotes.length})</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {linkedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-2.5 rounded-lg border border-line/60 bg-moss/30 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-ink truncate block">{note.title}</span>
                          <span className="text-[10px] text-ink/50 font-mono">
                            Updated {new Date(note.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                          Note
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-moss border border-line text-ink/30">
                <Key className="h-8 w-8 text-accent/60" />
              </div>
              <h3 className="text-base font-bold text-ink">Select a login to inspect credentials</h3>
              <p className="text-xs text-ink/50 max-w-sm">
                Click any password entry on the left to reveal details, copy credentials with 1 click, or inspect TOTP 2FA codes.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setShowAddEdit(true);
                }}
                className="gap-1.5 text-xs mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create New Password</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Detail Sheet */}
      <PasswordDetailSheet
        item={selectedItem}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        onEdit={(item) => {
          setShowDetailSheet(false);
          setEditingItem(item);
          setShowAddEdit(true);
        }}
        onDeleted={() => {
          setShowDetailSheet(false);
          setSelectedItem(null);
          refreshVault();
        }}
        onItemUpdated={refreshVault}
      />

      {/* Add / Edit Password Modal */}
      <AddEditPasswordModal
        open={showAddEdit}
        onOpenChange={setShowAddEdit}
        editingItem={editingItem}
        onSaved={refreshVault}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Login Credential"
        description={`Are you sure you want to permanently delete "${selectedItem?.title}"? This action cannot be undone.`}
      >
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            disabled={isDeleting}
          >
            Delete Permanently
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
