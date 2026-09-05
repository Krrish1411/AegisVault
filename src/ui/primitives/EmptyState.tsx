import * as React from 'react';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, primaryAction, secondaryAction, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center sm:p-12',
          className
        )}
        {...props}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-subtle text-accent mb-4 shadow-subtle">
          {icon ?? <Shield className="h-7 w-7" />}
        </div>
        <h3 className="text-base font-semibold text-text-primary tracking-tight">{title}</h3>
        <p className="mt-1.5 max-w-sm text-sm text-text-secondary">{description}</p>
        {(primaryAction || secondaryAction) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';
