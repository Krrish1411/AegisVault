import * as React from 'react';
import { Palette, Sun, Moon, Check } from 'lucide-react';
import { useUiStore, type ThemePalette } from '@/state/uiStore';
import { cn } from '@/lib/utils';

export function ThemeSelector() {
  const [open, setOpen] = React.useState(false);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const themePalette = useUiStore((s) => s.themePalette);
  const setThemePalette = useUiStore((s) => s.setThemePalette);

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const palettes: { id: ThemePalette; name: string; color: string; desc: string }[] = [
    { id: 'cyan', name: 'Luma Cyan', color: '#0284c7', desc: 'Shadcn Preset: Cyber cyan & mist' },
    { id: 'proton', name: 'Proton Violet', color: '#6d4aff', desc: 'Deep obsidian & electric violet' },
    { id: 'indigo', name: 'Linear Indigo', color: '#5865f2', desc: 'Midnight navy & electric blue' },
    { id: 'pine', name: 'Botanical Pine', color: '#12855a', desc: 'Warm moss & deep emerald' },
    { id: 'slate', name: 'Titanium Slate', color: '#38bdf8', desc: 'Minimalist titanium & ice' },
    { id: 'amber', name: 'Sunset Amber', color: '#d97706', desc: 'Warm espresso & gold' },
  ];

  const toggleLightDark = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-9 px-2.5 items-center gap-1.5 rounded-xl border border-line bg-card hover:bg-moss text-xs font-semibold text-ink/70 hover:text-ink transition-all cursor-pointer shadow-xs active:scale-95"
          title="Change Theme Palette"
        >
          <Palette className="h-3.5 w-3.5 text-accent" />
          <span className="hidden sm:inline capitalize">{themePalette}</span>
        </button>

        <button
          type="button"
          onClick={toggleLightDark}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-ink/60 hover:text-ink hover:bg-moss transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-mari-400" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-2xl border border-line bg-card p-1.5 shadow-modal backdrop-blur-md anim-pop">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink/45 font-mono">
            Theme Palettes
          </div>
          <div className="space-y-0.5">
            {palettes.map((p) => {
              const isSelected = themePalette === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setThemePalette(p.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer active:scale-[0.98]',
                    isSelected
                      ? 'bg-moss font-bold text-ink border border-line/60 shadow-xs'
                      : 'text-ink/75 hover:bg-moss hover:text-ink'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-xs border border-white/20"
                      style={{ backgroundColor: p.color }}
                    />
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[10px] text-ink/45">{p.desc}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
