import * as React from 'react';
import {
  Star,
  Lock,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { SecretInput } from '@/ui/primitives/SecretInput';
import { CustomSelect, type SelectOption } from '@/ui/primitives/CustomSelect';
import { GeneratorModal } from '@/features/generator/GeneratorModal';
import { detectCardIssuer, formatCardNumber, formatPan } from '@/domain/cards/cardHelpers';
import { generateBurnerPersona } from '@/domain/generator/burnerPersonaGenerator';
import type {
  VaultItemEnvelope,
  VaultItemType,
  PasswordHistoryEntry,
  MpinHistoryEntry,
} from '@/domain/vault/types';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';

const BANK_ACCOUNT_TYPE_OPTIONS: readonly SelectOption[] = [
  { value: 'savings', label: 'Savings Account' },
  { value: 'current', label: 'Current / Checking Account' },
  { value: 'salary', label: 'Salary Account' },
  { value: 'fixed_deposit', label: 'Fixed Deposit (FD)' },
];

const DOCUMENT_TYPE_OPTIONS: readonly SelectOption[] = [
  { value: 'cancelled_cheque', label: 'Cancelled Cheque' },
  { value: 'passbook', label: 'Bank Passbook Copy' },
  { value: 'id_card', label: 'National ID / Aadhaar' },
  { value: 'passport', label: 'Passport Scan' },
  { value: 'tax_return', label: 'Tax Return / Form 16' },
  { value: 'financial', label: 'Financial Statement' },
  { value: 'contract', label: 'Legal Contract' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'medical', label: 'Medical Record' },
  { value: 'other', label: 'Other Document' },
];

export interface AddEditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: VaultItemType;
  editingItem?: VaultItemEnvelope | null;
  onSaved: () => void;
}

