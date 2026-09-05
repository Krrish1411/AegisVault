import * as React from 'react';
import { KeyRound, Copy, Check, Clock } from 'lucide-react';
import { Badge } from '@/ui/primitives/Badge';
import { generateTotp, formatTotpCode } from '@/domain/totp/totpEngine';

export interface TotpCardDisplayProps {
  secret: string;
  issuer?: string | undefined;
  account?: string | undefined;
  digits?: (6 | 8) | undefined;
  period?: number | undefined;
  algorithm?: ('SHA1' | 'SHA256' | 'SHA512') | undefined;
  onCopy: (code: string) => void;
  isCopied: boolean;
}

export function TotpCardDisplay({
  secret,
  issuer,
  account,
  digits = 6,
  period = 30,
  algorithm = 'SHA1',
  onCopy,
  isCopied,
}: TotpCardDisplayProps) {
  const [currentCode, setCurrentCode] = React.useState<string>('------');
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(period);
  const [progress, setProgress] = React.useState<number>(1);
  const [error, setError] = React.useState<string | null>(null);

  const updateCode = React.useCallback(async () => {
    try {
      const result = await generateTotp(secret, {
        period,
        digits,
        algorithm,
      });
      setCurrentCode(result.code);
      setSecondsRemaining(result.secondsRemaining);
      setProgress(result.progress);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid TOTP secret');
    }
  }, [secret, period, digits, algorithm]);

  React.useEffect(() => {
    updateCode();
    const interval = setInterval(updateCode, 1000);
    return () => clearInterval(interval);
  }, [updateCode]);

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-surface to-surface-subtle p-5 shadow-elevated space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-accent" />
          <span className="text-xs font-semibold uppercase text-text-muted">
            {issuer || 'Authenticator 2FA'}
          </span>
        </div>
        <Badge variant="accent" className="font-mono text-[10px]">
          {algorithm} • {period}s
        </Badge>
      </div>

      {error ? (
        <div className="p-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-md">
          {error}
        </div>
      ) : (
        <>
          {/* Main TOTP Code Display */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-text-primary">
                {formatTotpCode(currentCode)}
              </div>
              {account && (
                <div className="text-xs text-text-secondary mt-1">{account}</div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onCopy(currentCode)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary hover:border-accent/40 shadow-subtle transition-all"
              title="Copy current TOTP code"
            >
              {isCopied ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>

          {/* Animated Countdown Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Next code in {secondsRemaining}s</span>
              </span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-subtle overflow-hidden border border-border">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  secondsRemaining <= 5 ? 'bg-danger' : secondsRemaining <= 10 ? 'bg-warning' : 'bg-accent'
                }`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
