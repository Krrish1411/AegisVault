import * as React from 'react';
import { CreditCard, Plus, Search, Star, Filter, ChevronRight } from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { ListRow } from '@/ui/primitives/ListRow';
import { EmptyState } from '@/ui/primitives/EmptyState';
import { Badge } from '@/ui/primitives/Badge';
import { AddEditItemModal } from '@/features/items/AddEditItemModal';
import { ItemDetailSheet } from '@/features/items/ItemDetailSheet';
import { detectCardIssuer, maskCardNumber } from '@/domain/cards/cardHelpers';
import { appVaultService } from '@/application/services/AppVaultService';
import { inMemorySearchIndex } from '@/domain/organization/searchIndex';
import { useUiStore } from '@/state/uiStore';
import type { VaultItemEnvelope, CardPayload } from '@/domain/vault/types';

export function CardsScreen() {
  const vaultRevision = useUiStore((state) => state.vaultRevision);
  const [items, setItems] = React.useState<VaultItemEnvelope[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | 'credit_card' | 'debit_card'>('all');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = React.useState(false);

  const [selectedItem, setSelectedItem] = React.useState<VaultItemEnvelope | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);
  const [showAddEdit, setShowAddEdit] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<VaultItemEnvelope | null>(null);

  const refreshCards = React.useCallback(() => {
    const domain = appVaultService.getDecryptedVault();
    if (domain) {
      const results = inMemorySearchIndex.search({
        query: searchQuery,
      }).filter((i) => {
        if (i.archived) return false;
        if (filterFavoritesOnly && !i.favorite) return false;
        if (filterType === 'all') return i.type === 'credit_card' || i.type === 'debit_card';
        return i.type === filterType;
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
  }, [searchQuery, filterType, filterFavoritesOnly]);

  React.useEffect(() => {
    refreshCards();
  }, [refreshCards, vaultRevision]);

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
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Payment & Credit Cards</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Credit cards, debit cards, CVVs, and expiry records with secure masked display.
          </p>
        </div>

        <Button onClick={handleAddNew} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>Add Card</span>
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards by name or cardholder..."
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Button
            size="sm"
            variant={filterType === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilterType('all')}
            className="h-8 text-xs"
          >
            All Cards
          </Button>
          <Button
            size="sm"
            variant={filterType === 'credit_card' ? 'default' : 'ghost'}
            onClick={() => setFilterType('credit_card')}
            className="h-8 text-xs"
          >
            Credit
          </Button>
          <Button
            size="sm"
            variant={filterType === 'debit_card' ? 'default' : 'ghost'}
            onClick={() => setFilterType('debit_card')}
            className="h-8 text-xs"
          >
            Debit
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
        !searchQuery && filterType === 'all' ? (
          <EmptyState
            icon={<CreditCard className="h-6 w-6 text-accent" />}
            title="No payment cards added"
            description="Store credit and debit card information with zero plaintext persistence."
            primaryAction={
              <Button onClick={handleAddNew} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Add payment card</span>
              </Button>
            }
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-text-muted">
            <Filter className="h-6 w-6 mx-auto mb-2 text-text-muted opacity-60" />
            <p className="text-sm">No payment cards match your search query.</p>
          </div>
        )
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const payload = item.payload as Partial<CardPayload>;
            const issuer = detectCardIssuer(payload.cardNumber ?? '');

            return (
              <ListRow
                key={item.id}
                icon={<CreditCard className="h-5 w-5" />}
                title={item.title}
                subtitle={
                  <span className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="font-mono font-medium">
                      {maskCardNumber(payload.cardNumber ?? '')}
                    </span>
                    {payload.expiryMonth && payload.expiryYear && (
                      <span className="font-mono text-[11px] text-text-muted">
                        Exp: {payload.expiryMonth}/{payload.expiryYear}
                      </span>
                    )}
                    {payload.cardholderName && (
                      <span className="text-[11px] text-text-muted truncate">
                        {payload.cardholderName}
                      </span>
                    )}
                  </span>
                }
                badges={
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-mono uppercase text-[10px]">
                      {issuer}
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
                        refreshCards();
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

      {/* Add / Edit Card Modal */}
      <AddEditItemModal
        open={showAddEdit}
        onOpenChange={setShowAddEdit}
        defaultType="credit_card"
        editingItem={editingItem}
        onSaved={refreshCards}
      />

      {/* Card Detail Sheet */}
      <ItemDetailSheet
        item={selectedItem}
        open={showDetail}
        onOpenChange={setShowDetail}
        onEdit={handleEdit}
        onDeleted={refreshCards}
        onItemUpdated={refreshCards}
      />
    </div>
  );
}
