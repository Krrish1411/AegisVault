import * as React from 'react';
import {
  ShieldAlert,
  UserPlus,
  Trash2,
  Download,
  Printer,
  Clock,
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  Users,
} from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { Badge } from '@/ui/primitives/Badge';
import { CustomSelect } from '@/ui/primitives/CustomSelect';
import { appVaultService } from '@/application/services/AppVaultService';
import {
  calculateWaitPeriodStatus,
  generateBeneficiaryCertificateHtml,
} from '@/domain/emergency/emergencyAccessEngine';
import { useUiStore } from '@/state/uiStore';
import type { EmergencyContact } from '@/domain/vault/types';

export interface EmergencyAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WAIT_PERIOD_OPTIONS = [
  { value: '0', label: '0 Days (Immediate Access)' },
  { value: '3', label: '3 Days Notice' },
  { value: '7', label: '7 Days Notice (Standard)' },
  { value: '14', label: '14 Days Notice (High Security)' },
  { value: '30', label: '30 Days Notice (Maximum Protection)' },
];

const ACCESS_LEVEL_OPTIONS = [
  { value: 'full', label: 'Full Vault (All Logins, Finances & Notes)' },
  { value: 'selected', label: 'Selected Critical Assets (Banking, IDs & Notes)' },
];

