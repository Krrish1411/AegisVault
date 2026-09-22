import * as React from 'react';
import { Shield, X, Check } from 'lucide-react';
import { appVaultService } from '@/application/services/AppVaultService';
import type { CapturedCredentialRecord } from '@/storage/sqlite/SqliteVaultRepository';
import { AddEditPasswordModal } from '@/features/passwords/AddEditPasswordModal';
import { useSessionStore } from '@/state/sessionStore';
import { useUiStore } from '@/state/uiStore';

export function CapturedCredentialsBanner() {
  const status = useSessionStore((state) => state.status);
  const addToast = useUiStore((state) => state.addToast);
  const [capturedItems, setCapturedItems] = React.useState<CapturedCredentialRecord[]>([]);
  const [activeItem, setActiveItem] = React.useState<CapturedCredentialRecord | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const checkCaptured = React.useCallback(async () => {
    if (status !== 'unlocked') return;
    try {
      const items = await appVaultService.getCapturedCredentials();
      setCapturedItems(items);
    } catch {
      // safe fallback
    }
  }, [status]);

  React.useEffect(() => {
    if (status !== 'unlocked') return;
    checkCaptured();
    const interval = setInterval(checkCaptured, 4000);
    return () => clearInterval(interval);
  }, [status, checkCaptured]);

  const current = capturedItems[0];
  if (!current) {
    return null;
  }

  const handleReview = (item: CapturedCredentialRecord) => {
    setActiveItem(item);
    setModalOpen(true);
  };

  const handleDismiss = async (id: string) => {
    await appVaultService.dismissCapturedCredential(id);
    setCapturedItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSaved = async () => {
    if (activeItem) {
      await appVaultService.dismissCapturedCredential(activeItem.id);
      setCapturedItems((prev) => prev.filter((it) => it.id !== activeItem.id));
      setActiveItem(null);
    }
    addToast({
      title: 'Captured Login Encrypted',
      description: 'Credentials have been secured in your AegisVault container.',
      variant: 'success',
    });
  };

  const formatWebsiteUrl = (domain?: string) => {
    if (!domain) return '';
    if (domain.startsWith('http://') || domain.startsWith('https://')) return domain;
    return `https://${domain}`;
  };

  return (
    <>
      <aside aria-label="Captured Credentials Alert" className="bg-accent/10 border-b border-accent/25 px-4 py-3 text-text-primary transition-all duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-text-primary">Captured Login Found: </span>
              <span className="font-medium text-accent">{current.title || current.domain}</span>
              {current.username ? (
                <span className="text-text-secondary ml-1 font-mono text-[12px]">({current.username})</span>
              ) : null}
              <span className="text-text-muted ml-1.5 hidden md:inline">
                Captured from website form submission.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => handleReview(current)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-contrast text-xs font-medium hover:bg-accent-hover transition-colors cursor-pointer active:scale-95 shadow-sm"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Review & Save</span>
            </button>
            <button
              type="button"
              onClick={() => handleDismiss(current.id)}
              aria-label="Dismiss captured login"
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {activeItem ? (
        <AddEditPasswordModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setActiveItem(null);
          }}
          initialValues={{
            title: activeItem.title || activeItem.domain,
            website: formatWebsiteUrl(activeItem.domain),
            username: activeItem.username,
            password: activeItem.password,
          }}
          onSaved={handleSaved}
        />
      ) : null}
    </>
  );
}
