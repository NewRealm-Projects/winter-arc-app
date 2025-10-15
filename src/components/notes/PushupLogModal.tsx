import { useState } from 'react';
import { format } from 'date-fns';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from '../ui/AppModal';
import { useTranslation } from '../../hooks/useTranslation';

export interface PushupLogData {
  count: number;
  note?: string;
  date: string;
}

interface PushupLogModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: PushupLogData) => Promise<void>;
  currentDate?: string;
}

const QUICK_COUNTS = [10, 20, 30, 50, 100];

function PushupLogModal({ open, onClose, onSave, currentDate }: PushupLogModalProps) {
  const { t } = useTranslation();

  const [count, setCount] = useState<number>(20);
  const [customCount, setCustomCount] = useState<string>('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = currentDate || todayKey;

  const canSave = count > 0;

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      await onSave({
        count,
        note: note.trim() || undefined,
        date: activeDate,
      });

      // Reset form
      setCount(20);
      setCustomCount('');
      setNote('');
      onClose();
    } catch (error) {
      console.error('Error saving pushup log:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      // Reset form
      setCount(20);
      setCustomCount('');
      setNote('');
      onClose();
    }
  };

  const handleQuickCount = (quickCount: number) => {
    setCount(quickCount);
    setCustomCount('');
  };

  const handleCustomCountChange = (value: string) => {
    setCustomCount(value);
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      setCount(Math.round(numeric));
    }
  };

  const handleIncrement = (amount: number) => {
    setCount((prev) => Math.max(0, prev + amount));
    setCustomCount('');
  };

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={t('quickLog.pushupModal.title')}
      icon={<span className="text-2xl">💪</span>}
      size="sm"
      preventCloseOnBackdrop={saving}
      footer={
        <>
          <ModalSecondaryButton onClick={handleClose} disabled={saving}>
            {t('common.actions.cancel')}
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSave} disabled={!canSave || saving}>
            {saving ? t('common.saving') : t('common.actions.save')}
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Current Count Display */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 text-center">
          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
            {count}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t('quickLog.pushupModal.pushups')}
          </div>
        </div>

        {/* Increment/Decrement Buttons */}
        <div className="grid grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => handleIncrement(-10)}
            className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 font-medium transition-colors"
          >
            -10
          </button>
          <button
            type="button"
            onClick={() => handleIncrement(-5)}
            className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 font-medium transition-colors"
          >
            -5
          </button>
          <button
            type="button"
            onClick={() => handleIncrement(-1)}
            className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 font-medium transition-colors"
          >
            -1
          </button>
          <button
            type="button"
            onClick={() => handleIncrement(1)}
            className="px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30 font-medium transition-colors"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => handleIncrement(5)}
            className="px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30 font-medium transition-colors"
          >
            +5
          </button>
        </div>

        {/* Quick Count Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('quickLog.pushupModal.quickCounts')}
          </label>
          <div className="grid grid-cols-5 gap-2">
            {QUICK_COUNTS.map((quickCount) => (
              <button
                key={quickCount}
                type="button"
                onClick={() => handleQuickCount(quickCount)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  count === quickCount && !customCount
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {quickCount}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Count Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('quickLog.pushupModal.customCount')}
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={customCount}
            onChange={(e) => handleCustomCountChange(e.target.value)}
            placeholder={t('quickLog.pushupModal.enterCount')}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('quickLog.optionalNote')}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('quickLog.notePlaceholder')}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            maxLength={200}
          />
        </div>
      </div>
    </AppModal>
  );
}

export default PushupLogModal;
