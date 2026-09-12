import * as React from 'react';
import { UserCheck, Plus, Search, Star, Filter, ChevronRight } from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { ListRow } from '@/ui/primitives/ListRow';
import { EmptyState } from '@/ui/primitives/EmptyState';
import { Badge } from '@/ui/primitives/Badge';
import { AddEditItemModal } from '@/features/items/AddEditItemModal';
import { ItemDetailSheet } from '@/features/items/ItemDetailSheet';
import { maskAadhaar } from '@/domain/cards/cardHelpers';
import { appVaultService } from '@/application/services/AppVaultService';
import { inMemorySearchIndex } from '@/domain/organization/searchIndex';
import { useUiStore } from '@/state/uiStore';
import type { VaultItemEnvelope } from '@/domain/vault/types';

export function IdentityScreen() {
  const vaultRevision = useUiStore((state) => state.vaultRevision);
  const [items, setItems] = React.useState<VaultItemEnvelope[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<'all' | 'indian' | 'travel' | 'insurance'>('all');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = React.useState(false);

  const [selectedItem, setSelectedItem] = React.useState<VaultItemEnvelope | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);
  const [showAddEdit, setShowAddEdit] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<VaultItemEnvelope | null>(null);

  const identityTypes = React.useMemo(
    () =>
      new Set([
        'identity',
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

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Personal Data & Identity Documents</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Passports, PAN, Aadhaar, driving licenses, tax IDs, and insurance policies with encrypted storage.
          </p>
        </div>

        <Button onClick={handleAddNew} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>Add Identity</span>
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search identity documents by name or record..."
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
            All Identity
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

            return (
              <ListRow
                key={item.id}
                icon={<UserCheck className="h-5 w-5" />}
                title={item.title}
                subtitle={
                  <span className="flex items-center gap-3 text-xs text-text-secondary">
                    {payload.fullName && (
                      <span className="font-medium text-text-primary">
                        {payload.fullName}
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
