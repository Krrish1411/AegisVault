import * as React from 'react';
import { Key, Globe, User, FileText, Star, Lock, Sparkles, Layers, Clock } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { CustomSelect } from '@/ui/primitives/CustomSelect';
import { GeneratorModal } from '@/features/generator/GeneratorModal';
import type { VaultItemEnvelope, LoginPayload, PasswordHistoryEntry } from '@/domain/vault/types';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';

export interface AddEditPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: VaultItemEnvelope | null;
  onSaved: () => void;
}

export function AddEditPasswordModal({
  open,
  onOpenChange,
  editingItem,
  onSaved,
}: AddEditPasswordModalProps) {
  const addToast = useUiStore((state) => state.addToast);
  const activeVaultId = useUiStore((state) => state.activeVaultId);

  const [title, setTitle] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [favorite, setFavorite] = React.useState(false);
  const [targetVaultId, setTargetVaultId] = React.useState<string>(
    activeVaultId === 'all' ? 'vault-personal' : activeVaultId
  );
  const [expirationOption, setExpirationOption] = React.useState<string>('never');
  const [customExpiryDate, setCustomExpiryDate] = React.useState<string>('');

  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [showGeneratorModal, setShowGeneratorModal] = React.useState(false);

  const vaults = appVaultService.getVaultRecords();
  const vaultOptions = vaults.map((v) => ({
    value: v.id,
    label: v.name,
    description: v.description || 'Secure encrypted container',
  }));

  // Sync with editing item
  React.useEffect(() => {
    if (editingItem) {
      const payload = editingItem.payload as Partial<LoginPayload>;
      setTitle(editingItem.title);
      setUsername(payload.username ?? '');
      setPassword(payload.password ?? '');
      setWebsite(payload.urls?.[0] ?? '');
      setNotes(payload.notes ?? '');
      setFavorite(editingItem.favorite);
      setTargetVaultId(editingItem.vaultId || 'vault-personal');

      if (payload.expirationIntervalDays) {
        setExpirationOption(String(payload.expirationIntervalDays));
        setCustomExpiryDate('');
      } else if (payload.expiresAt) {
        setExpirationOption('custom');
        setCustomExpiryDate(payload.expiresAt.slice(0, 10));
      } else {
        setExpirationOption('never');
        setCustomExpiryDate('');
      }
    } else {
      setTitle('');
      setUsername('');
      setPassword('');
      setWebsite('');
      setNotes('');
      setFavorite(false);
      setTargetVaultId(activeVaultId === 'all' ? 'vault-personal' : activeVaultId);
      setExpirationOption('never');
      setCustomExpiryDate('');
    }
    setError(undefined);
  }, [editingItem, open, activeVaultId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a title (e.g. Google, GitHub)');
      return;
    }
    if (!password) {
      setError('Please enter or generate a password');
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const now = new Date().toISOString();

      let expiresAt: string | undefined = undefined;
      let expirationIntervalDays: number | undefined = undefined;

      if (expirationOption === 'custom' && customExpiryDate) {
        expiresAt = new Date(`${customExpiryDate}T23:59:59.999Z`).toISOString();
      } else if (expirationOption !== 'never' && !isNaN(Number(expirationOption))) {
        const days = Number(expirationOption);
        expirationIntervalDays = days;
        expiresAt = new Date(Date.now() + days * 86400000).toISOString();
      }

      const oldPayload = editingItem ? (editingItem.payload as Partial<LoginPayload>) : null;
      const isPasswordChanged = oldPayload ? oldPayload.password !== password : true;
      const lastPasswordRotatedAt = isPasswordChanged
        ? now
        : (oldPayload?.lastPasswordRotatedAt ?? now);

      const loginPayload: LoginPayload = {
        username: username.trim(),
        password,
        urls: website.trim() ? [website.trim()] : [],
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(expiresAt ? { expiresAt } : {}),
        ...(expirationIntervalDays ? { expirationIntervalDays } : {}),
        lastPasswordRotatedAt,
      };

      // Handle password history if password was changed on an existing item
      let history: PasswordHistoryEntry[] = [...(editingItem?.passwordHistory ?? [])];
      if (editingItem && oldPayload) {
        if (oldPayload.password && oldPayload.password !== password) {
          const newHistoryEntry: PasswordHistoryEntry = {
            id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            password: oldPayload.password,
            archivedAt: now,
          };
          history = [newHistoryEntry, ...history].slice(0, 10);
        }
      }

      const item: VaultItemEnvelope = {
        id: editingItem?.id ?? `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: 'login',
        title: title.trim(),
        favorite,
        archived: editingItem?.archived ?? false,
        vaultId: targetVaultId,
        createdAt: editingItem?.createdAt ?? now,
        updatedAt: now,
        expiresAt,
        payload: loginPayload as unknown as Record<string, unknown>,
        ...(history.length > 0 ? { passwordHistory: history } : {}),
      };

      await appVaultService.saveItem(item);

      addToast({
        title: editingItem ? 'Password Updated' : 'Password Saved',
        description: `"${title}" has been encrypted and saved to your vault.`,
        variant: 'success',
      });

      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={editingItem ? 'Edit Password' : 'Add New Password'}
        description="Credential fields are encrypted in an authenticated container before saving."
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Title & Favorite */}
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <label htmlFor="item-title" className="text-xs font-medium text-text-secondary">
                Title / Service Name
              </label>
              <Input
                id="item-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. GitHub, Google, ProtonMail"
                disabled={isSaving}
                autoFocus
                required
              />
            </div>

            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              title={favorite ? 'Remove from favorites' : 'Mark as favorite'}
              className={`mt-6 flex h-10 w-10 items-center justify-center rounded-xl border transition-colors cursor-pointer active:scale-95 ${
                favorite
                  ? 'border-warning/50 bg-warning/10 text-warning'
                  : 'border-border bg-surface text-text-muted hover:text-text-primary'
              }`}
            >
              <Star className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Vault Target & Website URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-accent" />
                <span>Store in Vault</span>
              </label>
              <CustomSelect
                value={targetVaultId}
                onChange={setTargetVaultId}
                options={vaultOptions}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="item-website" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                <span>Website URL</span>
              </label>
              <Input
                id="item-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://github.com"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Username / Email */}
          <div className="space-y-1">
            <label htmlFor="item-username" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>Username or Email</span>
            </label>
            <Input
              id="item-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user@example.com"
              disabled={isSaving}
            />
          </div>

          {/* Password + Generate Button */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="item-password" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" />
                <span>Password</span>
              </label>
              <button
                type="button"
                onClick={() => setShowGeneratorModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline focus:outline-none cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Open Generator</span>
              </button>
            </div>
            <SecretInput
              id="item-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter or generate password..."
              disabled={isSaving}
              allowCopy={false}
            />
          </div>

          {/* Password Expiration & Age Policy */}
          <div className="space-y-2 p-3 rounded-xl border border-line bg-surface-subtle">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-accent" />
                <span>Password Expiration Policy</span>
              </label>
              <span className="text-[11px] font-mono text-accent font-semibold">
                {expirationOption === 'never'
                  ? 'Never expires'
                  : expirationOption === 'custom'
                    ? customExpiryDate ? `Expires: ${customExpiryDate}` : 'Select date'
                    : `Expires in ${expirationOption} days`}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-0.5">
              {[
                { id: 'never', label: 'Never' },
                { id: '30', label: '30 Days' },
                { id: '60', label: '60 Days' },
                { id: '90', label: '90 Days' },
                { id: '180', label: '180 Days' },
                { id: '365', label: '1 Year' },
                { id: 'custom', label: 'Custom' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setExpirationOption(opt.id)}
                  className={`py-1 px-2 rounded-lg text-xs font-medium border transition-all cursor-pointer text-center ${
                    expirationOption === opt.id
                      ? 'bg-accent text-accent-foreground border-accent shadow-xs'
                      : 'bg-card text-ink/75 border-line hover:border-accent/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {expirationOption === 'custom' && (
              <div className="pt-1.5">
                <label className="text-[10px] text-text-muted block mb-1">Select Custom Expiration Date</label>
                <Input
                  type="date"
                  value={customExpiryDate}
                  onChange={(e) => setCustomExpiryDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  disabled={isSaving}
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label htmlFor="item-notes" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>Notes (Encrypted)</span>
            </label>
            <textarea
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional secure notes..."
              rows={2}
              disabled={isSaving}
              className="flex w-full rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-ink/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button type="submit" size="sm" isLoading={isSaving} disabled={isSaving} className="gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>{editingItem ? 'Save Changes' : 'Encrypt & Save'}</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Embedded Secret Generator Modal */}
      <GeneratorModal
        open={showGeneratorModal}
        onOpenChange={setShowGeneratorModal}
        onSelectSecret={(secret) => {
          setPassword(secret);
          if (error) setError(undefined);
        }}
      />
    </>
  );
}
