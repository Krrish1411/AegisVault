import * as React from 'react';
import {
  CreditCard,
  Building2,
  Calendar,
  Edit2,
  Trash2,
  Copy,
  Check,
  Star,
  Archive,
  Eye,
  EyeOff,
  ShieldCheck,
  Smartphone,
  History,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Globe,
  Paperclip,
  FileText,
  Download,
  Upload,
  X,
} from 'lucide-react';
import { Sheet } from '@/ui/primitives/Sheet';
import { Button } from '@/ui/primitives/Button';
import { Badge } from '@/ui/primitives/Badge';
import { Dialog } from '@/ui/primitives/Dialog';
import { maskCardNumber, maskAadhaar, detectCardIssuer } from '@/domain/cards/cardHelpers';
import { TotpCardDisplay } from './TotpCardDisplay';
import type {
  VaultItemEnvelope,
  BankAccountPayload,
  MpinHistoryEntry,
  AttachmentMetadata,
  DocumentPayload,
} from '@/domain/vault/types';
import { appVaultService } from '@/application/services/AppVaultService';
import { webClipboard } from '@/platform/web/WebClipboardPort';
import { useSessionStore } from '@/state/sessionStore';
import { useUiStore } from '@/state/uiStore';

export interface ItemDetailSheetProps {
  item: VaultItemEnvelope | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (item: VaultItemEnvelope) => void;
  onDeleted: () => void;
  onItemUpdated?: () => void;
}

