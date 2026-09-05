import { Sliders } from 'lucide-react';
import { useUiStore } from '@/state/uiStore';
import { cn } from '@/lib/utils';

export function ModeToggle() {
  const appMode = useUiStore((s) => s.appMode);
  const setAppMode = useUiStore((s) => s.setAppMode);
  const addToast = useUiStore((s) => s.addToast);

  const toggle = () => {
    const nextMode = appMode === 'simple' ? 'advanced' : 'simple';
    setAppMode(nextMode);
    addToast({
      title: nextMode === 'advanced' ? 'Advanced Mode Enabled' : 'Simple Mode Enabled',
      description:
        nextMode === 'advanced'
          ? 'Custom fields, crypto parameters, and raw secret inspector unlocked.'
          : 'Streamlined essential fields active.',
      variant: 'default',
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer active:scale-95 shadow-xs',
        appMode === 'advanced'
          ? 'border-accent/40 bg-accent/15 text-accent shadow-xs'
          : 'border-line bg-card/60 text-ink/60 hover:text-ink hover:bg-moss'
      )}
      title="Toggle Simple vs Advanced Interface"
    >
      <Sliders className="h-3 w-3" />
      <span className="capitalize">{appMode}</span>
    </button>
  );
}
