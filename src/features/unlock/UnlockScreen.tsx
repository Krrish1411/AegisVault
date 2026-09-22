import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  LifeBuoy,
  Lock,
  Sparkles,
  ShieldAlert,
  Plus,
  KeyRound,
  Fingerprint,
} from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/primitives/Card';
import { StatusIndicator } from '@/ui/primitives/StatusIndicator';
import { RecoveryUnlockModal } from '@/features/recovery/RecoveryUnlockModal';
import { CreateVaultModal } from '@/features/onboarding/CreateVaultModal';
import { EmergencyUnlockModal } from '@/features/emergency/EmergencyUnlockModal';
import { appVaultService } from '@/application/services/AppVaultService';
import { useSessionStore } from '@/state/sessionStore';
import { useUiStore } from '@/state/uiStore';
import { AuthenticationFailedError, VaultNotFoundError } from '@/lib/errors/VaultError';

export function UnlockScreen() {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [hasQuickPin, setHasQuickPin] = React.useState(false);
  const [hasBiometric, setHasBiometric] = React.useState(false);
  const [unlockMode, setUnlockMode] = React.useState<'pin' | 'password'>('password');
  const [pinAttemptsLeft, setPinAttemptsLeft] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [isUnlocking, setIsUnlocking] = React.useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = React.useState(false);
  const [showEmergencyUnlockModal, setShowEmergencyUnlockModal] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [hasVault, setHasVault] = React.useState<boolean | null>(null);

  const vaultName = useSessionStore((state) => state.vaultName) ?? 'Personal Vault';
  const addToast = useUiStore((state) => state.addToast);

  const triggerBiometricUnlock = React.useCallback(async () => {
    setIsUnlocking(true);
    setError(undefined);
    try {
      await appVaultService.unlockWithBiometric();
      addToast({
        title: 'Vault Decrypted',
        description: 'Biometric identity verified. Session active.',
        variant: 'success',
      });
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('password')) {
        setError(msg);
      }
    } finally {
      setIsUnlocking(false);
    }
  }, [addToast, navigate]);

  // If already unlocked, redirect to dashboard
  const status = useSessionStore((state) => state.status);
  React.useEffect(() => {
    if (status === 'unlocked') {
      navigate('/dashboard');
    }
  }, [status, navigate]);

  // Check if vault exists in storage, if biometrics or Quick PIN is configured
  React.useEffect(() => {
    appVaultService.isVaultCreated().then(async (exists) => {
      setHasVault(exists);
      if (exists) {
        const bioConfigured = appVaultService.hasBiometricUnlock();
        setHasBiometric(bioConfigured);

        if (bioConfigured) {
          triggerBiometricUnlock();
        } else {
          const pinConfigured = appVaultService.hasQuickPin();
          setHasQuickPin(pinConfigured);
          if (pinConfigured) {
            setUnlockMode('pin');
          }
        }
      }
    });
  }, [triggerBiometricUnlock]);

  const handlePasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your master password');
      return;
    }

    setIsUnlocking(true);
    setError(undefined);

    try {
      await appVaultService.unlockVault({
        masterPassword: password,
      });

      addToast({
        title: 'Vault Decrypted',
        description: 'Master key verified with Argon2id. Session active.',
        variant: 'success',
      });

      navigate('/dashboard');
    } catch (err) {
      if (err instanceof VaultNotFoundError) {
        setHasVault(false);
        setError('No vault found on this device. Please create a new vault to continue.');
      } else if (err instanceof AuthenticationFailedError) {
        setError('Incorrect master password. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to unlock vault');
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleQuickPinUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter your device PIN');
      return;
    }

    setIsUnlocking(true);
    setError(undefined);

    try {
      await appVaultService.unlockWithQuickPin(pin);

      addToast({
        title: 'Vault Unlocked',
        description: 'Device PIN verified in <0.05s. Session active.',
        variant: 'success',
      });

      navigate('/dashboard');
    } catch {
      const remaining = appVaultService.getQuickPinRemainingAttempts();
      setPinAttemptsLeft(remaining);
      if (remaining === 0) {
        setHasQuickPin(false);
        setUnlockMode('password');
        setError('Quick PIN disabled after 3 incorrect attempts. Please unlock with your Master Password.');
      } else {
        setError(`Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`);
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleDemoFill = () => {
    setPassword('DemoPassword123!');
  };

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center page-bg px-4 py-12 text-ink select-none">
        {/* Gateway Canvas */}
        <div className="w-full max-w-md space-y-6 anim-fade-up" style={{ zoom: 1.15 }}>
          {/* Brand Shield Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/25 shadow-hero mb-2 anim-pop">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-display font-extrabold tracking-tight text-ink">
              AegisVault
            </h1>
            <div className="flex items-center justify-center gap-2">
              <StatusIndicator status="offline" label="Private & Offline • 0 Cloud Calls" />
            </div>
          </div>

          {/* Conditional Card: No Vault Found vs Decrypt Form */}
          {hasVault === false ? (
            /* No Vault Found State */
            <Card className="border-line bg-card shadow-card lift text-center">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/25 mb-2 anim-pop">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl font-display font-bold text-ink">
                  No Vault Found
                </CardTitle>
                <CardDescription className="text-xs text-ink/65 max-w-xs mx-auto leading-relaxed pt-1">
                  There is no encrypted vault stored on this device yet. Create your master vault to get started.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-1">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full gap-2 shadow-hero active:scale-95 text-xs font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Vault</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <div className="pt-2 border-t border-line/60 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => navigate('/welcome')}
                    className="inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-ink transition-colors cursor-pointer font-medium"
                  >
                    <span>View Welcome & Architecture</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Active Vault Unlock Card */
            <Card className="border-line bg-card shadow-card lift">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-display font-bold text-ink">{vaultName}</CardTitle>
                <CardDescription className="text-xs text-ink/65">
                  {unlockMode === 'pin'
                    ? 'Enter your device PIN for instant decryption (<0.05s)'
                    : 'Enter your master password to decrypt your session'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {unlockMode === 'pin' ? (
                  /* Quick Device PIN Form */
                  <form onSubmit={handleQuickPinUnlock} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="device-pin" className="text-xs font-semibold text-ink/75">
                          Device PIN
                        </label>
                        {pinAttemptsLeft !== null && (
                          <span className="text-[11px] font-medium text-amber-500">
                            {pinAttemptsLeft} attempt{pinAttemptsLeft === 1 ? '' : 's'} remaining
                          </span>
                        )}
                      </div>
                      <SecretInput
                        id="device-pin"
                        placeholder="Enter 4-12 digit PIN..."
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value);
                          if (error) setError(undefined);
                        }}
                        autoFocus
                        disabled={isUnlocking}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      {error && <p className="text-xs text-danger font-medium">{error}</p>}
                    </div>

                    <Button
                      type="submit"
                      className="w-full gap-2 shadow-hero active:scale-95"
                      isLoading={isUnlocking}
                    >
                      <KeyRound className="h-4 w-4" />
                      <span>Unlock with Quick PIN (&lt;0.05s)</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <div className="pt-2 border-t border-line/50 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setUnlockMode('password');
                          setError(undefined);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/65 hover:text-ink transition-colors cursor-pointer"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Use Master Password instead</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Full Argon2id Master Password Form */
                  <form onSubmit={handlePasswordUnlock} className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="master-password" className="text-xs font-semibold text-ink/75">
                        Master Password
                      </label>
                      <SecretInput
                        id="master-password"
                        placeholder="Enter master password..."
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError(undefined);
                        }}
                        autoFocus
                        disabled={isUnlocking}
                      />
                      {error && <p className="text-xs text-danger font-medium">{error}</p>}
                    </div>

                    {hasBiometric && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={triggerBiometricUnlock}
                        disabled={isUnlocking}
                        className="w-full gap-2 border-accent/40 text-accent hover:bg-accent/10 active:scale-95 text-xs font-semibold py-2.5 mb-2"
                      >
                        <Fingerprint className="h-4 w-4" />
                        <span>Unlock with Fingerprint or Face ID</span>
                      </Button>
                    )}

                    <Button
                      type="submit"
                      className="w-full gap-2 shadow-hero active:scale-95"
                      isLoading={isUnlocking}
                    >
                      <Lock className="h-4 w-4" />
                      <span>Decrypt & Unlock Vault</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <div className="pt-1 flex flex-col items-center gap-2">
                      {hasQuickPin && (
                        <button
                          type="button"
                          onClick={() => {
                            setUnlockMode('pin');
                            setError(undefined);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline cursor-pointer"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          <span>Use Quick Device PIN (&lt;0.05s unlock)</span>
                        </button>
                      )}

                      {/* Demo Quick Fill Hint */}
                      <button
                        type="button"
                        onClick={handleDemoFill}
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-accent hover:underline cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3 text-accent" />
                        <span>Using Demo Vault? Autofill demo password</span>
                      </button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recovery and Disaster Protocol */}
          {hasVault !== false && (
            <div className="flex flex-col items-center gap-2 pt-1 text-center">
              <button
                type="button"
                onClick={() => setShowRecoveryModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-ink transition-colors cursor-pointer"
              >
                <LifeBuoy className="h-3.5 w-3.5 text-accent" />
                <span>Forgot password? Use BIP-39 Recovery Phrase</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmergencyUnlockModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline transition-colors cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-accent" />
                <span>Emergency Beneficiary Access / Grant Unlock</span>
              </button>

              <div className="pt-2 border-t border-line/60 w-full flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/welcome')}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-line bg-card/60 hover:bg-moss text-xs font-semibold text-ink/75 hover:text-ink transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span>New to AegisVault? Explore Features & App Guide</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs text-ink/65">
                  <span>Crafted with precision by</span>
                  <span className="font-extrabold tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/25 shadow-xs">
                    Krish Patel
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recovery Unlock Modal */}
      <RecoveryUnlockModal
        open={showRecoveryModal}
        onOpenChange={setShowRecoveryModal}
        onRecovered={() => {
          setShowRecoveryModal(false);
          navigate('/dashboard');
        }}
      />

      {/* Beneficiary Emergency Unlock Modal */}
      <EmergencyUnlockModal
        open={showEmergencyUnlockModal}
        onOpenChange={setShowEmergencyUnlockModal}
      />

      {/* Create Vault Modal */}
      <CreateVaultModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </>
  );
}
