import * as React from 'react';
import {
  Key,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Upload,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { Badge } from '@/ui/primitives/Badge';
import {
  inspectEmergencyGrant,
  unlockEmergencyGrant,
  calculateWaitPeriodStatus,
  type EmergencyGrantPackage,
  type WaitPeriodStatus,
} from '@/domain/emergency/emergencyAccessEngine';
import { appVaultService } from '@/application/services/AppVaultService';
import { webClipboard } from '@/platform/web/WebClipboardPort';
import { useUiStore } from '@/state/uiStore';
import type { VaultItemEnvelope } from '@/domain/vault/types';

export interface EmergencyUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmergencyUnlockModal({ open, onOpenChange }: EmergencyUnlockModalProps) {
  const addToast = useUiStore((state) => state.addToast);

  // Step 1: Input Grant & PIN
  const [grantJson, setGrantJson] = React.useState('');
  const [emergencyPin, setEmergencyPin] = React.useState('');
  const [showPin, setShowPin] = React.useState(false);
  const [inspectedGrant, setInspectedGrant] = React.useState<EmergencyGrantPackage | null>(null);

  // State & Results
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [waitStatus, setWaitStatus] = React.useState<WaitPeriodStatus | null>(null);
  const [unlockedItems, setUnlockedItems] = React.useState<VaultItemEnvelope[] | null>(null);
  const [unlockedVaultName, setUnlockedVaultName] = React.useState('');

  // Unlocked Viewer state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<'all' | 'login' | 'finance' | 'identity' | 'note'>('all');
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (open) {
      // Reset state on open
      setGrantJson('');
      setEmergencyPin('');
      setInspectedGrant(null);
      setError(null);
      setWaitStatus(null);
      setUnlockedItems(null);
      setSearchQuery('');
    }
  }, [open]);

  // Inspect package whenever valid JSON is pasted or uploaded
  React.useEffect(() => {
    if (!grantJson.trim()) {
      setInspectedGrant(null);
      setWaitStatus(null);
      return;
    }

    try {
      const inspected = inspectEmergencyGrant(grantJson);
      setInspectedGrant(inspected);
      setError(null);

      // Check if contact exists in current active vault to pull real live status
      const existingContacts = appVaultService.getEmergencyContacts();
      const matched = existingContacts.find((c) => c.id === inspected.grantId);

      const status = calculateWaitPeriodStatus(
        inspected.waitPeriodDays,
        matched?.status ?? 'active',
        matched?.requestDate
      );
      setWaitStatus(status);
    } catch {
      setInspectedGrant(null);
      setWaitStatus(null);
    }
  }, [grantJson]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setGrantJson(content);
    };
    reader.readAsText(file);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!grantJson.trim()) {
      setError('Please provide or upload an emergency grant token.');
      return;
    }
    if (!emergencyPin.trim()) {
      setError('Please enter your secret Emergency Access PIN.');
      return;
    }

    setIsLoading(true);
    try {
      const existingContacts = appVaultService.getEmergencyContacts();
      const matched = existingContacts.find((c) => c.id === inspectedGrant?.grantId);

      const result = await unlockEmergencyGrant(grantJson, emergencyPin, {
        status: matched?.status ?? 'active',
        requestDate: matched?.requestDate,
      });

      setUnlockedItems(result.items);
      setUnlockedVaultName(result.vaultName);
      setWaitStatus(result.waitStatus);

      addToast({
        title: 'Emergency Access Unlocked',
        description: `Successfully decrypted ${result.items.length} records from ${result.vaultName}.`,
        variant: 'success',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to unlock emergency grant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (id: string, text: string, label: string) => {
    await webClipboard.writeText(text, { autoClearMs: 30000 });
    setCopiedField(id);
    addToast({
      title: `${label} Copied`,
      description: 'Copied to clipboard. Clipboard will auto-clear.',
      variant: 'default',
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredItems = React.useMemo(() => {
    if (!unlockedItems) return [];
    return unlockedItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(item.payload).toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeCategory === 'all') return true;
      if (activeCategory === 'login') return item.type === 'login';
      if (activeCategory === 'finance') {
        return ['bank_account', 'credit_card', 'upi', 'upi_pin', 'atm_pin'].includes(item.type);
      }
      if (activeCategory === 'identity') {
        return [
          'identity',
          'pan',
          'aadhaar',
          'passport',
          'driving_license',
          'voter_id',
          'insurance',
          'tax_id',
        ].includes(item.type);
      }
      if (activeCategory === 'note') return item.type === 'secure_note';
      return true;
    });
  }, [unlockedItems, searchQuery, activeCategory]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Emergency Access / Beneficiary Unlock"
      description="Unlock emergency credentials with your designated Emergency Grant Token and secret PIN."
    >
      <div className="space-y-4 pt-1 max-h-[80vh] overflow-y-auto pr-1">
        {/* VIEW 1: Input & Decrypt Form (when not yet unlocked) */}
        {!unlockedItems ? (
          <form onSubmit={handleUnlock} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Grant Token Input / Upload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">
                  Emergency Grant Package (.aegis-emergency)
                </label>
                <label className="text-xs text-accent hover:underline cursor-pointer flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept=".aegis-emergency,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                value={grantJson}
                onChange={(e) => setGrantJson(e.target.value)}
                placeholder="Paste the .aegis-emergency file contents or grant token here..."
                rows={3}
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                required
              />
            </div>

            {/* Inspected Grant Information Banner */}
            {inspectedGrant && (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-text-primary">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    <span>Verified Grant Certificate</span>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {inspectedGrant.accessLevel.toUpperCase()} ACCESS
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono pt-1 text-[11px]">
                  <div>
                    <span className="text-text-muted block">VAULT</span>
                    <span className="font-semibold text-text-primary">{inspectedGrant.vaultName}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block">BENEFICIARY</span>
                    <span className="font-semibold text-text-primary">{inspectedGrant.contactName}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block">SECURITY WAIT</span>
                    <span className="font-semibold text-text-primary">
                      {inspectedGrant.waitPeriodDays === 0
                        ? 'Immediate'
                        : `${inspectedGrant.waitPeriodDays} Days`}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block">STATUS</span>
                    <span className="font-semibold text-text-primary">
                      {waitStatus?.canUnlock ? (
                        <span className="text-success">Ready to Unlock</span>
                      ) : (
                        <span className="text-warning">
                          {waitStatus?.remainingDays || inspectedGrant.waitPeriodDays}d Wait Period
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency PIN Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">
                  Secret Emergency Access PIN
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[10px] text-accent hover:underline cursor-pointer flex items-center gap-1"
                >
                  {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
                <Input
                  type={showPin ? 'text' : 'password'}
                  value={emergencyPin}
                  onChange={(e) => setEmergencyPin(e.target.value)}
                  placeholder="Enter secret PIN provided by vault owner"
                  className="pl-9 h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !grantJson.trim() || !emergencyPin.trim()}
                className="gap-1.5"
              >
                <Key className="h-3.5 w-3.5" />
                <span>{isLoading ? 'Decrypting...' : 'Decrypt Emergency Vault'}</span>
              </Button>
            </div>
          </form>
        ) : (
          /* VIEW 2: Decrypted Beneficiary Credential Viewer */
          <div className="space-y-4">
            {/* Decrypted Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-text-primary text-sm">
                    {unlockedVaultName} — Emergency View
                  </div>
                  <div className="text-text-muted text-[11px]">
                    {unlockedItems.length} records decrypted in beneficiary read-only mode
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setUnlockedItems(null)}
                className="h-7 text-xs self-start sm:self-auto"
              >
                Lock & Close
              </Button>
            </div>

            {/* Search & Category Pills */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search decrypted credentials..."
                  className="pl-9 h-8 text-xs bg-surface-subtle"
                />
              </div>

              <div className="flex flex-wrap gap-1 text-xs">
                <Button
                  size="sm"
                  variant={activeCategory === 'all' ? 'default' : 'ghost'}
                  onClick={() => setActiveCategory('all')}
                  className="h-7 text-xs"
                >
                  All ({unlockedItems.length})
                </Button>
                <Button
                  size="sm"
                  variant={activeCategory === 'login' ? 'default' : 'ghost'}
                  onClick={() => setActiveCategory('login')}
                  className="h-7 text-xs"
                >
                  Logins ({unlockedItems.filter((i) => i.type === 'login').length})
                </Button>
                <Button
                  size="sm"
                  variant={activeCategory === 'finance' ? 'default' : 'ghost'}
                  onClick={() => setActiveCategory('finance')}
                  className="h-7 text-xs"
                >
                  Banking & Cards
                </Button>
                <Button
                  size="sm"
                  variant={activeCategory === 'identity' ? 'default' : 'ghost'}
                  onClick={() => setActiveCategory('identity')}
                  className="h-7 text-xs"
                >
                  Identities & Documents
                </Button>
                <Button
                  size="sm"
                  variant={activeCategory === 'note' ? 'default' : 'ghost'}
                  onClick={() => setActiveCategory('note')}
                  className="h-7 text-xs"
                >
                  Secure Notes
                </Button>
              </div>
            </div>

            {/* Records List */}
            <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1 divide-y divide-line/40">
              {filteredItems.length === 0 ? (
                <div className="p-6 text-center text-text-muted text-xs">
                  No matching emergency records found.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const payload = (item.payload || {}) as Record<string, unknown>;
                  const isRevealed = Boolean(revealedPasswords[item.id]);

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-line bg-surface space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs font-bold text-text-primary truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-moss text-ink/60 border border-line shrink-0">
                            {item.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Login Credential fields */}
                      {item.type === 'login' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-moss/30 p-2.5 rounded-lg border border-line/40">
                          <div>
                            <span className="text-[10px] text-text-muted block font-mono">USERNAME</span>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <span className="font-semibold text-text-primary truncate">
                                {(payload.username as string) || '—'}
                              </span>
                              {Boolean(payload.username) && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(`user-${item.id}`, String(payload.username), 'Username')}
                                  className="text-accent hover:underline shrink-0 cursor-pointer"
                                >
                                  {copiedField === `user-${item.id}` ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-text-muted block font-mono">PASSWORD</span>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <span className="font-mono font-semibold text-text-primary truncate">
                                {isRevealed ? String(payload.password) : '••••••••••••'}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedPasswords((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                                  }
                                  className="text-text-muted hover:text-text-primary cursor-pointer p-0.5"
                                >
                                  {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </button>
                                {Boolean(payload.password) && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(`pass-${item.id}`, String(payload.password), 'Password')}
                                    className="text-accent hover:underline cursor-pointer"
                                  >
                                    {copiedField === `pass-${item.id}` ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Generic Record Fields (banking, notes, cards, IDs) */}
                      {item.type !== 'login' && (
                        <div className="space-y-1.5 text-xs bg-moss/30 p-2.5 rounded-lg border border-line/40">
                          {Object.entries(payload)
                            .filter(([k, v]) => Boolean(v) && !['notes', 'secret'].includes(k))
                            .map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-text-muted capitalize font-mono">{k}:</span>
                                <div className="flex items-center gap-1.5 font-mono text-text-primary font-semibold truncate">
                                  <span className="truncate">{String(v)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(`${item.id}-${k}`, String(v), k)}
                                    className="text-accent hover:underline shrink-0 cursor-pointer"
                                  >
                                    {copiedField === `${item.id}-${k}` ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                </div>
                              </div>
                            ))}

                          {Boolean(payload.notes || payload.content) && (
                            <div className="pt-1.5 border-t border-line/40 text-[11px] text-text-secondary whitespace-pre-wrap leading-relaxed">
                              {String(payload.notes || payload.content)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
