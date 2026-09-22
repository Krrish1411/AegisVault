import * as React from 'react';
import {
  Mail,
  Sparkles,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { Card, CardContent } from '@/ui/primitives/Card';
import { Badge } from '@/ui/primitives/Badge';
import { EmptyState } from '@/ui/primitives/EmptyState';
import { useAliasStore } from '@/state/aliasStore';
import { useUiStore } from '@/state/uiStore';
import { appVaultService } from '@/application/services/AppVaultService';
import {
  generateDuckAlias,
  extractAliasesFromVault,
  type AggregatedAlias,
  type DuckEmailOptions,
} from '@/domain/generator/emailAliasGenerator';
import { webClipboard } from '@/platform/web/WebClipboardPort';
import { useNavigate } from 'react-router-dom';

export function EmailAliasesScreen() {
  const navigate = useNavigate();
  const addToast = useUiStore((state) => state.addToast);
  const vaultRevision = useUiStore((state) => state.vaultRevision);

  const forwardingEmail = useAliasStore((state) => state.forwardingEmail);
  const setForwardingEmail = useAliasStore((state) => state.setForwardingEmail);
  const customAliases = useAliasStore((state) => state.customAliases);
  const addCustomAlias = useAliasStore((state) => state.addCustomAlias);
  const removeCustomAlias = useAliasStore((state) => state.removeCustomAlias);

  // Forwarding address editing state
  const [editingForwarding, setEditingForwarding] = React.useState(false);
  const [forwardingInput, setForwardingInput] = React.useState(forwardingEmail);
  const [forwardingError, setForwardingError] = React.useState<string | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sourceFilter, setSourceFilter] = React.useState<'all' | 'vault' | 'standalone'>('all');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Generator panel state
  const [generatorStyle, setGeneratorStyle] = React.useState<'memorable' | 'compact' | 'service'>('memorable');
  const [serviceTag, setServiceTag] = React.useState('');
  const [standaloneNotes, setStandaloneNotes] = React.useState('');
  const [generatedAlias, setGeneratedAlias] = React.useState<string>(() =>
    generateDuckAlias({ style: 'memorable' })
  );

  // Load vault aliases reactively
  const vaultAliases = React.useMemo(() => {
    if (vaultRevision < 0) return [];
    const decrypted = appVaultService.getDecryptedVault();
    if (!decrypted) return [];
    return extractAliasesFromVault(decrypted.items);
  }, [vaultRevision]);

  // Combine vault aliases and standalone custom aliases
  const allAliases: AggregatedAlias[] = React.useMemo(() => {
    const standaloneMapped: AggregatedAlias[] = customAliases.map((ca) => ({
      id: ca.id,
      alias: ca.alias,
      title: ca.tag,
      source: 'standalone',
      createdAt: ca.createdAt,
      notes: ca.notes,
    }));
    return [...vaultAliases, ...standaloneMapped].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [vaultAliases, customAliases]);

  // Filtered aliases
  const filteredAliases = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allAliases.filter((item) => {
      if (sourceFilter === 'vault' && item.source !== 'vault') return false;
      if (sourceFilter === 'standalone' && item.source !== 'standalone') return false;
      if (!q) return true;
      return (
        item.alias.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
    });
  }, [allAliases, searchQuery, sourceFilter]);

  const handleSaveForwarding = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = forwardingInput.trim();
    if (!trimmed) {
      setForwardingError('Forwarding email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setForwardingError('Please enter a valid email address');
      return;
    }
    setForwardingEmail(trimmed);
    setForwardingError(null);
    setEditingForwarding(false);
    addToast({
      title: 'Forwarding Destination Saved',
      description: `Disguises will route to ${trimmed}`,
      variant: 'success',
    });
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await webClipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      addToast({
        title: 'Alias Copied',
        description: `${text} copied to clipboard`,
        variant: 'success',
      });
    } catch {
      // ignore
    }
  };

  const handleRegenerate = () => {
    const opts: DuckEmailOptions = {
      style: generatorStyle,
      serviceHint: serviceTag.trim() || undefined,
    };
    setGeneratedAlias(generateDuckAlias(opts));
  };

  const handleSaveStandalone = () => {
    addCustomAlias(generatedAlias, serviceTag.trim() || 'Burner Disguise', standaloneNotes);
    addToast({
      title: 'Standalone Alias Saved',
      description: `${generatedAlias} saved to your disguise roster`,
      variant: 'success',
    });
    setServiceTag('');
    setStandaloneNotes('');
    handleRegenerate();
  };

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
      }),
    []
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pine-600/15 text-pine-600 border border-pine-500/25 shadow-xs">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Email Aliases &amp; Disguises
              </h1>
              <p className="text-xs text-text-secondary">
                Zero-spam DuckDuckGo email protection (@duck.com). Tracker-free and private.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs text-pine-700 dark:text-pine-300 bg-pine-50 dark:bg-pine-950/60 border-pine-500/30">
            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-pine-600" />
            100% Free &amp; Offline Generator
          </Badge>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-line bg-card/70 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary">Total Active Disguises</p>
              <p className="text-2xl font-bold tracking-tight text-ink font-mono tabular-nums mt-1">
                {allAliases.length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-line bg-card/70 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary">Vault Account Logins</p>
              <p className="text-2xl font-bold tracking-tight text-ink font-mono tabular-nums mt-1">
                {vaultAliases.length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-line bg-card/70 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary">Standalone Burners</p>
              <p className="text-2xl font-bold tracking-tight text-ink font-mono tabular-nums mt-1">
                {customAliases.length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forwarding Destination Configuration Card */}
      <Card className="border border-line bg-card/90 shadow-xs">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-ink">
                  DuckDuckGo Forwarding Destination
                </h2>
                {forwardingEmail ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Routing Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Not Configured
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                Emails sent to your <span className="font-mono text-ink">@duck.com</span> disguises have their hidden ad trackers stripped and are forwarded directly to this email address.
              </p>
            </div>

            {!editingForwarding && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setForwardingInput(forwardingEmail);
                  setEditingForwarding(true);
                }}
                className="shrink-0"
              >
                {forwardingEmail ? 'Change Destination' : 'Configure Destination'}
              </Button>
            )}
          </div>

          {editingForwarding ? (
            <form onSubmit={handleSaveForwarding} className="pt-2 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    value={forwardingInput}
                    onChange={(e) => setForwardingInput(e.target.value)}
                    placeholder="your-clean-email@gmail.com"
                    autoFocus
                    className="h-10 text-base sm:text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" className="h-10 px-4">
                    Save Destination
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingForwarding(false);
                      setForwardingError(null);
                    }}
                    className="h-10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              {forwardingError && (
                <p className="text-xs text-danger flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {forwardingError}
                </p>
              )}
            </form>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-moss/50 border border-line">
              <div className="flex items-center gap-2.5 font-mono text-sm font-semibold text-ink">
                <Mail className="h-4 w-4 text-pine-600 shrink-0" />
                <span>{forwardingEmail || 'None configured (Click "Configure Destination" above)'}</span>
              </div>
              <a
                href="https://duckduckgo.com/email"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <span>DuckDuckGo Email Protection</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fast Disguise Generator Card */}
      <Card className="border border-line bg-card/90 shadow-xs">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-ink">Quick Disguise Generator</h2>
            </div>
            <span className="text-xs text-text-secondary">100% Offline &amp; Untrackable</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="gen-style" className="text-xs font-medium text-text-secondary">Style Pattern</label>
              <select
                id="gen-style"
                value={generatorStyle}
                onChange={(e) => {
                  setGeneratorStyle(e.target.value as 'memorable' | 'compact' | 'service');
                }}
                className="flex h-10 w-full rounded-xl border border-line bg-card px-3 text-sm text-ink outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="memorable">Memorable (swift-fox-8821@duck.com)</option>
                <option value="compact">Compact (vlt-9k2a8f71@duck.com)</option>
                <option value="service">Service Tagged (service-token@duck.com)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="gen-tag" className="text-xs font-medium text-text-secondary">Service Hint / Tag</label>
              <Input
                id="gen-tag"
                value={serviceTag}
                onChange={(e) => setServiceTag(e.target.value)}
                placeholder="e.g. Netflix, Spotify, Newsletter..."
                className="h-10 text-base sm:text-sm"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="gen-notes" className="text-xs font-medium text-text-secondary">Notes (Optional)</label>
              <Input
                id="gen-notes"
                value={standaloneNotes}
                onChange={(e) => setStandaloneNotes(e.target.value)}
                placeholder="Temporary signup, trial..."
                className="h-10 text-base sm:text-sm"
              />
            </div>
          </div>

          {/* Generated Disguise Display & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-line">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-600/15 text-pine-600 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-base font-bold text-ink truncate select-all">
                  {generatedAlias}
                </p>
                <p className="text-[11px] text-text-secondary truncate">
                  {forwardingEmail ? `Forwards to ${forwardingEmail}` : 'Private Duck disguise'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                className="h-9 px-3"
                title="Generate another disguise"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                <span>Reroll</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(generatedAlias, 'generator-preview')}
                className="h-9 px-3"
                title="1-click copy disguise to clipboard"
              >
                {copiedId === 'generator-preview' ? (
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1" />
                )}
                <span>{copiedId === 'generator-preview' ? 'Copied' : 'Copy'}</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSaveStandalone}
                className="h-9 px-4"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Save Burner</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disguises Directory */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-ink">Active Disguises Directory</h2>
            <Badge variant="outline" className="font-mono tabular-nums text-xs">
              {filteredAliases.length}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center rounded-xl border border-line bg-card p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSourceFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  sourceFilter === 'all'
                    ? 'bg-accent text-white font-semibold'
                    : 'text-text-secondary hover:text-ink'
                }`}
              >
                All ({allAliases.length})
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('vault')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  sourceFilter === 'vault'
                    ? 'bg-accent text-white font-semibold'
                    : 'text-text-secondary hover:text-ink'
                }`}
              >
                Vault Logins ({vaultAliases.length})
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('standalone')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  sourceFilter === 'standalone'
                    ? 'bg-accent text-white font-semibold'
                    : 'text-text-secondary hover:text-ink'
                }`}
              >
                Burners ({customAliases.length})
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search disguises..."
                className="pl-8 h-9 text-base sm:text-xs"
              />
            </div>
          </div>
        </div>

        {/* List of Disguises */}
        {filteredAliases.length === 0 ? (
          <EmptyState
            title="No Email Disguises Found"
            description={
              searchQuery
                ? 'No disguises matched your search criteria.'
                : 'Generate a new DuckDuckGo @duck.com email disguise above to protect your real inbox.'
            }
            icon={<Mail className="h-7 w-7" />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredAliases.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-line bg-card hover:border-accent/40 transition-colors gap-3"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-600/10 text-pine-600 shrink-0 mt-0.5 sm:mt-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-ink truncate select-all">
                        {item.alias}
                      </span>
                      {item.source === 'vault' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-pine-500/10 text-pine-700 dark:text-pine-300 border border-pine-500/20">
                          Vault Login
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          Standalone Burner
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary flex-wrap">
                      <span className="font-medium text-ink/80">{item.title}</span>
                      <span>•</span>
                      <span>Created {dateFormatter.format(new Date(item.createdAt))}</span>
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span className="italic truncate max-w-xs">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(item.alias, item.id)}
                    className="h-8 px-2.5 text-xs"
                    title="Copy disguise to clipboard"
                    aria-label={`Copy disguise ${item.alias}`}
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>

                  {item.source === 'vault' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/passwords')}
                      className="h-8 px-2 text-xs"
                      title="Open in Passwords"
                      aria-label={`View ${item.title} in Passwords`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        removeCustomAlias(item.id);
                        addToast({
                          title: 'Burner Disguise Removed',
                          description: `${item.alias} deleted`,
                          variant: 'default',
                        });
                      }}
                      className="h-8 px-2 text-xs text-text-muted hover:text-danger hover:bg-danger/10"
                      title="Delete standalone disguise"
                      aria-label={`Delete disguise ${item.alias}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
