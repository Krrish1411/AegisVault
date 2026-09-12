import * as React from 'react';
import {
  Shield,
  Moon,
  Sun,
  Laptop,
  Clock,
  HardDrive,
  Cpu,
  WifiOff,
  Clipboard,
  EyeOff,
  KeyRound,
  Download,
  Upload,
  FileArchive,
  Share2,
  Printer,
  AlertTriangle,
  FileText,
  Database,
  Sparkles,
  Trash2,
  Users,
  Key,
  Keyboard,
  RotateCcw,
  Edit3,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/primitives/Card';
import { Button } from '@/ui/primitives/Button';
import { Badge } from '@/ui/primitives/Badge';
import { Input } from '@/ui/primitives/Input';
import { Dialog } from '@/ui/primitives/Dialog';
import { ChangePasswordModal } from '@/features/recovery/ChangePasswordModal';
import { ExportBackupModal } from '@/features/backup/ExportBackupModal';
import { ImportBackupModal } from '@/features/backup/ImportBackupModal';
import { ExportShareModal } from '@/features/sharing/ExportShareModal';
import { ImportShareModal } from '@/features/sharing/ImportShareModal';
import { EmergencyKitModal } from '@/features/emergency/EmergencyKitModal';
import { EmergencyAccessModal } from '@/features/emergency/EmergencyAccessModal';
import { EmergencyUnlockModal } from '@/features/emergency/EmergencyUnlockModal';
import { ImportExternalModal } from '@/features/migration/ImportExternalModal';
import { VaultUpgradeModal } from '@/features/migration/VaultUpgradeModal';
import { BuyMeACoffeeButton } from '@/ui/primitives/BuyMeACoffeeButton';
import {
  getShortcuts,
  saveShortcut,
  resetAllShortcuts,
  formatShortcut,
  type ShortcutAction,
} from '@/domain/shortcuts/shortcutEngine';
import { seedActiveVaultWithDemoData } from '@/domain/demo/demoSeeder';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore, type ThemePalette } from '@/state/uiStore';
import { useSessionStore } from '@/state/sessionStore';
import type { ThemeMode } from '@/domain/vault/types';

