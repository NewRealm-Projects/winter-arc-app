import { useCallback } from 'react';
import type { CheckInActivity } from '../../types/tracking';
import { ActivityRow } from './ActivityRow';
import { useTranslation } from '../../hooks/useTranslation';

interface ActivityListProps {
  activities: CheckInActivity[];
  onChange: (activities: CheckInActivity[]) => void;
  isDisabled?: boolean;
}

export function ActivityList({ activities, onChange, isDisabled = false }: ActivityListProps) {
  const { t } = useTranslation();

  const handleActivityChange = useCallback(
    (id: string, updates: Partial<Omit<CheckInActivity, 'id'>>) => {
      onChange(
        activities.map((activity) =>
          activity.id === id ? { ...activity, ...updates } : activity
        )
      );
    },
    [activities, onChange]
  );

  const handleActivityDelete = useCallback(
    (id: string) => {
      onChange(activities.filter((activity) => activity.id !== id));
    },
    [activities, onChange]
  );

  const handleAddActivity = useCallback(() => {
    const newActivity: CheckInActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'running',
      durationMinutes: 30,
      intensity: 5,
    };
    onChange([...activities, newActivity]);
  }, [activities, onChange]);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t('checkIn.activitiesTitle')}
      </h3>

      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            onChange={handleActivityChange}
            onDelete={handleActivityDelete}
            isDisabled={isDisabled}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddActivity}
        disabled={isDisabled || activities.length >= 5}
        className="mt-3 w-full rounded-xl border-2 border-dashed border-gray-300 bg-transparent px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-winter-500 hover:bg-winter-500/5 hover:text-winter-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-winter-500 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-winter-400 dark:hover:text-winter-400"
      >
        + {t('checkIn.addActivity')}
      </button>

      {activities.length >= 5 && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          {t('checkIn.maxActivitiesReached')}
        </p>
      )}
    </div>
  );
}
