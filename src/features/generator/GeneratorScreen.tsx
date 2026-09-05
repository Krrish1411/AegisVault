import * as React from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Sliders,
  Key,
  BookOpen,
  Hash,
} from 'lucide-react';
import { Card, CardContent } from '@/ui/primitives/Card';
import { Button } from '@/ui/primitives/Button';
import { Badge } from '@/ui/primitives/Badge';
import {
  generatePassword,
  generatePassphrase,
  generatePin,
  classifyPasswordChars,
  type PasswordGeneratorOptions,
  type PassphraseGeneratorOptions,
  type PinGeneratorOptions,
  type GeneratedSecret,
} from '@/domain/generator/secretGenerator';
import { webClipboard } from '@/platform/web/WebClipboardPort';
import { useSessionStore } from '@/state/sessionStore';
import { useUiStore } from '@/state/uiStore';

export function GeneratorScreen() {
  const [activeTab, setActiveTab] = React.useState<'password' | 'passphrase' | 'pin'>('password');
  const [copied, setCopied] = React.useState(false);
  const [countdown, setCountdown] = React.useState<number | null>(null);

  const clipboardClearSeconds = useSessionStore((state) => state.clipboardClearSeconds);
  const addToast = useUiStore((state) => state.addToast);

  // Password Options
  const [pwdLength, setPwdLength] = React.useState(20);
  const [useUpper, setUseUpper] = React.useState(true);
  const [useLower, setUseLower] = React.useState(true);
  const [useNumbers, setUseNumbers] = React.useState(true);
  const [useSymbols, setUseSymbols] = React.useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = React.useState(false);

  // Passphrase Options
  const [wordCount, setWordCount] = React.useState(5);
  const [separator, setSeparator] = React.useState('-');
  const [capitalize, setCapitalize] = React.useState<'none' | 'first' | 'all'>('first');
  const [includeNumber, setIncludeNumber] = React.useState(true);

  // PIN Options
  const [pinLength, setPinLength] = React.useState(6);

  // Generated State
  const [generated, setGenerated] = React.useState<GeneratedSecret>(() =>
    generatePassword({
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false,
    })
  );

  const regenerate = React.useCallback(() => {
    if (activeTab === 'password') {
      const opts: PasswordGeneratorOptions = {
        length: pwdLength,
        uppercase: useUpper,
        lowercase: useLower,
        numbers: useNumbers,
        symbols: useSymbols,
        excludeAmbiguous,
      };
      setGenerated(generatePassword(opts));
    } else if (activeTab === 'passphrase') {
      const opts: PassphraseGeneratorOptions = {
        wordCount,
        separator,
        capitalize,
        includeNumber,
      };
      setGenerated(generatePassphrase(opts));
    } else {
      const opts: PinGeneratorOptions = {
        length: pinLength,
      };
      setGenerated(generatePin(opts));
    }
  }, [
    activeTab,
    pwdLength,
    useUpper,
    useLower,
    useNumbers,
    useSymbols,
    excludeAmbiguous,
    wordCount,
    separator,
    capitalize,
    includeNumber,
    pinLength,
  ]);

  // Regenerate when options or tab change
  React.useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Handle Copy with Auto-Clear Timer
  const handleCopy = async () => {
    const clearMs = clipboardClearSeconds > 0 ? clipboardClearSeconds * 1000 : 0;
    await webClipboard.writeText(generated.secret, { autoClearMs: clearMs });
    setCopied(true);

    if (clipboardClearSeconds > 0) {
      setCountdown(clipboardClearSeconds);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            setCountdown(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    addToast({
      title: 'Secret Copied to Clipboard',
      description:
        clipboardClearSeconds > 0
          ? `Clipboard will automatically clear in ${clipboardClearSeconds} seconds for safety.`
          : 'Copied to clipboard.',
      variant: 'success',
    });

    setTimeout(() => setCopied(false), 2500);
  };

  const classifiedChars = React.useMemo(() => {
    if (activeTab === 'password') {
      return classifyPasswordChars(generated.secret);
    }
    return null;
  }, [activeTab, generated.secret]);

  const strengthBadge = () => {
    switch (generated.strength) {
      case 'very_strong':
        return <Badge variant="success">Very Strong ({generated.entropyBits} bits)</Badge>;
      case 'strong':
        return <Badge variant="accent">Strong ({generated.entropyBits} bits)</Badge>;
      case 'good':
        return <Badge variant="default">Good ({generated.entropyBits} bits)</Badge>;
      case 'fair':
        return <Badge variant="warning">Moderate ({generated.entropyBits} bits)</Badge>;
      default:
        return <Badge variant="danger">Weak ({generated.entropyBits} bits)</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-accent" />
            <span>Secret Generator</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            CSPRNG unbiased entropy engine. Generated exclusively in local memory.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-lg border border-border bg-surface p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'password'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('passphrase')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'passphrase'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Passphrase</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pin')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'pin'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Hash className="h-3.5 w-3.5" />
            <span>PIN</span>
          </button>
        </div>
      </div>

      {/* Hero Secret Display Card */}
      <Card className="border-border bg-surface shadow-elevated overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Secret Display Box */}
          <div className="relative rounded-xl border border-border/80 bg-surface-subtle p-5 sm:p-6 text-center shadow-inner">
            <div className="flex items-center justify-center min-h-[56px] break-all select-all font-mono text-xl sm:text-2xl font-bold tracking-wider text-text-primary">
              {classifiedChars ? (
                <span>
                  {classifiedChars.map((item, idx) => {
                    let color = 'text-text-primary';
                    if (item.type === 'uppercase') color = 'text-sky-400';
                    if (item.type === 'lowercase') color = 'text-text-primary';
                    if (item.type === 'number') color = 'text-amber-400';
                    if (item.type === 'symbol') color = 'text-emerald-400';

                    return (
                      <span key={idx} className={color}>
                        {item.char}
                      </span>
                    );
                  })}
                </span>
              ) : (
                <span>{generated.secret}</span>
              )}
            </div>

            {/* Quality & Entropy Badge */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-border/40">
              {strengthBadge()}
              {countdown !== null && (
                <span className="text-xs text-text-muted animate-pulse">
                  Auto-clearing in {countdown}s
                </span>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={handleCopy}
              className="w-full sm:w-auto min-w-[180px] gap-2 font-semibold shadow-subtle"
            >
              {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy Secret'}</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={regenerate}
              className="w-full sm:w-auto gap-2"
            >
              <RefreshCw className="h-4 w-4 text-accent" />
              <span>Regenerate</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generator Controls */}
      <Card className="border-border bg-surface">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Sliders className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">Configuration Parameters</h2>
          </div>

          {/* Password Controls */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              {/* Length Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="pwd-length-slider" className="font-medium text-text-secondary">
                    Length ({pwdLength} characters)
                  </label>
                  <span className="font-mono text-sm font-bold text-text-primary">{pwdLength}</span>
                </div>
                <input
                  id="pwd-length-slider"
                  type="range"
                  min="12"
                  max="128"
                  value={pwdLength}
                  onChange={(e) => setPwdLength(Number(e.target.value))}
                  className="w-full my-2 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>12 (Standard)</span>
                  <span>20 (Recommended)</span>
                  <span>32 (High)</span>
                  <span>64</span>
                  <span>128</span>
                </div>
              </div>

              {/* Character Set Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-subtle cursor-pointer hover:border-border/80 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-text-primary">Uppercase Letters</span>
                    <p className="text-[11px] text-sky-400 font-mono">A-Z</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={useUpper}
                    onChange={(e) => setUseUpper(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-subtle cursor-pointer hover:border-border/80 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-text-primary">Lowercase Letters</span>
                    <p className="text-[11px] text-text-primary font-mono">a-z</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={useLower}
                    onChange={(e) => setUseLower(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-subtle cursor-pointer hover:border-border/80 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-text-primary">Numbers</span>
                    <p className="text-[11px] text-amber-400 font-mono">0-9</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={useNumbers}
                    onChange={(e) => setUseNumbers(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-subtle cursor-pointer hover:border-border/80 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-text-primary">Symbols</span>
                    <p className="text-[11px] text-emerald-400 font-mono">!@#$%^&*()_+-=...</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={useSymbols}
                    onChange={(e) => setUseSymbols(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                </label>
              </div>

              {/* Exclude Ambiguous Characters */}
              <label className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-surface-subtle cursor-pointer hover:border-border/80 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-text-primary">Exclude Ambiguous Characters</span>
                  <p className="text-[11px] text-text-secondary">
                    Avoids confusing look-alike characters (<code className="text-text-muted">il1Lo0O|`'</code>)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={excludeAmbiguous}
                  onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
              </label>
            </div>
          )}

          {/* Passphrase Controls */}
          {activeTab === 'passphrase' && (
            <div className="space-y-6">
              {/* Word Count Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="word-count-slider" className="font-medium text-text-secondary">
                    Word Count ({wordCount} words)
                  </label>
                  <span className="font-mono text-sm font-bold text-text-primary">{wordCount} words</span>
                </div>
                <input
                  id="word-count-slider"
                  type="range"
                  min="3"
                  max="12"
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full my-2 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>3 words</span>
                  <span>5 (Recommended)</span>
                  <span>8</span>
                  <span>12 words</span>
                </div>
              </div>

              {/* Separator Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">Word Separator</label>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Hyphen (-)', val: '-' },
                    { label: 'Period (.)', val: '.' },
                    { label: 'Underscore (_)', val: '_' },
                    { label: 'Space ( )', val: ' ' },
                  ].map((s) => (
                    <Button
                      key={s.val}
                      type="button"
                      variant={separator === s.val ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSeparator(s.val)}
                      className="text-xs"
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Casing & Number inclusion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Capitalization</label>
                  <div className="flex items-center gap-2">
                    {[
                      { label: 'TitleCase', val: 'first' as const },
                      { label: 'lowercase', val: 'none' as const },
                      { label: 'UPPERCASE', val: 'all' as const },
                    ].map((c) => (
                      <Button
                        key={c.val}
                        type="button"
                        variant={capitalize === c.val ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCapitalize(c.val)}
                        className="text-xs"
                      >
                        {c.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-subtle cursor-pointer hover:border-border/80 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-text-primary">Append Random Number</span>
                    <p className="text-[11px] text-text-secondary">Adds a digit to a random word</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeNumber}
                    onChange={(e) => setIncludeNumber(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                </label>
              </div>
            </div>
          )}

          {/* PIN Controls */}
          {activeTab === 'pin' && (
            <div className="space-y-6">
              {/* Length Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="pin-length-slider" className="font-medium text-text-secondary">
                    PIN Length ({pinLength} digits)
                  </label>
                  <span className="font-mono text-sm font-bold text-text-primary">{pinLength} digits</span>
                </div>
                <input
                  id="pin-length-slider"
                  type="range"
                  min="4"
                  max="12"
                  value={pinLength}
                  onChange={(e) => setPinLength(Number(e.target.value))}
                  className="w-full my-2 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>4 digits (Standard)</span>
                  <span>6 digits (Recommended)</span>
                  <span>8 digits</span>
                  <span>12 digits</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={pinLength === 4 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPinLength(4)}
                  className="text-xs"
                >
                  4-Digit PIN
                </Button>

                <Button
                  type="button"
                  variant={pinLength === 6 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPinLength(6)}
                  className="text-xs"
                >
                  6-Digit PIN
                </Button>

                <Button
                  type="button"
                  variant={pinLength === 8 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPinLength(8)}
                  className="text-xs"
                >
                  8-Digit PIN
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mathematical Entropy Invariant Note */}
      <Card className="border-border bg-surface-subtle">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="text-xs text-text-secondary space-y-1">
            <p className="font-semibold text-text-primary">Cryptographic Entropy & Rejection Sampling</p>
            <p>
              AegisVault utilizes browser CSPRNG (<code className="font-mono text-text-primary">crypto.getRandomValues</code>) with rejection sampling to eliminate modulo bias. Secrets never leave local memory and are never persisted to disk or sent across networks.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
