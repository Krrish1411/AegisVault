import * as React from 'react';
import { UserCheck, Plus, Search, Star, Filter, ChevronRight, MapPin, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { ListRow } from '@/ui/primitives/ListRow';
import { EmptyState } from '@/ui/primitives/EmptyState';
import { Badge } from '@/ui/primitives/Badge';
import { AddEditItemModal } from '@/features/items/AddEditItemModal';
import { ItemDetailSheet } from '@/features/items/ItemDetailSheet';
import { maskAadhaar } from '@/domain/cards/cardHelpers';
import { generateBurnerPersona, formatAddress } from '@/domain/generator/burnerPersonaGenerator';
import { webClipboard } from '@/platform/web/WebClipboardPort';
import { appVaultService } from '@/application/services/AppVaultService';
import { inMemorySearchIndex } from '@/domain/organization/searchIndex';
import { useUiStore } from '@/state/uiStore';
import type { VaultItemEnvelope, AddressPayload } from '@/domain/vault/types';

export function IdentityScreen() {
  const vaultRevision = useUiStore((state) => state.vaultRevision);
  const addToast = useUiStore((state) => state.addToast);
  const [items, setItems] = React.useState<VaultItemEnvelope[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<'all' | 'address' | 'indian' | 'travel' | 'insurance'>('all');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const [selectedItem, setSelectedItem] = React.useState<VaultItemEnvelope | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);
  const [showAddEdit, setShowAddEdit] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<VaultItemEnvelope | null>(null);

  const identityTypes = React.useMemo(
    () =>
      new Set([
        'identity',
        'address',
        'pan',
        'aadhaar',
        'passport',
        'driving_license',
        'voter_id',
        'tax_id',
        'insurance',
        'emergency_contact',
      ]),
    []
  );

  const refreshIdentity = React.useCallback(() => {
    const domain = appVaultService.getDecryptedVault();
    if (domain) {
      const results = inMemorySearchIndex.search({
        query: searchQuery,
      }).filter((i) => {
        if (i.archived) return false;
        if (filterFavoritesOnly && !i.favorite) return false;
        if (!identityTypes.has(i.type)) return false;

        if (categoryFilter === 'address') {
          return i.type === 'address' || i.type === 'identity';
        }
        if (categoryFilter === 'indian') {
          return i.type === 'pan' || i.type === 'aadhaar' || i.type === 'voter_id';
        }
        if (categoryFilter === 'travel') {
          return i.type === 'passport' || i.type === 'driving_license';
        }
        if (categoryFilter === 'insurance') {
          return i.type === 'insurance' || i.type === 'emergency_contact';
        }
        return true;
      });

      // Float favorites to top
      results.sort((a, b) => {
        if (Boolean(a.favorite) !== Boolean(b.favorite)) {
          return a.favorite ? -1 : 1;
        }
        return a.title.localeCompare(b.title);
      });

      setItems(results);
    }
  }, [searchQuery, categoryFilter, filterFavoritesOnly, identityTypes]);

  React.useEffect(() => {
    refreshIdentity();
  }, [refreshIdentity, vaultRevision]);

  const handleAddNew = () => {
    setEditingItem(null);
    setShowAddEdit(true);
  };

  const handleEdit = (item: VaultItemEnvelope) => {
    setEditingItem(item);
    setShowAddEdit(true);
  };

  const activeVaultId = useUiStore((state) => state.activeVaultId);

  const handleQuickCreateBurner = async () => {
    const burner = generateBurnerPersona();
    const formatted = formatAddress(burner);
    const now = new Date().toISOString();
    await appVaultService.saveItem({
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: 'address',
      title: burner.title,
      favorite: false,
      archived: false,
      vaultId: activeVaultId !== 'all' ? activeVaultId : 'vault-personal',
      createdAt: now,
      updatedAt: now,
      payload: burner as unknown as Record<string, unknown>,
      tags: ['burner', 'disposable', 'persona'],
    });
    await webClipboard.writeText(formatted);
    addToast({
      title: 'Burner Persona Created & Copied',
      description: `Saved ${burner.fullName} (${burner.city}) and copied address to clipboard!`,
      variant: 'default',
    });
    refreshIdentity();
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Personal Data & Identity Documents</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Passports, addresses, disposable burner personas, PAN, Aadhaar, driving licenses, and insurance policies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={handleQuickCreateBurner}
            className="gap-1.5 text-xs text-accent border-accent/30 hover:bg-accent/10 shadow-xs cursor-pointer h-9"
            title="Instantly generate and copy a throwaway persona for untrusted sites"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Quick Burner Persona</span>
          </Button>

          <Button onClick={handleAddNew} className="gap-2 shrink-0 text-xs shadow-xs cursor-pointer h-9">
            <Plus className="h-4 w-4" />
            <span>Add Identity / Address</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search identities, addresses, or records..."
            className="pl-9 h-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Button
            size="sm"
            variant={categoryFilter === 'all' ? 'default' : 'ghost'}
            onClick={() => setCategoryFilter('all')}
            className="h-8 text-xs"
          >
            All Records
          </Button>
          <Button
            size="sm"
            variant={categoryFilter === 'address' ? 'default' : 'ghost'}
            onClick={() => setCategoryFilter('address')}
            className="h-8 text-xs gap-1.5"
          >
            <MapPin className="h-3 w-3" />
            <span>Addresses & Personas</span>
          </Button>
          <Button
            size="sm"
            variant={categoryFilter === 'indian' ? 'default' : 'ghost'}
            onClick={() => setCategoryFilter('indian')}
            className="h-8 text-xs"
          >
            PAN / Aadhaar / Voter
          </Button>
          <Button
            size="sm"
            variant={categoryFilter === 'travel' ? 'default' : 'ghost'}
            onClick={() => setCategoryFilter('travel')}
            className="h-8 text-xs"
          >
            Passports & DLs
          </Button>
          <Button
            size="sm"
            variant={categoryFilter === 'insurance' ? 'default' : 'ghost'}
            onClick={() => setCategoryFilter('insurance')}
            className="h-8 text-xs"
          >
            Insurance & Contacts
          </Button>

          <Button
            size="sm"
            variant={filterFavoritesOnly ? 'default' : 'ghost'}
            onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
            className={`h-8 text-xs gap-1.5 ${filterFavoritesOnly ? 'bg-amber-500 text-white hover:bg-amber-600' : 'text-text-secondary'}`}
          >
            <Star className={`h-3.5 w-3.5 ${filterFavoritesOnly ? 'fill-current text-white' : 'text-amber-500'}`} />
            <span>Favorites</span>
          </Button>
        </div>
      </div>

      {/* List / Empty State */}
      {items.length === 0 ? (
        !searchQuery && categoryFilter === 'all' ? (
          <EmptyState
            icon={<UserCheck className="h-6 w-6 text-accent" />}
            title="No identity records added"
            description="Store government identification, PAN cards, passports, and insurance policies securely."
            primaryAction={
              <Button onClick={handleAddNew} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Add identity record</span>
              </Button>
            }
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-text-muted">
            <Filter className="h-6 w-6 mx-auto mb-2 text-text-muted opacity-60" />
            <p className="text-sm">No identity records match your active search or filter.</p>
          </div>
        )
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const payload = item.payload as Record<string, string>;
            const isAddressItem = item.type === 'address' || Boolean(payload.addressLine1 || (item.type === 'identity' && payload.address));

            return (
              <ListRow
                key={item.id}
                icon={isAddressItem ? <MapPin className="h-5 w-5 text-accent" /> : <UserCheck className="h-5 w-5" />}
                title={item.title}
                subtitle={
                  <span className="flex items-center gap-3 text-xs text-text-secondary">
                    {isAddressItem && payload.profileType === 'temporary' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/15 text-accent border border-accent/25">
                        Burner
                      </span>
                    )}
                    {payload.fullName && (
                      <span className="font-medium text-text-primary">
                        {payload.fullName}
                      </span>
                    )}
                    {isAddressItem && (payload.addressLine1 || payload.city) && (
                      <span className="text-text-muted truncate">
                        {[payload.addressLine1, payload.city, payload.postalCode].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {payload.panNumber && (
                      <span className="font-mono text-[11px] text-accent uppercase font-semibold">
                        PAN: {payload.panNumber}
                      </span>
                    )}
                    {payload.aadhaarNumber && (
                      <span className="font-mono text-[11px] text-text-muted">
                        Aadhaar: {maskAadhaar(payload.aadhaarNumber)}
                      </span>
                    )}
                    {payload.passportNumber && (
                      <span className="font-mono text-[11px] text-text-muted uppercase">
                        Passport: {payload.passportNumber}
                      </span>
                    )}
                    {payload.policyNumber && (
                      <span className="font-mono text-[11px] text-text-muted">
                        Policy: {payload.policyNumber}
                      </span>
                    )}
                  </span>
                }
                badges={
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {item.type.replace(/_/g, ' ')}
                    </Badge>
                    {item.favorite && (
                      <Badge variant="accent" className="h-5 px-1.5 text-[10px]">
                        <Star className="h-2.5 w-2.5 fill-current mr-0.5" />
                        Fav
                      </Badge>
                    )}
                  </div>
                }
                trailing={
                  <div className="flex items-center gap-1.5">
                    {isAddressItem && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const formatted = formatAddress(payload as unknown as AddressPayload);
                          await webClipboard.writeText(formatted);
                          setCopiedId(item.id);
                          addToast({
                            title: 'Address Copied',
                            description: `Copied address for "${item.title}" to clipboard.`,
                            variant: 'default',
                          });
                          setTimeout(() => setCopiedId((c) => (c === item.id ? null : c)), 2000);
                        }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-surface-subtle transition-colors cursor-pointer"
                        title="Copy formatted address"
                        aria-label="Copy formatted address"
                      >
                        {copiedId === item.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await appVaultService.toggleFavoriteItem(item.id);
                        refreshIdentity();
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        item.favorite
                          ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                          : 'text-text-muted hover:text-amber-500 hover:bg-surface-subtle'
                      }`}
                      title={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
                      aria-label={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`h-4 w-4 ${item.favorite ? 'fill-current' : ''}`} />
                    </button>
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  </div>
                }
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetail(true);
                }}
              />
            );
          })}
        </div>
      )}

      {/* Add / Edit Identity Modal */}
      <AddEditItemModal
        open={showAddEdit}
        onOpenChange={setShowAddEdit}
        defaultType="identity"
        editingItem={editingItem}
        onSaved={refreshIdentity}
      />

      {/* Identity Detail Sheet */}
      <ItemDetailSheet
        item={selectedItem}
        open={showDetail}
        onOpenChange={setShowDetail}
        onEdit={handleEdit}
        onDeleted={refreshIdentity}
        onItemUpdated={refreshIdentity}
      />
    </div>
  );
}
