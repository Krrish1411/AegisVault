import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Check, X } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { RecoverySetupModal } from '@/features/recovery/RecoverySetupModal';
import { appVaultService } from '@/application/services/AppVaultService';
import { validateMasterPassword } from '@/security/crypto/passwordPolicy';
import { useUiStore } from '@/state/uiStore';

export interface CreateVaultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateVaultModal({ open, onOpenChange }: CreateVaultModalProps) {
  const navigate = useNavigate();
  const addToast = useUiStore((state) => state.addToast);

  const [vaultName, setVaultName] = React.useState('Personal Vault');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [isCreating, setIsCreating] = React.useState(false);

  // Recovery Modal State
  const [showRecoveryModal, setShowRecoveryModal] = React.useState(false);
  const [generatedPhrase, setGeneratedPhrase] = React.useState('');

  const validation = validateMasterPassword(password);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultName.trim()) {
      setError('Please enter a vault name');
      return;
    }
    if (!validation.isValid) {
      setError(validation.errors[0] || 'Master password does not meet security requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Master passwords do not match');
      return;
    }

    setIsCreating(true);
    setError(undefined);

    try {
      const result = await appVaultService.createVault({
        vaultName: vaultName.trim(),
        masterPassword: password,
      });

      addToast({
        title: 'Vault Initialized',
        description: 'Your 256-bit encrypted vault has been created with BIP39 recovery wrapping.',
        variant: 'success',
      });

      setGeneratedPhrase(result.recoveryPhrase);
      onOpenChange(false);
      setShowRecoveryModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vault');
    } finally {
      setIsCreating(false);
    }
  };

  const checklist = [
    { label: 'Minimum 12 characters', ok: validation.requirements.minLength },
    { label: 'Lowercase letter (a-z)', ok: validation.requirements.hasLowercase },
    { label: 'Uppercase letter (A-Z)', ok: validation.requirements.hasUppercase },
    { label: 'Number (0-9)', ok: validation.requirements.hasNumber },
    { label: 'Special symbol (!@#$%...)', ok: validation.requirements.hasSymbol },
  ];

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title="Create Encrypted Vault"
        description="Your master password protects your 256-bit encryption key across all your vaults. It is never transmitted or persisted in plaintext."
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="create-vault-name" className="text-xs font-medium text-text-secondary">
              Vault Name
            </label>
            <Input
              id="create-vault-name"
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              placeholder="e.g. Personal Vault"
              disabled={isCreating}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="create-master-password" className="text-xs font-medium text-text-secondary">
                Master Password
              </label>
              <span className="text-[11px] font-mono text-accent">
                {validation.score === 5 ? 'Institutional Grade' : `${validation.score}/5 criteria`}
              </span>
            </div>

            <SecretInput
              id="create-master-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(undefined);
              }}
              placeholder="Enter a strong master password..."
              disabled={isCreating}
              allowCopy={false}
            />

            {/* Score progress bar */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-colors ${
                    validation.score >= idx
                      ? validation.score === 5
                        ? 'bg-emerald-500'
                        : validation.score >= 3
                        ? 'bg-accent'
                        : 'bg-amber-500'
                      : 'bg-moss border border-line/40'
                  }`}
                />
              ))}
            </div>

            {/* Real-time Checklist */}
            <div className="rounded-xl border border-line bg-card/60 p-2.5 space-y-1.5 text-xs">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink/40 font-mono">
                Password Requirements
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {checklist.map((c) => (
                  <div key={c.label} className="flex items-center gap-1.5 text-[11px]">
                    {c.ok ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-ink/30 shrink-0" />
                    )}
                    <span className={c.ok ? 'text-ink font-medium' : 'text-ink/50'}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-confirm-password" className="text-xs font-medium text-text-secondary">
              Confirm Master Password
            </label>
            <SecretInput
              id="create-confirm-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError(undefined);
              }}
              placeholder="Re-enter your master password..."
              disabled={isCreating}
              allowCopy={false}
            />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="rounded-lg bg-surface-subtle p-3 text-[11px] text-text-secondary space-y-1">
            <p className="flex items-center gap-1.5 font-medium text-text-primary">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span>Cryptographic Invariant</span>
            </p>
            <p>
              Master password runs through Argon2id key derivation to unwrap a random 256-bit Vault Encryption Key.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>

            <Button type="submit" size="sm" isLoading={isCreating} disabled={isCreating} className="gap-2">
              <Lock className="h-3.5 w-3.5" />
              <span>Create & Encrypt Vault</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 24-Word BIP39 Recovery Phrase Confirmation Flow */}
      <RecoverySetupModal
        open={showRecoveryModal}
        onOpenChange={setShowRecoveryModal}
        recoveryPhrase={generatedPhrase}
        onConfirmed={() => {
          navigate('/dashboard');
        }}
      />
    </>
  );
}
