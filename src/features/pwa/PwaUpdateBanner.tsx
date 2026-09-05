import * as React from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { applyPwaUpdate } from '@/platform/pwa/pwaService';

export function PwaUpdateBanner() {
  const [updateWorker, setUpdateWorker] = React.useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ worker: ServiceWorker }>;
      setUpdateWorker(customEvent.detail.worker);
    };

    window.addEventListener('pwa-update-available', handleUpdate);
    return () => window.removeEventListener('pwa-update-available', handleUpdate);
  }, []);

  if (!updateWorker || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up rounded-xl border border-accent/40 bg-surface/95 p-4 shadow-elevated backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="text-xs font-bold text-text-primary">
            Offline App Update Ready
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            A verified new offline release of AegisVault has been cached. Click to apply the update when you are ready.
          </p>

          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => applyPwaUpdate(updateWorker)}
              className="gap-1.5 text-xs h-7"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Update & Reload</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="text-xs h-7 text-text-muted"
            >
              Later
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-text-muted hover:text-text-primary p-1 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
