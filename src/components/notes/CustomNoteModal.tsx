import { useState } from 'react';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from '../ui/AppModal';
import { useTranslation } from '../../hooks/useTranslation';

export interface CustomNoteData {
  title?: string;
  content: string;
}

interface CustomNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CustomNoteData) => Promise<void>;
}

function CustomNoteModal({ open, onClose, onSave }: CustomNoteModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    // Validate
    if (!content.trim()) {
      setError(t('notes.emptyInput'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave({
        title: title.trim() || undefined,
        content: content.trim(),
      });

      // Reset form
      setTitle('');
      setContent('');
      onClose();
    } catch (err) {
      console.error('Failed to save custom note', err);
      setError(t('notes.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setTitle('');
      setContent('');
      setError('');
      onClose();
    }
  };

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={t('quickLog.newNote')}
      subtitle={t('quickLog.newNoteSubtitle')}
      icon={<span className="text-2xl">📝</span>}
      size="md"
      footer={
        <>
          <ModalSecondaryButton onClick={handleClose} disabled={saving}>
            {t('tracking.cancel')}
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSave} disabled={saving || !content.trim()}>
            {saving ? t('notes.submitting') : t('notes.submitButton')}
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Title (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('quickLog.noteTitle')} ({t('quickLog.optional')})
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('quickLog.noteTitlePlaceholder')}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none -mx-1"
            disabled={saving}
          />
        </div>

        {/* Content (Required) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('quickLog.noteContent')}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('notes.placeholder')}
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none resize-none -mx-1"
            disabled={saving}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    </AppModal>
  );
}

export default CustomNoteModal;
