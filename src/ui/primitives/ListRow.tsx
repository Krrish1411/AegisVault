import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export interface ListRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  isInteractive?: boolean;
}

export const ListRow = React.forwardRef<HTMLDivElement, ListRowProps>(
  ({ className, icon, title, subtitle, badges, trailing, onClick, isInteractive = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
        className={cn(
          'flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-3.5 transition-all text-text-primary',
          isInteractive && onClick && 'cursor-pointer hover:bg-surface-subtle hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-accent">
              {icon}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-text-primary truncate">{title}</span>
              {badges}
            </div>
            {subtitle && <span className="text-xs text-text-secondary truncate mt-0.5">{subtitle}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {trailing}
          {onClick && !trailing && <ChevronRight className="h-4 w-4 text-text-muted" />}
        </div>
      </div>
    );
  }
);
ListRow.displayName = 'ListRow';
