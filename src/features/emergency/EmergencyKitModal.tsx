import * as React from 'react';
import { Printer, ShieldAlert, CheckSquare, Square } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { generateEmergencyKitHtml } from '@/domain/emergency/emergencyKit';
import { appVaultService } from '@/application/services/AppVaultService';
import type { VaultItemEnvelope } from '@/domain/vault/types';

export interface EmergencyKitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryPhrase?: string;
}

export function EmergencyKitModal({
  open,
  onOpenChange,
  recoveryPhrase,
}: EmergencyKitModalProps) {
  const [ownerName, setOwnerName] = React.useState('');
  const [instructions, setInstructions] = React.useState(
    'In case of emergency, use the master recovery phrase below to restore the offline vault on any device.'
  );
  const [includeRecoveryPhrase, setIncludeRecoveryPhrase] = React.useState(true);
  const [selectedItemIds, setSelectedItemIds] = React.useState<Set<string>>(new Set());

  const decryptedVault = appVaultService.getDecryptedVault();

  // Auto-select critical items by default (banking, identity, notes)
  React.useEffect(() => {
    if (decryptedVault) {
      const initial = new Set<string>();
      decryptedVault.items.forEach((item: VaultItemEnvelope) => {
        if (
          [
            'bank_account',
            'identity',
            'insurance',
            'emergency_contact',
            'secure_note',
          ].includes(item.type) ||
          item.favorite
        ) {
          initial.add(item.id);
        }
      });
      setSelectedItemIds(initial);
    }
  }, [decryptedVault]);

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrint = () => {
    if (!decryptedVault) return;

    const selectedItems: VaultItemEnvelope[] = decryptedVault.items.filter((i: VaultItemEnvelope) =>
      selectedItemIds.has(i.id)
    );

    const html = generateEmergencyKitHtml({
      vaultName: decryptedVault.metadata.name,
      ownerName: ownerName || undefined,
      instructions: instructions || undefined,
      recoveryPhrase: includeRecoveryPhrase ? recoveryPhrase : undefined,
      selectedItems,
    });

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
      title="Generate Emergency Access Kit"
      description="Create a printable physical emergency kit for your executor or trusted next-of-kin. Stored offline in cold storage."
    >
      <div className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto pr-1">
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning flex items-start gap-2.5">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <strong>Cold Storage Notice:</strong> Print and store this document in a fireproof safe or safe deposit box. Never upload or transmit unencrypted.
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary">Owner / Vault Holder Name</label>
          <Input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="e.g. Jane Doe"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary">Instructions for Trusted Contact</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>

        {recoveryPhrase && (
          <label className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={includeRecoveryPhrase}
              onChange={(e) => setIncludeRecoveryPhrase(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent"
            />
            <span>Include 24-Word Master Recovery Phrase in printout</span>
          </label>
        )}

        <div className="space-y-1.5 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
            <span>Select Critical Items to Include ({selectedItemIds.size} selected)</span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1 pr-1 border border-border rounded-md p-2 bg-surface">
            {decryptedVault?.items.map((item: VaultItemEnvelope) => {
              const isSelected = selectedItemIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-center justify-between p-1.5 rounded text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate max-w-[240px]">
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 shrink-0 text-accent" />
                    ) : (
                      <Square className="h-4 w-4 shrink-0 text-text-muted" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-text-muted capitalize">
                    {item.type.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            <span>Generate & Print Kit</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
