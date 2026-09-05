import * as React from 'react';
import { RefreshCw, Key, BookOpen, Hash, Check } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
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

export interface GeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSecret: (secret: string) => void;
}

export function GeneratorModal({ open, onOpenChange, onSelectSecret }: GeneratorModalProps) {
  const [activeTab, setActiveTab] = React.useState<'password' | 'passphrase' | 'pin'>('password');
  const [pwdLength, setPwdLength] = React.useState(20);
  const [useUpper, setUseUpper] = React.useState(true);
  const [useLower, setUseLower] = React.useState(true);
  const [useNumbers, setUseNumbers] = React.useState(true);
  const [useSymbols, setUseSymbols] = React.useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = React.useState(false);

  const [wordCount, setWordCount] = React.useState(5);
  const [pinLength, setPinLength] = React.useState(6);

  const [generated, setGenerated] = React.useState<GeneratedSecret>(() =>
    generatePassword({ length: 20 })
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
        separator: '-',
        capitalize: 'first',
        includeNumber: true,
      };
      setGenerated(generatePassphrase(opts));
    } else {
      const opts: PinGeneratorOptions = {
        length: pinLength,
      };
      setGenerated(generatePin(opts));
    }
  }, [activeTab, pwdLength, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous, wordCount, pinLength]);

  React.useEffect(() => {
    if (open) {
      regenerate();
    }
  }, [open, regenerate]);

  const handleUseSecret = () => {
    onSelectSecret(generated.secret);
    onOpenChange(false);
  };

  const classified = activeTab === 'password' ? classifyPasswordChars(generated.secret) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Generate High-Entropy Secret"
      description="CSPRNG random password generator with unbiased rejection sampling."
    >
      <div className="space-y-5 pt-2">
        {/* Tab switcher */}
        <div className="flex items-center rounded-lg border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition-all ${
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
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition-all ${
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
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition-all ${
              activeTab === 'pin'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Hash className="h-3.5 w-3.5" />
            <span>PIN</span>
          </button>
        </div>

        {/* Secret Output Box */}
        <div className="rounded-lg border border-border bg-surface-subtle p-4 text-center space-y-2">
          <div className="flex items-center justify-center min-h-[40px] break-all select-all font-mono text-lg font-bold tracking-wider text-text-primary">
            {classified ? (
              <span>
                {classified.map((item, idx) => {
                  let color = 'text-text-primary';
                  if (item.type === 'uppercase') color = 'text-sky-400';
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

          <div className="flex items-center justify-center gap-2">
            <Badge variant="accent" className="text-[10px]">
              {generated.entropyBits} bits entropy • {generated.strength.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Basic Parameters */}
        {activeTab === 'password' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-text-secondary">Length</span>
                <span className="font-mono text-sm font-bold text-accent px-2 py-0.5 rounded-md bg-accent/10">{pwdLength} characters</span>
              </div>
              <input
                type="range"
                min="12"
                max="64"
                value={pwdLength}
                onChange={(e) => setPwdLength(Number(e.target.value))}
                className="w-full my-2 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <label className="flex items-center justify-between rounded-xl border border-line bg-card p-2.5 cursor-pointer hover:border-accent/40 transition-colors shadow-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-ink">Uppercase</span>
                  <span className="text-[10px] text-accent font-mono block">A-Z</span>
                </div>
                <input
                  type="checkbox"
                  checked={useUpper}
                  onChange={(e) => setUseUpper(e.target.checked)}
                  className="h-4 w-4 rounded-md border-line text-accent focus:ring-accent accent-accent"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-line bg-card p-2.5 cursor-pointer hover:border-accent/40 transition-colors shadow-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-ink">Lowercase</span>
                  <span className="text-[10px] text-accent font-mono block">a-z</span>
                </div>
                <input
                  type="checkbox"
                  checked={useLower}
                  onChange={(e) => setUseLower(e.target.checked)}
                  className="h-4 w-4 rounded-md border-line text-accent focus:ring-accent accent-accent"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-line bg-card p-2.5 cursor-pointer hover:border-accent/40 transition-colors shadow-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-ink">Numbers</span>
                  <span className="text-[10px] text-amber-500 font-mono block">0-9</span>
                </div>
                <input
                  type="checkbox"
                  checked={useNumbers}
                  onChange={(e) => setUseNumbers(e.target.checked)}
                  className="h-4 w-4 rounded-md border-line text-accent focus:ring-accent accent-accent"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-line bg-card p-2.5 cursor-pointer hover:border-accent/40 transition-colors shadow-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-ink">Symbols</span>
                  <span className="text-[10px] text-emerald-500 font-mono block">!@#$%^&*</span>
                </div>
                <input
                  type="checkbox"
                  checked={useSymbols}
                  onChange={(e) => setUseSymbols(e.target.checked)}
                  className="h-4 w-4 rounded-md border-line text-accent focus:ring-accent accent-accent"
                />
              </label>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                className="h-4 w-4 rounded-md border-line text-accent focus:ring-accent accent-accent"
              />
              <span>Avoid look-alike characters (0, O, 1, l, I)</span>
            </label>
          </div>
        )}

        {activeTab === 'passphrase' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-text-secondary">Word Count</span>
              <span className="font-mono text-sm font-bold text-accent px-2 py-0.5 rounded-md bg-accent/10">{wordCount} words</span>
            </div>
            <input
              type="range"
              min="3"
              max="8"
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="w-full my-2 cursor-pointer"
            />
          </div>
        )}

        {activeTab === 'pin' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-text-secondary">Digits</span>
              <span className="font-mono text-sm font-bold text-accent px-2 py-0.5 rounded-md bg-accent/10">{pinLength} digits</span>
            </div>
            <input
              type="range"
              min="4"
              max="12"
              value={pinLength}
              onChange={(e) => setPinLength(Number(e.target.value))}
              className="w-full my-2 cursor-pointer"
            />
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={regenerate}
            className="gap-1 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-accent" />
            <span>Regenerate</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleUseSecret}
              className="gap-1 text-xs"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Use This Secret</span>
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
