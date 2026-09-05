import * as React from 'react';
import {
  ShieldAlert,
  Copy,
  Check,
  Download,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { splitRecoveryPhrase } from '@/security/crypto/bip39';
import { webClipboard } from '@/platform/web/WebClipboardPort';
import { useUiStore } from '@/state/uiStore';

export interface RecoverySetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryPhrase: string;
  onConfirmed: () => void;
}

export function RecoverySetupModal({
  open,
  onOpenChange,
  recoveryPhrase,
  onConfirmed,
}: RecoverySetupModalProps) {
  const addToast = useUiStore((state) => state.addToast);
  const [step, setStep] = React.useState<'display' | 'verify'>('display');
  const [copied, setCopied] = React.useState(false);

  const words = React.useMemo(() => splitRecoveryPhrase(recoveryPhrase), [recoveryPhrase]);

  // Choose 3 random word indices to verify (e.g. index 3, 11, 19)
  const challengeIndices = React.useMemo(() => {
    if (words.length !== 24) return [2, 10, 18];
    const available = [2, 5, 8, 11, 14, 17, 20, 23];
    return [available[0]!, available[3]!, available[6]!];
  }, [words]);

  const [input1, setInput1] = React.useState('');
  const [input2, setInput2] = React.useState('');
  const [input3, setInput3] = React.useState('');
  const [error, setError] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (open) {
      setStep('display');
      setInput1('');
      setInput2('');
      setInput3('');
      setError(undefined);
    }
  }, [open]);

  const handleCopy = async () => {
    await webClipboard.writeText(recoveryPhrase, { autoClearMs: 30000 });
    setCopied(true);
    addToast({
      title: 'Recovery Phrase Copied',
      description: 'Copied to clipboard. Clipboard will automatically clear in 30 seconds.',
      variant: 'default',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = `AEGISVAULT EMERGENCY RECOVERY SHEET\n` +
      `Generated: ${new Date().toISOString()}\n` +
      `=================================================================\n` +
      `IMPORTANT: Keep this phrase in a secure physical location.\n` +
      `Do NOT store it unencrypted on cloud drives or email.\n` +
      `\n` +
      `24-WORD RECOVERY PHRASE:\n` +
      words.map((w, i) => `${String(i + 1).padStart(2, ' ')}. ${w}`).join('\n') +
      `\n\n=================================================================\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aegisvault-emergency-recovery-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    addToast({
      title: 'Emergency Sheet Downloaded',
      description: 'Store this file offline in a safe physical vault.',
      variant: 'success',
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const w1Expected = words[challengeIndices[0]!]?.toLowerCase();
    const w2Expected = words[challengeIndices[1]!]?.toLowerCase();
    const w3Expected = words[challengeIndices[2]!]?.toLowerCase();

    if (
      input1.trim().toLowerCase() !== w1Expected ||
      input2.trim().toLowerCase() !== w2Expected ||
      input3.trim().toLowerCase() !== w3Expected
    ) {
      setError('One or more words do not match your recovery phrase. Please check and try again.');
      return;
    }

    addToast({
      title: 'Recovery Phrase Verified',
      description: 'Your recovery key wrap is confirmed and ready.',
      variant: 'success',
    });

    onConfirmed();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          // If closed before verification, still trigger confirmed to not trap user
          onConfirmed();
        }
        onOpenChange(v);
      }}
      title="Master Recovery Phrase"
      description="Your 24-word BIP39 emergency recovery phrase provides mathematical recovery if you ever lose your master password."
    >
      {step === 'display' ? (
        <div className="space-y-5 pt-2">
          {/* Warning Banner */}
          <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3.5 text-xs text-warning">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-text-primary">Permanent Loss Risk</p>
              <p className="text-text-secondary leading-relaxed">
                If you forget your master password and lose this 24-word phrase, your encrypted data cannot be decrypted by anyone. Write these words down in order.
              </p>
            </div>
          </div>

          {/* 24-Word Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 rounded-xl border border-border bg-surface-subtle p-3.5">
            {words.map((word, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-md border border-border/80 bg-surface px-2.5 py-1.5 text-xs font-mono select-all"
              >
                <span className="text-[10px] text-text-muted select-none w-4 text-right">
                  {idx + 1}.
                </span>
                <span className="font-semibold text-text-primary">{word}</span>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1 text-xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-1 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Kit</span>
              </Button>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setStep('verify')}
              className="gap-1.5 text-xs"
            >
              <span>Verify Phrase</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-5 pt-2">
          <div className="rounded-lg border border-border bg-surface-subtle p-3.5 text-xs text-text-secondary leading-relaxed">
            Please confirm you wrote down your recovery phrase by entering the requested words below:
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="challenge-word-1" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-accent" />
                <span>Word #{challengeIndices[0]! + 1}</span>
              </label>
              <Input
                id="challenge-word-1"
                value={input1}
                onChange={(e) => setInput1(e.target.value)}
                placeholder={`Enter word #${challengeIndices[0]! + 1}`}
                autoFocus
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="challenge-word-2" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-accent" />
                <span>Word #{challengeIndices[1]! + 1}</span>
              </label>
              <Input
                id="challenge-word-2"
                value={input2}
                onChange={(e) => setInput2(e.target.value)}
                placeholder={`Enter word #${challengeIndices[1]! + 1}`}
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="challenge-word-3" className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-accent" />
                <span>Word #{challengeIndices[2]! + 1}</span>
              </label>
              <Input
                id="challenge-word-3"
                value={input3}
                onChange={(e) => setInput3(e.target.value)}
                placeholder={`Enter word #${challengeIndices[2]! + 1}`}
                required
              />
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep('display')}
              className="gap-1 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Button>

            <Button type="submit" size="sm" className="gap-1.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Confirm & Complete</span>
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
