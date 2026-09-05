import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

const maxWidthClasses: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md sm:max-w-lg',
  lg: 'max-w-lg sm:max-w-xl lg:max-w-2xl',
  xl: 'max-w-xl sm:max-w-2xl lg:max-w-3xl',
  '2xl': 'max-w-2xl sm:max-w-3xl lg:max-w-4xl',
  '3xl': 'max-w-3xl sm:max-w-4xl lg:max-w-5xl',
  '4xl': 'max-w-4xl sm:max-w-5xl lg:max-w-6xl',
};

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  size?: DialogSize;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  size = 'xl',
}: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 anim-fade-up">
      {/* Backdrop with unconditional dismiss */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Dialog content with Desktop Widening, perfectly centered on viewport */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-describedby={description ? 'dialog-description' : undefined}
        className={cn(
          'relative z-50 w-full rounded-2xl border border-line bg-card p-6 shadow-modal text-ink transition-all anim-pop max-h-[90vh] flex flex-col',
          maxWidthClasses[size],
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-4 shrink-0 pb-3 border-b border-line/60">
          <div>
            {title && (
              <h2 id="dialog-title" className="text-xl font-display font-bold leading-tight text-ink">
                {title}
              </h2>
            )}
            {description && (
              <p id="dialog-description" className="mt-1 text-xs text-ink/65 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-ink/50 hover:text-ink hover:bg-moss transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-500 cursor-pointer active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">{children}</div>
      </div>
    </div>,
    document.body
  );
}