export function ItemDetailSheet({
  item,
  open,
  onOpenChange,
  onEdit,
  onDeleted,
  onItemUpdated,
}: ItemDetailSheetProps) {
  const addToast = useUiStore((state) => state.addToast);
  const vaultRevision = useUiStore((state) => state.vaultRevision);
  const clipboardClearSeconds = useSessionStore((state) => state.clipboardClearSeconds);

  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [revealedFields, setRevealedFields] = React.useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showMpinHistory, setShowMpinHistory] = React.useState(false);
  const [isRestoringMpin, setIsRestoringMpin] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = React.useState(false);
  const [previewMeta, setPreviewMeta] = React.useState<AttachmentMetadata | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = React.useState<string | null>(null);
  const [previewTextContent, setPreviewTextContent] = React.useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setRevealedFields(new Set());
      setCopiedKey(null);
      setShowMpinHistory(false);
    }
  }, [open, item]);

  const domain = appVaultService.getDecryptedVault();
  const linkedAttachments = React.useMemo(() => {
    if (!domain || !item) return [];
    return domain.attachments.filter(
      (att) => att.linkedItemId === item.id || item.attachmentIds?.includes(att.id)
    );
  }, [domain, item, vaultRevision]);

  const linkedDocumentItems = React.useMemo(() => {
    if (!domain || !item) return [];
    return domain.items.filter((i) => {
      if (i.type !== 'document') return false;
      const docPayload = i.payload as unknown as DocumentPayload;
      return (
        docPayload?.linkedItemId === item.id ||
        (item.linkedItemIds && item.linkedItemIds.includes(i.id))
      );
    });
  }, [domain, item, vaultRevision]);

  if (!item) return null;

  const toggleReveal = (fieldName: string) => {
    setRevealedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) next.delete(fieldName);
      else next.add(fieldName);
      return next;
    });
  };

  const copyToClipboard = async (label: string, text: string, keyName: string) => {
    if (!text) return;
    const clearMs = clipboardClearSeconds > 0 ? clipboardClearSeconds * 1000 : 0;
    await webClipboard.writeText(text, { autoClearMs: clearMs });
    setCopiedKey(keyName);
    addToast({
      title: `${label} Copied`,
      description:
        clipboardClearSeconds > 0
          ? `Copied to clipboard (auto-clears in ${clipboardClearSeconds} seconds).`
          : 'Copied to clipboard.',
      variant: 'default',
    });
    setTimeout(() => setCopiedKey(null), 2000);
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
        title: item.archived ? 'Item Restored' : 'Item Archived',
        description: item.archived
          ? `"${item.title}" moved to active vault items.`
          : `"${item.title}" moved to archive.`,
        variant: 'default',
      });
      onItemUpdated?.();
      onOpenChange(false);
    } catch (err) {
      addToast({
        title: 'Archive failed',
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
        title: 'Favorite failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const handleRestoreMpin = async (historicPin: string) => {
    if (!item || item.type !== 'bank_account') return;
    setIsRestoringMpin(true);
    try {
      const currentBankPayload = (item.payload as unknown as Partial<BankAccountPayload>) || {};
      const currentMpin = currentBankPayload.mpin || '';

      const updatedHistory: MpinHistoryEntry[] = [
        ...(currentBankPayload.mpinHistory || []),
      ];
      if (currentMpin && currentMpin !== historicPin) {
        updatedHistory.unshift({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          pin: currentMpin,
          archivedAt: new Date().toISOString(),
        });
      }

      const updatedPayload: BankAccountPayload = {
        bankName: currentBankPayload.bankName || '',
        accountHolderName: currentBankPayload.accountHolderName || '',
        accountNumber: currentBankPayload.accountNumber || '',
        ...currentBankPayload,
        mpin: historicPin,
        mpinHistory: updatedHistory,
      };

      await appVaultService.saveItem({
        ...item,
        payload: updatedPayload as unknown as Record<string, unknown>,
        updatedAt: new Date().toISOString(),
      });

      addToast({
        title: 'MPIN Restored',
        description: 'Selected historic MPIN has been restored as active.',
        variant: 'default',
      });
      onItemUpdated?.();
    } catch (err) {
      addToast({
        title: 'Restore Failed',
        description: err instanceof Error ? err.message : 'Could not restore MPIN',
        variant: 'danger',
      });
    } finally {
      setIsRestoringMpin(false);
    }
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !item) return;
    setIsUploadingAttachment(true);
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      await appVaultService.addAttachment(
        {
          filename: file.name,
          mediaType: file.type || 'application/octet-stream',
          data,
        },
        item.id
      );
      addToast({
        title: 'File Attached',
        description: `Linked "${file.name}" to ${item.title}.`,
        variant: 'success',
      });
      onItemUpdated?.();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      addToast({
        title: 'Attach Failed',
        description: err instanceof Error ? err.message : 'Could not attach file',
        variant: 'danger',
      });
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleDownloadAttachment = async (att: AttachmentMetadata) => {
    try {
      const { data } = await appVaultService.getDecryptedAttachment(att.id);
      const blob = new Blob([data as unknown as BlobPart], { type: att.mediaType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      addToast({
        title: 'Downloaded',
        description: `"${att.filename}" downloaded.`,
        variant: 'default',
      });
    } catch {
      addToast({
        title: 'Download Failed',
        description: 'Failed to download attachment',
        variant: 'danger',
      });
    }
  };

  const handlePreviewAttachment = async (att: AttachmentMetadata) => {
    setIsPreviewLoading(true);
    setPreviewMeta(att);
    try {
      const { data } = await appVaultService.getDecryptedAttachment(att.id);
      if (
        att.mediaType.startsWith('text/') ||
        att.filename.endsWith('.txt') ||
        att.filename.endsWith('.json') ||
        att.filename.endsWith('.csv')
      ) {
        setPreviewTextContent(new TextDecoder().decode(data));
      } else {
        const blob = new Blob([data as unknown as BlobPart], { type: att.mediaType });
        setPreviewBlobUrl(URL.createObjectURL(blob));
      }
    } catch {
      addToast({
        title: 'Preview Failed',
        description: 'Failed to decrypt document',
        variant: 'danger',
      });
      closePreview();
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewMeta(null);
    setPreviewBlobUrl(null);
    setPreviewTextContent(null);
  };

  const handleUnlinkAttachment = async (attId: string) => {
    if (!item) return;
    try {
      await appVaultService.linkAttachmentToItem(attId, null);
      addToast({
        title: 'Document Unlinked',
        description: 'Removed attachment link from this item.',
        variant: 'default',
      });
      onItemUpdated?.();
    } catch {
      addToast({
        title: 'Unlink Failed',
        description: 'Failed to unlink document',
        variant: 'danger',
      });
    }
  };

  const payload = item.payload as Record<string, string>;
  const bankPayload = (item.type === 'bank_account' ? (item.payload as unknown as BankAccountPayload) : null);

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title={item.title}
        description={`${item.type.replace(/_/g, ' ').toUpperCase()} • Updated ${new Date(item.updatedAt).toLocaleDateString()}`}
      >
        <div className="space-y-6 pt-4">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="default">{item.type.replace(/_/g, ' ')}</Badge>
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

          {/* --- TYPE-SPECIFIC VISUAL REPRESENTATIONS --- */}

          {/* 1. Credit / Debit Card Visual Design */}
          {(item.type === 'credit_card' || item.type === 'debit_card') && (
            <div className="space-y-4">
              {/* Virtual Payment Card */}
              <div className="rounded-xl border border-border bg-gradient-to-br from-surface to-surface-subtle p-5 shadow-elevated space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-accent" />
                    <span className="text-xs font-semibold uppercase text-text-muted">
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>
                  <Badge variant="accent" className="font-mono uppercase text-[11px]">
                    {detectCardIssuer(payload.cardNumber ?? '')}
                  </Badge>
                </div>

                {/* Card Number with Masking & Copy */}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono text-base sm:text-lg tracking-wider font-semibold text-text-primary">
                    {revealedFields.has('cardNumber')
                      ? payload.cardNumber
                      : maskCardNumber(payload.cardNumber ?? '')}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleReveal('cardNumber')}
                      className="p-1.5 text-text-muted hover:text-text-primary rounded hover:bg-surface"
                      title={revealedFields.has('cardNumber') ? 'Mask' : 'Reveal'}
                    >
                      {revealedFields.has('cardNumber') ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('Card Number', payload.cardNumber ?? '', 'cardNumber')}
                      className="p-1.5 text-text-muted hover:text-text-primary rounded hover:bg-surface"
                      title="Copy card number"
                    >
                      {copiedKey === 'cardNumber' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expiry & CVV */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                  <div>
                    <div className="text-[10px] text-text-muted uppercase">Cardholder</div>
                    <div className="font-semibold text-text-primary tracking-wide">
                      {payload.cardholderName || '—'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-[10px] text-text-muted uppercase">Expires</div>
                      <div className="font-mono font-semibold text-text-primary">
                        {payload.expiryMonth && payload.expiryYear
                          ? `${payload.expiryMonth}/${payload.expiryYear}`
                          : '—'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-text-muted uppercase">CVV</div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-semibold text-text-primary">
                          {revealedFields.has('cvv') ? payload.cvv : '•••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleReveal('cvv')}
                          className="p-0.5 text-text-muted hover:text-text-primary"
                        >
                          {revealedFields.has('cvv') ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card PIN if present */}
              {payload.pin && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-subtle text-xs">
                  <div>
                    <span className="text-text-muted">ATM / Card PIN:</span>
                    <span className="ml-2 font-mono font-bold text-text-primary">
                      {revealedFields.has('pin') ? payload.pin : '••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleReveal('pin')}
                      className="p-1 text-text-muted hover:text-text-primary"
                    >
                      {revealedFields.has('pin') ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('Card PIN', payload.pin ?? '', 'pin')}
                      className="p-1 text-text-muted hover:text-text-primary"
                    >
                      {copiedKey === 'pin' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Enhanced Bank Account & Credentials */}
          {item.type === 'bank_account' && bankPayload && (
            <div className="space-y-4">
              {/* Primary Account Card */}
              <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-accent" />
                    <span>{bankPayload.bankName || 'Bank Account'}</span>
                  </span>
                  <Badge variant="outline" className="capitalize">{bankPayload.accountType || 'Savings'}</Badge>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Account Holder</div>
                  <div className="text-xs font-semibold text-text-primary">{bankPayload.accountHolderName || '—'}</div>
                </div>

                {/* Account Number with Mask / Reveal */}
                <div className="space-y-1 pt-2 border-t border-border">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Account Number</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-text-primary tracking-wide">
                      {revealedFields.has('accountNumber')
                        ? bankPayload.accountNumber
                        : `•••• •••• ${(bankPayload.accountNumber || '').slice(-4)}`}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleReveal('accountNumber')}
                        className="p-1.5 text-text-muted hover:text-text-primary rounded hover:bg-surface"
                        title={revealedFields.has('accountNumber') ? 'Mask' : 'Reveal'}
                      >
                        {revealedFields.has('accountNumber') ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('Account Number', bankPayload.accountNumber || '', 'accountNumber')}
                        className="p-1.5 text-text-muted hover:text-text-primary rounded hover:bg-surface"
                        title="Copy account number"
                      >
                        {copiedKey === 'accountNumber' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* IFSC & Branch & CIF Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                  {bankPayload.ifscCode && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/70">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase">IFSC Code</div>
                        <div className="font-mono font-bold text-text-primary uppercase">{bankPayload.ifscCode}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('IFSC Code', bankPayload.ifscCode || '', 'ifsc')}
                        className="p-1 text-text-muted hover:text-text-primary rounded"
                        title="Copy IFSC"
                      >
                        {copiedKey === 'ifsc' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}

                  {bankPayload.branchName && (
                    <div className="p-2 rounded-lg bg-surface border border-border/70">
                      <div className="text-[10px] text-text-muted uppercase">Branch</div>
                      <div className="font-medium text-text-primary truncate">{bankPayload.branchName}</div>
                    </div>
                  )}

                  {bankPayload.customerId && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/70">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase">CIF / Customer ID</div>
                        <div className="font-mono font-semibold text-text-primary">{bankPayload.customerId}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('Customer ID', bankPayload.customerId || '', 'customerId')}
                        className="p-1 text-text-muted hover:text-text-primary rounded"
                        title="Copy CIF / Customer ID"
                      >
                        {copiedKey === 'customerId' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}

                  {bankPayload.routingNumber && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/70">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase">Routing Number</div>
                        <div className="font-mono font-semibold text-text-primary">{bankPayload.routingNumber}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('Routing Number', bankPayload.routingNumber || '', 'routingNumber')}
                        className="p-1 text-text-muted hover:text-text-primary rounded"
                      >
                        {copiedKey === 'routingNumber' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}

                  {bankPayload.iban && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/70 col-span-1 sm:col-span-2">
                      <div className="overflow-hidden">
                        <div className="text-[10px] text-text-muted uppercase">IBAN</div>
                        <div className="font-mono font-semibold text-text-primary truncate">{bankPayload.iban}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('IBAN', bankPayload.iban || '', 'iban')}
                        className="p-1 text-text-muted hover:text-text-primary rounded shrink-0 ml-1"
                      >
                        {copiedKey === 'iban' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}

                  {bankPayload.swiftBic && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/70">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase">SWIFT / BIC</div>
                        <div className="font-mono font-semibold text-text-primary uppercase">{bankPayload.swiftBic}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('SWIFT / BIC', bankPayload.swiftBic || '', 'swiftBic')}
                        className="p-1 text-text-muted hover:text-text-primary rounded"
                      >
                        {copiedKey === 'swiftBic' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Net Banking Credentials */}
              {(bankPayload.netBankingUserId || bankPayload.netBankingPassword) && (
                <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <Globe className="h-4 w-4 text-accent" />
                      <span>Net Banking Credentials</span>
                    </span>
                    <Badge variant="accent" className="text-[10px]">Portal Login</Badge>
                  </div>

                  {bankPayload.netBankingUserId && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border text-xs">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase">Net Banking User ID / Username</div>
                        <div className="font-mono font-semibold text-text-primary">{bankPayload.netBankingUserId}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('Net Banking User ID', bankPayload.netBankingUserId || '', 'netBankingUserId')}
                        className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface-subtle"
                        title="Copy User ID"
                      >
                        {copiedKey === 'netBankingUserId' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}

                  {bankPayload.netBankingPassword && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border text-xs">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase">Net Banking Login Password</div>
                        <div className="font-mono font-semibold text-text-primary">
                          {revealedFields.has('netBankingPassword') ? bankPayload.netBankingPassword : '••••••••••••'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleReveal('netBankingPassword')}
                          className="p-1 text-text-muted hover:text-text-primary rounded"
                          title={revealedFields.has('netBankingPassword') ? 'Mask' : 'Reveal'}
                        >
                          {revealedFields.has('netBankingPassword') ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('Net Banking Password', bankPayload.netBankingPassword || '', 'netBankingPassword')}
                          className="p-1 text-text-muted hover:text-text-primary rounded"
                          title="Copy Password"
                        >
                          {copiedKey === 'netBankingPassword' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* High-Security Banking Passwords */}
              {(bankPayload.profilePassword || bankPayload.transactionPassword) && (
                <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4 text-warning" />
                      <span>High-Security Banking Passwords</span>
                    </span>
                    <Badge variant="warning" className="text-[10px]">Sensitive</Badge>
                  </div>

                  {bankPayload.profilePassword && (
                    <div className="space-y-1 p-2.5 rounded-lg bg-surface border border-border text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-text-muted uppercase font-semibold">Profile Password (SBI / Beneficiary)</div>
                          <div className="text-[10px] text-text-muted">Required to add payees & change bank limits</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleReveal('profilePassword')}
                            className="p-1 text-text-muted hover:text-text-primary rounded"
                            title={revealedFields.has('profilePassword') ? 'Mask' : 'Reveal'}
                          >
                            {revealedFields.has('profilePassword') ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('Profile Password', bankPayload.profilePassword || '', 'profilePassword')}
                            className="p-1 text-text-muted hover:text-text-primary rounded"
                            title="Copy Profile Password"
                          >
                            {copiedKey === 'profilePassword' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-text-primary pt-1">
                        {revealedFields.has('profilePassword') ? bankPayload.profilePassword : '••••••••••••'}
                      </div>
                    </div>
                  )}

                  {bankPayload.transactionPassword && (
                    <div className="space-y-1 p-2.5 rounded-lg bg-surface border border-border text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-text-muted uppercase font-semibold">Transaction Password</div>
                          <div className="text-[10px] text-text-muted">Required for authorizing high-value transfers</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleReveal('transactionPassword')}
                            className="p-1 text-text-muted hover:text-text-primary rounded"
                            title={revealedFields.has('transactionPassword') ? 'Mask' : 'Reveal'}
                          >
                            {revealedFields.has('transactionPassword') ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('Transaction Password', bankPayload.transactionPassword || '', 'transactionPassword')}
                            className="p-1 text-text-muted hover:text-text-primary rounded"
                            title="Copy Transaction Password"
                          >
                            {copiedKey === 'transactionPassword' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-text-primary pt-1">
                        {revealedFields.has('transactionPassword') ? bankPayload.transactionPassword : '••••••••••••'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Banking & PINs */}
              {(bankPayload.mpin || bankPayload.atmPin || bankPayload.upiId) && (
                <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <Smartphone className="h-4 w-4 text-accent" />
                      <span>Mobile Banking & PINs</span>
                    </span>
                    <Badge variant="outline" className="text-[10px]">PIN Codes</Badge>
                  </div>

                  {bankPayload.mpin && (
                    <div className="space-y-2 p-2.5 rounded-lg bg-surface border border-border text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-text-muted uppercase font-semibold">Active MPIN (Mobile PIN)</div>
                          <div className="font-mono text-base font-bold text-text-primary tracking-widest pt-0.5">
                            {revealedFields.has('mpin') ? bankPayload.mpin : '••••••'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleReveal('mpin')}
                            className="p-1 text-text-muted hover:text-text-primary rounded"
                            title={revealedFields.has('mpin') ? 'Mask' : 'Reveal'}
                          >
                            {revealedFields.has('mpin') ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('MPIN', bankPayload.mpin || '', 'mpin')}
                            className="p-1 text-text-muted hover:text-text-primary rounded"
                            title="Copy MPIN"
                          >
                            {copiedKey === 'mpin' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* MPIN History Toggle Button */}
                      {bankPayload.mpinHistory && bankPayload.mpinHistory.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <button
                            type="button"
                            onClick={() => setShowMpinHistory(!showMpinHistory)}
                            className="w-full flex items-center justify-between py-1 px-2 text-[11px] font-medium text-accent hover:bg-accent/10 rounded transition-colors"
                          >
                            <span className="flex items-center gap-1.5">
                              <History className="h-3 w-3" />
                              <span>
                                {showMpinHistory ? 'Hide MPIN Revision History' : `View MPIN History (${bankPayload.mpinHistory.length} previous)`}
                              </span>
                            </span>
                            {showMpinHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>

                          {/* Collapsible MPIN Revision History List */}
                          {showMpinHistory && (
                            <div className="mt-2 space-y-1.5 pt-1">
                              <div className="text-[10px] text-text-muted">Previous MPINs changed over time:</div>
                              {bankPayload.mpinHistory.map((entry) => {
                                const fieldKey = `mpin_hist_${entry.id}`;
                                const isRevealed = revealedFields.has(fieldKey);
                                return (
                                  <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-2 rounded bg-surface-subtle border border-border text-[11px]"
                                  >
                                    <div>
                                      <div className="text-[9px] text-text-muted">
                                        Replaced {new Date(entry.archivedAt).toLocaleDateString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </div>
                                      <div className="font-mono font-semibold tracking-wider text-text-secondary">
                                        {isRevealed ? entry.pin : '••••••'}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => toggleReveal(fieldKey)}
                                        className="p-1 text-text-muted hover:text-text-primary rounded"
                                        title={isRevealed ? 'Mask' : 'Reveal'}
                                      >
                                        {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard('Historic MPIN', entry.pin, fieldKey)}
                                        className="p-1 text-text-muted hover:text-text-primary rounded"
                                        title="Copy historic PIN"
                                      >
                                        {copiedKey === fieldKey ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                                      </button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRestoreMpin(entry.pin)}
                                        disabled={isRestoringMpin}
                                        className="h-6 px-1.5 text-[10px] gap-1 text-accent hover:bg-accent/10"
                                        title="Restore this PIN as active MPIN"
                                      >
                                        <RotateCcw className="h-2.5 w-2.5" />
                                        <span>Restore</span>
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {bankPayload.atmPin && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border text-xs">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase font-semibold">ATM / Card PIN</div>
                        <div className="font-mono font-bold text-base text-text-primary tracking-widest pt-0.5">
                          {revealedFields.has('atmPin') ? bankPayload.atmPin : '••••'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleReveal('atmPin')}
                          className="p-1 text-text-muted hover:text-text-primary rounded"
                          title={revealedFields.has('atmPin') ? 'Mask' : 'Reveal'}
                        >
                          {revealedFields.has('atmPin') ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('ATM PIN', bankPayload.atmPin || '', 'atmPin')}
                          className="p-1 text-text-muted hover:text-text-primary rounded"
                          title="Copy ATM PIN"
                        >
                          {copiedKey === 'atmPin' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {bankPayload.upiId && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border text-xs">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase font-semibold">UPI ID / VPA</div>
                        <div className="font-mono font-semibold text-accent">{bankPayload.upiId}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('UPI ID', bankPayload.upiId || '', 'upiId')}
                        className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface-subtle"
                        title="Copy UPI ID"
                      >
                        {copiedKey === 'upiId' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Indian Identity Documents: PAN & Aadhaar */}
          {item.type === 'pan' && (
            <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-text-muted">Income Tax Dept • PAN</span>
                <Badge variant="accent">PAN Card</Badge>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-[10px] text-text-muted uppercase">Permanent Account Number</div>
                  <div className="font-mono text-base font-bold text-text-primary uppercase tracking-wider">
                    {revealedFields.has('pan') ? payload.panNumber : `${(payload.panNumber ?? '').slice(0, 5)}••••${(payload.panNumber ?? '').slice(-1)}`}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleReveal('pan')}
                    className="p-1 text-text-muted hover:text-text-primary"
                  >
                    {revealedFields.has('pan') ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('PAN Number', payload.panNumber ?? '', 'pan')}
                    className="p-1 text-text-muted hover:text-text-primary"
                  >
                    {copiedKey === 'pan' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                <div>
                  <div className="text-[10px] text-text-muted">Name</div>
                  <div className="font-medium text-text-primary">{payload.fullName || '—'}</div>
                </div>
                {payload.dateOfBirth && (
                  <div>
                    <div className="text-[10px] text-text-muted">DOB</div>
                    <div className="font-medium text-text-primary">{payload.dateOfBirth}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {item.type === 'aadhaar' && (
            <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-text-muted">Unique Identification Authority of India</span>
                <Badge variant="accent">Aadhaar</Badge>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-[10px] text-text-muted uppercase">Aadhaar Number</div>
                  <div className="font-mono text-base font-bold text-text-primary tracking-wider">
                    {revealedFields.has('aadhaar') ? payload.aadhaarNumber : maskAadhaar(payload.aadhaarNumber ?? '')}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleReveal('aadhaar')}
                    className="p-1 text-text-muted hover:text-text-primary"
                  >
                    {revealedFields.has('aadhaar') ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('Aadhaar Number', payload.aadhaarNumber ?? '', 'aadhaar')}
                    className="p-1 text-text-muted hover:text-text-primary"
                  >
                    {copiedKey === 'aadhaar' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                <div>
                  <div className="text-[10px] text-text-muted">Name</div>
                  <div className="font-medium text-text-primary">{payload.fullName || '—'}</div>
                </div>
                {payload.dateOfBirth && (
                  <div>
                    <div className="text-[10px] text-text-muted">DOB</div>
                    <div className="font-medium text-text-primary">{payload.dateOfBirth}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Passport / Driving License / Identity */}
          {item.type === 'passport' && (
            <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-text-muted">Passport • {payload.country || 'International'}</span>
                <Badge variant="default">Passport</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-text-muted uppercase">Passport Number</div>
                  <div className="font-mono text-base font-bold text-text-primary uppercase">
                    {payload.passportNumber || '—'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('Passport Number', payload.passportNumber ?? '', 'passport')}
                  className="p-1 text-text-muted hover:text-text-primary"
                >
                  {copiedKey === 'passport' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                <div>
                  <div className="text-[10px] text-text-muted">Full Name</div>
                  <div className="font-medium text-text-primary">{payload.fullName || '—'}</div>
                </div>
                {payload.expiryDate && (
                  <div>
                    <div className="text-[10px] text-text-muted">Expiry Date</div>
                    <div className="font-medium text-text-primary">{payload.expiryDate}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. TOTP Live Authenticator Card */}
          {item.type === 'totp' && payload.secret && (
            <TotpCardDisplay
              secret={payload.secret}
              issuer={payload.issuer}
              account={payload.account}
              digits={payload.digits ? (Number(payload.digits) as 6 | 8) : 6}
              period={payload.period ? Number(payload.period) : 30}
              algorithm={(payload.algorithm as 'SHA1' | 'SHA256' | 'SHA512') || 'SHA1'}
              onCopy={(code) => copyToClipboard('TOTP Code', code, 'totp')}
              isCopied={copiedKey === 'totp'}
            />
          )}

          {/* 6. Crypto Wallet Seed */}
          {item.type === 'wallet_seed' && payload.seedPhrase && (
            <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-text-muted">
                  BIP39 Mnemonic Seed • {payload.blockchain || 'Multi-Chain'}
                </span>
                <Badge variant="accent">Cold Wallet Seed</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  {payload.seedPhrase.trim().split(/\s+/).length} Words Phrase
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleReveal('seedPhrase')}
                    className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface"
                    title={revealedFields.has('seedPhrase') ? 'Mask Words' : 'Reveal Words'}
                  >
                    {revealedFields.has('seedPhrase') ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('Seed Phrase', payload.seedPhrase ?? '', 'seedPhrase')}
                    className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface"
                    title="Copy full seed phrase"
                  >
                    {copiedKey === 'seedPhrase' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {payload.seedPhrase.trim().split(/\s+/).map((word, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 p-2 rounded-md bg-surface border border-border text-xs font-mono"
                  >
                    <span className="text-[10px] text-text-muted font-sans select-none">{idx + 1}.</span>
                    <span className="font-semibold text-text-primary">
                      {revealedFields.has('seedPhrase') ? word : '••••'}
                    </span>
                  </div>
                ))}
              </div>

              {payload.passphrase && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface text-xs">
                  <div>
                    <span className="text-text-muted">Passphrase (25th word):</span>
                    <span className="ml-2 font-mono font-bold text-text-primary">
                      {revealedFields.has('passphrase') ? payload.passphrase : '••••••••'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleReveal('passphrase')}
                    className="p-1 text-text-muted hover:text-text-primary"
                  >
                    {revealedFields.has('passphrase') ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 7. Private Key */}
          {item.type === 'private_key' && payload.privateKey && (
            <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-text-muted">
                  Cryptographic Private Key • {payload.keyType || 'secp256k1'}
                </span>
                <Badge variant="danger">Private Key</Badge>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="font-mono text-xs font-bold text-text-primary break-all max-w-[280px]">
                  {revealedFields.has('privateKey')
                    ? payload.privateKey
                    : `${payload.privateKey.slice(0, 6)}••••••••${payload.privateKey.slice(-4)}`}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleReveal('privateKey')}
                    className="p-1 text-text-muted hover:text-text-primary"
                  >
                    {revealedFields.has('privateKey') ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('Private Key', payload.privateKey ?? '', 'privateKey')}
                    className="p-1 text-text-muted hover:text-text-primary"
                  >
                    {copiedKey === 'privateKey' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {payload.publicKeyOrAddress && (
                <div className="space-y-1 pt-1 border-t border-border text-xs">
                  <div className="text-[10px] text-text-muted uppercase">Public Address</div>
                  <div className="font-mono text-xs text-text-primary break-all">
                    {payload.publicKeyOrAddress}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. Generic / Notes Display for remaining fields */}
          {payload.notes && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-secondary">Encrypted Notes</span>
              <div className="rounded-md border border-border bg-surface-subtle p-3 text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
                {payload.notes}
              </div>
            </div>
          )}

          {/* Linked Documents, Passbooks & Cancelled Cheques */}
          <div className="space-y-2.5 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Paperclip className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold text-text-primary">
                  Linked Documents & Cheques ({linkedAttachments.length + linkedDocumentItems.length})
                </span>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleQuickUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploadingAttachment}
                  disabled={isUploadingAttachment}
                  className="h-7 text-[11px] gap-1 px-2.5 cursor-pointer"
                >
                  <Upload className="h-3 w-3" />
                  <span>Attach File</span>
                </Button>
              </div>
            </div>

            {linkedAttachments.length === 0 && linkedDocumentItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-3 text-center bg-surface-subtle/50">
                <p className="text-[11px] text-text-muted">
                  No files or documents attached to this record yet.
                </p>
                <p className="text-[10px] text-text-muted/80 mt-0.5">
                  Attach a cancelled cheque photo, passbook scan, or PDF statement.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {linkedAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card hover:bg-surface-subtle transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 truncate">
                      <div className="p-1.5 rounded-lg bg-surface-subtle border border-border shrink-0">
                        <FileText className="h-4 w-4 text-accent" />
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="text-xs font-medium text-text-primary truncate">
                          {att.filename}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono">
                          {(att.sizeBytes / 1024).toFixed(1)} KB • {new Date(att.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreviewAttachment(att)}
                        title="Preview document"
                        className="h-7 w-7 p-0 cursor-pointer text-text-muted hover:text-text-primary"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadAttachment(att)}
                        title="Download decrypted document"
                        className="h-7 w-7 p-0 cursor-pointer text-text-muted hover:text-text-primary"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlinkAttachment(att.id)}
                        title="Unlink from this record"
                        className="h-7 w-7 p-0 cursor-pointer text-text-muted hover:text-danger"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {linkedDocumentItems.map((doc) => {
                  const docPayload = doc.payload as unknown as DocumentPayload;
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 truncate">
                        <div className="p-1.5 rounded-lg bg-surface-subtle border border-border shrink-0">
                          <FileText className="h-4 w-4 text-mari-500" />
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="text-xs font-medium text-text-primary truncate">
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-text-muted font-mono capitalize">
                            {(docPayload?.documentType ?? 'document').replace('_', ' ')}
                            {docPayload?.referenceNumber ? ` • #${docPayload.referenceNumber}` : ''}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Linked Record
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
      </Sheet>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Item"
        description={`Are you sure you want to permanently delete "${item.title}"?`}
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

      {/* Attachment Preview Modal */}
      <Dialog
        open={Boolean(previewMeta)}
        onOpenChange={(open) => {
          if (!open) closePreview();
        }}
        title={previewMeta?.filename ?? 'Document Preview'}
        description={previewMeta ? `${previewMeta.mediaType} • ${(previewMeta.sizeBytes / 1024).toFixed(1)} KB` : ''}
      >
        <div className="space-y-4 pt-2">
          {isPreviewLoading ? (
            <div className="py-12 text-center text-xs text-text-muted font-mono animate-pulse">
              Decrypting and rendering payload...
            </div>
          ) : previewTextContent !== null ? (
            <div className="max-h-[60vh] overflow-y-auto rounded-md border border-border bg-surface-subtle p-3 text-xs font-mono text-text-primary whitespace-pre-wrap leading-relaxed">
              {previewTextContent}
            </div>
          ) : previewBlobUrl && previewMeta?.mediaType.startsWith('image/') ? (
            <div className="flex justify-center max-h-[60vh] overflow-hidden rounded-md border border-border bg-surface-subtle p-2">
              <img
                src={previewBlobUrl}
                alt={previewMeta.filename}
                className="max-h-[55vh] object-contain rounded"
              />
            </div>
          ) : previewBlobUrl && (previewMeta?.mediaType === 'application/pdf' || previewMeta?.filename.endsWith('.pdf')) ? (
            <div className="h-[60vh] w-full rounded-md border border-border bg-surface-subtle">
              <iframe src={previewBlobUrl} className="w-full h-full rounded-md" title="PDF Preview" />
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <FileText className="h-10 w-10 text-text-muted mx-auto" />
              <p className="text-xs text-text-secondary">
                Direct in-browser visual preview not available for this media format.
              </p>
              {previewMeta && (
                <Button size="sm" onClick={() => handleDownloadAttachment(previewMeta)} className="gap-1.5 mx-auto">
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Decrypted File</span>
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            {previewMeta && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadAttachment(previewMeta)}
                className="gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save to Disk</span>
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={closePreview} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
