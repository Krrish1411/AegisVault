import * as React from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { webClipboard } from '@/platform/web/WebClipboardPort';

export interface SecretInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string | undefined;
  allowCopy?: boolean;
  onCopied?: () => void;
}

export const SecretInput = React.forwardRef<HTMLInputElement, SecretInputProps>(
  ({ className, error, value, allowCopy = true, onCopied, disabled, ...props }, ref) => {
    const [revealed, setRevealed] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const toggleReveal = () => {
      setRevealed((prev) => !prev);
    };

    const handleCopy = async () => {
      if (!value) return;
      try {
        await webClipboard.writeText(String(value), { autoClearMs: 30000 });
        setCopied(true);
        onCopied?.();
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard error handled gracefully
      }
    };

    return (
      <div className="relative w-full">
        <div className="relative flex items-center">
          <input
            type={revealed ? 'text' : 'password'}
            value={value}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-lpignore="true"
            className={cn(
              'flex h-11 w-full rounded-xl border border-line bg-card px-3.5 py-2 text-base sm:text-sm text-ink placeholder:text-ink/35 font-mono transition-all shadow-xs outline-none',
              'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              allowCopy ? 'pr-20' : 'pr-10',
              error && 'border-danger focus-visible:ring-danger/20 focus-visible:border-danger',
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button
              type="button"
              onClick={toggleReveal}
              aria-label={revealed ? 'Hide secret' : 'Reveal secret'}
              className="p-1 text-text-muted hover:text-text-primary rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
              tabIndex={0}
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>

            {allowCopy && (
              <button
                type="button"
                onClick={handleCopy}
                disabled={!value}
                aria-label={copied ? 'Copied to clipboard' : 'Copy secret'}
                className={cn(
                  'p-1 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors',
                  copied ? 'text-success' : 'text-text-muted hover:text-text-primary disabled:opacity-30'
                )}
                tabIndex={0}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
SecretInput.displayName = 'SecretInput';
