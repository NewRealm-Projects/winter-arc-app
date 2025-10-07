import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { SmartNote, Event, SmartNoteAttachment } from '../types/events';
import { noteStore } from '../store/noteStore';
import { processSmartNote, retrySmartNote } from '../features/notes/pipeline';

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
        const baseClass = 'px-3 py-1 rounded-full text-sm bg-winter-100 text-winter-700 dark:bg-winter-900/40 dark:text-winter-100 flex items-center gap-1';
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

  return (
    <div className="glass dark:glass-dark rounded-2xl p-5 shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{createdAgo}</div>
          <p className="mt-2 text-base text-gray-900 dark:text-gray-100 leading-relaxed">
            {note.summary}
            {note.pending && <span className="ml-2" title="Wird verarbeitet">⏳</span>}
          </p>
        </div>
        {note.pending && (
          <button
            className="text-sm text-winter-600 hover:text-winter-500 dark:text-winter-300"
            onClick={() => retrySmartNote(note.id)}
            type="button"
          >
            Erneut prüfen
          </button>
        )}
      </div>
      <EventBadges events={note.events} />
      {note.attachments && note.attachments.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {note.attachments.map((attachment) => (
            <img
              key={attachment.id}
              src={attachment.url}
              alt="Notizanhang"
              className="h-20 w-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
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
    loadNotes();
    const unsubscribe = noteStore.subscribe(() => {
      loadNotes();
    });
    return unsubscribe;
  }, [loadNotes]);

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
    <div className="min-h-screen safe-area-inset-top">
      <div className="relative text-white p-6 pb-8">
        <div className="max-w-[700px] mx-auto relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">🧠 {t('notes.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">Smart Notes helfen dir, Aktivitäten automatisch zu tracken.</p>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto px-4 pt-4 md:pt-6 pb-20 space-y-6">
        <form onSubmit={onSubmit} className="glass dark:glass-dark rounded-2xl p-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1 w-full">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Kurz notieren…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-500 outline-none"
              disabled={isSubmitting}
            />
            {attachments.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative">
                    <img
                      src={attachment.url}
                      alt="Ausgewählter Anhang"
                      className="h-20 w-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => { handleAttachmentRemove(attachment.id); }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
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
                onChange={() => handleAttachmentChange(event)}
                className="hidden"
                multiple
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl border border-dashed border-winter-400 text-sm text-winter-600 hover:bg-winter-50 dark:border-winter-500/60 dark:text-winter-200 dark:hover:bg-winter-900/50"
              >
                📷 Foto aufnehmen oder wählen
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !input.trim()}
            className={`px-5 py-3 rounded-xl font-semibold transition-colors ${
              isSubmitting
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed'
                : 'bg-winter-600 text-white hover:bg-winter-700'
            }`}
          >
            {isSubmitting ? 'Wird hinzugefügt…' : 'Hinzufügen'}
          </button>
        </form>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Heute</h2>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoTracking}
              onChange={(event) => setAutoTracking(event.target.checked)}
            />
            Auto-Tracking aktiv
          </label>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {notes.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-10">Noch keine Smart Notes vorhanden.</div>
          ) : (
            notes.map((note) => <NoteCard key={note.id} note={note} />)
          )}
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={loadingMore}
          >
            {loadingMore ? 'Lädt…' : 'Mehr laden'}
          </button>
        )}
      </div>
    </div>
  );
}

export default NotesPage;

