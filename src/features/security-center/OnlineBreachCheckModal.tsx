import * as React from 'react';
import { Globe, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { Badge } from '@/ui/primitives/Badge';
import { checkPasswordBreachPwned } from '@/domain/breach/breachChecker';
import { appVaultService } from '@/application/services/AppVaultService';
import type { LoginPayload } from '@/domain/vault/types';

export interface OnlineBreachCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface BreachedItemResult {
  itemId: string;
  itemTitle: string;
  breachCount: number;
}

export function OnlineBreachCheckModal({
  open,
  onOpenChange,
}: OnlineBreachCheckModalProps) {
  const [consentGiven, setConsentGiven] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResults, setScanResults] = React.useState<BreachedItemResult[] | null>(null);
  const [totalScanned, setTotalScanned] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const decryptedVault = appVaultService.getDecryptedVault();

  const handleScan = async () => {
    if (!consentGiven || !decryptedVault) return;

    setIsScanning(true);
    setError(null);
    setScanResults(null);

    try {
      const breached: BreachedItemResult[] = [];
      let count = 0;

      for (const item of decryptedVault.items) {
        if (item.type === 'login' || item.type === 'bank_login') {
          const payload = item.payload as unknown as LoginPayload;
          const password = payload?.password;

          if (password) {
            count++;
            const result = await checkPasswordBreachPwned(password, consentGiven);
            if (result.isBreached) {
              breached.push({
                itemId: item.id,
                itemTitle: item.title,
                breachCount: result.breachCount,
              });
            }
          }
        }
      }

      setTotalScanned(count);
      setScanResults(breached);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Breach check failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setConsentGiven(false);
    setScanResults(null);
    setTotalScanned(0);
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) handleReset();
        onOpenChange(newOpen);
      }}
      title="Optional Online Breach Check"
      description="Verify if any stored passwords have appeared in known public data breaches using the k-Anonymity protocol."
    >
      <div className="space-y-4 pt-2">
        {/* Privacy Disclosure Notice */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3.5 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-accent">
            <Globe className="h-4 w-4" />
            <span>Zero-Knowledge k-Anonymity Privacy Guarantee</span>
          </div>
          <p className="text-text-secondary leading-relaxed">
            Your plain passwords, usernames, and URLs <strong>NEVER</strong> leave your browser.
            AegisVault calculates a SHA-1 hash locally in memory and only transmits the first <strong>5 characters</strong> (e.g. <code className="font-mono text-accent">5BAA6</code>) of the hash to the API. Matching occurs completely in your browser.
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-md">
            {error}
          </div>
        )}

        {!scanResults ? (
          <div className="space-y-4">
            <label className="flex items-start gap-2.5 text-xs text-text-primary cursor-pointer p-3 rounded-lg border border-border bg-surface-subtle">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 rounded border-border text-accent focus:ring-accent"
              />
              <span className="leading-relaxed">
                I understand and give explicit consent for AegisVault to perform anonymized 5-character prefix hash queries to check for public data breaches.
              </span>
            </label>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleScan}
                disabled={!consentGiven || isScanning}
                className="gap-1.5"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{isScanning ? 'Scanning via k-Anonymity...' : 'Run Breach Audit'}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-subtle">
              <span className="text-xs text-text-secondary">
                Scanned <strong>{totalScanned}</strong> account passwords.
              </span>
              <Badge variant={scanResults.length === 0 ? 'success' : 'danger'}>
                {scanResults.length === 0 ? '0 Compromised' : `${scanResults.length} Breached`}
              </Badge>
            </div>

            {scanResults.length === 0 ? (
              <div className="p-4 text-center space-y-1 bg-success/5 border border-success/20 rounded-lg">
                <CheckCircle2 className="mx-auto h-7 w-7 text-success" />
                <div className="text-xs font-semibold text-text-primary">No Breached Passwords Found</div>
                <div className="text-[11px] text-text-secondary">
                  None of your vault passwords appeared in the Have I Been Pwned database.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-danger flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Compromised Passwords Detected — Change Immediately</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {scanResults.map((r) => (
                    <div
                      key={r.itemId}
                      className="flex items-center justify-between p-2 rounded-md bg-danger/10 border border-danger/20 text-xs"
                    >
                      <span className="font-semibold text-text-primary">{r.itemTitle}</span>
                      <span className="text-danger font-mono text-[11px]">
                        Appeared {r.breachCount.toLocaleString()} times in breaches
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Scan Again
              </Button>
              <Button variant="default" size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
