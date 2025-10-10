import { useMemo } from 'react';
import { addDays, startOfWeek } from 'date-fns';
import { useStore } from '../store/useStore';

const WEEK_OPTIONS = { weekStartsOn: 1 as const }; // Monday
const MAX_TRAINING_LOAD = 1000;

interface WeeklyTrainingLoadStats {
  readonly averageLoad: number;
  readonly streakDays: number;
  readonly averagePercent: number;
  readonly badgeLevel: 'low' | 'optimal' | 'high';
  readonly badgeLabel: string;
  readonly weekDays: ReadonlyArray<{
    readonly dateKey: string;
    readonly load: number;
    readonly percent: number;
  }>;
}

/**
 * Hook to aggregate training load data for the current week (Mon-Sun)
 * and calculate weekly statistics (streak, average, badge level)
 */
export function useTrainingLoadWeek(): WeeklyTrainingLoadStats {
  const trainingLoadMap = useStore((state) => state.trainingLoad);
  const selectedDate = useStore((state) => state.selectedDate);

  return useMemo(() => {
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    const monday = startOfWeek(baseDate, WEEK_OPTIONS);

    // Build 7 days (Mon-Sun)
    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const currentDate = addDays(monday, index);
      const dateKey = currentDate.toISOString().split('T')[0];
      const loadData = trainingLoadMap[dateKey];
      const load = loadData?.load ?? 0;
      const percent = Math.min(100, Math.max(0, Math.round((load / MAX_TRAINING_LOAD) * 100)));

      return { dateKey, load, percent };
    });

    // Calculate statistics
    const totalLoad = weekDays.reduce((sum, day) => sum + day.load, 0);
    const averageLoad = Math.round(totalLoad / 7);
    const averagePercent = Math.round(
      weekDays.reduce((sum, day) => sum + day.percent, 0) / 7
    );
    const streakDays = weekDays.filter((day) => day.percent >= 100).length;

    // Determine badge level based on average load
    const badgeLevel: 'low' | 'optimal' | 'high' =
      averageLoad >= 600 ? 'high' : averageLoad >= 200 ? 'optimal' : 'low';

    // Badge label (internationalization handled by component)
    const badgeLabel = badgeLevel;

    return {
      averageLoad,
      streakDays,
      averagePercent,
      badgeLevel,
      badgeLabel,
      weekDays,
    };
  }, [trainingLoadMap, selectedDate]);
}
