import * as React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Shield,
  Key,
  CreditCard,
  Building2,
  FileText,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Settings,
  Lock,
  Menu,
  X,
  Search,
  Wallet,
  Keyboard,
} from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { ToastContainer } from '@/ui/primitives/Toast';
import { CommandPalette } from '@/ui/navigation/CommandPalette';
import { MobileBottomNav } from '@/ui/layout/MobileBottomNav';
import { VaultSwitcher } from '@/ui/navigation/VaultSwitcher';
import { ThemeSelector } from '@/ui/navigation/ThemeSelector';
import { BuyMeACoffeeButton } from '@/ui/primitives/BuyMeACoffeeButton';
import { ImportExternalModal } from '@/features/migration/ImportExternalModal';
import { KeyboardShortcutsModal } from '@/features/shortcuts/KeyboardShortcutsModal';
import { getShortcuts, matchesShortcut } from '@/domain/shortcuts/shortcutEngine';
import { useSessionStore } from '@/state/sessionStore';
import { useUiStore } from '@/state/uiStore';
import { appVaultService } from '@/application/services/AppVaultService';
import { cn } from '@/lib/utils';

export interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = React.useState(false);

  const status = useSessionStore((state) => state.status);
  const addToast = useUiStore((state) => state.addToast);

  const handleLock = React.useCallback(async () => {
    await appVaultService.lockVault();
    addToast({
      title: 'Vault locked',
      description: 'Your decrypted session data and keys have been cleared from memory.',
      variant: 'default',
    });
    navigate('/unlock');
  }, [addToast, navigate]);

  // Global Dynamic Keyboard Shortcuts Engine
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcuts = getShortcuts();
      for (const sc of shortcuts) {
        if (matchesShortcut(e, sc.currentKey)) {
          e.preventDefault();
          switch (sc.id) {
            case 'search':
              setCommandPaletteOpen((prev) => !prev);
              break;
            case 'lock':
              if (status === 'unlocked') {
                handleLock();
              }
              break;
            case 'generator':
              navigate('/generator');
              break;
            case 'shortcuts_help':
              setShortcutsModalOpen((prev) => !prev);
              break;
            case 'nav_dashboard':
              navigate('/dashboard');
              break;
            case 'nav_passwords':
              navigate('/passwords');
              break;
            case 'nav_banking':
              navigate('/banking');
              break;
            case 'nav_cards':
              navigate('/cards');
              break;
            case 'nav_identities':
              navigate('/identity');
              break;
            case 'nav_documents':
              navigate('/documents');
              break;
            case 'nav_notes':
              navigate('/notes');
              break;
            case 'nav_wallets':
              navigate('/wallets');
              break;
            case 'nav_settings':
              navigate('/settings');
              break;
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleLock, navigate]);

  const navItems = [
    { to: '/dashboard', label: 'Vault', icon: <Shield className="h-4 w-4" /> },
    { to: '/passwords', label: 'Passwords', icon: <Key className="h-4 w-4" /> },
    { to: '/generator', label: 'Generator', icon: <Sparkles className="h-4 w-4" /> },
    { to: '/banking', label: 'Banking', icon: <Building2 className="h-4 w-4" /> },
    { to: '/cards', label: 'Cards', icon: <CreditCard className="h-4 w-4" /> },
    { to: '/identity', label: 'Identities', icon: <UserCheck className="h-4 w-4" /> },
    { to: '/documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
    { to: '/notes', label: 'Secure Notes', icon: <FileText className="h-4 w-4" /> },
    { to: '/wallets', label: 'Crypto Wallets', icon: <Wallet className="h-4 w-4" /> },
    { to: '/security-center', label: 'Security Center', icon: <ShieldAlert className="h-4 w-4" /> },
    { to: '/settings', label: 'Settings & Security', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-screen w-full flex-col page-bg text-ink overflow-hidden select-none">
      {/* Executive Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-card/90 px-4 sm:px-6 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-ink/60 hover:text-ink hover:bg-moss"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <NavLink to="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight text-ink group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pine-600/15 text-pine-600 border border-pine-500/25 shadow-xs transition-transform group-hover:scale-105">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-extrabold tracking-tight">AegisVault</span>
          </NavLink>

          <span className="hidden sm:inline-flex ml-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-pine-700 dark:text-pine-300 px-2.5 py-0.5 rounded-full bg-pine-50 dark:bg-pine-950/60 border border-pine-200/60 dark:border-pine-800/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pine-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-pine-500" />
              </span>
              <span>Private / Offline</span>
            </span>
          </span>
        </div>

        {/* Search Command Palette Trigger */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="flex h-9 w-full items-center justify-between rounded-xl border border-line bg-moss/70 hover:bg-moss px-3.5 text-xs text-ink/60 hover:text-ink hover:border-accent/40 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <span className="flex items-center gap-2 font-medium">
              <Search className="h-3.5 w-3.5 text-ink/45" />
              <span>Search 150+ vault records, wallets, cards...</span>
            </span>
            <kbd className="rounded-lg border border-line bg-card px-1.5 py-0.5 text-[10px] font-mono text-ink/65 shadow-xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right utility items */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Palette & Dark Mode Selector */}
          <ThemeSelector />

          {/* Keyboard Shortcuts Guide */}
          <button
            type="button"
            onClick={() => setShortcutsModalOpen(true)}
            aria-label="Keyboard Shortcuts"
            title="Keyboard Shortcuts (Press ? or Cmd+/)"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink/60 hover:text-ink hover:bg-moss transition-colors cursor-pointer"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          <NavLink
            to="/settings"
            aria-label="Settings"
            className={({ isActive }) =>
              cn(
                'flex h-9 w-9 items-center justify-center rounded-xl text-ink/60 hover:text-ink hover:bg-moss transition-colors',
                isActive && 'bg-moss text-ink font-bold'
              )
            }
          >
            <Settings className="h-4 w-4" />
          </NavLink>

          {status === 'unlocked' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLock}
              className="gap-1.5 text-xs text-ink border-line hover:bg-moss h-8 font-medium"
            >
              <Lock className="h-3.5 w-3.5 text-ink/50" />
              <span className="hidden sm:inline">Lock</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden relative pb-16 md:pb-0">
        {/* Desktop Sidebar Navigation */}
        <aside
          className={cn(
            'fixed md:static inset-y-14 left-0 z-30 flex w-64 flex-col justify-between border-r border-line bg-card/85 p-3 transition-transform md:translate-x-0 backdrop-blur-md',
            mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Vault Switcher (1Password/Proton Pass style) */}
            <div className="mb-3 shrink-0">
              <VaultSwitcher />
            </div>

            <nav className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-ink/45">
                Categories
              </div>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.98]',
                      isActive
                        ? 'bg-accent/15 text-accent font-bold border border-accent/25 shadow-xs'
                        : 'text-ink/75 hover:bg-moss hover:text-ink'
                    )
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="border-t border-line pt-3 px-2 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-mono text-ink/50">
              <span>AegisVault v1.0</span>
              <span className="text-pine-600 dark:text-pine-400 font-semibold">Offline Safe</span>
            </div>
            <div className="flex items-center justify-between gap-1 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-ink/70">
                <span className="text-[11px]">Crafted by</span>
                <span className="font-extrabold tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/25 text-[11px] shadow-xs">
                  Krish Patel
                </span>
              </div>
            </div>
            <div className="pt-1">
              <BuyMeACoffeeButton size="sm" className="w-full" />
            </div>
          </div>
        </aside>

        {/* Mobile menu backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-20 bg-ink/30 backdrop-blur-xs md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto page-bg focus:outline-none custom-scrollbar">
          <div className="w-full px-4 sm:px-8 py-6 h-full flex flex-col">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Interactive Command Palette */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      {/* External CSV / Password Manager Importer Modal */}
      <ImportExternalModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={() => navigate('/passwords')}
      />

      {/* Keyboard Shortcuts Cheat-sheet Modal */}
      <KeyboardShortcutsModal
        open={shortcutsModalOpen}
        onOpenChange={setShortcutsModalOpen}
      />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
