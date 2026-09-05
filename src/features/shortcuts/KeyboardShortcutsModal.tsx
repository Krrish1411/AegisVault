import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { getShortcuts, formatShortcut, type ShortcutAction } from '@/domain/shortcuts/shortcutEngine';

export interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const navigate = useNavigate();
  const [shortcuts, setShortcuts] = React.useState<ShortcutAction[]>([]);

  React.useEffect(() => {
    if (open) {
      setShortcuts(getShortcuts());
    }
  }, [open]);

  const categories = ['Actions', 'Navigation', 'General'] as const;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Keyboard Shortcuts"
      description="Navigate AegisVault rapidly using native hardware keyboard shortcuts."
    >
      <div className="space-y-5 pt-2 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
        {categories.map((category) => {
          const categoryItems = shortcuts.filter((s) => s.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink/40">
                {category}
              </div>
              <div className="rounded-xl border border-line bg-card divide-y divide-line overflow-hidden shadow-xs">
                {categoryItems.map((item) => {
                  const keys = formatShortcut(item.currentKey);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-moss/40 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0 pr-4">
                        <div className="font-semibold text-ink">{item.title}</div>
                        <div className="text-[11px] text-ink/55 truncate">
                          {item.description}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {keys.map((k, i) => (
                          <kbd
                            key={i}
                            className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md border border-line bg-moss px-1.5 font-mono text-[10px] font-bold text-ink shadow-xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-3 border-t border-line text-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              navigate('/settings');
            }}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Customize Shortcuts in Settings</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
