import * as React from 'react';
import { useUiStore, type ToastItem } from '@/state/uiStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-4"
    >
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastMessage({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, toast.durationMs ?? 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    default: <Info className="h-4 w-4 text-pine-600" />,
    success: <CheckCircle2 className="h-4 w-4 text-pine-600" />,
    warning: <AlertTriangle className="h-4 w-4 text-mari-600" />,
    danger: <AlertCircle className="h-4 w-4 text-flare-600" />,
  };

  const variant = toast.variant ?? 'default';

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-modal anim-slide-up text-ink select-none',
        variant === 'success' && 'border-pine-500/30 bg-card',
        variant === 'warning' && 'border-mari-500/30 bg-card',
        variant === 'danger' && 'border-flare-500/30 bg-card'
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[variant]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-display font-bold text-ink leading-tight">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs text-ink/70 leading-relaxed font-sans">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-lg p-1 text-ink/40 hover:text-ink hover:bg-moss transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pine-500 cursor-pointer active:scale-95"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
