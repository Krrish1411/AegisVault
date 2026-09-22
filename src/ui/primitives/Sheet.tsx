import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { acquireScrollLock } from '@/lib/ui/scrollLock';
import { useFocusTrap } from '@/lib/ui/useFocusTrap';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  position?: 'right' | 'bottom';
  className?: string;
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  position = 'right',
  className,
}: SheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null);

  useFocusTrap(sheetRef, open);

  React.useEffect(() => {
    if (!open) return;

    const releaseScrollLock = acquireScrollLock();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      releaseScrollLock();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        aria-describedby={description ? 'sheet-description' : undefined}
        tabIndex={-1}
        className={cn(
          'fixed z-50 bg-card p-6 shadow-modal transition-all border-line text-ink focus:outline-none',
          position === 'right' && 'inset-y-0 right-0 h-full w-full max-w-md border-l animate-fade-in',
          position === 'bottom' && 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t animate-slide-up',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-line/60">
          <div>
            {title && (
              <h2 id="sheet-title" className="text-lg font-display font-bold leading-tight text-ink">
                {title}
              </h2>
            )}
            {description && (
              <p id="sheet-description" className="mt-1 text-xs text-ink/65 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close sheet"
            className="rounded-xl p-2 text-ink/50 hover:text-ink hover:bg-moss transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-500 cursor-pointer active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar pr-1">{children}</div>
      </div>
    </div>
  );
}
