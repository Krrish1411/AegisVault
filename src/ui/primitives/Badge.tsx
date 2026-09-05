import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-pine-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-line bg-card text-ink shadow-xs',
        secondary: 'border-line/60 bg-moss text-ink/75',
        accent:
          'border-pine-200/60 dark:border-pine-800/60 bg-pine-50 dark:bg-pine-950/60 text-pine-700 dark:text-pine-300',
        success:
          'border-pine-200/60 dark:border-pine-800/60 bg-pine-50 dark:bg-pine-950/60 text-pine-700 dark:text-pine-300',
        warning:
          'border-mari-200/60 dark:border-mari-700/60 bg-mari-50 dark:bg-mari-800/20 text-mari-700 dark:text-mari-300',
        danger:
          'border-flare-200/60 dark:border-flare-700/60 bg-flare-100 dark:bg-flare-700/20 text-flare-700 dark:text-flare-300',
        skyx:
          'border-skyx-200/60 dark:border-skyx-700/60 bg-skyx-100 dark:bg-skyx-700/20 text-skyx-700 dark:text-skyx-300',
        outline: 'border-line text-ink',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
