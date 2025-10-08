import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { SmartNote, Event, SmartNoteAttachment } from '../types/events';
import { noteStore } from '../store/noteStore';
import { useStore } from '../store/useStore';
import { processSmartNote, retrySmartNote, updateSmartNote } from '../features/notes/pipeline';
import { glassCardClasses, glassCardHoverClasses, designTokens } from '../theme/tokens';

const PAGE_SIZE = 20;

function useAutoTracking() {
  const [autoTracking, setAutoTracking] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    try {
      const stored = localStorage.getItem('smart_notes_auto_tracking');
      return stored ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('smart_notes_auto_tracking', JSON.stringify(autoTracking));
    } catch (error) {
      console.warn('Failed to persist auto-tracking preference', error);
    }
  }, [autoTracking]);

  return [autoTracking, setAutoTracking] as const;
}

function getBeverageLabel(beverage: 'water' | 'protein' | 'coffee' | 'tea' | 'other') {
  switch (beverage) {
    case 'water':
      return 'Wasser';
    case 'protein':
      return 'Protein';
    case 'coffee':
      return 'Kaffee';
    case 'tea':
      return 'Tee';
    default:
      return 'Drink';
  }
}

function getWorkoutLabel(sport: string) {
  switch (sport) {
    case 'hiit_hyrox':
      return 'Hyrox/HIIT';
    case 'cardio':
      return 'Cardio';
    case 'gym':
      return 'Gym';
    case 'swimming':
      return 'Schwimmen';
    case 'football':
      return 'Football';
    default:
      return sport;
  }
}