export function SettingsScreen() {
  const navigate = useNavigate();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const themePalette = useUiStore((state) => state.themePalette);
  const setThemePalette = useUiStore((state) => state.setThemePalette);
  const addToast = useUiStore((state) => state.addToast);

  const autoLockMinutes = useSessionStore((state) => state.autoLockMinutes);
  const setAutoLockMinutes = useSessionStore((state) => state.setAutoLockMinutes);
  const lockOnVisibilityHidden = useSessionStore((state) => state.lockOnVisibilityHidden);
  const setLockOnVisibilityHidden = useSessionStore((state) => state.setLockOnVisibilityHidden);
  const clipboardClearSeconds = useSessionStore((state) => state.clipboardClearSeconds);
  const setClipboardClearSeconds = useSessionStore((state) => state.setClipboardClearSeconds);

  // Modals state
  const [showChangePasswordModal, setShowChangePasswordModal] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [showExportShareModal, setShowExportShareModal] = React.useState(false);
  const [showImportShareModal, setShowImportShareModal] = React.useState(false);
  const [showEmergencyKitModal, setShowEmergencyKitModal] = React.useState(false);
  const [showEmergencyAccessModal, setShowEmergencyAccessModal] = React.useState(false);
  const [showEmergencyUnlockModal, setShowEmergencyUnlockModal] = React.useState(false);
  const [showExternalImportModal, setShowExternalImportModal] = React.useState(false);
  const [showVaultUpgradeModal, setShowVaultUpgradeModal] = React.useState(false);

  // Dynamic Keyboard Shortcuts state
  const [shortcuts, setShortcuts] = React.useState<ShortcutAction[]>(() => getShortcuts());
  const [editingShortcut, setEditingShortcut] = React.useState<ShortcutAction | null>(null);
  const [newKeyString, setNewKeyString] = React.useState('');

  React.useEffect(() => {
    const handleUpdated = () => {
      setShortcuts(getShortcuts());
    };
    window.addEventListener('aegis-shortcuts-updated', handleUpdated);
    return () => window.removeEventListener('aegis-shortcuts-updated', handleUpdated);
  }, []);

  const handleStartEdit = (sc: ShortcutAction) => {
    setEditingShortcut(sc);
    setNewKeyString(sc.currentKey);
  };

  const handleSaveEdit = () => {
    if (!editingShortcut || !newKeyString.trim()) return;
    const updated = saveShortcut(editingShortcut.id, newKeyString);
    setShortcuts(updated);
    setEditingShortcut(null);
    addToast({
      title: 'Shortcut Saved',
      description: `Updated shortcut for "${editingShortcut.title}" to ${newKeyString.trim()}`,
      variant: 'success',
    });
  };

  const handleResetShortcuts = () => {
    if (confirm('Reset all keyboard shortcuts to factory defaults?')) {
      const reset = resetAllShortcuts();
      setShortcuts(reset);
      setEditingShortcut(null);
      addToast({
        title: 'Shortcuts Reset',
        description: 'All shortcuts restored to defaults.',
        variant: 'default',
      });
    }
  };

  // Danger Zone Modals state
  const [showClearDataModal, setShowClearDataModal] = React.useState(false);
  const [showPurgeVaultModal, setShowPurgeVaultModal] = React.useState(false);
  const [isClearing, setIsClearing] = React.useState(false);
  const [isPurging, setIsPurging] = React.useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = React.useState('');

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    addToast({
      title: 'Theme updated',
      description: `Theme set to ${newTheme} mode.`,
      variant: 'default',
    });
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in w-full">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings & Security</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Configure interface appearance, session safety parameters, and manage encrypted backups.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Master Password & Recovery Card */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Master Password & Key Management</CardTitle>
              <CardDescription className="text-xs">
                Update your master passphrase. The underlying Vault Encryption Key is re-wrapped with zero re-encryption delay.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-surface-subtle">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Master Passphrase</p>
                    <p className="text-xs text-text-secondary">Argon2id key derivation & XChaCha20 wrapping</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowVaultUpgradeModal(true)}
                    className="text-xs gap-1.5 text-accent"
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    <span>Upgrade KDF</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowChangePasswordModal(true)}
                    className="text-xs"
                  >
                    Change Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Encrypted Backup & Portability */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Encrypted Portability & Backups</CardTitle>
              <CardDescription className="text-xs">
                Export or restore full encrypted snapshots (.aegisvault), or import accounts from other password managers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Export Card */}
                <div className="p-4 rounded-lg border border-border bg-surface-subtle space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-accent" />
                      <span className="text-xs font-semibold text-text-primary">Export Encrypted Backup</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Downloads an encrypted `.aegisvault` container containing your complete vault payload.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowExportModal(true)}
                    className="w-full text-xs gap-1.5"
                  >
                    <FileArchive className="h-3.5 w-3.5" />
                    <span>Create Backup</span>
                  </Button>
                </div>

                {/* Import Backup Card */}
                <div className="p-4 rounded-lg border border-border bg-surface-subtle space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-accent" />
                      <span className="text-xs font-semibold text-text-primary">Restore from Backup</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Restore or merge items from a previous encrypted `.aegisvault` file.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowImportModal(true)}
                    className="w-full text-xs gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Import Backup</span>
                  </Button>
                </div>

                {/* Third-Party Migration / CSV Card */}
                <div className="p-4 rounded-lg border border-accent/40 bg-accent/5 space-y-3 flex flex-col justify-between shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-accent" />
                      <span className="text-xs font-bold text-text-primary">Import CSV & Password Managers</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Import from CSV, Bitwarden, 1Password, Proton Pass, Chrome, LastPass, or KeePass.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setShowExternalImportModal(true)}
                    className="w-full text-xs gap-1.5 font-semibold"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Import Passwords / CSV</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Appearance & Theming</CardTitle>
              <CardDescription className="text-xs">
                Choose your preferred visual theme and accent palette. Supports high-contrast light and dark modes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-xs font-medium transition-all ${
                    theme === 'dark'
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-border bg-surface-subtle text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Moon className="h-5 w-5" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-xs font-medium transition-all ${
                    theme === 'light'
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-border bg-surface-subtle text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Sun className="h-5 w-5" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-xs font-medium transition-all ${
                    theme === 'system'
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-border bg-surface-subtle text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Laptop className="h-5 w-5" />
                  <span>System</span>
                </button>
              </div>

              {/* Theme Palette Chooser */}
              <div className="pt-3 border-t border-border space-y-2">
                <label className="text-xs font-semibold text-text-primary">Theme Palette Accent</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'proton', name: 'Proton Violet', color: '#6d4aff' },
                    { id: 'indigo', name: 'Linear Indigo', color: '#5865f2' },
                    { id: 'slate', name: 'Titanium Slate', color: '#38bdf8' },
                    { id: 'amber', name: 'Sunset Amber', color: '#d97706' },
                    { id: 'pine', name: 'Botanical Pine', color: '#12855a' },
                  ].map((p) => {
                    const isSelected = themePalette === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setThemePalette(p.id as ThemePalette);
                          addToast({
                            title: 'Theme palette updated',
                            description: `Switched to ${p.name}.`,
                          });
                        }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'border-accent bg-accent/10 text-accent font-bold shadow-xs'
                            : 'border-border bg-surface-subtle text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="truncate">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Safety & Inactivity Auto-Lock */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Session Safety & Auto-Lock</CardTitle>
              <CardDescription className="text-xs">
                Automatically lock vault and purge decrypted key material from memory when inactive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Auto-Lock Inactivity Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Inactivity Auto-Lock</p>
                    <p className="text-xs text-text-secondary">Wipes decrypted memory session after idle time</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: '1m', val: 1 },
                    { label: '5m', val: 5 },
                    { label: '10m', val: 10 },
                    { label: '15m', val: 15 },
                    { label: '30m', val: 30 },
                    { label: 'Never', val: 0 },
                  ].map((item) => (
                    <Button
                      key={item.val}
                      size="sm"
                      variant={autoLockMinutes === item.val ? 'default' : 'outline'}
                      onClick={() => {
                        setAutoLockMinutes(item.val);
                        addToast({
                          title: 'Auto-lock updated',
                          description:
                            item.val > 0
                              ? `Vault will lock after ${item.val} minutes of inactivity.`
                              : 'Auto-lock disabled.',
                        });
                      }}
                      className="h-8 px-2.5 text-xs"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Clipboard Auto-Clear Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <Clipboard className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Clipboard Auto-Clear</p>
                    <p className="text-xs text-text-secondary">Wipes copied passwords and secrets from OS clipboard</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: '10s', val: 10 },
                    { label: '20s (Default)', val: 20 },
                    { label: '30s', val: 30 },
                    { label: '60s', val: 60 },
                    { label: 'Never', val: 0 },
                  ].map((item) => (
                    <Button
                      key={item.val}
                      size="sm"
                      variant={clipboardClearSeconds === item.val ? 'default' : 'outline'}
                      onClick={() => {
                        setClipboardClearSeconds(item.val);
                        addToast({
                          title: 'Clipboard timeout updated',
                          description:
                            item.val > 0
                              ? `Copied secrets will auto-clear in ${item.val} seconds.`
                              : 'Clipboard auto-clear disabled.',
                        });
                      }}
                      className="h-8 px-2.5 text-xs"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Lock on Visibility Change Toggle */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <EyeOff className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Lock on Tab Switch / Window Blur</p>
                    <p className="text-xs text-text-secondary">
                      Immediately locks the vault when you switch browser tabs or minimize window
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={lockOnVisibilityHidden}
                  onChange={(e) => {
                    setLockOnVisibilityHidden(e.target.checked);
                    addToast({
                      title: 'Visibility protection updated',
                      description: e.target.checked
                        ? 'Vault will lock immediately when switching tabs.'
                        : 'Tab switch locking disabled.',
                    });
                  }}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Family & Peer Encrypted Sharing */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Granular Sharing & Family Packages</CardTitle>
                <Badge variant="accent">End-to-End Encrypted</Badge>
              </div>
              <CardDescription className="text-xs">
                Share full vaults, specific folders, or selected credentials using independent sharing passphrases. Your master passphrase is never revealed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-surface-subtle p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                      <Share2 className="h-4 w-4 text-accent" />
                      <span>Export Encrypted Package</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Bundle and encrypt items with a custom recipient passphrase and role assignment.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowExportShareModal(true)}
                    className="w-full gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Create .aegispkg</span>
                  </Button>
                </div>

                <div className="rounded-lg border border-border bg-surface-subtle p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                      <Upload className="h-4 w-4 text-accent" />
                      <span>Import Sharing Package</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Decrypt incoming .aegispkg bundles and merge items into your current vault.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowImportShareModal(true)}
                    className="w-full gap-1.5 text-xs"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Import .aegispkg</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Access & Digital Legacy */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Emergency Access & Digital Legacy</CardTitle>
                <Badge variant="accent">Zero-Knowledge Grants</Badge>
              </div>
              <CardDescription className="text-xs">
                Designate trusted beneficiaries or legal executors with encrypted grant tokens, security waiting periods, and physical cold storage kits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Digital Emergency Grants */}
                <div className="rounded-lg border border-border bg-surface-subtle p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                      <Users className="h-4 w-4 text-accent" />
                      <span>Trusted Beneficiaries</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Create encrypted emergency packages with custom waiting notices (0 to 30 days) and PIN protection.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setShowEmergencyAccessModal(true)}
                      className="flex-1 gap-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Manage Contacts</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowEmergencyUnlockModal(true)}
                      className="gap-1.5 text-xs cursor-pointer"
                      title="Beneficiary Unlock Tool"
                    >
                      <Key className="h-3.5 w-3.5" />
                      <span>Unlock Tool</span>
                    </Button>
                  </div>
                </div>

                {/* Printable Cold Emergency Kit */}
                <div className="rounded-lg border border-border bg-surface-subtle p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                      <Printer className="h-4 w-4 text-accent" />
                      <span>Physical Cold Kit</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Print an offline recovery document for a physical safe or safety deposit box with recovery phrase and critical items.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEmergencyKitModal(true)}
                    className="w-full gap-1.5 text-xs cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Print Emergency Kit</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Keyboard Shortcuts Management */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-accent" />
                  <CardTitle className="text-base font-semibold">Keyboard Shortcuts & Hotkeys</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetShortcuts}
                  className="h-8 text-xs gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Defaults</span>
                </Button>
              </div>
              <CardDescription className="text-xs">
                Customize hotkeys for navigation, global search, and instant emergency locking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="rounded-xl border border-line bg-card divide-y divide-line overflow-hidden shadow-xs">
                {shortcuts.map((sc) => {
                  const keys = formatShortcut(sc.currentKey);
                  return (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-moss/40 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{sc.title}</span>
                          <span className="text-[10px] font-mono text-ink/40 uppercase">
                            {sc.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink/55 truncate">
                          {sc.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1">
                          {keys.map((k, i) => (
                            <kbd
                              key={i}
                              className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md border border-line bg-moss px-1.5 font-mono text-[10px] font-bold text-ink shadow-xs"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(sc)}
                          className="h-7 px-2 text-xs text-accent hover:text-accent font-medium cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-1" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Security Diagnostics & Information */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Security Architecture & Audit</CardTitle>
                <Badge variant="success">SAIF Compliant</Badge>
              </div>
              <CardDescription className="text-xs">
                Verified cryptographic specifications and privacy guarantees.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg border border-border bg-surface-subtle p-3 space-y-1">
                  <div className="flex items-center gap-2 text-text-primary font-medium">
                    <Cpu className="h-4 w-4 text-accent" />
                    <span>Key Derivation (KDF)</span>
                  </div>
                  <p className="text-text-secondary">Argon2id (64MB memory-hard)</p>
                </div>

                <div className="rounded-lg border border-border bg-surface-subtle p-3 space-y-1">
                  <div className="flex items-center gap-2 text-text-primary font-medium">
                    <Shield className="h-4 w-4 text-accent" />
                    <span>Primary Vault Cipher</span>
                  </div>
                  <p className="text-text-secondary">XChaCha20-Poly1305 IETF (256-bit)</p>
                </div>

                <div className="rounded-lg border border-border bg-surface-subtle p-3 space-y-1">
                  <div className="flex items-center gap-2 text-text-primary font-medium">
                    <HardDrive className="h-4 w-4 text-accent" />
                    <span>Storage Engine</span>
                  </div>
                  <p className="text-text-secondary">Local IndexedDB Storage Port</p>
                </div>

                <div className="rounded-lg border border-border bg-surface-subtle p-3 space-y-1">
                  <div className="flex items-center gap-2 text-text-primary font-medium">
                    <WifiOff className="h-4 w-4 text-accent" />
                    <span>Network Policy</span>
                  </div>
                  <p className="text-text-secondary">0 requests / strictly offline</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Dataset & Evaluation Lab */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Evaluation Lab & Demo Dataset</CardTitle>
                <Badge variant="accent">150+ Records</Badge>
              </div>
              <CardDescription className="text-xs">
                Populate your vault with realistic mock records (logins, cards, Indian IDs, bank accounts, UPI, notes, and attachments) to explore the entire UI/UX.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-accent/30 bg-accent/5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-text-primary flex items-center gap-2">
                    <Database className="h-4 w-4 text-accent" />
                    <span>Seed 150+ Realistic Entries & Attachments</span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Includes Google, GitHub, Netflix, Credit/Debit cards with Luhn numbers, Indian PAN/Aadhaar/Passports, UPI handles, Markdown notes, crypto wallet seeds, and mock encrypted PDFs/PNGs.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={async () => {
                    try {
                      const res = await seedActiveVaultWithDemoData();
                      addToast({
                        title: 'Demo Vault Populated',
                        description: `Loaded ${res.itemCount} realistic records and ${res.attachmentCount} encrypted attachments.`,
                        variant: 'success',
                      });
                    } catch (err) {
                      addToast({
                        title: 'Seeding Error',
                        description: err instanceof Error ? err.message : 'Failed to seed demo data',
                        variant: 'danger',
                      });
                    }
                  }}
                  className="gap-1.5 shrink-0 text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Load 150 Demo Records</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone: Data & Vault Management */}
          <Card className="border-danger/30 bg-surface">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-danger">Danger Zone: Data & Vault Management</CardTitle>
                <Badge variant="danger">Irreversible Actions</Badge>
              </div>
              <CardDescription className="text-xs">
                Purge all inserted records to reset your vault, or permanently destroy the entire encrypted local database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Clear All Data */}
                <div className="p-4 rounded-lg border border-border bg-surface-subtle space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                      <Trash2 className="h-4 w-4 text-warning" />
                      <span>Clear All Vault Records</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Deletes all credentials, cards, bank accounts, and notes while preserving your master password and vault configuration.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowClearDataModal(true)}
                    className="w-full text-xs text-warning border-warning/30 hover:bg-warning/10"
                  >
                    Clear All Data
                  </Button>
                </div>

                {/* Purge Entire Vault */}
                <div className="p-4 rounded-lg border border-danger/30 bg-danger/5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-danger">
                      <AlertTriangle className="h-4 w-4 text-danger" />
                      <span>Delete Entire Vault Database</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Permanently wipes the entire encrypted IndexedDB database, all keys, and settings from this browser.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setPurgeConfirmText('');
                      setShowPurgeVaultModal(true);
                    }}
                    className="w-full text-xs"
                  >
                    Delete Entire Vault
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Guide & Feature Tour Navigation Card */}
          <Card className="border-border bg-surface hover:border-accent/40 transition-colors shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-accent" />
                  <CardTitle className="text-base font-semibold">App Guide & Feature Tour</CardTitle>
                </div>
                <Badge variant="accent">Interactive</Badge>
              </div>
              <CardDescription className="text-xs">
                Explore the visual feature tour, verified zero-cloud architecture, cryptographic engine specifications, and comparison matrix.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-line bg-surface-subtle">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-text-primary flex items-center gap-2">
                    <span>AegisVault Onboarding & Security Walkthrough</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Review how AegisVault safeguards credentials, bank accounts, UPI PINs, identities, and documents entirely on your device with zero cloud servers.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => navigate('/welcome')}
                  className="gap-2 shrink-0 text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <span>Open Welcome Tour</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* About AegisVault & Creator */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" />
                  <CardTitle className="text-base font-semibold">About AegisVault</CardTitle>
                </div>
                <Badge variant="accent">v1.0.0 Stable</Badge>
              </div>
              <CardDescription className="text-xs">
                Zero-knowledge, local-first privacy vault with military-grade authenticated cryptography.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-line bg-surface-subtle">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-text-primary">
                    AegisVault Digital Locker
                  </div>
                  <p className="text-xs text-text-secondary">
                    Designed and built from the ground up for total data sovereignty. No cloud dependencies, no trackers, zero network transmission.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/10 shadow-xs">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs text-text-secondary font-medium">Crafted by</span>
                    <span className="text-xs font-black tracking-wide text-accent">
                      Krish Patel
                    </span>
                  </div>
                  <BuyMeACoffeeButton size="sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Clear All Data Confirmation Dialog */}
      <Dialog
        open={showClearDataModal}
        onOpenChange={setShowClearDataModal}
        title="Clear All Vault Data"
        description="Are you sure you want to delete all stored credentials, cards, and secure notes? Your master password and vault containers will be kept intact so you can start fresh."
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 text-xs text-warning font-medium">
            Warning: All items and attachments will be permanently deleted from local storage.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDataModal(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isClearing}
              onClick={async () => {
                setIsClearing(true);
                try {
                  const res = await appVaultService.clearAllItems();
                  addToast({
                    title: 'Vault Data Cleared',
                    description: `Successfully deleted ${res.deletedCount} items and mock attachments.`,
                    variant: 'default',
                  });
                  setShowClearDataModal(false);
                } catch (err) {
                  addToast({
                    title: 'Clear Failed',
                    description: err instanceof Error ? err.message : 'Unknown error',
                    variant: 'danger',
                  });
                } finally {
                  setIsClearing(false);
                }
              }}
            >
              Clear All Data
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Entire Vault Confirmation Dialog */}
      <Dialog
        open={showPurgeVaultModal}
        onOpenChange={setShowPurgeVaultModal}
        title="Permanently Delete Entire Vault"
        description="This will irreversibly destroy your entire encrypted vault, all keys, and settings. Type 'DELETE' to confirm."
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-lg border border-danger/30 bg-danger/5 text-xs text-danger font-medium">
            Caution: After this action, you will be locked out and returned to the initial Welcome screen. All encrypted data will be wiped.
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">Type DELETE to confirm</label>
            <Input
              placeholder="DELETE"
              value={purgeConfirmText}
              onChange={(e) => setPurgeConfirmText(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPurgeVaultModal(false)}
              disabled={isPurging}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={purgeConfirmText !== 'DELETE' || isPurging}
              isLoading={isPurging}
              onClick={async () => {
                setIsPurging(true);
                try {
                  await appVaultService.purgeEntireVault();
                  addToast({
                    title: 'Vault Purged',
                    description: 'Entire vault database permanently destroyed.',
                    variant: 'default',
                  });
                  setShowPurgeVaultModal(false);
                  navigate('/welcome');
                } catch (err) {
                  addToast({
                    title: 'Purge Failed',
                    description: err instanceof Error ? err.message : 'Unknown error',
                    variant: 'danger',
                  });
                  setIsPurging(false);
                }
              }}
            >
              Purge Entire Vault
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Change Password Dialog */}
      <ChangePasswordModal
        open={showChangePasswordModal}
        onOpenChange={setShowChangePasswordModal}
      />

      {/* Export Backup Dialog */}
      <ExportBackupModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
      />

      {/* Import Backup Dialog */}
      <ImportBackupModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImported={() => {
          // Re-trigger any view updates if needed
        }}
      />

      {/* Export Share Dialog */}
      <ExportShareModal
        open={showExportShareModal}
        onOpenChange={setShowExportShareModal}
      />

      {/* Import Share Dialog */}
      <ImportShareModal
        open={showImportShareModal}
        onOpenChange={setShowImportShareModal}
      />

      {/* Emergency Cold Kit Dialog */}
      <EmergencyKitModal
        open={showEmergencyKitModal}
        onOpenChange={setShowEmergencyKitModal}
      />

      {/* Emergency Access & Contacts Dialog */}
      <EmergencyAccessModal
        open={showEmergencyAccessModal}
        onOpenChange={setShowEmergencyAccessModal}
      />

      {/* Emergency Beneficiary Unlock Dialog */}
      <EmergencyUnlockModal
        open={showEmergencyUnlockModal}
        onOpenChange={setShowEmergencyUnlockModal}
      />

      {/* External Password Manager Migration Dialog */}
      <ImportExternalModal
        open={showExternalImportModal}
        onOpenChange={setShowExternalImportModal}
      />

      {/* Vault Cryptographic Profile / KDF Upgrade Dialog */}
      <VaultUpgradeModal
        open={showVaultUpgradeModal}
        onOpenChange={setShowVaultUpgradeModal}
      />

      {/* Edit Shortcut Dialog */}
      <Dialog
        open={Boolean(editingShortcut)}
        onOpenChange={(open) => {
          if (!open) setEditingShortcut(null);
        }}
        title={`Customize Shortcut: ${editingShortcut?.title ?? ''}`}
        description="Press keys in the input box or type key combinations like mod, alt, ctrl, and shift."
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">
              Key Combination
            </label>
            <Input
              value={newKeyString}
              onChange={(e) => setNewKeyString(e.target.value.toLowerCase())}
              placeholder="e.g. mod+k, alt+1, mod+shift+g"
              onKeyDown={(e) => {
                if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
                e.preventDefault();
                const parts: string[] = [];
                if (e.metaKey || e.ctrlKey) parts.push('mod');
                if (e.altKey) parts.push('alt');
                if (e.shiftKey) parts.push('shift');
                parts.push(e.key.toLowerCase());
                setNewKeyString(parts.join('+'));
              }}
            />
            <p className="text-[11px] text-text-muted">
              Press any combination directly in the input above, or type manually (e.g. mod+k, alt+3).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-text-muted">Preview:</span>
            <div className="flex items-center gap-1">
              {formatShortcut(newKeyString || 'mod+k').map((k, i) => (
                <kbd
                  key={i}
                  className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-line bg-moss px-2 font-mono text-xs font-bold text-ink shadow-xs"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-line">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (editingShortcut) {
                  setNewKeyString(editingShortcut.defaultKey);
                }
              }}
              className="text-xs gap-1 text-ink/70"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Use Default ({editingShortcut?.defaultKey})</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingShortcut(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                className="text-xs"
              >
                Save Shortcut
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
