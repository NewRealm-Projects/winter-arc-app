import { useCallback, type ChangeEvent } from 'react';
import type { ActivityType, CheckInActivity } from '../../types/tracking';
import { useTranslation } from '../../hooks/useTranslation';

interface ActivityRowProps {
  activity: CheckInActivity;
  onChange: (id: string, updates: Partial<Omit<CheckInActivity, 'id'>>) => void;
  onDelete: (id: string) => void;
  isDisabled?: boolean;
}

const ACTIVITY_TYPES: ActivityType[] = ['running', 'cycling', 'strength', 'hiit', 'mobility', 'other'];

export function ActivityRow({ activity, onChange, onDelete, isDisabled = false }: ActivityRowProps) {
  const { t } = useTranslation();

  const handleTypeChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onChange(activity.id, { type: event.target.value as ActivityType });
    },
    [activity.id, onChange]
  );

  const handleDurationChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      if (!Number.isNaN(value) && value >= 0) {
        onChange(activity.id, { durationMinutes: value });
      }
    },
    [activity.id, onChange]
  );

  const handleIntensityChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      onChange(activity.id, { intensity: value });
    },
    [activity.id, onChange]
  );

  const handleDelete = useCallback(() => {
    onDelete(activity.id);
  }, [activity.id, onDelete]);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="mb-3 flex gap-2">
        <select
          value={activity.type}
          onChange={handleTypeChange}
          disabled={isDisabled}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-winter-500 focus:outline-none focus:ring-2 focus:ring-winter-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          aria-label={t('checkIn.activityTypeLabel')}
        >
          {ACTIVITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`checkIn.activityType.${type}`)}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={activity.durationMinutes}
          onChange={handleDurationChange}
          disabled={isDisabled}
          min="1"
          max="999"
          className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-winter-500 focus:outline-none focus:ring-2 focus:ring-winter-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          placeholder={t('checkIn.durationPlaceholder')}
          aria-label={t('checkIn.durationLabel')}
        />

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDisabled}
          className="rounded-lg bg-rose-500/10 px-3 py-2 text-rose-600 transition hover:bg-rose-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 dark:text-rose-400"
          aria-label={t('checkIn.deleteActivity')}
        >
          ×
        </button>
      </div>

      <div>
        <label className="mb-2 flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
          <span>{t('checkIn.intensityLabel')}</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{activity.intensity}/10</span>
        </label>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={activity.intensity}
          onChange={handleIntensityChange}
          disabled={isDisabled}
          className="w-full accent-winter-500"
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={activity.intensity}
          aria-valuetext={`${activity.intensity}`}
        />
        <div className="mt-1 flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
          <span>{t('checkIn.intensityLow')}</span>
          <span>{t('checkIn.intensityHigh')}</span>
        </div>
      </div>
    </div>
  );
}
