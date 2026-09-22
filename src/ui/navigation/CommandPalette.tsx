import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Key,
  CreditCard,
  Landmark,
  UserCheck,
  FileText,
  ShieldCheck,
  Sparkles,
  Settings,
  Lock,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  const decryptedVault = appVaultService.getDecryptedVault();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build items list
  const filteredItems = React.useMemo(() => {
    if (!decryptedVault) return [];
    const q = query.toLowerCase().trim();
    if (!q) return decryptedVault.items.slice(0, 10);

    return decryptedVault.items.filter((it) => {
      const matchTitle = it.title.toLowerCase().includes(q);
      const matchType = it.type.toLowerCase().includes(q);
      const matchTag = (it.tags ?? []).some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchType || matchTag;
    }).slice(0, 15);
  }, [decryptedVault, query]);

  // Static commands
  const staticCommands = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    const cmds = [
      { id: 'nav-passwords', title: 'Go to Passwords & Logins', icon: Key, action: () => navigate('/passwords') },
      { id: 'nav-cards', title: 'Go to Cards & Payment Methods', icon: CreditCard, action: () => navigate('/cards') },
      { id: 'nav-banking', title: 'Go to Bank Accounts & UPI', icon: Landmark, action: () => navigate('/banking') },
      { id: 'nav-identity', title: 'Go to Identities & Gov IDs', icon: UserCheck, action: () => navigate('/identity') },
      { id: 'nav-notes', title: 'Go to Secure Notes', icon: FileText, action: () => navigate('/notes') },
      { id: 'nav-generator', title: 'Generate Strong Secret / Passphrase', icon: Sparkles, action: () => navigate('/generator') },
      { id: 'nav-security', title: 'Run Security Center Audit', icon: ShieldCheck, action: () => navigate('/security-center') },
      { id: 'nav-settings', title: 'Open Vault Settings', icon: Settings, action: () => navigate('/settings') },
      {
        id: 'act-theme',
        title: `Toggle Theme (${theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'})`,
        icon: theme === 'dark' ? Sun : Moon,
        action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'act-lock',
        title: 'Lock Vault Now (Cmd+L)',
        icon: Lock,
        action: async () => {
          await appVaultService.lockVault();
          navigate('/unlock');
        },
      },
    ];

    if (!q) return cmds;
    return cmds.filter((c) => c.title.toLowerCase().includes(q));
  }, [query, navigate, theme, setTheme]);

  const totalEntries = filteredItems.length + staticCommands.length;

  const handleSelect = (index: number) => {
    if (index < filteredItems.length) {
      const item = filteredItems[index];
      if (item) {
        if (item.type === 'credit_card' || item.type === 'debit_card') navigate('/cards');
        else if (item.type === 'bank_account' || item.type === 'upi') navigate('/banking');
        else if (item.type === 'identity' || item.type === 'pan' || item.type === 'aadhaar' || item.type === 'passport' || item.type === 'driving_license') navigate('/identity');
        else if (item.type === 'secure_note') navigate('/notes');
        else navigate('/passwords');
      }
    } else {
      const cmdIndex = index - filteredItems.length;
      const cmd = staticCommands[cmdIndex];
      cmd?.action();
    }
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalEntries));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalEntries) % Math.max(1, totalEntries));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-ink/40 backdrop-blur-md p-4 anim-fade-up"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-card shadow-modal backdrop-blur-md anim-pop"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center border-b border-line px-4 py-3.5 gap-3">
          <Search className="h-5 w-5 text-ink/45 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search 150+ accounts, cards, notes..."
            className="flex-1 bg-transparent text-sm font-medium text-ink placeholder:text-ink/35 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-lg border border-line bg-moss px-2 py-0.5 text-[10px] text-ink/65 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredItems.length > 0 && (
            <div>
              <div className="px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-ink/45 font-mono">
                Vault Records ({filteredItems.length})
              </div>
              {filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left active:scale-[0.99] cursor-pointer ${
                      isSelected
                        ? 'bg-pine-600 text-white font-semibold shadow-xs'
                        : 'text-ink hover:bg-moss'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Key className="h-3.5 w-3.5 shrink-0 opacity-75" />
                      <span className="truncate">{item.title}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-moss text-ink/60 border border-line/60'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          <div>
            <div className="px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-ink/45 font-mono">
              Quick Actions
            </div>
            {staticCommands.map((cmd, idx) => {
              const actualIdx = filteredItems.length + idx;
              const isSelected = actualIdx === selectedIndex;
              const IconComp = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => handleSelect(actualIdx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left active:scale-[0.99] cursor-pointer ${
                    isSelected
                      ? 'bg-pine-600 text-white font-semibold shadow-xs'
                      : 'text-ink hover:bg-moss'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="h-4 w-4 shrink-0 opacity-80" />
                    <span>{cmd.title}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {totalEntries === 0 && (
            <div className="py-8 text-center text-xs text-ink/40">
              No matching records or actions found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
