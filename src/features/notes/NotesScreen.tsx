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
} from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { Dialog } from '@/ui/primitives/Dialog';
import { EmptyState } from '@/ui/primitives/EmptyState';
import { appVaultService } from '@/application/services/AppVaultService';
import { inMemorySearchIndex } from '@/domain/organization/searchIndex';
import { useUiStore } from '@/state/uiStore';
import type {
  VaultItemEnvelope,
  SecureNotePayload,
  CheckboxItem,
} from '@/domain/vault/types';

export function NotesScreen() {
  const addToast = useUiStore((state) => state.addToast);
  const vaultRevision = useUiStore((state) => state.vaultRevision);

  const [notes, setNotes] = React.useState<VaultItemEnvelope[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = React.useState(false);

  // Note Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<VaultItemEnvelope | null>(null);
  const [noteTitle, setNoteTitle] = React.useState('');
  const [noteContent, setNoteContent] = React.useState('');
  const [noteChecklist, setNoteChecklist] = React.useState<CheckboxItem[]>([]);
  const [newChecklistText, setNewChecklistText] = React.useState('');
  const [noteFavorite, setNoteFavorite] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const refreshNotes = React.useCallback(() => {
    const domain = appVaultService.getDecryptedVault();
    if (domain) {
      const results = inMemorySearchIndex.search({
        query: searchQuery,
      }).filter((i) => {
        if (i.type !== 'secure_note' || i.archived) return false;
        if (filterFavoritesOnly && !i.favorite) return false;
        return true;
      });

      // Float favorites to top
      results.sort((a, b) => {
        if (Boolean(a.favorite) !== Boolean(b.favorite)) {
          return a.favorite ? -1 : 1;
        }
        return a.title.localeCompare(b.title);
      });

      setNotes(results);
    }
  }, [searchQuery, filterFavoritesOnly, vaultRevision]);

  React.useEffect(() => {
    refreshNotes();
  }, [refreshNotes, vaultRevision]);

  const handleOpenNewNote = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteChecklist([]);
    setNewChecklistText('');
    setNoteFavorite(false);
    setPreviewMode(false);
    setIsEditorOpen(true);
  };

  const handleOpenEditNote = (note: VaultItemEnvelope) => {
    const payload = note.payload as Partial<SecureNotePayload>;
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(payload.content ?? '');
    setNoteChecklist(payload.checklist ? [...payload.checklist] : []);
    setNewChecklistText('');
    setNoteFavorite(note.favorite);
    setPreviewMode(false);
    setIsEditorOpen(true);
  };

  const handleAddChecklistItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = newChecklistText.trim();
      if (trimmed) {
        setNoteChecklist([
          ...noteChecklist,
          { id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: trimmed, checked: false },
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
      const payload: SecureNotePayload = {
        content: noteContent,
        checklist: noteChecklist,
        isMarkdown: true,
      };

      const item: VaultItemEnvelope = {
        id: editingNote?.id ?? `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: 'secure_note',
        title: noteTitle.trim(),
        favorite: noteFavorite,
        archived: editingNote?.archived ?? false,
        createdAt: editingNote?.createdAt ?? now,
        updatedAt: now,
        payload: payload as unknown as Record<string, unknown>,
      };

      await appVaultService.saveItem(item);

      addToast({
        title: editingNote ? 'Note Updated' : 'Note Encrypted & Saved',
        description: `"${noteTitle}" stored securely in local vault.`,
        variant: 'success',
      });

      setIsEditorOpen(false);
      refreshNotes();
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
      refreshNotes();
    } catch (err) {
      addToast({
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'danger',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Encrypted Secure Notes</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Private memos, recovery checklists, markdown documents, and confidential notes.
          </p>
        </div>

        <Button onClick={handleOpenNewNote} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>New Secure Note</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes and checklist items..."
            className="pl-9 h-10 w-full"
          />
        </div>

        <Button
          size="sm"
          variant={filterFavoritesOnly ? 'default' : 'ghost'}
          onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
          className={`h-8 text-xs gap-1.5 self-start sm:self-auto ${
            filterFavoritesOnly ? 'bg-amber-500 text-white hover:bg-amber-600' : 'text-text-secondary border border-border'
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${filterFavoritesOnly ? 'fill-current text-white' : 'text-amber-500'}`} />
          <span>Favorites</span>
        </Button>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6 text-accent" />}
          title="No secure notes created"
          description="Create encrypted notes, checklists, and private memos with zero plaintext exposure."
          primaryAction={
            <Button onClick={handleOpenNewNote} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Create first note</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => {
            const payload = note.payload as Partial<SecureNotePayload>;
            const checklist = payload.checklist ?? [];
            const completedCount = checklist.filter((c) => c.checked).length;

            return (
              <div
                key={note.id}
                onClick={() => handleOpenEditNote(note)}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-subtle hover:border-accent/40 hover:shadow-elevated transition-all cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-text-primary text-sm line-clamp-1">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await appVaultService.toggleFavoriteItem(note.id);
                          refreshNotes();
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
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Snippet / Content Preview */}
                  {payload.content && (
                    <p className="text-xs text-text-secondary line-clamp-4 whitespace-pre-wrap font-sans">
                      {payload.content}
                    </p>
                  )}

                  {/* Checklist Summary */}
                  {checklist.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-text-muted">
                        <span>Checklist</span>
                        <span>{completedCount}/{checklist.length}</span>
                      </div>
                      <div className="space-y-1">
                        {checklist.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center gap-1.5 text-xs text-text-secondary">
                            {item.checked ? (
                              <CheckSquare className="h-3.5 w-3.5 text-success shrink-0" />
                            ) : (
                              <Square className="h-3.5 w-3.5 text-text-muted shrink-0" />
                            )}
                            <span className={`truncate text-xs ${item.checked ? 'line-through text-text-muted' : ''}`}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Meta */}
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-border/60 text-[11px] text-text-muted">
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  <span className="font-mono text-accent/80 text-[10.5px]">Secure Note</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note Editor Modal */}
      <Dialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        title={editingNote ? 'Edit Secure Note' : 'New Secure Note'}
        description="Encrypted locally using 256-bit authenticated cipher."
      >
        <form onSubmit={handleSaveNote} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto pr-1">
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

          {/* Editor / Preview Switcher */}
          <div className="flex items-center justify-between pt-1">
            <label className="text-xs font-medium text-text-secondary">Note Content (Markdown supported)</label>
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  !previewMode ? 'bg-accent/10 text-accent font-semibold' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Edit3 className="h-3 w-3" />
                <span>Write</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  previewMode ? 'bg-accent/10 text-accent font-semibold' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {previewMode ? (
            <div className="min-h-[160px] rounded-md border border-border bg-surface-subtle p-3 text-xs text-text-primary whitespace-pre-wrap leading-relaxed font-sans">
              {noteContent || <span className="text-text-muted italic">No text content entered.</span>}
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
                {noteContent.length} characters • {noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0} words
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
                      className="flex items-center gap-2 cursor-pointer flex-1"
                      onClick={() => toggleChecklistItem(item.id)}
                    >
                      {item.checked ? (
                        <CheckSquare className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-text-muted shrink-0" />
                      )}
                      <span className={`${item.checked ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        {item.text}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      className="text-text-muted hover:text-danger p-0.5"
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

            <Button type="submit" size="sm" isLoading={isSaving} disabled={isSaving} className="gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>{editingNote ? 'Update Note' : 'Encrypt & Save'}</span>
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
