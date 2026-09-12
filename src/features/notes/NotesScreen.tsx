import * as React from 'react';
import {
  FileText,
  Plus,
  Search,
  Star,
  Trash2,
  CheckSquare,
  Square,
  Edit3,
  Eye,
  Lock,
  X,
  Folder,
  FolderPlus,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Link2,
  Key,
  CreditCard,
  Landmark,
  User,
  Shield,
  Edit2,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { Dialog } from '@/ui/primitives/Dialog';
import { Badge } from '@/ui/primitives/Badge';
import { EmptyState } from '@/ui/primitives/EmptyState';
import { appVaultService } from '@/application/services/AppVaultService';
import { useUiStore } from '@/state/uiStore';
import type {
  VaultItemEnvelope,
  SecureNotePayload,
  CheckboxItem,
  VaultFolder,
} from '@/domain/vault/types';

type SidebarFilter =
  | { type: 'all' }
  | { type: 'favorites' }
  | { type: 'unorganized' }
  | { type: 'folder'; folderId: string };

function getItemTypeIcon(type: string) {
  switch (type) {
    case 'login':
      return <Key className="h-3.5 w-3.5 text-accent shrink-0" />;
    case 'bank_account':
    case 'bank_login':
    case 'bank_profile':
      return <Landmark className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    case 'credit_card':
    case 'debit_card':
      return <CreditCard className="h-3.5 w-3.5 text-purple-400 shrink-0" />;
    case 'identity':
    case 'pan':
    case 'aadhaar':
    case 'passport':
    case 'driving_license':
    case 'voter_id':
    case 'address':
      return <User className="h-3.5 w-3.5 text-cyan-400 shrink-0" />;
    case 'secure_note':
      return <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
    default:
      return <Shield className="h-3.5 w-3.5 text-text-muted shrink-0" />;
  }
}

function getItemTypeLabel(type: string): string {
  switch (type) {
    case 'login':
      return 'Password';
    case 'bank_account':
      return 'Bank Account';
    case 'bank_login':
      return 'Bank Login';
    case 'credit_card':
      return 'Credit Card';
    case 'debit_card':
      return 'Debit Card';
    case 'identity':
      return 'Identity';
    case 'pan':
      return 'PAN Card';
    case 'aadhaar':
      return 'Aadhaar';
    case 'passport':
      return 'Passport';
    case 'driving_license':
      return 'Driver License';
    case 'document':
      return 'Document';
    default:
      return type.replace('_', ' ');
  }
}

export function NotesScreen() {
  const addToast = useUiStore((state) => state.addToast);
  const vaultRevision = useUiStore((state) => state.vaultRevision);

  // Vault data
  const [allNotes, setAllNotes] = React.useState<readonly VaultItemEnvelope[]>([]);
  const [folders, setFolders] = React.useState<readonly VaultFolder[]>([]);
  const [allItems, setAllItems] = React.useState<readonly VaultItemEnvelope[]>([]);

  // Navigation & Filtering
  const [activeFilter, setActiveFilter] = React.useState<SidebarFilter>({ type: 'all' });
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  // Note Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<VaultItemEnvelope | null>(null);
  const [noteTitle, setNoteTitle] = React.useState('');
  const [noteFolderId, setNoteFolderId] = React.useState<string>('');
  const [noteContent, setNoteContent] = React.useState('');
  const [noteChecklist, setNoteChecklist] = React.useState<CheckboxItem[]>([]);
  const [newChecklistText, setNewChecklistText] = React.useState('');
  const [noteFavorite, setNoteFavorite] = React.useState(false);
  const [noteLinkedItemIds, setNoteLinkedItemIds] = React.useState<string[]>([]);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // 2-Way Link Picker State
  const [showLinkPicker, setShowLinkPicker] = React.useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = React.useState('');

  // Folder Management Modals
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [isRenameModalOpen, setIsRenameModalOpen] = React.useState(false);
  const [renamingFolder, setRenamingFolder] = React.useState<VaultFolder | null>(null);
  const [renameFolderName, setRenameFolderName] = React.useState('');
  const [isDeleteFolderModalOpen, setIsDeleteFolderModalOpen] = React.useState(false);
  const [deletingFolder, setDeletingFolder] = React.useState<VaultFolder | null>(null);
  const [deleteOption, setDeleteOption] = React.useState<'move_to_root' | 'delete_all'>('move_to_root');

  // Load vault items & folders
  const loadVaultData = React.useCallback(() => {
    const domain = appVaultService.getDecryptedVault();
    if (domain) {
      setFolders(domain.folders ?? []);
      setAllItems(domain.items ?? []);
      const notesList = (domain.items ?? []).filter(
        (i) => i.type === 'secure_note' && !i.archived
      );
      setAllNotes(notesList);
    }
  }, []);

  React.useEffect(() => {
    loadVaultData();
  }, [loadVaultData, vaultRevision]);

  // Expand folders by default on initial load
  React.useEffect(() => {
    if (folders.length > 0 && expandedFolders.size === 0) {
      setExpandedFolders(new Set(folders.map((f) => f.id)));
    }
  }, [folders, expandedFolders.size]);

  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Filtered notes based on active sidebar filter and search
  const displayedNotes = React.useMemo(() => {
    let result = allNotes;

    if (activeFilter.type === 'favorites') {
      result = result.filter((n) => n.favorite);
    } else if (activeFilter.type === 'unorganized') {
      result = result.filter((n) => !n.folderId);
    } else if (activeFilter.type === 'folder') {
      result = result.filter((n) => n.folderId === activeFilter.folderId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((n) => {
        if (n.title.toLowerCase().includes(q)) return true;
        const payload = n.payload as Partial<SecureNotePayload>;
        if (payload.content && payload.content.toLowerCase().includes(q)) return true;
        if (
          payload.checklist &&
          payload.checklist.some((c) => c.text.toLowerCase().includes(q))
        ) {
          return true;
        }
        return false;
      });
    }

    // Sort: favorites first, then alphabetically
    return [...result].sort((a, b) => {
      if (Boolean(a.favorite) !== Boolean(b.favorite)) {
        return a.favorite ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    });
  }, [allNotes, activeFilter, searchQuery]);

  // Counts for sidebar badges
  const totalNotesCount = allNotes.length;
  const favoriteNotesCount = allNotes.filter((n) => n.favorite).length;
  const unorganizedNotesCount = allNotes.filter((n) => !n.folderId).length;

  // Folder helper map
  const folderMap = React.useMemo(() => {
    const map = new Map<string, VaultFolder>();
    for (const f of folders) {
      map.set(f.id, f);
    }
    return map;
  }, [folders]);

  // Item helper map for linked items
  const itemMap = React.useMemo(() => {
    const map = new Map<string, VaultItemEnvelope>();
    for (const item of allItems) {
      map.set(item.id, item);
    }
    return map;
  }, [allItems]);

  // Open note editor for new note
  const handleOpenNewNote = (defaultFolderId?: string) => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteFolderId(
      defaultFolderId ||
        (activeFilter.type === 'folder' ? activeFilter.folderId : '')
    );
    setNoteContent('');
    setNoteChecklist([]);
    setNewChecklistText('');
    setNoteFavorite(false);
    setNoteLinkedItemIds([]);
    setPreviewMode(false);
    setShowLinkPicker(false);
    setIsEditorOpen(true);
  };

  // Open note editor for existing note
  const handleOpenEditNote = (note: VaultItemEnvelope) => {
    const payload = note.payload as Partial<SecureNotePayload>;
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteFolderId(note.folderId ?? '');
    setNoteContent(payload.content ?? '');
    setNoteChecklist(payload.checklist ? [...payload.checklist] : []);
    setNewChecklistText('');
    setNoteFavorite(note.favorite);
    setNoteLinkedItemIds(note.linkedItemIds ? [...note.linkedItemIds] : []);
    setPreviewMode(false);
    setShowLinkPicker(false);
    setIsEditorOpen(true);
  };

  const handleAddChecklistItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = newChecklistText.trim();
      if (trimmed) {
        setNoteChecklist([
          ...noteChecklist,
          {
            id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            text: trimmed,
            checked: false,
          },
        ]);
        setNewChecklistText('');
      }
    }
  };

  const toggleChecklistItem = (id: string) => {
    setNoteChecklist(
      noteChecklist.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
    );
  };

  const removeChecklistItem = (id: string) => {
    setNoteChecklist(noteChecklist.filter((c) => c.id !== id));
  };

  // 2-Way Link Helpers
  const addLinkedItem = (itemId: string) => {
    if (!noteLinkedItemIds.includes(itemId)) {
      setNoteLinkedItemIds([...noteLinkedItemIds, itemId]);
    }
    setShowLinkPicker(false);
    setLinkSearchQuery('');
  };

  const removeLinkedItem = (itemId: string) => {
    setNoteLinkedItemIds(noteLinkedItemIds.filter((id) => id !== itemId));
  };

  // Save Note with true 2-Way Linking
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      addToast({
        title: 'Title required',
        description: 'Please give your secure note a title.',
        variant: 'danger',
      });
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const noteId =
        editingNote?.id ??
        `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const payload: SecureNotePayload = {
        content: noteContent,
        checklist: noteChecklist,
        isMarkdown: true,
      };

      const noteItem: VaultItemEnvelope = {
        id: noteId,
        type: 'secure_note',
        title: noteTitle.trim(),
        favorite: noteFavorite,
        archived: editingNote?.archived ?? false,
        folderId: noteFolderId.trim() ? noteFolderId.trim() : undefined,
        linkedItemIds: noteLinkedItemIds.length > 0 ? noteLinkedItemIds : undefined,
        createdAt: editingNote?.createdAt ?? now,
        updatedAt: now,
        payload: payload as unknown as Record<string, unknown>,
      };

      // 1. Save the note item itself
      await appVaultService.saveItem(noteItem);

      // 2. Perform 2-Way Linking Sync:
      // For each newly linked item, ensure noteId is in its linkedItemIds
      const domain = appVaultService.getDecryptedVault();
      if (domain) {
        for (const linkedId of noteLinkedItemIds) {
          const targetItem = domain.items.find((i) => i.id === linkedId);
          if (targetItem) {
            const currentLinks = targetItem.linkedItemIds ?? [];
            if (!currentLinks.includes(noteId)) {
              await appVaultService.saveItem({
                ...targetItem,
                linkedItemIds: [...currentLinks, noteId],
              });
            }
          }
        }

        // For items previously linked that were unlinked, remove noteId from their linkedItemIds
        const previousLinks = editingNote?.linkedItemIds ?? [];
        for (const oldLinkedId of previousLinks) {
          if (!noteLinkedItemIds.includes(oldLinkedId)) {
            const targetItem = domain.items.find((i) => i.id === oldLinkedId);
            if (targetItem && targetItem.linkedItemIds?.includes(noteId)) {
              await appVaultService.saveItem({
                ...targetItem,
                linkedItemIds: targetItem.linkedItemIds.filter((id) => id !== noteId),
              });
            }
          }
        }
      }

      addToast({
        title: editingNote ? 'Note Updated' : 'Note Encrypted & Saved',
        description: `"${noteTitle}" stored securely with 2-way linking.`,
        variant: 'success',
      });

      setIsEditorOpen(false);
      loadVaultData();
    } catch (err) {
      addToast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string, title: string) => {
    try {
      await appVaultService.deleteItem(noteId);
      addToast({
        title: 'Note Deleted',
        description: `"${title}" deleted from encrypted vault.`,
        variant: 'default',
      });
      loadVaultData();
    } catch (err) {
      addToast({
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  // Folder Actions
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const created = await appVaultService.createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsNewFolderModalOpen(false);
      // Auto-expand newly created folder
      setExpandedFolders((prev) => new Set(prev).add(created.id));
      setActiveFilter({ type: 'folder', folderId: created.id });
      addToast({
        title: 'Folder Created',
        description: `Folder "${created.name}" created successfully.`,
        variant: 'success',
      });
      loadVaultData();
    } catch (err) {
      addToast({
        title: 'Failed to create folder',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFolder || !renameFolderName.trim()) return;

    try {
      await appVaultService.updateFolder(renamingFolder.id, {
        name: renameFolderName.trim(),
      });
      setIsRenameModalOpen(false);
      setRenamingFolder(null);
      addToast({
        title: 'Folder Renamed',
        description: `Folder renamed to "${renameFolderName.trim()}".`,
        variant: 'success',
      });
      loadVaultData();
    } catch (err) {
      addToast({
        title: 'Failed to rename folder',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  const handleDeleteFolder = async () => {
    if (!deletingFolder) return;

    try {
      await appVaultService.deleteFolder(deletingFolder.id, deleteOption);
      if (activeFilter.type === 'folder' && activeFilter.folderId === deletingFolder.id) {
        setActiveFilter({ type: 'all' });
      }
      setIsDeleteFolderModalOpen(false);
      setDeletingFolder(null);
      addToast({
        title: 'Folder Deleted',
        description: `Folder "${deletingFolder.name}" removed.`,
        variant: 'default',
      });
      loadVaultData();
    } catch (err) {
      addToast({
        title: 'Failed to delete folder',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  // Available items for 2-way link picker (exclude current note)
  const linkableItems = React.useMemo(() => {
    const currentId = editingNote?.id;
    let list = allItems.filter((i) => i.id !== currentId && !noteLinkedItemIds.includes(i.id));

    if (linkSearchQuery.trim()) {
      const q = linkSearchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          getItemTypeLabel(i.type).toLowerCase().includes(q)
      );
    }
    return list.slice(0, 20);
  }, [allItems, editingNote, noteLinkedItemIds, linkSearchQuery]);

  const getActiveFilterTitle = () => {
    if (activeFilter.type === 'all') return 'All Encrypted Notes';
    if (activeFilter.type === 'favorites') return 'Favorite Notes';
    if (activeFilter.type === 'unorganized') return 'Unorganized Notes';
    if (activeFilter.type === 'folder') {
      const folder = folderMap.get(activeFilter.folderId);
      return folder ? folder.name : 'Folder Notes';
    }
    return 'Secure Notes';
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-accent" />
            <span>Secure Notes</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Hierarchical encrypted memos, checklists, and 2-way linked credentials with zero telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Sidebar Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden gap-1.5 text-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
            <span>Folders & Views</span>
          </Button>

          <Button
            onClick={() => handleOpenNewNote()}
            className="gap-2 shrink-0 text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Secure Note</span>
          </Button>
        </div>
      </div>

      {/* Main Layout: 2-Column Sidebar + Notes Content */}
      <div className="flex flex-col md:flex-row items-start gap-6 w-full">
        {/* Left Sidebar: Navigation, Folders & Notes Dropdown Tree */}
        <div
          className={`w-full md:w-64 lg:w-72 shrink-0 space-y-4 rounded-xl border border-border bg-surface p-4 shadow-subtle ${
            mobileSidebarOpen ? 'block' : 'hidden md:block'
          }`}
        >
          {/* System Filters */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveFilter({ type: 'all' });
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeFilter.type === 'all'
                  ? 'bg-accent text-white font-semibold shadow-sm'
                  : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0" />
                <span>All Notes</span>
              </div>
              <span
                className={`font-mono text-[11px] px-1.5 py-0.5 rounded-full ${
                  activeFilter.type === 'all' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
                }`}
              >
                {totalNotesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFilter({ type: 'favorites' });
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeFilter.type === 'favorites'
                  ? 'bg-accent text-white font-semibold shadow-sm'
                  : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-current shrink-0" />
                <span>Favorites</span>
              </div>
              <span
                className={`font-mono text-[11px] px-1.5 py-0.5 rounded-full ${
                  activeFilter.type === 'favorites' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
                }`}
              >
                {favoriteNotesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFilter({ type: 'unorganized' });
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeFilter.type === 'unorganized'
                  ? 'bg-accent text-white font-semibold shadow-sm'
                  : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-text-muted shrink-0" />
                <span>Unorganized</span>
              </div>
              <span
                className={`font-mono text-[11px] px-1.5 py-0.5 rounded-full ${
                  activeFilter.type === 'unorganized' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
                }`}
              >
                {unorganizedNotesCount}
              </span>
            </button>
          </div>

          <hr className="border-border" />

          {/* Folders Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Folders ({folders.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewFolderName('');
                  setIsNewFolderModalOpen(true);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent/80 p-1 rounded hover:bg-accent/10 transition-colors"
                title="Create new folder"
                aria-label="Create new folder"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span>New</span>
              </button>
            </div>

            {folders.length === 0 ? (
              <div className="p-3 text-center rounded-lg border border-dashed border-border text-xs text-text-muted">
                <p>No folders created yet.</p>
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(true)}
                  className="mt-1 text-accent text-xs font-semibold hover:underline"
                >
                  Create your first folder
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {folders.map((folder) => {
                  const isFolderActive =
                    activeFilter.type === 'folder' && activeFilter.folderId === folder.id;
                  const isExpanded = expandedFolders.has(folder.id);
                  const folderNotes = allNotes.filter((n) => n.folderId === folder.id);

                  return (
                    <div key={folder.id} className="space-y-0.5">
                      {/* Folder Row */}
                      <div
                        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isFolderActive
                            ? 'bg-accent/15 text-accent font-semibold'
                            : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                        }`}
                        onClick={() => {
                          setActiveFilter({ type: 'folder', folderId: folder.id });
                          setMobileSidebarOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {/* Collapsible toggle arrow */}
                          <button
                            type="button"
                            aria-label={isExpanded ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFolderExpanded(folder.id);
                            }}
                            className="p-1 -ml-1 text-text-muted hover:text-text-primary rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 transition-transform" />
                            )}
                          </button>

                          {isExpanded ? (
                            <FolderOpen className="h-4 w-4 text-accent shrink-0" />
                          ) : (
                            <Folder className="h-4 w-4 text-text-muted shrink-0" />
                          )}

                          <span className="truncate">{folder.name}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-text-muted font-mono px-1.5 py-0.5 rounded-full bg-surface border border-border/50">
                            {folderNotes.length}
                          </span>

                          {/* Rename / Delete buttons on hover */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingFolder(folder);
                                setRenameFolderName(folder.name);
                                setIsRenameModalOpen(true);
                              }}
                              className="p-1 text-text-muted hover:text-accent rounded"
                              title="Rename folder"
                              aria-label="Rename folder"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingFolder(folder);
                                setDeleteOption('move_to_root');
                                setIsDeleteFolderModalOpen(true);
                              }}
                              className="p-1 text-text-muted hover:text-danger rounded"
                              title="Delete folder"
                              aria-label="Delete folder"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown / Collapsible list of notes inside this folder */}
                      {isExpanded && (
                        <div className="ml-5 pl-2 border-l border-border/60 space-y-0.5 py-0.5">
                          {folderNotes.length === 0 ? (
                            <div className="px-2 py-1 text-[11px] text-text-muted italic">
                              No notes in folder
                            </div>
                          ) : (
                            folderNotes.map((note) => (
                              <div
                                key={note.id}
                                onClick={() => {
                                  handleOpenEditNote(note);
                                  setMobileSidebarOpen(false);
                                }}
                                className="group flex items-center justify-between px-2 py-1 rounded text-xs text-text-secondary hover:text-text-primary hover:bg-surface-subtle cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <FileText className="h-3 w-3 text-text-muted group-hover:text-accent shrink-0" />
                                  <span className="truncate">{note.title}</span>
                                </div>
                                {note.favorite && (
                                  <Star className="h-2.5 w-2.5 fill-current text-amber-500 shrink-0" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Main Content: Header, Search, Notes Grid */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* Search & Active View Subheading */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text-primary">
                {getActiveFilterTitle()}
              </h2>
              <Badge variant="default" className="text-xs font-mono">
                {displayedNotes.length}
              </Badge>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes and checklist items..."
                className="pl-9 h-9 text-xs w-full"
              />
            </div>
          </div>

          {/* Notes Grid */}
          {displayedNotes.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-accent" />}
              title={searchQuery ? 'No matching notes' : 'No notes in this view'}
              description={
                searchQuery
                  ? `No notes matched "${searchQuery}". Try a different keyword or create a new note.`
                  : 'Encrypted notes allow private markdown text, checklists, and 2-way links to passwords, banks, and identities.'
              }
              primaryAction={
                <Button
                  onClick={() =>
                    handleOpenNewNote(
                      activeFilter.type === 'folder' ? activeFilter.folderId : undefined
                    )
                  }
                  className="gap-2 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create note in this view</span>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedNotes.map((note) => {
                const payload = note.payload as Partial<SecureNotePayload>;
                const checklist = payload.checklist ?? [];
                const completedCount = checklist.filter((c) => c.checked).length;
                const folder = note.folderId ? folderMap.get(note.folderId) : undefined;
                const linkedIds = note.linkedItemIds ?? [];

                return (
                  <div
                    key={note.id}
                    onClick={() => handleOpenEditNote(note)}
                    className="group relative flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-subtle hover:border-accent/50 hover:shadow-elevated transition-all cursor-pointer"
                  >
                    <div className="space-y-2.5">
                      {/* Top title & Favorite / Delete buttons */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-semibold text-text-primary text-sm truncate">
                              {note.title}
                            </h3>
                            {folder && (
                              <Badge variant="default" className="text-[10px] gap-1 py-0 px-1.5">
                                <Folder className="h-2.5 w-2.5 text-accent" />
                                <span>{folder.name}</span>
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await appVaultService.toggleFavoriteItem(note.id);
                              loadVaultData();
                            }}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              note.favorite
                                ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                                : 'text-text-muted hover:text-amber-500 hover:bg-surface-subtle opacity-60 group-hover:opacity-100'
                            }`}
                            title={note.favorite ? 'Remove from favorites' : 'Add to favorites'}
                            aria-label={note.favorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star className={`h-4 w-4 ${note.favorite ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id, note.title);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-danger rounded transition-opacity"
                            title="Delete note"
                            aria-label="Delete note"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 2-Way Linked Items Chips */}
                      {linkedIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {linkedIds.slice(0, 3).map((lid) => {
                            const lItem = itemMap.get(lid);
                            if (!lItem) return null;
                            return (
                              <div
                                key={lid}
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle border border-border text-text-secondary"
                              >
                                {getItemTypeIcon(lItem.type)}
                                <span className="truncate max-w-[100px]">{lItem.title}</span>
                              </div>
                            );
                          })}
                          {linkedIds.length > 3 && (
                            <span className="text-[10px] text-text-muted self-center">
                              +{linkedIds.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Snippet / Content Preview */}
                      {payload.content && (
                        <p className="text-xs text-text-secondary line-clamp-3 whitespace-pre-wrap font-sans leading-relaxed">
                          {payload.content}
                        </p>
                      )}

                      {/* Checklist Summary */}
                      {checklist.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-text-muted">
                            <span>Checklist</span>
                            <span className="font-mono">
                              {completedCount}/{checklist.length}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {checklist.slice(0, 2).map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-1.5 text-xs text-text-secondary"
                              >
                                {item.checked ? (
                                  <CheckSquare className="h-3.5 w-3.5 text-success shrink-0" />
                                ) : (
                                  <Square className="h-3.5 w-3.5 text-text-muted shrink-0" />
                                )}
                                <span
                                  className={`truncate text-xs ${
                                    item.checked ? 'line-through text-text-muted' : ''
                                  }`}
                                >
                                  {item.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Meta */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-[11px] text-text-muted">
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      <span className="font-mono text-accent/80 text-[10.5px]">Secure Note</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Note Editor Modal */}
      <Dialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        title={editingNote ? 'Edit Secure Note' : 'New Secure Note'}
        description="Encrypted locally with 256-bit authenticated cipher and 2-way linked credentials."
      >
        <form onSubmit={handleSaveNote} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto pr-1">
          {/* Title & Favorite */}
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-text-secondary">Note Title</label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g. Master Server Configuration, Recovery Instructions"
                autoFocus
                required
              />
            </div>

            <button
              type="button"
              onClick={() => setNoteFavorite(!noteFavorite)}
              title={noteFavorite ? 'Remove from favorites' : 'Mark as important / favorite'}
              className={`mt-6 flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
                noteFavorite
                  ? 'border-warning/50 bg-warning/10 text-warning'
                  : 'border-border bg-surface text-text-muted hover:text-text-primary'
              }`}
            >
              <Star className={`h-4 w-4 ${noteFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Folder Assignment */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5 text-accent" />
              <span>Assign to Folder</span>
            </label>
            <select
              value={noteFolderId}
              onChange={(e) => setNoteFolderId(e.target.value)}
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <option value="">No Folder (Unorganized)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2-Way Linked Items Section */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-accent" />
                <span>Linked Vault Items (2-Way Linking)</span>
              </label>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowLinkPicker(!showLinkPicker)}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Link Item...</span>
              </Button>
            </div>

            <p className="text-[11px] text-text-muted">
              Link this note to any password, bank account, card, or identity. This note will also appear inside that item.
            </p>

            {/* Currently Linked Items List */}
            {noteLinkedItemIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {noteLinkedItemIds.map((itemId) => {
                  const targetItem = itemMap.get(itemId);
                  if (!targetItem) return null;
                  return (
                    <div
                      key={itemId}
                      className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg bg-surface-subtle border border-border text-xs text-text-primary"
                    >
                      {getItemTypeIcon(targetItem.type)}
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{targetItem.title}</span>
                        <span className="text-[10px] text-text-muted">
                          ({getItemTypeLabel(targetItem.type)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLinkedItem(itemId)}
                        className="p-1 text-text-muted hover:text-danger rounded"
                        title="Unlink item"
                        aria-label="Unlink item"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Link Item Search & Picker Box */}
            {showLinkPicker && (
              <div className="p-3 rounded-lg border border-accent/30 bg-surface-subtle space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">
                    Select Vault Item to Link
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLinkPicker(false)}
                    className="p-0.5 text-text-muted hover:text-text-primary"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Input
                  value={linkSearchQuery}
                  onChange={(e) => setLinkSearchQuery(e.target.value)}
                  placeholder="Search credentials, banks, cards, identities..."
                  className="h-8 text-xs w-full"
                  autoFocus
                />

                <div className="max-h-36 overflow-y-auto space-y-1">
                  {linkableItems.length === 0 ? (
                    <div className="p-2 text-center text-xs text-text-muted">
                      No matching unlinked items found.
                    </div>
                  ) : (
                    linkableItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => addLinkedItem(item.id)}
                        className="flex items-center justify-between p-1.5 px-2 rounded hover:bg-accent/10 cursor-pointer text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getItemTypeIcon(item.type)}
                          <span className="truncate text-text-primary font-medium">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            • {getItemTypeLabel(item.type)}
                          </span>
                        </div>
                        <Plus className="h-3.5 w-3.5 text-accent shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Editor / Preview Switcher */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <label className="text-xs font-medium text-text-secondary">
              Note Content (Markdown supported)
            </label>
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  !previewMode
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Edit3 className="h-3 w-3" />
                <span>Write</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  previewMode
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {previewMode ? (
            <div className="min-h-[160px] rounded-md border border-border bg-surface-subtle p-3 text-xs text-text-primary whitespace-pre-wrap leading-relaxed font-sans">
              {noteContent || (
                <span className="text-text-muted italic">No text content entered.</span>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your private markdown note here..."
                rows={6}
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent font-mono leading-relaxed"
              />
              <div className="text-[10px] text-text-muted text-right">
                {noteContent.length} characters •{' '}
                {noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0} words
              </div>
            </div>
          )}

          {/* Checklist Items */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Checklist Items</span>
            </label>

            <Input
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={handleAddChecklistItem}
              placeholder="Add checklist item (Press Enter)..."
            />

            {noteChecklist.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {noteChecklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-md bg-surface-subtle border border-border text-xs"
                  >
                    <div
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                      onClick={() => toggleChecklistItem(item.id)}
                    >
                      {item.checked ? (
                        <CheckSquare className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-text-muted shrink-0" />
                      )}
                      <span
                        className={`truncate text-xs ${
                          item.checked ? 'line-through text-text-muted' : 'text-text-primary'
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      className="text-text-muted hover:text-danger p-0.5 shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditorOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              isLoading={isSaving}
              disabled={isSaving}
              className="gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{editingNote ? 'Update Note' : 'Encrypt & Save'}</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* New Folder Modal */}
      <Dialog
        open={isNewFolderModalOpen}
        onOpenChange={setIsNewFolderModalOpen}
        title="Create New Folder"
        description="Organize your secure notes into encrypted categories."
      >
        <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary">Folder Name</label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Work, Financial, Personal, Recovery"
              autoFocus
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewFolderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="gap-1.5">
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Create Folder</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Rename Folder Modal */}
      <Dialog
        open={isRenameModalOpen}
        onOpenChange={setIsRenameModalOpen}
        title="Rename Folder"
        description="Change the name of this folder."
      >
        <form onSubmit={handleRenameFolder} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary">Folder Name</label>
            <Input
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Enter new folder name..."
              autoFocus
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsRenameModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="gap-1.5">
              <Edit2 className="h-3.5 w-3.5" />
              <span>Save Name</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Folder Modal */}
      <Dialog
        open={isDeleteFolderModalOpen}
        onOpenChange={setIsDeleteFolderModalOpen}
        title="Delete Folder"
        description={`Are you sure you want to delete "${deletingFolder?.name}"?`}
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-text-secondary">
            Choose what to do with notes currently inside this folder:
          </p>

          <div className="space-y-2">
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-surface-subtle cursor-pointer">
              <input
                type="radio"
                name="deleteOption"
                checked={deleteOption === 'move_to_root'}
                onChange={() => setDeleteOption('move_to_root')}
                className="mt-0.5 text-accent"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-semibold text-text-primary">
                  Keep Notes (Move to Unorganized)
                </span>
                <p className="text-text-muted">
                  The folder will be deleted, but all notes will remain safely in your vault.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-danger/30 bg-danger/5 cursor-pointer">
              <input
                type="radio"
                name="deleteOption"
                checked={deleteOption === 'delete_all'}
                onChange={() => setDeleteOption('delete_all')}
                className="mt-0.5 text-danger"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-semibold text-danger">
                  Delete Folder and All Contained Notes
                </span>
                <p className="text-text-muted">
                  Permanently delete this folder and all notes inside it from the vault.
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteFolderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDeleteFolder}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Folder</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
