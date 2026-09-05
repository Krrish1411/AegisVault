import * as React from 'react';
import {
  Key,
  Globe,
  User,
  FileText,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Check,
  Star,
  History,
  Archive,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { Sheet } from '@/ui/primitives/Sheet';
import { Button } from '@/ui/primitives/Button';
import { Badge } from '@/ui/primitives/Badge';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { Dialog } from '@/ui/primitives/Dialog';
import type { VaultItemEnvelope, LoginPayload } from '@/domain/vault/types';
import { appVaultService } from '@/application/services/AppVaultService';
import { webClipboard } from '@/platform/web/WebClipboardPort';
import { useSessionStore } from '@/state/sessionStore';
import { useUiStore } from '@/state/uiStore';

export interface PasswordDetailSheetProps {
  item: VaultItemEnvelope | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (item: VaultItemEnvelope) => void;
  onDeleted: () => void;
  onItemUpdated?: () => void;
}

export function PasswordDetailSheet({
  item,
  open,
  onOpenChange,
  onEdit,
  onDeleted,
  onItemUpdated,
}: PasswordDetailSheetProps) {
  const addToast = useUiStore((state) => state.addToast);
  const clipboardClearSeconds = useSessionStore((state) => state.clipboardClearSeconds);

  const [copiedUser, setCopiedUser] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

  if (!item) return null;
  const payload = item.payload as Partial<LoginPayload>;
  const history = item.passwordHistory ?? [];

  const handleCopyUsername = async () => {
    if (!payload.username) return;
    const clearMs = clipboardClearSeconds > 0 ? clipboardClearSeconds * 1000 : 0;
    await webClipboard.writeText(payload.username, { autoClearMs: clearMs });
    setCopiedUser(true);
    addToast({
      title: 'Username Copied',
      description:
        clipboardClearSeconds > 0
          ? `Copied to clipboard (auto-clears in ${clipboardClearSeconds} seconds).`
          : 'Copied to clipboard.',
    });
    setTimeout(() => setCopiedUser(false), 2000);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await appVaultService.deleteItem(item.id);
      addToast({
        title: 'Item Deleted',
        description: `"${item.title}" removed from your encrypted vault.`,
        variant: 'default',
      });
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onDeleted();
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

  const handleToggleArchive = async () => {
    try {
      await appVaultService.toggleArchiveItem(item.id);
      addToast({
        title: item.archived ? 'Item Unarchived' : 'Item Archived',
        description: item.archived
          ? `"${item.title}" moved to active vault items.`
          : `"${item.title}" moved to archive.`,
        variant: 'default',
      });
      onItemUpdated?.();
      onOpenChange(false);
    } catch (err) {
      addToast({
        title: 'Failed to update archive status',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await appVaultService.toggleFavoriteItem(item.id);
      addToast({
        title: item.favorite ? 'Removed from Favorites' : 'Added to Favorites',
        description: `"${item.title}" favorite status updated.`,
        variant: 'default',
      });
      onItemUpdated?.();
    } catch (err) {
      addToast({
        title: 'Failed to update favorite status',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const handleRestorePassword = async (historyEntryId: string) => {
    try {
      await appVaultService.restorePasswordFromHistory(item.id, historyEntryId);
      addToast({
        title: 'Password Restored',
        description: 'Selected historical password has been restored.',
        variant: 'success',
      });
      onItemUpdated?.();
    } catch (err) {
      addToast({
        title: 'Failed to restore password',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const handleDeleteHistoryEntry = async (historyEntryId: string) => {
    try {
      await appVaultService.deletePasswordHistoryEntry(item.id, historyEntryId);
      addToast({
        title: 'History Entry Deleted',
        description: 'Password history entry removed.',
        variant: 'default',
      });
      onItemUpdated?.();
    } catch (err) {
      addToast({
        title: 'Failed to delete history entry',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const handleClearHistory = async () => {
    try {
      await appVaultService.clearPasswordHistory(item.id);
      addToast({
        title: 'History Cleared',
        description: 'All historical passwords deleted for this item.',
        variant: 'default',
      });
      onItemUpdated?.();
    } catch (err) {
      addToast({
        title: 'Failed to clear history',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const expiresAt = payload.expiresAt ?? item.expiresAt;
  const lastRotated = payload.lastPasswordRotatedAt ?? item.updatedAt;
  const now = Date.now();
  let expiryInfo: { label: string; variant: 'danger' | 'warning' | 'default' } | null = null;
  if (expiresAt) {
    const expiryTime = new Date(expiresAt).getTime();
    if (!isNaN(expiryTime)) {
      if (expiryTime <= now) {
        const daysAgo = Math.max(0, Math.floor((now - expiryTime) / 86400000));
        expiryInfo = {
          label: daysAgo === 0 ? 'Expired today' : `Expired ${daysAgo}d ago`,
          variant: 'danger',
        };
      } else {
        const daysLeft = Math.max(1, Math.ceil((expiryTime - now) / 86400000));
        expiryInfo = {
          label: `Expires in ${daysLeft}d`,
          variant: daysLeft <= 14 ? 'warning' : 'default',
        };
      }
    }
  }
  const passwordAgeDays = Math.max(0, Math.floor((now - new Date(lastRotated).getTime()) / 86400000));

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title={item.title}
        description={`Login credential • Last updated ${new Date(item.updatedAt).toLocaleDateString()}`}
      >
        <div className="space-y-6 pt-4">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="default">Login</Badge>
              {item.favorite && (
                <Badge variant="accent" className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  <span>Favorite</span>
                </Badge>
              )}
              {item.archived && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Archive className="h-3 w-3" />
                  <span>Archived</span>
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                title={item.favorite ? 'Unmark Favorite' : 'Mark Favorite'}
                className="h-8 px-2 text-xs"
              >
                <Star className={`h-3.5 w-3.5 ${item.favorite ? 'text-warning fill-current' : ''}`} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleArchive}
                title={item.archived ? 'Restore to Active' : 'Archive Item'}
                className="h-8 px-2 text-xs text-text-muted hover:text-text-primary"
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(item);
                }}
                className="h-8 gap-1 text-xs"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-8 text-xs text-danger hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Credential Details */}
          <div className="space-y-4">
            {/* Username / Email */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Username / Email</span>
              </span>
              <div className="flex items-center justify-between rounded-md border border-border bg-surface-subtle px-3 py-2 text-sm text-text-primary">
                <span className="font-mono truncate">{payload.username || '—'}</span>
                {payload.username && (
                  <button
                    type="button"
                    onClick={handleCopyUsername}
                    className="p-1 text-text-muted hover:text-text-primary transition-colors"
                    title="Copy username"
                  >
                    {copiedUser ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  <span>Password</span>
                </span>
                {expiryInfo && (
                  <Badge variant={expiryInfo.variant} className="text-[10px] h-4.5 px-1.5 gap-1 font-mono">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{expiryInfo.label}</span>
                  </Badge>
                )}
              </div>
              <SecretInput
                value={payload.password ?? ''}
                readOnly
                allowCopy={true}
                onCopied={() => {
                  addToast({
                    title: 'Password Copied',
                    description:
                      clipboardClearSeconds > 0
                        ? `Copied to clipboard. Auto-clears in ${clipboardClearSeconds} seconds.`
                        : 'Copied to clipboard.',
                  });
                }}
              />
              <div className="flex items-center justify-between text-[10px] text-text-muted pt-0.5 px-0.5">
                <span>Age: {passwordAgeDays} {passwordAgeDays === 1 ? 'day' : 'days'}</span>
                {expiresAt && !isNaN(new Date(expiresAt).getTime()) && (
                  <span>Policy expiry: {new Date(expiresAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Website URL */}
            {payload.urls && payload.urls.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Website</span>
                </span>
                <div className="flex items-center justify-between rounded-md border border-border bg-surface-subtle px-3 py-2 text-sm">
                  <span className="truncate text-accent">{payload.urls[0]}</span>
                  <a
                    href={payload.urls[0]}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="p-1 text-text-muted hover:text-text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Notes */}
            {payload.notes && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Notes</span>
                </span>
                <div className="rounded-md border border-border bg-surface-subtle p-3 text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
                  {payload.notes}
                </div>
              </div>
            )}

            {/* Password History Section */}
            {history.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between py-1">
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
                  >
                    <History className="h-3.5 w-3.5 text-accent" />
                    <span>Password History ({history.length})</span>
                    <span className="text-[11px] text-accent">({showHistory ? 'Hide' : 'Show'})</span>
                  </button>

                  {showHistory && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="text-[11px] text-danger hover:underline"
                    >
                      Clear History
                    </button>
                  )}
                </div>

                {showHistory && (
                  <div className="mt-2 space-y-2">
                    {history.map((h) => (
                      <div key={h.id} className="rounded border border-border bg-surface-subtle p-2 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-text-muted">
                          <span>Replaced on {new Date(h.archivedAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRestorePassword(h.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteHistoryEntry(h.id)}
                              className="text-[11px] text-danger hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <SecretInput value={h.password} readOnly allowCopy={true} className="h-8 text-xs font-mono" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Metadata Footer */}
            <div className="pt-4 border-t border-border space-y-1 text-[11px] text-text-muted">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created: {new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Updated: {new Date(item.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Credential"
        description={`Are you sure you want to permanently delete "${item.title}"? This item will be removed from your encrypted vault.`}
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
            Delete Item
          </Button>
        </div>
      </Dialog>
    </>
  );
}
