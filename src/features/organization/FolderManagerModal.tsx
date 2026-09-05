import * as React from 'react';
import { Folder, FolderPlus, Trash2, Edit2, CornerDownRight } from 'lucide-react';
import { Dialog } from '@/ui/primitives/Dialog';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { buildFolderTree, type FolderNode } from '@/domain/organization/folderTree';
import type { VaultFolder } from '@/domain/vault/types';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';

export interface FolderManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFoldersChanged: () => void;
}

export function FolderManagerModal({
  open,
  onOpenChange,
  onFoldersChanged,
}: FolderManagerModalProps) {
  const addToast = useUiStore((state) => state.addToast);

  const [folders, setFolders] = React.useState<readonly VaultFolder[]>([]);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [selectedParentId, setSelectedParentId] = React.useState<string | undefined>(undefined);
  const [editingFolderId, setEditingFolderId] = React.useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const refreshFolders = React.useCallback(() => {
    const domain = appVaultService.getDecryptedVault();
    if (domain) {
      setFolders(domain.folders);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      refreshFolders();
      setNewFolderName('');
      setSelectedParentId(undefined);
      setEditingFolderId(null);
      setError(undefined);
    }
  }, [open, refreshFolders]);

  const tree = React.useMemo(() => {
    const domain = appVaultService.getDecryptedVault();
    return buildFolderTree(folders, domain?.items ?? []);
  }, [folders]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      setError('Folder name is required');
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      await appVaultService.createFolder(newFolderName.trim(), selectedParentId);
      setNewFolderName('');
      setSelectedParentId(undefined);
      refreshFolders();
      onFoldersChanged();
      addToast({
        title: 'Folder Created',
        description: `Folder "${newFolderName.trim()}" created successfully.`,
        variant: 'success',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!editingFolderName.trim()) return;

    setIsSubmitting(true);
    setError(undefined);

    try {
      await appVaultService.updateFolder(folderId, { name: editingFolderName.trim() });
      setEditingFolderId(null);
      setEditingFolderName('');
      refreshFolders();
      onFoldersChanged();
      addToast({
        title: 'Folder Renamed',
        description: 'Folder updated successfully.',
        variant: 'success',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFolder = async (folder: VaultFolder) => {
    if (!window.confirm(`Delete folder "${folder.name}"? Items inside will be moved to root.`)) {
      return;
    }

    try {
      await appVaultService.deleteFolder(folder.id, 'move_to_root');
      refreshFolders();
      onFoldersChanged();
      addToast({
        title: 'Folder Deleted',
        description: `Folder "${folder.name}" deleted. Items moved to root.`,
        variant: 'default',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
    }
  };

  const renderTreeNode = (node: FolderNode) => {
    const isEditing = editingFolderId === node.folder.id;

    return (
      <div key={node.folder.id} className="space-y-1">
        <div
          className="flex items-center justify-between p-2 rounded-lg border border-border bg-surface-subtle hover:bg-surface text-xs"
          style={{ marginLeft: `${node.depth * 1.25}rem` }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {node.depth > 0 ? (
              <CornerDownRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-accent shrink-0" />
            )}

            {isEditing ? (
              <input
                type="text"
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                className="rounded border border-border bg-background px-2 py-0.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                autoFocus
              />
            ) : (
              <span className="font-medium text-text-primary truncate">
                {node.folder.name}
              </span>
            )}

            <span className="text-[10px] text-text-muted font-mono">
              ({node.itemCount} items)
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleRenameFolder(node.folder.id)}
                  className="h-6 px-2 text-[10px]"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingFolderId(null)}
                  className="h-6 px-2 text-[10px]"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingFolderId(node.folder.id);
                    setEditingFolderName(node.folder.name);
                  }}
                  className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface"
                  title="Rename folder"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFolder(node.folder)}
                  className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10"
                  title="Delete folder"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {node.children.map(renderTreeNode)}
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Organize Vault Folders"
      description="Create nested folders to categorize logins, financial data, and personal secrets."
    >
      <div className="space-y-4 pt-2">
        {/* Create Folder Form */}
        <form onSubmit={handleCreateFolder} className="space-y-3 p-3 rounded-lg border border-border bg-surface-subtle">
          <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <FolderPlus className="h-4 w-4 text-accent" />
            <span>Create New Folder</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name (e.g. Work, Finance)..."
              disabled={isSubmitting}
            />

            <select
              value={selectedParentId ?? ''}
              onChange={(e) => setSelectedParentId(e.target.value || undefined)}
              disabled={isSubmitting}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Root (No Parent)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  Inside: {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting || !newFolderName.trim()}
              className="text-xs gap-1.5"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Add Folder</span>
            </Button>
          </div>
        </form>

        {error && <p className="text-xs text-danger">{error}</p>}

        {/* Existing Folder Tree */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <div className="text-xs font-medium text-text-secondary">Folder Tree</div>
          {tree.length === 0 ? (
            <p className="text-xs text-text-muted italic p-3 text-center border border-dashed border-border rounded-lg">
              No folders created yet. Add one above.
            </p>
          ) : (
            <div className="space-y-1.5">{tree.map(renderTreeNode)}</div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
