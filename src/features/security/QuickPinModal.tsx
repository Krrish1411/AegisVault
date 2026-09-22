import * as React from 'react';
import { Check, Trash2, ShieldCheck } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';

export interface QuickPinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPinChanged?: () => void;
}

export function QuickPinModal({ open, onOpenChange, onPinChanged }: QuickPinModalProps) {
  const addToast = useUiStore((state) => state.addToast);

  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [hasExistingPin, setHasExistingPin] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPin('');
      setConfirmPin('');
      setError(undefined);
      setHasExistingPin(appVaultService.hasQuickPin());
    }
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();

    if (cleanPin.length < 4 || cleanPin.length > 12) {
      setError('PIN must be between 4 and 12 digits');
      return;
    }

    if (!/^\d+$/.test(cleanPin)) {
      setError('PIN must contain only numbers');
      return;
    }

    if (cleanPin !== confirmPin.trim()) {
      setError('PINs do not match');
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      await appVaultService.setupQuickPin(cleanPin);

      addToast({
        title: 'Quick PIN Enabled',
        description: 'Instant <0.05s device unlock configured. Protected with 3-strike lockout.',
        variant: 'success',
      });

      onPinChanged?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure Quick PIN');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearPin = () => {
    if (confirm('Are you sure you want to disable Quick PIN unlock on this device?')) {
      appVaultService.clearQuickPin();
      addToast({
        title: 'Quick PIN Disabled',
        description: 'Device unlock will require full Master Password.',
        variant: 'default',
      });
      onPinChanged?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={hasExistingPin ? 'Manage Quick Device PIN' : 'Enable Quick Device PIN'}
      description="Configure a 4-12 digit PIN to decrypt your vault in <0.05s on this device while keeping master encryption intact."
    >
      <form onSubmit={handleSave} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label htmlFor="quick-pin" className="text-xs font-semibold text-ink/75">
            New Device PIN (4–12 Digits)
          </label>
          <SecretInput
            id="quick-pin"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              if (error) setError(undefined);
            }}
            placeholder="Enter numeric PIN..."
            disabled={isSaving}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={12}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm-quick-pin" className="text-xs font-semibold text-ink/75">
            Confirm Device PIN
          </label>
          <SecretInput
            id="confirm-quick-pin"
            value={confirmPin}
            onChange={(e) => {
              setConfirmPin(e.target.value);
              if (error) setError(undefined);
            }}
            placeholder="Re-enter numeric PIN..."
            disabled={isSaving}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={12}
          />
          {error && <p className="text-xs text-danger font-medium">{error}</p>}
        </div>

        <div className="rounded-xl border border-line bg-surface-subtle p-3 space-y-1.5 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5 font-semibold text-text-primary">
            <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
            <span>Hardware-Grade Security</span>
          </div>
          <p>
            Your PIN is fortified with 100,000 rounds of PBKDF2 and XChaCha20-Poly1305.
            After 3 incorrect attempts, device credentials are automatically purged.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {hasExistingPin ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearPin}
              className="gap-1.5 text-xs text-danger hover:text-danger hover:bg-danger/10"
              disabled={isSaving}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Disable PIN</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
              className="gap-1.5 text-xs shadow-hero active:scale-95"
            >
              <Check className="h-4 w-4" />
              <span>{hasExistingPin ? 'Update PIN' : 'Save PIN'}</span>
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
