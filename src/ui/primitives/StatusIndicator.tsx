import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 'locked' | 'unlocked' | 'offline' | 'online' | 'healthy' | 'warning' | 'danger';

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  label?: string;
  showDot?: boolean;
}

const statusConfig: Record<StatusType, { color: string; dotClass: string; defaultLabel: string }> = {
  locked: {
    color: 'text-text-muted',
    dotClass: 'bg-text-muted',
    defaultLabel: 'Locked',
  },
  unlocked: {
    color: 'text-success',
    dotClass: 'bg-success',
    defaultLabel: 'Unlocked',
  },
  offline: {
    color: 'text-text-secondary',
    dotClass: 'bg-accent',
    defaultLabel: 'Offline / Private',
  },
  online: {
    color: 'text-accent',
    dotClass: 'bg-accent',
    defaultLabel: 'Online',
  },
  healthy: {
    color: 'text-success',
    dotClass: 'bg-success',
    defaultLabel: 'Protected',
  },
  warning: {
    color: 'text-warning',
    dotClass: 'bg-warning',
    defaultLabel: 'Attention needed',
  },
  danger: {
    color: 'text-danger',
    dotClass: 'bg-danger',
    defaultLabel: 'Risk detected',
  },
};

export const StatusIndicator = React.forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  ({ className, status, label, showDot = true, ...props }, ref) => {
    const config = statusConfig[status];
    const displayLabel = label ?? config.defaultLabel;

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center gap-1.5 text-xs font-medium', config.color, className)}
        {...props}
      >
        {showDot && (
          <span className="relative flex h-2 w-2">
            <span className={cn('relative inline-flex h-2 w-2 rounded-full', config.dotClass)} />
          </span>
        )}
        {displayLabel && <span>{displayLabel}</span>}
      </span>
    );
  }
);
StatusIndicator.displayName = 'StatusIndicator';
