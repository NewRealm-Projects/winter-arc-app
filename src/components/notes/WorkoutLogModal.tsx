import { useState } from 'react';
import { format } from 'date-fns';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from '../ui/AppModal';
import { useTranslation } from '../../hooks/useTranslation';
import type { SportKey } from '../../types';

export type Intensity = 'easy' | 'moderate' | 'hard';

export interface WorkoutLogData {
  sport: SportKey;
  durationMin: number;
  intensity: Intensity;
  note?: string;
  date: string;
}

interface WorkoutLogModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: WorkoutLogData) => Promise<void>;
  currentDate?: string;
}

const SPORT_OPTIONS: Array<{ key: SportKey; icon: string; labelKey: string }> = [
  { key: 'hiit', icon: '🔥', labelKey: 'quickLog.workoutModal.sportHiit' },
  { key: 'cardio', icon: '🏃', labelKey: 'quickLog.workoutModal.sportCardio' },
  { key: 'gym', icon: '🏋️', labelKey: 'quickLog.workoutModal.sportGym' },
  { key: 'schwimmen', icon: '🏊', labelKey: 'quickLog.workoutModal.sportSwimming' },
  { key: 'soccer', icon: '⚽', labelKey: 'quickLog.workoutModal.sportSoccer' },
  { key: 'rest', icon: '😴', labelKey: 'quickLog.workoutModal.sportRest' },
];

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

function WorkoutLogModal({ open, onClose, onSave, currentDate }: WorkoutLogModalProps) {
  const { t } = useTranslation();

  const [sport, setSport] = useState<SportKey>('cardio');
  const [durationMin, setDurationMin] = useState<number>(60);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [intensity, setIntensity] = useState<Intensity>('moderate');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = currentDate || todayKey;

  const isRest = sport === 'rest';

  const handleSave = async () => {
    if (durationMin <= 0 && !isRest) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        sport,
        durationMin: isRest ? 0 : durationMin,
        intensity: isRest ? 'easy' : intensity,
        note: note.trim() || undefined,
        date: activeDate,
      });

      // Reset form
      setSport('cardio');
      setDurationMin(60);
      setCustomDuration('');
      setIntensity('moderate');
      setNote('');
      onClose();
    } catch (error) {
      console.error('Error saving workout log:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      // Reset form
      setSport('cardio');
      setDurationMin(60);
      setCustomDuration('');
      setIntensity('moderate');
      setNote('');
      onClose();
    }
  };

  const handleDurationSelect = (duration: number) => {
    setDurationMin(duration);
    setCustomDuration('');
  };

  const handleCustomDurationChange = (value: string) => {
    setCustomDuration(value);
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      setDurationMin(Math.round(numeric));
    }
  };

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={t('quickLog.workoutModal.title')}
      icon={<span className="text-2xl">🏃</span>}
      size="md"
      preventCloseOnBackdrop={saving}
      footer={
        <>
          <ModalSecondaryButton onClick={handleClose} disabled={saving}>
            {t('common.actions.cancel')}
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSave} disabled={(!isRest && durationMin <= 0) || saving}>
            {saving ? t('common.saving') : t('common.actions.save')}
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Sport Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('quickLog.workoutModal.sportType')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SPORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSport(option.key)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  sport === option.key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <span className="text-2xl mb-1">{option.icon}</span>
                <span className="text-[10px] text-gray-600 dark:text-gray-400 text-center">
                  {t(option.labelKey)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration (not for rest days) */}
        {!isRest && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('quickLog.workoutModal.duration')} ({t('common.minutes')})
            </label>

            {/* Quick Duration Buttons */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {DURATION_OPTIONS.map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => handleDurationSelect(duration)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    durationMin === duration && !customDuration
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {duration}
                </button>
              ))}
            </div>

            {/* Custom Duration Input */}
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={customDuration}
                onChange={(e) => handleCustomDurationChange(e.target.value)}
                placeholder={t('quickLog.workoutModal.customDuration')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                min
              </span>
            </div>
          </div>
        )}

        {/* Intensity (not for rest days) */}
        {!isRest && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('quickLog.workoutModal.intensity')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setIntensity('easy')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  intensity === 'easy'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('quickLog.workoutModal.intensityEasy')}
              </button>
              <button
                type="button"
                onClick={() => setIntensity('moderate')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  intensity === 'moderate'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('quickLog.workoutModal.intensityModerate')}
              </button>
              <button
                type="button"
                onClick={() => setIntensity('hard')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  intensity === 'hard'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('quickLog.workoutModal.intensityHard')}
              </button>
            </div>
          </div>
        )}

        {/* Rest Day Info */}
        {isRest && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {t('quickLog.workoutModal.restDayInfo')}
            </div>
          </div>
        )}

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

export default WorkoutLogModal;
