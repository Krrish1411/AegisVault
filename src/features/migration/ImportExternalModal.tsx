import * as React from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { Badge } from '@/ui/primitives/Badge';
import {
  importExternalPasswordFile,
  detectExternalFormat,
  type ExternalFormat,
} from '@/domain/migration/externalImporters';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';
import type { VaultItemEnvelope, VaultFolder } from '@/domain/vault/types';

export interface ImportExternalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export function ImportExternalModal({
  open,
  onOpenChange,
  onImportComplete,
}: ImportExternalModalProps) {
  const addToast = useUiStore((s) => s.addToast);

  const [fileContent, setFileContent] = React.useState<string | null>(null);
  const [filename, setFilename] = React.useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = React.useState<ExternalFormat>('unknown');
  const [isImporting, setIsImporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [parsedData, setParsedData] = React.useState<{
    items: VaultItemEnvelope[];
    folders: VaultFolder[];
    formatDetected: ExternalFormat;
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setFileContent(content);
        try {
          const detected = detectExternalFormat(content);
          setSelectedFormat(detected);
          const result = importExternalPasswordFile(content, detected);
          setParsedData(result);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to parse file');
          setParsedData(null);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleFormatChange = (fmt: ExternalFormat) => {
    setSelectedFormat(fmt);
    if (fileContent) {
      try {
        const result = importExternalPasswordFile(fileContent, fmt);
        setParsedData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse with selected format');
        setParsedData(null);
      }
    }
  };

  const handleCommitImport = async () => {
    if (!parsedData) return;
    setIsImporting(true);
    setError(null);

    try {
      for (const item of parsedData.items) {
        await appVaultService.saveItem(item);
      }

      addToast({
        title: 'Credentials Migrated',
        description: `Successfully encrypted and imported ${parsedData.items.length} records into AegisVault.`,
        variant: 'success',
      });

      handleReset();
      onOpenChange(false);
      onImportComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFileContent(null);
    setFilename(null);
    setSelectedFormat('unknown');
    setParsedData(null);
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) handleReset();
        onOpenChange(newOpen);
      }}
      title="Import from Other Password Managers"
      description="Migrate credentials from Bitwarden, 1Password, LastPass, Dashlane, KeePass, Chrome, Safari, Firefox, Proton Pass, and RoboForm."
    >
      <div className="space-y-4 pt-2">
        {error && (
          <div className="p-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-md">
            {error}
          </div>
        )}

        {!parsedData ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">Password Export File</label>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-accent transition-colors">
                <label className="cursor-pointer space-y-1">
                  <Upload className="mx-auto h-8 w-8 text-text-muted" />
                  <div className="text-xs text-text-primary font-medium">
                    {filename ? filename : 'Select CSV or JSON export file'}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    Bitwarden, 1Password, LastPass, Dashlane, KeePass, Chrome, Safari, Firefox, Proton Pass
                  </div>
                  <input
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-subtle">
              <div>
                <span className="text-xs font-semibold text-text-primary">Detected Format</span>
                <div className="text-xs text-text-muted uppercase font-mono mt-0.5">
                  {parsedData.formatDetected.replace('_', ' ')}
                </div>
              </div>

              <select
                value={selectedFormat}
                onChange={(e) => handleFormatChange(e.target.value as ExternalFormat)}
                className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text-primary"
              >
                <option value="bitwarden_json">Bitwarden JSON</option>
                <option value="bitwarden_csv">Bitwarden CSV</option>
                <option value="1password_csv">1Password CSV</option>
                <option value="lastpass_csv">LastPass CSV</option>
                <option value="dashlane_csv">Dashlane CSV</option>
                <option value="keepass_csv">KeePass CSV</option>
                <option value="safari_csv">Apple Safari / iCloud Keychain CSV</option>
                <option value="proton_csv">Proton Pass CSV</option>
                <option value="roboform_csv">RoboForm CSV</option>
                <option value="enpass_csv">Enpass CSV</option>
                <option value="browser_csv">Chrome / Edge / Firefox CSV</option>
                <option value="generic_csv">Generic CSV</option>
              </select>
            </div>

            <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                <span>Items to Migrate ({parsedData.items.length})</span>
                <Badge variant="accent">
                  {parsedData.folders.length} Folders
                </Badge>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {parsedData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-md bg-surface-subtle text-xs"
                  >
                    <div className="truncate max-w-[200px]">
                      <span className="font-semibold text-text-primary">{item.title}</span>
                      {typeof item.payload === 'object' && item.payload && 'username' in item.payload && (
                        <div className="text-[11px] text-text-secondary truncate">
                          {String(item.payload.username)}
                        </div>
                      )}
                    </div>
                    <Badge variant="default" className="text-[10px]">
                      {item.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={handleReset} disabled={isImporting}>
                Select Another File
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleCommitImport}
                disabled={isImporting}
                className="gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{isImporting ? 'Encrypting & Importing...' : 'Import into AegisVault'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