export function EmergencyAccessModal({ open, onOpenChange }: EmergencyAccessModalProps) {
  const addToast = useUiStore((state) => state.addToast);
  const vaultRevision = useUiStore((state) => state.vaultRevision);

  const [contacts, setContacts] = React.useState<readonly EmergencyContact[]>([]);
  const [showAddForm, setShowAddForm] = React.useState(false);

  // New Contact Form State
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [relationship, setRelationship] = React.useState('');
  const [accessLevel, setAccessLevel] = React.useState<'full' | 'selected'>('full');
  const [waitPeriodDays, setWaitPeriodDays] = React.useState('7');
  const [emergencyPin, setEmergencyPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [showPin, setShowPin] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshContacts = React.useCallback(() => {
    const list = appVaultService.getEmergencyContacts();
    setContacts(list);
  }, [vaultRevision]);

  React.useEffect(() => {
    if (open) {
      refreshContacts();
      setShowAddForm(false);
      setError(null);
    }
  }, [open, refreshContacts]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Contact name is required.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('A valid beneficiary email address is required.');
      return;
    }
    if (emergencyPin.trim().length < 6) {
      setError('Emergency PIN must be at least 6 characters or digits.');
      return;
    }
    if (emergencyPin !== confirmPin) {
      setError('Emergency PIN and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await appVaultService.addEmergencyContact(
        {
          name,
          email,
          relationship: relationship || undefined,
          accessLevel,
          waitPeriodDays: parseInt(waitPeriodDays, 10),
        },
        emergencyPin
      );

      addToast({
        title: 'Emergency Contact Registered',
        description: `Encrypted grant created for ${result.contact.name}.`,
        variant: 'success',
      });

      // Auto download kit
      downloadGrantFile(result.contact, result.grantJson);

      // Reset form
      setName('');
      setEmail('');
      setRelationship('');
      setEmergencyPin('');
      setConfirmPin('');
      setShowAddForm(false);
      refreshContacts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register emergency contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (contact: EmergencyContact) => {
    if (confirm(`Remove ${contact.name} from emergency contacts? Their grant will be invalidated.`)) {
      await appVaultService.deleteEmergencyContact(contact.id);
      refreshContacts();
      addToast({
        title: 'Emergency Contact Removed',
        description: `${contact.name} has been removed.`,
        variant: 'default',
      });
    }
  };

  const handleApprove = async (contact: EmergencyContact) => {
    await appVaultService.approveEmergencyRequest(contact.id);
    refreshContacts();
    addToast({
      title: 'Emergency Request Approved',
      description: `${contact.name} can now unlock the emergency snapshot immediately.`,
      variant: 'success',
    });
  };

  const handleRevoke = async (contact: EmergencyContact) => {
    await appVaultService.rejectEmergencyRequest(contact.id);
    refreshContacts();
    addToast({
      title: 'Emergency Access Revoked',
      description: `Emergency grant for ${contact.name} has been revoked.`,
      variant: 'danger',
    });
  };

  const handleSimulateRequest = async (contact: EmergencyContact, daysAgo: number = 0) => {
    await appVaultService.simulateEmergencyRequest(contact.id, daysAgo);
    refreshContacts();
    addToast({
      title: 'Emergency Request Simulated',
      description: `Simulated access request with timestamp set to ${daysAgo} days ago.`,
      variant: 'default',
    });
  };

  const handleResetRequest = async (contact: EmergencyContact) => {
    await appVaultService.resetEmergencyRequest(contact.id);
    refreshContacts();
    addToast({
      title: 'Request Reset',
      description: 'Contact status restored to active.',
      variant: 'default',
    });
  };

  const downloadGrantFile = (contact: EmergencyContact, grantJson?: string) => {
    const data = grantJson || contact.grantData;
    if (!data) return;

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AegisVault-EmergencyGrant-${contact.name.replace(/\s+/g, '_')}.aegis-emergency`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintCertificate = (contact: EmergencyContact) => {
    const decrypted = appVaultService.getDecryptedVault();
    const vaultName = decrypted?.metadata.name || 'Primary Vault';
    const grantJson = contact.grantData || '';

    const html = generateBeneficiaryCertificateHtml(contact, vaultName, grantJson);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Emergency Access & Digital Legacy"
      description="Designate trusted next-of-kin or legal executors with zero-knowledge emergency grants and customizable security waiting periods."
    >
      <div className="space-y-5 pt-2 max-h-[75vh] overflow-y-auto pr-1">
        {/* Security Architecture Callout */}
        <div className="rounded-xl border border-accent/25 bg-accent/5 p-3.5 text-xs text-text-secondary flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-text-primary">Zero-Knowledge Digital Legacy:</strong>
            <p className="leading-relaxed">
              Your master password is never shared. Each emergency contact receives a dedicated snapshot encrypted with an independent Emergency PIN. If access is requested, you receive a waiting notice to reject any unauthorized access.
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Trusted Contacts ({contacts.length})
            </span>
          </div>

          {!showAddForm && (
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="gap-1.5 text-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Emergency Contact</span>
            </Button>
          )}
        </div>

        {/* Add Contact Form Drawer */}
        {showAddForm && (
          <form onSubmit={handleCreateContact} className="rounded-xl border border-line bg-surface-subtle p-4 space-y-3.5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="text-xs font-bold text-text-primary">Register New Trusted Beneficiary</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-text-muted hover:text-text-primary cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="p-2 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary">Full Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary">Email Address *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah@example.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary">Relationship (Optional)</label>
                <Input
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Spouse, Sibling, Legal Attorney"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary">Security Waiting Period</label>
                <CustomSelect
                  value={waitPeriodDays}
                  onChange={setWaitPeriodDays}
                  options={WAIT_PERIOD_OPTIONS}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-secondary">Access Scope</label>
              <CustomSelect
                value={accessLevel}
                onChange={(val) => setAccessLevel(val as 'full' | 'selected')}
                options={ACCESS_LEVEL_OPTIONS}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-line/50">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary flex items-center justify-between">
                  <span>Emergency PIN (6+ chars) *</span>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[10px] text-accent hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{showPin ? 'Hide' : 'Show'}</span>
                  </button>
                </label>
                <Input
                  type={showPin ? 'text' : 'password'}
                  value={emergencyPin}
                  onChange={(e) => setEmergencyPin(e.target.value)}
                  placeholder="Secret PIN shared with contact"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary">Confirm Emergency PIN *</label>
                <Input
                  type={showPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Confirm secret PIN"
                  required
                />
              </div>
            </div>

            <p className="text-[11px] text-text-muted">
              💡 When created, an encrypted <code>.aegis-emergency</code> kit file will download. Give this file and the secret PIN to your beneficiary.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5"
              >
                <Key className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Encrypting Grant...' : 'Register & Export Kit'}</span>
              </Button>
            </div>
          </form>
        )}

        {/* Contacts List */}
        {contacts.length === 0 && !showAddForm ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-border bg-surface-subtle space-y-2">
            <Users className="h-8 w-8 mx-auto text-text-muted" />
            <h4 className="text-sm font-semibold text-text-primary">No Emergency Contacts Designated</h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Add a trusted family member or executor so they can securely access your digital assets in an emergency.
            </p>
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-xs"
            >
              Add First Contact
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => {
              const waitStatus = calculateWaitPeriodStatus(
                contact.waitPeriodDays,
                contact.status,
                contact.requestDate
              );

              return (
                <div
                  key={contact.id}
                  className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-text-primary">{contact.name}</span>
                        {contact.relationship && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-moss text-ink/60 border border-line">
                            {contact.relationship}
                          </span>
                        )}
                        <Badge
                          variant={
                            contact.status === 'approved'
                              ? 'success'
                              : contact.status === 'requested'
                              ? 'warning'
                              : contact.status === 'revoked'
                              ? 'danger'
                              : 'default'
                          }
                        >
                          {contact.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary font-mono truncate">{contact.email}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadGrantFile(contact)}
                        title="Download .aegis-emergency file"
                        className="h-7 text-xs gap-1 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Grant Kit</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintCertificate(contact)}
                        title="Print Grant Certificate"
                        className="h-7 text-xs gap-1 cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Certificate</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteContact(contact)}
                        className="h-7 text-xs text-danger hover:bg-danger/10 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Metadata Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono bg-moss/40 p-2.5 rounded-lg border border-line/40">
                    <div>
                      <span className="text-[10px] text-text-muted uppercase block">Access Scope</span>
                      <span className="font-semibold text-text-primary capitalize">{contact.accessLevel}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted uppercase block">Waiting Notice</span>
                      <span className="font-semibold text-text-primary">
                        {contact.waitPeriodDays === 0 ? 'Immediate' : `${contact.waitPeriodDays} Days`}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-text-muted uppercase block">Added On</span>
                      <span className="font-semibold text-text-primary">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Pending Request Alert & Controls */}
                  {contact.status === 'requested' && (
                    <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-warning font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>Emergency Access Requested</span>
                        </div>
                        <span className="font-mono">
                          {waitStatus.canUnlock
                            ? 'Waiting period elapsed!'
                            : `${waitStatus.remainingDays} days left before auto-unlock`}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRevoke(contact)}
                          className="h-7 text-xs"
                        >
                          Deny & Revoke
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(contact)}
                          className="h-7 text-xs"
                        >
                          Approve Now
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Simulation Helpers for Testing */}
                  <div className="flex items-center justify-between pt-1 border-t border-line/40 text-[11px] text-text-muted">
                    <span className="font-mono">Demo / Test Controls:</span>
                    <div className="flex items-center gap-2">
                      {contact.status !== 'requested' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSimulateRequest(contact, 0)}
                            className="text-accent hover:underline cursor-pointer"
                          >
                            Simulate Request
                          </button>
                          <span className="text-text-muted">•</span>
                          <button
                            type="button"
                            onClick={() => handleSimulateRequest(contact, contact.waitPeriodDays + 1)}
                            className="text-accent hover:underline cursor-pointer"
                          >
                            Simulate Wait Elapsed
                          </button>
                        </>
                      )}
                      {contact.status !== 'active' && (
                        <button
                          type="button"
                          onClick={() => handleResetRequest(contact)}
                          className="text-text-secondary hover:underline cursor-pointer"
                        >
                          Reset to Active
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Dialog>
  );
}
