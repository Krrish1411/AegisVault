import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
}

export interface CustomSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select an option...',
  disabled = false,
  className,
}: CustomSelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Click outside dismissal
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(!open);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const currentIndex = options.findIndex((o) => o.value === value);
      const nextIndex = (currentIndex + 1) % options.length;
      const nextOpt = options[nextIndex];
      if (nextOpt) onChange(nextOpt.value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const currentIndex = options.findIndex((o) => o.value === value);
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      const prevOpt = options[prevIndex];
      if (prevOpt) onChange(prevOpt.value);
    }
  };

  return (
    <div className={cn('relative w-full space-y-1', className)} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-ink/75 block">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-11 w-full flex items-center justify-between gap-2.5 rounded-xl border border-line bg-card px-3.5 text-sm text-ink transition-all shadow-xs outline-none cursor-pointer select-none active:scale-[0.99]',
          open && 'border-accent ring-2 ring-accent/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption?.color && (
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {selectedOption?.icon && (
            <span className="shrink-0 text-ink/60">{selectedOption.icon}</span>
          )}
          <span className="truncate font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-ink/40 transition-transform duration-200 shrink-0',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Floating Menu */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-line bg-card p-1.5 shadow-modal backdrop-blur-md anim-pop custom-scrollbar">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer active:scale-[0.98]',
                  isSelected
                    ? 'bg-pine-50 dark:bg-pine-950/60 text-pine-700 dark:text-pine-300 font-bold border border-pine-200/60 dark:border-pine-800/60 shadow-xs'
                    : 'text-ink/80 hover:bg-moss hover:text-ink'
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {option.color && (
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <div>
                    <div className="font-semibold">{option.label}</div>
                    {option.description && (
                      <div className="text-[10px] text-ink/50 leading-tight">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-pine-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