export function AddEditItemModal({
  open,
  onOpenChange,
  defaultType = 'login',
  editingItem,
  onSaved,
}: AddEditItemModalProps) {
  const [itemType, setItemType] = React.useState<VaultItemType>(defaultType);
  const [title, setTitle] = React.useState('');
  const [favorite, setFavorite] = React.useState(false);
  const [payloadFields, setPayloadFields] = React.useState<Record<string, string>>({});
  const [showGeneratorModal, setShowGeneratorModal] = React.useState(false);
  const [targetSecretField, setTargetSecretField] = React.useState<string>('password');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const openGeneratorForField = (fieldName: string) => {
    setTargetSecretField(fieldName);
    setShowGeneratorModal(true);
  };

  const activeVaultId = useUiStore((s) => s.activeVaultId);
  const addToast = useUiStore((s) => s.addToast);

  const handleGenerateBurnerPersona = () => {
    const burner = generateBurnerPersona();
    if (!title) {
      setTitle(burner.title);
    }
    setPayloadFields((prev) => ({
      ...prev,
      profileType: 'temporary',
      fullName: burner.fullName ?? '',
      company: burner.company ?? '',
      addressLine1: burner.addressLine1 ?? '',
      addressLine2: burner.addressLine2 ?? '',
      city: burner.city ?? '',
      state: burner.state ?? '',
      postalCode: burner.postalCode ?? '',
      country: burner.country ?? '',
      phone: burner.phone ?? '',
      email: burner.email ?? '',
      purpose: burner.purpose ?? '',
      notes: burner.notes ?? '',
    }));
    addToast({
      title: 'Burner Persona Generated',
      description: `Created disposable persona for ${burner.fullName} (${burner.city}).`,
      variant: 'default',
    });
  };

  // Initialize form when opening
  React.useEffect(() => {
    if (editingItem) {
      setItemType(editingItem.type);
      setTitle(editingItem.title);
      setFavorite(editingItem.favorite);
      setPayloadFields((editingItem.payload as Record<string, string>) || {});
    } else {
      setItemType(defaultType);
      setTitle('');
      setFavorite(false);
      setPayloadFields({});
    }
    setError(undefined);
  }, [editingItem, defaultType, open]);

  const existingItems = React.useMemo(() => {
    if (!open) return [];
    const domain = appVaultService.getDecryptedVault();
    if (!domain) return [];
    return domain.items.filter((i) => !editingItem || i.id !== editingItem.id);
  }, [editingItem, open]);

  const linkItemOptions: readonly SelectOption[] = React.useMemo(() => {
    const defaultOpt: SelectOption = { value: '', label: 'None (Standalone Document / Item)' };
    const mapped: SelectOption[] = existingItems.map((i) => ({
      value: i.id,
      label: `${i.title} (${i.type.replace(/_/g, ' ')})`,
    }));
    return [defaultOpt, ...mapped];
  }, [existingItems]);

  const updateField = (key: string, value: string) => {
    setPayloadFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Item title is required');
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const now = new Date().toISOString();

      // Password history check if login/password item
      let history: PasswordHistoryEntry[] = [...(editingItem?.passwordHistory ?? [])];
      if (editingItem && payloadFields.password) {
        const oldPayload = editingItem.payload as Record<string, string>;
        if (oldPayload.password && oldPayload.password !== payloadFields.password) {
          const newHistoryEntry: PasswordHistoryEntry = {
            id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            password: oldPayload.password,
            archivedAt: now,
          };
          history = [newHistoryEntry, ...history].slice(0, 10);
        }
      }

      // MPIN history check if banking item
      let mpinHistory: MpinHistoryEntry[] = [
        ...(((editingItem?.payload as Record<string, unknown>)?.mpinHistory as MpinHistoryEntry[]) ?? []),
      ];
      if (editingItem && itemType === 'bank_account' && payloadFields.mpin) {
        const oldPayload = editingItem.payload as Record<string, unknown>;
        if (oldPayload.mpin && oldPayload.mpin !== payloadFields.mpin) {
          const newMpinEntry: MpinHistoryEntry = {
            id: `mpin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            pin: String(oldPayload.mpin),
            archivedAt: now,
          };
          mpinHistory = [newMpinEntry, ...mpinHistory].slice(0, 10);
        }
      }

      const item: VaultItemEnvelope = {
        id: editingItem?.id ?? `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: itemType,
        title: title.trim(),
        favorite,
        archived: editingItem?.archived ?? false,
        vaultId: editingItem?.vaultId ?? (activeVaultId !== 'all' ? activeVaultId : 'vault-personal'),
        createdAt: editingItem?.createdAt ?? now,
        updatedAt: now,
        attachmentIds: editingItem?.attachmentIds,
        linkedItemIds: editingItem?.linkedItemIds,
        payload: {
          ...payloadFields,
          ...(mpinHistory.length > 0 ? { mpinHistory } : {}),
        } as unknown as Record<string, unknown>,
        ...(history.length > 0 ? { passwordHistory: history } : {}),
      };

      await appVaultService.saveItem(item);

      if (payloadFields.linkedItemId) {
        await appVaultService.linkItemToItem(item.id, payloadFields.linkedItemId);
      }

      addToast({
        title: editingItem ? 'Item Updated' : 'Item Saved',
        description: `"${title}" has been encrypted and saved.`,
        variant: 'success',
      });

      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={editingItem ? `Edit ${title || 'Item'}` : 'Add Secure Item'}
        description="All fields are encrypted with 256-bit XChaCha20-Poly1305 before persisting."
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto pr-1">
          {/* Type Selector (only for new items) */}
          {!editingItem && (
            <div className="space-y-1">
              <label htmlFor="item-type-select" className="text-xs font-medium text-text-secondary">Item Type</label>
              <select
                id="item-type-select"
                value={itemType}
                onChange={(e) => {
                  setItemType(e.target.value as VaultItemType);
                  setPayloadFields({});
                }}
                className="flex h-11 w-full rounded-xl border border-line bg-card px-3.5 py-2 text-sm text-ink transition-all shadow-xs outline-none cursor-pointer focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
              >
                <optgroup label="Credentials">
                  <option value="login">Website / Login Account</option>
                  <option value="bank_login">Bank NetBanking Login</option>
                  <option value="secure_note">Secure Note</option>
                </optgroup>
                <optgroup label="Cards & Banking">
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_account">Bank Account</option>
                  <option value="upi">UPI / VPA Handle</option>
                  <option value="atm_pin">ATM / Card PIN</option>
                </optgroup>
                <optgroup label="Identity & Documents">
                  <option value="address">Address & Persona (Real / Burner)</option>
                  <option value="identity">Personal Identity Profile</option>
                  <option value="document">Document / Cancelled Cheque Record</option>
                  <option value="pan">PAN Card (India)</option>
                  <option value="aadhaar">Aadhaar Card (India)</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="tax_id">Tax ID / SSN</option>
                  <option value="insurance">Insurance Policy</option>
                  <option value="emergency_contact">Emergency Contact</option>
                </optgroup>
                <optgroup label="Crypto & Developer Keys">
                  <option value="totp">Authenticator / TOTP Key</option>
                  <option value="wallet_seed">Crypto Wallet Seed Phrase</option>
                  <option value="private_key">Private Key</option>
                  <option value="api_key">API Key & Secret</option>
                  <option value="ssh_key">SSH Key Pair</option>
                </optgroup>
              </select>
            </div>
          )}

          {/* Title & Favorite */}
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <label htmlFor="item-title" className="text-xs font-medium text-text-secondary">Title / Record Name</label>
              <Input
                id="item-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. HDFC Salary Account, Chase Sapphire, Passport"
                disabled={isSaving}
                autoFocus
                required
              />
            </div>

            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              title={favorite ? 'Remove from favorites' : 'Mark as favorite'}
              className={`mt-6 flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
                favorite
                  ? 'border-warning/50 bg-warning/10 text-warning'
                  : 'border-border bg-surface text-text-muted hover:text-text-primary'
              }`}
            >
              <Star className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* --- DYNAMIC PAYLOAD FORMS BASED ON TYPE --- */}

          {/* 1. Login / Bank Login */}
          {(itemType === 'login' || itemType === 'bank_login') && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Username / User ID</label>
                <Input
                  value={payloadFields.username ?? ''}
                  onChange={(e) => updateField('username', e.target.value)}
                  placeholder="user@example.com"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">Password</label>
                  <button
                    type="button"
                    onClick={() => openGeneratorForField('password')}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Generate</span>
                  </button>
                </div>
                <SecretInput
                  value={payloadFields.password ?? ''}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Password..."
                  disabled={isSaving}
                  allowCopy={false}
                />
              </div>

              {itemType === 'bank_login' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">Transaction Password / PIN</label>
                    <button
                      type="button"
                      onClick={() => openGeneratorForField('transactionPassword')}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <SecretInput
                    value={payloadFields.transactionPassword ?? ''}
                    onChange={(e) => updateField('transactionPassword', e.target.value)}
                    placeholder="Secondary transaction PIN/password..."
                    disabled={isSaving}
                    allowCopy={false}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Portal / Website URL</label>
                <Input
                  value={payloadFields.urls ?? ''}
                  onChange={(e) => updateField('urls', e.target.value)}
                  placeholder="https://..."
                  disabled={isSaving}
                />
              </div>
            </div>
          )}

          {/* 2. Credit Card / Debit Card */}
          {(itemType === 'credit_card' || itemType === 'debit_card') && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Cardholder Name</label>
                <Input
                  value={payloadFields.cardholderName ?? ''}
                  onChange={(e) => updateField('cardholderName', e.target.value)}
                  placeholder="NAME AS PRINTED ON CARD"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">Card Number</label>
                  {payloadFields.cardNumber && (
                    <span className="text-[11px] font-mono text-accent font-semibold uppercase">
                      {detectCardIssuer(payloadFields.cardNumber)}
                    </span>
                  )}
                </div>
                <Input
                  value={payloadFields.cardNumber ?? ''}
                  onChange={(e) => updateField('cardNumber', formatCardNumber(e.target.value))}
                  placeholder="4111 2222 3333 4444"
                  disabled={isSaving}
                  className="font-mono"
                  maxLength={23}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Exp Month</label>
                  <Input
                    value={payloadFields.expiryMonth ?? ''}
                    onChange={(e) => updateField('expiryMonth', e.target.value.slice(0, 2))}
                    placeholder="MM (08)"
                    disabled={isSaving}
                    className="font-mono"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Exp Year</label>
                  <Input
                    value={payloadFields.expiryYear ?? ''}
                    onChange={(e) => updateField('expiryYear', e.target.value.slice(0, 4))}
                    placeholder="YYYY (2028)"
                    disabled={isSaving}
                    className="font-mono"
                    maxLength={4}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">CVV / CVC</label>
                  <SecretInput
                    value={payloadFields.cvv ?? ''}
                    onChange={(e) => updateField('cvv', e.target.value.slice(0, 4))}
                    placeholder="123"
                    disabled={isSaving}
                    allowCopy={false}
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">Card / ATM PIN (Optional)</label>
                  <button
                    type="button"
                    onClick={() => openGeneratorForField('pin')}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Generate PIN</span>
                  </button>
                </div>
                <SecretInput
                  value={payloadFields.pin ?? ''}
                  onChange={(e) => updateField('pin', e.target.value.slice(0, 6))}
                  placeholder="4–6 digit PIN..."
                  disabled={isSaving}
                  allowCopy={false}
                  maxLength={6}
                />
              </div>
            </div>
          )}

          {/* 3. Bank Account */}
          {itemType === 'bank_account' && (
            <div className="space-y-4">
              {/* Account Details */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink/50 font-mono">
                  Bank & Account Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Bank Name</label>
                    <Input
                      value={payloadFields.bankName ?? ''}
                      onChange={(e) => updateField('bankName', e.target.value)}
                      placeholder="e.g. State Bank of India, HDFC, ICICI, Chase"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Account Holder</label>
                    <Input
                      value={payloadFields.accountHolderName ?? ''}
                      onChange={(e) => updateField('accountHolderName', e.target.value)}
                      placeholder="Legal name on account"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Account Number</label>
                  <SecretInput
                    value={payloadFields.accountNumber ?? ''}
                    onChange={(e) => updateField('accountNumber', e.target.value)}
                    placeholder="Bank account number..."
                    disabled={isSaving}
                    allowCopy={false}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">IFSC / Routing Code</label>
                    <Input
                      value={payloadFields.ifscCode ?? ''}
                      onChange={(e) => updateField('ifscCode', e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234 / HDFC0000128"
                      disabled={isSaving}
                      className="font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <CustomSelect
                      label="Account Type"
                      value={payloadFields.accountType ?? 'savings'}
                      onChange={(val) => updateField('accountType', val)}
                      options={BANK_ACCOUNT_TYPE_OPTIONS}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Branch Name</label>
                    <Input
                      value={payloadFields.branchName ?? ''}
                      onChange={(e) => updateField('branchName', e.target.value)}
                      placeholder="Branch location or branch code"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Customer ID / CIF</label>
                    <Input
                      value={payloadFields.customerId ?? ''}
                      onChange={(e) => updateField('customerId', e.target.value)}
                      placeholder="CIF number or Customer ID"
                      disabled={isSaving}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* NetBanking Credentials */}
              <div className="space-y-2.5 pt-2 border-t border-border">
                <div className="text-[11px] font-bold uppercase tracking-wider text-accent font-mono">
                  Net Banking Credentials
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Net Banking User ID</label>
                    <Input
                      value={payloadFields.netBankingUserId ?? ''}
                      onChange={(e) => updateField('netBankingUserId', e.target.value)}
                      placeholder="Net Banking login user ID"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-text-secondary">Net Banking Password</label>
                      <button
                        type="button"
                        onClick={() => openGeneratorForField('netBankingPassword')}
                        className="text-[11px] text-accent hover:underline cursor-pointer"
                      >
                        Generate
                      </button>
                    </div>
                    <SecretInput
                      value={payloadFields.netBankingPassword ?? ''}
                      onChange={(e) => updateField('netBankingPassword', e.target.value)}
                      placeholder="Net Banking login password"
                      disabled={isSaving}
                      allowCopy={false}
                    />
                  </div>
                </div>
              </div>

              {/* High Security Banking Passwords */}
              <div className="space-y-2.5 pt-2 border-t border-border">
                <div className="text-[11px] font-bold uppercase tracking-wider text-accent font-mono">
                  High-Security Banking Passwords
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-text-secondary">Profile Password</label>
                      <span className="text-[10px] text-text-muted">(SBI / Beneficiary Mgmt)</span>
                    </div>
                    <SecretInput
                      value={payloadFields.profilePassword ?? ''}
                      onChange={(e) => updateField('profilePassword', e.target.value)}
                      placeholder="Secondary profile password"
                      disabled={isSaving}
                      allowCopy={false}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-text-secondary">Transaction Password</label>
                      <span className="text-[10px] text-text-muted">(Funds Transfer)</span>
                    </div>
                    <SecretInput
                      value={payloadFields.transactionPassword ?? ''}
                      onChange={(e) => updateField('transactionPassword', e.target.value)}
                      placeholder="Transaction authorization password"
                      disabled={isSaving}
                      allowCopy={false}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Banking MPIN & ATM Card PIN */}
              <div className="space-y-2.5 pt-2 border-t border-border">
                <div className="text-[11px] font-bold uppercase tracking-wider text-accent font-mono flex items-center justify-between">
                  <span>Mobile Banking & PINs</span>
                  {editingItem && Array.isArray((editingItem.payload as Record<string, unknown>)?.mpinHistory) && (
                    <span className="text-[10px] text-text-muted lowercase font-sans">
                      {((editingItem.payload as Record<string, unknown>).mpinHistory as unknown[]).length} previous MPINs archived
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">MPIN (Mobile PIN)</label>
                    <SecretInput
                      value={payloadFields.mpin ?? ''}
                      onChange={(e) => updateField('mpin', e.target.value)}
                      placeholder="4 or 6 digit MPIN"
                      disabled={isSaving}
                      allowCopy={false}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">ATM / Debit PIN</label>
                    <SecretInput
                      value={payloadFields.atmPin ?? ''}
                      onChange={(e) => updateField('atmPin', e.target.value)}
                      placeholder="4 digit ATM PIN"
                      disabled={isSaving}
                      allowCopy={false}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">UPI ID / VPA</label>
                    <Input
                      value={payloadFields.upiId ?? ''}
                      onChange={(e) => updateField('upiId', e.target.value.toLowerCase())}
                      placeholder="name@okhdfcbank"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* International (IBAN / SWIFT) */}
              <div className="space-y-1 pt-2 border-t border-border">
                <label className="text-xs font-medium text-text-secondary">IBAN / SWIFT (Optional)</label>
                <Input
                  value={payloadFields.iban ?? ''}
                  onChange={(e) => updateField('iban', e.target.value.toUpperCase())}
                  placeholder="International Bank Account Number"
                  disabled={isSaving}
                  className="font-mono"
                />
              </div>
            </div>
          )}

          {/* 4. UPI & ATM PIN */}
          {itemType === 'upi' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">UPI ID / VPA</label>
                <Input
                  value={payloadFields.upiId ?? ''}
                  onChange={(e) => updateField('upiId', e.target.value.toLowerCase())}
                  placeholder="username@okhdfcbank"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Linked Bank Name</label>
                <Input
                  value={payloadFields.linkedBank ?? ''}
                  onChange={(e) => updateField('linkedBank', e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">UPI PIN</label>
                  <button
                    type="button"
                    onClick={() => openGeneratorForField('upiPin')}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Generate PIN</span>
                  </button>
                </div>
                <SecretInput
                  value={payloadFields.upiPin ?? ''}
                  onChange={(e) => updateField('upiPin', e.target.value.slice(0, 6))}
                  placeholder="4–6 digit UPI PIN..."
                  disabled={isSaving}
                  allowCopy={false}
                  maxLength={6}
                />
              </div>
            </div>
          )}

          {itemType === 'atm_pin' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Card Reference / Bank</label>
                <Input
                  value={payloadFields.cardTitle ?? ''}
                  onChange={(e) => updateField('cardTitle', e.target.value)}
                  placeholder="e.g. ICICI Coral Debit Card"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">ATM PIN</label>
                  <button
                    type="button"
                    onClick={() => openGeneratorForField('pin')}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Generate</span>
                  </button>
                </div>
                <SecretInput
                  value={payloadFields.pin ?? ''}
                  onChange={(e) => updateField('pin', e.target.value.slice(0, 6))}
                  placeholder="4 digit ATM PIN..."
                  disabled={isSaving}
                  allowCopy={false}
                  maxLength={6}
                />
              </div>
            </div>
          )}

          {/* Address & Personal Persona (Real vs. Disposable Burner) */}
          {(itemType === 'address' || itemType === 'identity') && (
            <div className="space-y-4">
              {/* Persona Type Toggle & Quick Generator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-line bg-surface-subtle shadow-xs">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                    <span>Profile Type & Privacy Level</span>
                  </span>
                  <p className="text-[11px] text-ink/60">
                    Choose between your official real persona or a disposable burner persona for untrusted sites.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="inline-flex rounded-lg border border-line bg-card p-0.5 shadow-xs">
                    <button
                      type="button"
                      onClick={() => updateField('profileType', 'real')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        (payloadFields.profileType ?? 'real') === 'real'
                          ? 'bg-pine-600 text-white shadow-xs font-bold'
                          : 'text-ink/65 hover:text-ink'
                      }`}
                    >
                      Official / Real
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('profileType', 'temporary')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        payloadFields.profileType === 'temporary'
                          ? 'bg-accent text-white shadow-xs font-bold'
                          : 'text-ink/65 hover:text-ink'
                      }`}
                    >
                      Burner / Disposable
                    </button>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateBurnerPersona}
                    className="gap-1.5 text-xs h-8 text-accent border-accent/30 hover:bg-accent/10 cursor-pointer"
                    title="Generate realistic burner persona with fake name, address, and disposable email"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Generate Burner</span>
                  </Button>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Full Name / Persona Name</label>
                  <Input
                    value={payloadFields.fullName ?? ''}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Company / Organization (Optional)</label>
                  <Input
                    value={payloadFields.company ?? ''}
                    onChange={(e) => updateField('company', e.target.value)}
                    placeholder="e.g. Apex Ventures Ltd"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Street Address */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Address Line 1 (Street / Building)</label>
                  <Input
                    value={payloadFields.addressLine1 ?? ''}
                    onChange={(e) => updateField('addressLine1', e.target.value)}
                    placeholder="e.g. 742 Evergreen Terrace"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Address Line 2 (Apt / Suite / Landmark)</label>
                  <Input
                    value={payloadFields.addressLine2 ?? ''}
                    onChange={(e) => updateField('addressLine2', e.target.value)}
                    placeholder="e.g. Apt 4B / Block C"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* City, State, Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">City</label>
                  <Input
                    value={payloadFields.city ?? ''}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="e.g. Springfield"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">State / Province</label>
                  <Input
                    value={payloadFields.state ?? ''}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder="e.g. OR / Maharashtra"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">ZIP / Postal PIN Code</label>
                  <Input
                    value={payloadFields.postalCode ?? ''}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    placeholder="e.g. 97477 / 400001"
                    disabled={isSaving}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Country & Contact Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Country</label>
                  <Input
                    value={payloadFields.country ?? ''}
                    onChange={(e) => updateField('country', e.target.value)}
                    placeholder="e.g. United States / India"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Phone / Burner Number</label>
                  <Input
                    value={payloadFields.phone ?? ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="e.g. +1 (555) 019-4821"
                    disabled={isSaving}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Email / Disposable Alias</label>
                  <Input
                    value={payloadFields.email ?? ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="e.g. burner@duck.com"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Purpose / Site Tags */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Intended Purpose / Websites</label>
                <Input
                  value={payloadFields.purpose ?? ''}
                  onChange={(e) => updateField('purpose', e.target.value)}
                  placeholder="e.g. Untrusted signups, free trials, shipping coupons..."
                  disabled={isSaving}
                />
              </div>
            </div>
          )}

          {/* 5. Indian Documents: PAN & Aadhaar */}
          {itemType === 'pan' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">PAN Number (10 alphanumeric)</label>
                <Input
                  value={payloadFields.panNumber ?? ''}
                  onChange={(e) => updateField('panNumber', formatPan(e.target.value))}
                  placeholder="ABCDE1234F"
                  disabled={isSaving}
                  className="font-mono uppercase font-semibold"
                  maxLength={10}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Full Name (As on PAN)</label>
                <Input
                  value={payloadFields.fullName ?? ''}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="FULL NAME"
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Father's Name</label>
                  <Input
                    value={payloadFields.fatherName ?? ''}
                    onChange={(e) => updateField('fatherName', e.target.value)}
                    placeholder="Father's Name"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Date of Birth</label>
                  <Input
                    type="date"
                    value={payloadFields.dateOfBirth ?? ''}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          )}

          {itemType === 'aadhaar' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Aadhaar Number (12 digits)</label>
                <SecretInput
                  value={payloadFields.aadhaarNumber ?? ''}
                  onChange={(e) => updateField('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="12 digit Aadhaar number"
                  disabled={isSaving}
                  allowCopy={false}
                  maxLength={12}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Full Name (As on Aadhaar)</label>
                <Input
                  value={payloadFields.fullName ?? ''}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="FULL NAME"
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Date of Birth</label>
                  <Input
                    type="date"
                    value={payloadFields.dateOfBirth ?? ''}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Linked Phone</label>
                  <Input
                    value={payloadFields.registeredPhone ?? ''}
                    onChange={(e) => updateField('registeredPhone', e.target.value)}
                    placeholder="+91 9876543210"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. Passport & Driving License */}
          {itemType === 'passport' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Passport Number</label>
                  <Input
                    value={payloadFields.passportNumber ?? ''}
                    onChange={(e) => updateField('passportNumber', e.target.value.toUpperCase())}
                    placeholder="Z1234567"
                    disabled={isSaving}
                    className="font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Issuing Country</label>
                  <Input
                    value={payloadFields.country ?? 'India'}
                    onChange={(e) => updateField('country', e.target.value)}
                    placeholder="India"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Expiry Date</label>
                  <Input
                    type="date"
                    value={payloadFields.expiryDate ?? ''}
                    onChange={(e) => updateField('expiryDate', e.target.value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Place of Issue</label>
                  <Input
                    value={payloadFields.placeOfIssue ?? ''}
                    onChange={(e) => updateField('placeOfIssue', e.target.value)}
                    placeholder="e.g. Mumbai, New Delhi"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. Insurance & Emergency Contact */}
          {itemType === 'insurance' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Policy Number</label>
                  <Input
                    value={payloadFields.policyNumber ?? ''}
                    onChange={(e) => updateField('policyNumber', e.target.value)}
                    placeholder="POL-123456"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Insurer Company</label>
                  <Input
                    value={payloadFields.insurerName ?? ''}
                    onChange={(e) => updateField('insurerName', e.target.value)}
                    placeholder="e.g. HDFC ERGO, Star Health"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Sum Insured</label>
                  <Input
                    value={payloadFields.sumInsured ?? ''}
                    onChange={(e) => updateField('sumInsured', e.target.value)}
                    placeholder="₹10,00,000 / $500,000"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Emergency TPA / Contact</label>
                  <Input
                    value={payloadFields.emergencyContact ?? ''}
                    onChange={(e) => updateField('emergencyContact', e.target.value)}
                    placeholder="Toll-free emergency phone"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          )}

          {itemType === 'emergency_contact' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Contact Name</label>
                  <Input
                    value={payloadFields.contactName ?? ''}
                    onChange={(e) => updateField('contactName', e.target.value)}
                    placeholder="Full name"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Relationship</label>
                  <Input
                    value={payloadFields.relationship ?? ''}
                    onChange={(e) => updateField('relationship', e.target.value)}
                    placeholder="e.g. Spouse, Parent, Doctor"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Primary Phone</label>
                <Input
                  value={payloadFields.primaryPhone ?? ''}
                  onChange={(e) => updateField('primaryPhone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  disabled={isSaving}
                />
              </div>
            </div>
          )}

          {/* Document & Cheque Record */}
          {itemType === 'document' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <CustomSelect
                  label="Document Type"
                  value={payloadFields.documentType ?? 'cancelled_cheque'}
                  onChange={(val) => updateField('documentType', val)}
                  options={DOCUMENT_TYPE_OPTIONS}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <CustomSelect
                  label="Link to Bank Account, Login, or Crypto Wallet"
                  value={payloadFields.linkedItemId ?? ''}
                  onChange={(val) => {
                    updateField('linkedItemId', val);
                    const matched = existingItems.find((i) => i.id === val);
                    if (matched) {
                      updateField('linkedItemTitle', matched.title);
                      updateField('linkedItemType', matched.type);
                    } else {
                      updateField('linkedItemTitle', '');
                      updateField('linkedItemType', '');
                    }
                  }}
                  options={linkItemOptions}
                  disabled={isSaving}
                />
                <p className="text-[11px] text-text-muted">
                  Relate this document (e.g. cancelled cheque, passbook scan, PAN) directly to your bank account or login.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Description / Remarks</label>
                <Input
                  value={payloadFields.description ?? ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="e.g. Cancelled cheque with sign for salary mandate"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Document Number / Reference (Optional)</label>
                <Input
                  value={payloadFields.referenceNumber ?? ''}
                  onChange={(e) => updateField('referenceNumber', e.target.value)}
                  placeholder="Cheque No., Account Ref, or Document ID"
                  disabled={isSaving}
                />
              </div>
            </div>
          )}

          {/* 8. TOTP Authenticator */}
          {itemType === 'totp' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Base32 Secret Key</label>
                <SecretInput
                  value={payloadFields.secret ?? ''}
                  onChange={(e) => updateField('secret', e.target.value.toUpperCase().replace(/\s/g, ''))}
                  placeholder="JBSWY3DPEHPK3PXP"
                  disabled={isSaving}
                  allowCopy={false}
                />
                <p className="text-[10px] text-text-muted">
                  RFC 6238 Base32 secret key from your provider (e.g. Google, GitHub, AWS).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Issuer / Service</label>
                  <Input
                    value={payloadFields.issuer ?? ''}
                    onChange={(e) => updateField('issuer', e.target.value)}
                    placeholder="e.g. GitHub, Google, AWS"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Account / Email</label>
                  <Input
                    value={payloadFields.account ?? ''}
                    onChange={(e) => updateField('account', e.target.value)}
                    placeholder="user@example.com"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Algorithm</label>
                  <select
                    value={payloadFields.algorithm ?? 'SHA1'}
                    onChange={(e) => updateField('algorithm', e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-line bg-card px-3.5 py-2 text-sm text-ink transition-all shadow-xs outline-none cursor-pointer focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
                  >
                    <option value="SHA1">SHA-1</option>
                    <option value="SHA256">SHA-256</option>
                    <option value="SHA512">SHA-512</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Digits</label>
                  <select
                    value={payloadFields.digits ?? '6'}
                    onChange={(e) => updateField('digits', e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-line bg-card px-3.5 py-2 text-sm text-ink transition-all shadow-xs outline-none cursor-pointer focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
                  >
                    <option value="6">6 digits</option>
                    <option value="8">8 digits</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Period (Sec)</label>
                  <Input
                    type="number"
                    value={payloadFields.period ?? '30'}
                    onChange={(e) => updateField('period', e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 9. Crypto Wallet Seed */}
          {itemType === 'wallet_seed' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">
                  BIP39 Seed Phrase (12, 15, 18, 21, or 24 words)
                </label>
                <textarea
                  value={payloadFields.seedPhrase ?? ''}
                  onChange={(e) => updateField('seedPhrase', e.target.value.toLowerCase())}
                  placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12..."
                  rows={3}
                  disabled={isSaving}
                  className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                />
                <p className="text-[10px] text-text-muted">
                  Cryptocurrency cold seed phrase. Stored with 256-bit encrypted authenticated envelope.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Blockchain / Network</label>
                  <select
                    value={payloadFields.blockchain ?? 'ethereum'}
                    onChange={(e) => updateField('blockchain', e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-line bg-card px-3.5 py-2 text-sm text-ink transition-all shadow-xs outline-none cursor-pointer focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
                  >
                    <option value="ethereum">Ethereum / EVM (MetaMask, Ledger)</option>
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="solana">Solana (Phantom, Solflare)</option>
                    <option value="cosmos">Cosmos (Keplr)</option>
                    <option value="multi">Multi-Chain HD Wallet</option>
                    <option value="other">Other Blockchain</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Optional 25th Word / Passphrase</label>
                  <SecretInput
                    value={payloadFields.passphrase ?? ''}
                    onChange={(e) => updateField('passphrase', e.target.value)}
                    placeholder="BIP39 Passphrase (Optional)"
                    disabled={isSaving}
                    allowCopy={false}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Primary Public Address (Optional)</label>
                <Input
                  value={payloadFields.primaryAddress ?? ''}
                  onChange={(e) => updateField('primaryAddress', e.target.value)}
                  placeholder="0x... or bc1q..."
                  disabled={isSaving}
                  className="font-mono"
                />
              </div>
            </div>
          )}

          {/* 10. Private Key */}
          {itemType === 'private_key' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Cryptographic Private Key</label>
                <SecretInput
                  value={payloadFields.privateKey ?? ''}
                  onChange={(e) => updateField('privateKey', e.target.value)}
                  placeholder="0x... or 64-char hex key"
                  disabled={isSaving}
                  allowCopy={false}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Key Algorithm / Type</label>
                  <select
                    value={payloadFields.keyType ?? 'ethereum'}
                    onChange={(e) => updateField('keyType', e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-line bg-card px-3.5 py-2 text-sm text-ink transition-all shadow-xs outline-none cursor-pointer focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
                  >
                    <option value="ethereum">Ethereum / secp256k1 (0x...)</option>
                    <option value="solana">Solana / Ed25519 (Base58)</option>
                    <option value="bitcoin">Bitcoin WIF / SegWit</option>
                    <option value="secp256k1">Generic secp256k1</option>
                    <option value="ed25519">Generic Ed25519</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Public Address</label>
                  <Input
                    value={payloadFields.publicKeyOrAddress ?? ''}
                    onChange={(e) => updateField('publicKeyOrAddress', e.target.value)}
                    placeholder="Public key or address"
                    disabled={isSaving}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 11. API Key & SSH Key */}
          {itemType === 'api_key' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">API Key</label>
                <Input
                  value={payloadFields.apiKey ?? ''}
                  onChange={(e) => updateField('apiKey', e.target.value)}
                  placeholder="API Key / Token ID..."
                  disabled={isSaving}
                  className="font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">API Secret</label>
                <SecretInput
                  value={payloadFields.apiSecret ?? ''}
                  onChange={(e) => updateField('apiSecret', e.target.value)}
                  placeholder="API Secret..."
                  disabled={isSaving}
                  allowCopy={false}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Endpoint / Service Name</label>
                <Input
                  value={payloadFields.endpoint ?? ''}
                  onChange={(e) => updateField('endpoint', e.target.value)}
                  placeholder="https://api.openai.com"
                  disabled={isSaving}
                />
              </div>
            </div>
          )}

          {itemType === 'ssh_key' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">SSH Private Key (PEM format)</label>
                <textarea
                  value={payloadFields.privateKey ?? ''}
                  onChange={(e) => updateField('privateKey', e.target.value)}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;..."
                  rows={4}
                  disabled={isSaving}
                  className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">SSH Public Key</label>
                <Input
                  value={payloadFields.publicKey ?? ''}
                  onChange={(e) => updateField('publicKey', e.target.value)}
                  placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5..."
                  disabled={isSaving}
                  className="font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Passphrase (Optional)</label>
                <SecretInput
                  value={payloadFields.passphrase ?? ''}
                  onChange={(e) => updateField('passphrase', e.target.value)}
                  placeholder="Key Passphrase..."
                  disabled={isSaving}
                  allowCopy={false}
                />
              </div>
            </div>
          )}

          {/* Secure Notes & Details (Available for all types) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary">Encrypted Notes</label>
            <textarea
              value={payloadFields.notes ?? ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any additional private remarks or instructions..."
              rows={2}
              disabled={isSaving}
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button type="submit" size="sm" isLoading={isSaving} disabled={isSaving} className="gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>{editingItem ? 'Save Changes' : 'Encrypt & Save'}</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Embedded Secret Generator Modal */}
      <GeneratorModal
        open={showGeneratorModal}
        onOpenChange={setShowGeneratorModal}
        onSelectSecret={(secret) => {
          updateField(targetSecretField, secret);
        }}
      />
    </>
  );
}
