import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, startIcon, endIcon, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {startIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none">
            {startIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-11 w-full rounded-xl border border-line bg-card px-3.5 py-2 text-base sm:text-sm text-ink placeholder:text-ink/35 transition-all shadow-xs outline-none',
            'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            startIcon && 'pl-10',
            endIcon && 'pr-10',
            error && 'border-danger focus-visible:ring-danger/20 focus-visible:border-danger',
            className
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40">
            {endIcon}
          </div>
        )}
        {error && <p className="mt-1.5 text-xs text-flare-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
