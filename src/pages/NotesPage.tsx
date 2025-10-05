import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { getNotes, saveNotes } from '../services/firestoreService';

function NotesPage() {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const [notes, setNotes] = useState('');
  const notesRef = useRef(notes);
  const initialNotesRef = useRef('');

  // Update ref when notes change
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Load notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      if (!user) return;
      const result = await getNotes(user.id);
      if (result.success && result.data) {
        setNotes(result.data);
        initialNotesRef.current = result.data;
      }
    };
    loadNotes();
  }, [user]);

  // Auto-save function (without UI feedback)
  const autoSave = async () => {
    if (!user) return;
    const currentNotes = notesRef.current;

    // Only save if notes have changed
    if (currentNotes !== initialNotesRef.current) {
      const result = await saveNotes(user.id, currentNotes);
      if (result.success) {
        initialNotesRef.current = currentNotes;
      }
    }
  };

  // Auto-save on unmount (when navigating away)
  useEffect(() => {
    return () => {
      autoSave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-save on beforeunload (when closing tab/refreshing)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (notesRef.current !== initialNotesRef.current && user) {
        // Call autoSave - browsers will wait briefly for async operations
        autoSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="min-h-screen safe-area-inset-top">
      {/* Header */}
      <div className="relative text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📝 {t('notes.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('notes.subtitle')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pt-4 md:pt-6 pb-20 space-y-4">
        <div className="glass dark:glass-dark rounded-[20px] p-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notes.placeholder')}
            className="w-full h-96 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-500 outline-none resize-none"
          />

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
            {t('notes.autoSave')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotesPage;