function EventBadges({ events }: { events: Event[] }) {
  if (!events.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {events.map((event) => {
        const baseClass =
          'px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/15 flex items-center gap-1';
        const confidenceLow = event.confidence < 0.5;

        switch (event.kind) {
          case 'drink':
            return (
              <span key={event.id} className={baseClass}>
                🥤 {event.volumeMl} ml {getBeverageLabel(event.beverage)}
                {confidenceLow && <span className="ml-2 text-xs">⚠︎ prüfen</span>}
              </span>
            );
          case 'protein':
            return (
              <span key={event.id} className={baseClass}>
                🧬 {event.grams} g
                {event.sourceLabel ? <span className="ml-1">({event.sourceLabel})</span> : null}
                {confidenceLow && <span className="ml-2 text-xs">⚠︎ prüfen</span>}
              </span>
            );
          case 'pushups':
            return (
              <span key={event.id} className={baseClass}>
                💪 ×{event.count}
                {confidenceLow && <span className="ml-2 text-xs">⚠︎ prüfen</span>}
              </span>
            );
          case 'workout':
            return (
              <span key={event.id} className={baseClass}>
                🏋️ {getWorkoutLabel(event.sport)}
                {event.durationMin ? <span className="ml-1">· {event.durationMin} min</span> : null}
                {event.intensity ? <span className="ml-1">· {event.intensity}</span> : null}
                {confidenceLow && <span className="ml-2 text-xs">⚠︎ prüfen</span>}
              </span>
            );
          case 'rest':
            return (
              <span key={event.id} className={baseClass}>
                😴 Rest-Day
                {event.reason ? <span className="ml-1">({event.reason})</span> : null}
                {confidenceLow && <span className="ml-2 text-xs">⚠︎ prüfen</span>}
              </span>
            );
          case 'weight':
            return (
              <span key={event.id} className={baseClass}>
                ⚖️ {event.kg} kg
                {confidenceLow && <span className="ml-2 text-xs">⚠︎ prüfen</span>}
              </span>
            );
          case 'bfp':
            return (
              <span key={event.id} className={baseClass}>
                📉 {event.percent} %
                {confidenceLow && <span className="ml-2 text-xs">⚠︎ prüfen</span>}
              </span>
            );
          case 'food':
            return (
              <span key={event.id} className={baseClass}>
                🍽️ {event.label}
                {typeof event.calories === 'number' ? <span className="ml-1">· {event.calories} kcal</span> : null}
                {typeof event.proteinG === 'number' ? <span className="ml-1">· {event.proteinG} g Protein</span> : null}
                {confidenceLow && <span className="ml-2 text-xs">⚠︎ prüfen</span>}
              </span>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

function NoteCard({ note }: { note: SmartNote }) {
  const createdAgo = formatDistanceToNow(note.ts, { addSuffix: true });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(note.raw);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(note.raw);
    }
  }, [note.raw, isEditing]);

  const handleStartEdit = useCallback(() => {
    setEditValue(note.raw);
    setIsEditing(true);
  }, [note.raw]);

  const handleCancelEdit = useCallback(() => {
    setEditValue(note.raw);
    setIsEditing(false);
  }, [note.raw]);

  const handleSaveEdit = useCallback(async () => {
    if (!editValue.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await updateSmartNote(note.id, editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update smart note', error);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, note.id]);

  const handleDelete = useCallback(async () => {
    const confirmed = typeof window === 'undefined' ? true : window.confirm('Smart Note wirklich löschen?');
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await noteStore.remove(note.id);
    } catch (error) {
      console.error('Failed to delete smart note', error);
    } finally {
      setIsDeleting(false);
    }
  }, [note.id]);

  return (
    <div className={`${glassCardHoverClasses} ${designTokens.padding.compact} text-white space-y-3 w-full`}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.35em] text-white/50">{createdAgo}</div>
            {isEditing ? (
              <>
                <textarea
                  aria-label="Smart Note bearbeiten"
                  value={editValue}
                  onChange={(event) => { setEditValue(event.target.value); }}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40"
                  disabled={isSaving}
                />
                <p className="mt-1 text-xs text-white/60">Änderungen werden erneut verarbeitet.</p>
              </>
            ) : (
              <p className="mt-2 text-sm md:text-base text-white/90 leading-relaxed">
                {note.summary}
                {note.pending && <span className="ml-2" title="Wird verarbeitet">⏳</span>}
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {note.pending && !isEditing ? (
              <button
                className="text-xs font-semibold text-white/80 hover:text-white transition-colors"
                onClick={() => retrySmartNote(note.id)}
                type="button"
              >
                Erneut prüfen
              </button>
            ) : null}
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-semibold text-white/60 transition-colors hover:text-white"
                  disabled={isSaving}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEdit()}
                  className={`text-xs font-semibold transition-colors ${
                    isSaving ? 'text-white/40 cursor-not-allowed' : 'text-winter-200 hover:text-white'
                  }`}
                  disabled={isSaving}
                >
                  Speichern
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="text-xs font-semibold text-white/80 transition-colors hover:text-white"
                >
                  Bearbeiten
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete()}
                  className={`text-xs font-semibold transition-colors ${
                    isDeleting ? 'text-white/40 cursor-not-allowed' : 'text-red-300 hover:text-red-200'
                  }`}
                  disabled={isDeleting}
                >
                  Löschen
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <EventBadges events={note.events} />
      {note.attachments && note.attachments.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {note.attachments.map((attachment) => (
            <img
              key={attachment.id}
              src={attachment.url}
              alt="Notizanhang"
              className="h-20 w-20 object-cover rounded-xl border border-white/15"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NotesPage() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [autoTracking, setAutoTracking] = useAutoTracking();
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const limitRef = useRef(PAGE_SIZE);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<SmartNoteAttachment[]>([]);

  const createAttachmentId = useCallback(() => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  const handleAttachmentChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const readers = Array.from(files).map(
        (file) =>
          new Promise<SmartNoteAttachment | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve({ id: createAttachmentId(), url: reader.result, type: 'image' });
              } else {
                resolve(null);
              }
            };
            reader.onerror = () => {
              console.error('Failed to read attachment file');
              resolve(null);
            };
            reader.readAsDataURL(file);
          })
      );

      const nextAttachments = (await Promise.all(readers)).filter(
        (attachment): attachment is SmartNoteAttachment => Boolean(attachment)
      );
      if (nextAttachments.length) {
        setAttachments((prev) => [...prev, ...nextAttachments]);
      }

      event.target.value = '';
    },
    [createAttachmentId]
  );

  const handleAttachmentRemove = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  }, []);

  const loadNotes = useCallback(async (limit = limitRef.current) => {
    const { notes: fetched, hasMore: more } = await noteStore.list({ limit });
    setNotes(fetched);
    setHasMore(more);
    limitRef.current = limit;
  }, []);

  useEffect(() => {
    void loadNotes();
    const unsubscribe = noteStore.subscribe(() => {
      void loadNotes();
    });
    return unsubscribe;
  }, [loadNotes]);

  const user = useStore((state) => state.user);

  useEffect(() => {
    if (!user) return;
    void noteStore.syncFromRemote();
  }, [user]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!input.trim()) return;
      setIsSubmitting(true);
      try {
        await processSmartNote(input, { autoTracking, attachments: attachments.length ? attachments : undefined });
        setInput('');
        setAttachments([]);
      } catch (error) {
        console.error('Failed to process note', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [input, autoTracking, attachments]
  );

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextLimit = limitRef.current + PAGE_SIZE;
    await loadNotes(nextLimit);
    setLoadingMore(false);
  }, [hasMore, loadingMore, loadNotes]);

  return (
    <div className="min-h-screen-mobile safe-pt pb-20 overflow-y-auto viewport-safe" data-testid="notes-page">
      <div className="mobile-container dashboard-container safe-pb px-3 pt-4 md:px-6 md:pt-8 lg:px-0">
        <div className="flex flex-col gap-3 md:gap-4">
          <section className={`${glassCardClasses} ${designTokens.padding.spacious} text-white animate-fade-in-up`}>
            <h1 className="text-fluid-h1 font-semibold flex items-center gap-2">
              <span aria-hidden="true">🧠</span>
              {t('notes.title')}
            </h1>
            <p className="text-sm text-white/70 max-w-xl">
              Smart Notes helfen dir, Aktivitäten automatisch zu tracken.
            </p>
          </section>

          <form
            data-testid="smart-note-form"
            onSubmit={onSubmit}
            className={[glassCardHoverClasses, designTokens.padding.spacious, 'flex flex-col gap-4 text-white', 'animate-fade-in-up delay-100'].join(' ')}
          >
            <div className="flex-1 w-full">
              <input
                data-testid="smart-note-input"
                value={input}
                onChange={(e) => { setInput(e.target.value); }}
                placeholder="Kurz notieren…"
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40"
                disabled={isSubmitting}
              />

              {attachments.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="relative">
                      <img
                        src={attachment.url}
                        alt="Ausgewählter Anhang"
                        className="h-20 w-20 object-cover rounded-xl border border-white/15"
                      />
                      <button
                        type="button"
                        onClick={() => { handleAttachmentRemove(attachment.id); }}
                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                        aria-label="Anhang entfernen"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleAttachmentChange}
                  className="hidden"
                  multiple
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center rounded-xl border border-dashed border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
                >
                  📷 Foto aufnehmen oder wählen
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !input.trim()}
              className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold transition-colors ${
                isSubmitting
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-winter-400 to-winter-600 text-white shadow-[0_10px_30px_rgba(15,118,110,0.35)] hover:from-winter-300 hover:to-winter-500'
              }`}
              data-testid="smart-note-submit"
            >
              {isSubmitting ? 'Wird hinzugefügt…' : 'Hinzufügen'}
            </button>
          </form>

          <section
            className={[glassCardClasses, designTokens.padding.spacious, 'text-white flex flex-col gap-4', 'animate-fade-in-up', 'delay-200'].join(' ')}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">Heute</h2>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={autoTracking}
                  onChange={(event) => { setAutoTracking(event.target.checked); }}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-winter-300 focus:ring-2 focus:ring-white/40"
                />
                Auto-Tracking aktiv
              </label>
            </div>
          </section>

          {notes.length === 0 ? (
            <div
              data-testid="smart-note-empty"
              className={[
                glassCardClasses,
                designTokens.padding.spacious,
                'text-white text-center animate-fade-in-up delay-300',
              ].join(' ')}
            >
              <p className="text-sm text-white/60">Noch keine Smart Notes vorhanden.</p>
            </div>
          ) : (
            <div data-testid="smart-note-list" className="flex flex-col gap-3">
              {notes.map((note) => <NoteCard key={note.id} note={note} />)}
            </div>
          )}

          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              className={[
                'inline-flex w-full items-center justify-center rounded-2xl border border-white/15 px-4 py-3',
                'text-sm font-semibold text-white/80 transition-colors',
                'hover:bg-white/10',
              ].join(' ')}
              disabled={loadingMore}
            >
              {loadingMore ? 'Lädt…' : 'Mehr laden'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotesPage;

