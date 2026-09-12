import * as React from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  File,
  FileImage,
  FileCode,
  HardDrive,
  AlertTriangle,
  Search,
  Star,
  Link2,
} from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { Dialog } from '@/ui/primitives/Dialog';
import { Badge } from '@/ui/primitives/Badge';
import { EmptyState } from '@/ui/primitives/EmptyState';
import { CustomSelect, type SelectOption } from '@/ui/primitives/CustomSelect';
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  RECOMMENDED_VAULT_TARGET_BYTES,
  getStorageQuotaEstimate,
  type StorageQuotaEstimate,
} from '@/domain/attachments/attachmentEngine';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';
import type { AttachmentMetadata } from '@/domain/vault/types';

export function DocumentsScreen() {
  const addToast = useUiStore((state) => state.addToast);
  const vaultRevision = useUiStore((state) => state.vaultRevision);

  const [attachments, setAttachments] = React.useState<AttachmentMetadata[]>([]);
  const [totalSize, setTotalSize] = React.useState(0);
  const [quota, setQuota] = React.useState<StorageQuotaEstimate | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [filterFavoritesOnly, setFilterFavoritesOnly] = React.useState(false);

  // Link Attachment to Item State
  const [linkingAttachment, setLinkingAttachment] = React.useState<AttachmentMetadata | null>(null);
  const [selectedLinkId, setSelectedLinkId] = React.useState<string>('');

  // Preview Modal State
  const [previewMeta, setPreviewMeta] = React.useState<AttachmentMetadata | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = React.useState<string | null>(null);
  const [previewTextContent, setPreviewTextContent] = React.useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);

  // Delete State
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const refreshAttachments = React.useCallback(async () => {
    const domain = appVaultService.getDecryptedVault();
    if (domain) {
      setAttachments([...domain.attachments]);
      const bytes = await appVaultService.getAttachmentTotalBytes();
      setTotalSize(bytes);
    }
    const quotaInfo = await getStorageQuotaEstimate();
    setQuota(quotaInfo);
  }, []);

  React.useEffect(() => {
    refreshAttachments();
  }, [refreshAttachments, vaultRevision]);

  // Clean up object URLs when preview modal closes
  const closePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setPreviewTextContent(null);
    setPreviewMeta(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]!;
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      addToast({
        title: 'File Too Large',
        description: `File is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Single file limit is 50 MB.`,
        variant: 'danger',
      });
      return;
    }

    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      await appVaultService.addAttachment({
        filename: file.name,
        mediaType: file.type || 'application/octet-stream',
        data,
      });

      addToast({
        title: 'Document Encrypted & Saved',
        description: `"${file.name}" was encrypted and persisted to local storage.`,
        variant: 'success',
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await refreshAttachments();
    } catch (err) {
      addToast({
        title: 'Upload Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreview = async (meta: AttachmentMetadata) => {
    setIsLoadingPreview(true);
    setPreviewMeta(meta);

    try {
      const { data } = await appVaultService.getDecryptedAttachment(meta.id);

      if (meta.mediaType.startsWith('text/') || meta.filename.endsWith('.txt') || meta.filename.endsWith('.json') || meta.filename.endsWith('.csv')) {
        const text = new TextDecoder().decode(data);
        setPreviewTextContent(text);
      } else {
        const blob = new Blob([data as unknown as BlobPart], { type: meta.mediaType });
        const url = URL.createObjectURL(blob);
        setPreviewBlobUrl(url);
      }
    } catch (err) {
      addToast({
        title: 'Preview Failed',
        description: err instanceof Error ? err.message : 'Failed to decrypt document',
        variant: 'danger',
      });
      closePreview();
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDownload = async (meta: AttachmentMetadata) => {
    try {
      const { data } = await appVaultService.getDecryptedAttachment(meta.id);
      const blob = new Blob([data as unknown as BlobPart], { type: meta.mediaType });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = meta.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up in-memory blob URL immediately
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      addToast({
        title: 'Download Initiated',
        description: `"${meta.filename}" downloaded successfully.`,
        variant: 'default',
      });
    } catch (err) {
      addToast({
        title: 'Download Failed',
        description: err instanceof Error ? err.message : 'Failed to decrypt file',
        variant: 'danger',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await appVaultService.deleteAttachment(deletingId);
      addToast({
        title: 'Document Deleted',
        description: 'Attachment permanently deleted from encrypted vault.',
        variant: 'default',
      });
      setDeletingId(null);
      await refreshAttachments();
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

  const availableItems = React.useMemo(() => {
    void vaultRevision;
    const domain = appVaultService.getDecryptedVault();
    return domain?.items ?? [];
  }, [vaultRevision]);

  const linkItemOptions: readonly SelectOption[] = React.useMemo(() => {
    const defaultOpt: SelectOption = { value: '', label: 'Unlinked (No account)' };
    const mapped = availableItems.map((i) => ({
      value: i.id,
      label: `${i.title} (${i.type.replace(/_/g, ' ')})`,
    }));
    return [defaultOpt, ...mapped];
  }, [availableItems]);

  const filteredAttachments = React.useMemo(() => {
    const list = attachments.filter((a) => {
      if (filterFavoritesOnly && !a.favorite) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.filename.toLowerCase().includes(q) ||
        (a.linkedItemTitle && a.linkedItemTitle.toLowerCase().includes(q))
      );
    });

    list.sort((a, b) => {
      if (Boolean(a.favorite) !== Boolean(b.favorite)) {
        return a.favorite ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [attachments, searchQuery, filterFavoritesOnly]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mediaType: string, filename: string) => {
    if (mediaType.startsWith('image/')) return <FileImage className="h-5 w-5 text-accent" />;
    if (mediaType === 'application/pdf' || filename.endsWith('.pdf')) return <FileText className="h-5 w-5 text-danger" />;
    if (mediaType.startsWith('text/') || filename.endsWith('.json') || filename.endsWith('.csv'))
      return <FileCode className="h-5 w-5 text-success" />;
    return <File className="h-5 w-5 text-text-muted" />;
  };

  const percentOfTarget = Math.min(100, (totalSize / RECOMMENDED_VAULT_TARGET_BYTES) * 100);

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Encrypted Documents & Attachments</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Passports, contracts, tax files, and records sealed with authenticated 256-bit encryption.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            id="attachment-file-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploading}
            disabled={isUploading}
            className="gap-2 shrink-0"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        </div>
      </div>

      {/* Storage Quota Card */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-text-primary font-medium">
            <HardDrive className="h-4 w-4 text-accent" />
            <span>Vault Attachment Storage:</span>
            <span className="font-mono font-bold text-accent">{formatBytes(totalSize)}</span>
            <span className="text-text-muted">/ 500 MB recommended target</span>
          </div>

          {quota && (
            <div className="text-text-muted text-[11px]">
              Browser indexed storage: {formatBytes(quota.usageBytes)} used
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden border border-border">
          <div
            className={`h-full transition-all duration-300 ${
              percentOfTarget > 90 ? 'bg-danger' : percentOfTarget > 70 ? 'bg-warning' : 'bg-accent'
            }`}
            style={{ width: `${Math.max(2, percentOfTarget)}%` }}
          />
        </div>

        {percentOfTarget > 80 && (
          <div className="flex items-center gap-2 text-xs text-warning pt-1">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Storage approaching recommended 500 MB target limit.</span>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by filename or linked item..."
            className="pl-9 h-10"
          />
        </div>

        <Button
          size="sm"
          variant={filterFavoritesOnly ? 'default' : 'ghost'}
          onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
          className={`h-8 text-xs gap-1.5 self-start sm:self-auto ${
            filterFavoritesOnly ? 'bg-amber-500 text-white hover:bg-amber-600' : 'text-text-secondary border border-border'
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${filterFavoritesOnly ? 'fill-current text-white' : 'text-amber-500'}`} />
          <span>Favorites ({attachments.filter((a) => a.favorite).length})</span>
        </Button>
      </div>

      {/* Document Library Grid */}
      {filteredAttachments.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6 text-accent" />}
          title="No encrypted documents uploaded"
          description="Drag & drop or upload PDFs, images, or documents. Files are authenticated and encrypted before storage."
          primaryAction={
            <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" />
              <span>Upload first document</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAttachments.map((att) => (
            <div
              key={att.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-subtle hover:border-accent/40 hover:shadow-elevated transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-surface-subtle border border-border">
                      {getFileIcon(att.mediaType, att.filename)}
                    </div>
                    <div className="space-y-0.5 max-w-[150px]">
                      <h3 className="text-xs font-semibold text-text-primary truncate" title={att.filename}>
                        {att.filename}
                      </h3>
                      <p className="text-[11px] font-mono text-text-muted">{formatBytes(att.sizeBytes)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await appVaultService.toggleFavoriteAttachment(att.id);
                        await refreshAttachments();
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        att.favorite
                          ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                          : 'text-text-muted hover:text-amber-500 hover:bg-surface-subtle'
                      }`}
                      title={att.favorite ? 'Remove from favorites' : 'Add to favorites'}
                      aria-label={att.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`h-4 w-4 ${att.favorite ? 'fill-current' : ''}`} />
                    </button>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {att.filename.split('.').pop() || 'FILE'}
                    </Badge>
                  </div>
                </div>

                {/* Linked Account / Item Status */}
                <div className="pt-1">
                  {att.linkedItemTitle ? (
                    <button
                      type="button"
                      onClick={() => {
                        setLinkingAttachment(att);
                        setSelectedLinkId(att.linkedItemId || '');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline cursor-pointer font-medium"
                      title="Click to re-link or unlink"
                    >
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Linked: {att.linkedItemTitle}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setLinkingAttachment(att);
                        setSelectedLinkId('');
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] text-text-muted hover:text-accent cursor-pointer transition-colors"
                    >
                      <Link2 className="h-3 w-3 shrink-0" />
                      <span>Link to Bank / Login / Wallet</span>
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-text-muted pt-0.5">
                  Added: {new Date(att.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-3 mt-2 border-t border-border/60">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(att)}
                  className="h-8 px-2.5 text-xs gap-1"
                  title="Preview document in memory"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(att)}
                  className="h-8 px-2.5 text-xs gap-1"
                  title="Decrypt and download file"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </Button>

                <button
                  type="button"
                  onClick={() => setDeletingId(att.id)}
                  className="p-1.5 text-text-muted hover:text-danger rounded hover:bg-danger/10 transition-colors ml-1"
                  title="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safe In-Memory Document Preview Modal */}
      <Dialog
        open={!!previewMeta}
        onOpenChange={(open) => {
          if (!open) closePreview();
        }}
        title={previewMeta?.filename || 'Document Preview'}
        description="Rendered strictly in volatile memory. No temp files written to disk."
      >
        <div className="space-y-4 pt-2">
          {isLoadingPreview ? (
            <div className="p-12 text-center text-text-muted text-xs">
              Decrypting document with 256-bit cipher...
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
              <File className="h-10 w-10 text-text-muted mx-auto" />
              <p className="text-xs text-text-secondary">
                Direct in-browser visual preview not available for this media format.
              </p>
              {previewMeta && (
                <Button size="sm" onClick={() => handleDownload(previewMeta)} className="gap-1.5 mx-auto">
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
                onClick={() => handleDownload(previewMeta)}
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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
        title="Delete Document"
        description="Are you sure you want to delete this encrypted document from your vault?"
      >
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingId(null)}
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
            Delete Document
          </Button>
        </div>
      </Dialog>

      {/* Link Attachment to Vault Item Modal */}
      <Dialog
        open={!!linkingAttachment}
        onOpenChange={(open) => {
          if (!open) setLinkingAttachment(null);
        }}
        title="Link Document to Account"
        description={`Relate "${linkingAttachment?.filename}" to a Bank Account, Login, Card, or Crypto Wallet in your vault.`}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <CustomSelect
              label="Select Account / Record to Link"
              value={selectedLinkId}
              onChange={(val) => setSelectedLinkId(val)}
              options={linkItemOptions}
            />
            <p className="text-[11px] text-text-muted">
              For example, link a cancelled cheque or bank statement scan directly to your Bank Account.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLinkingAttachment(null)}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={async () => {
                if (linkingAttachment) {
                  await appVaultService.linkAttachmentToItem(
                    linkingAttachment.id,
                    selectedLinkId ? selectedLinkId : null
                  );
                  await refreshAttachments();
                  addToast({
                    title: selectedLinkId ? 'Document Linked' : 'Document Unlinked',
                    description: selectedLinkId
                      ? `Linked "${linkingAttachment.filename}" to vault record.`
                      : `Unlinked "${linkingAttachment.filename}".`,
                    variant: 'success',
                  });
                  setLinkingAttachment(null);
                }
              }}
              className="gap-1.5 text-xs"
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>Save Link</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
