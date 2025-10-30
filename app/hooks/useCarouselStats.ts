'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import { useWeekContext } from '../contexts/WeekContext';
import { useTranslation } from './useTranslation';
import { getPercent, resolveWaterGoal, formatMl } from '../utils/progress';
import { calculateTDEE } from '../utils/nutrition';
import { countActiveSports } from '../utils/sports';
import type { DailyTracking } from '../types';

export interface CarouselStat {
  id: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight';
  icon: string; // Emoji string
  label: string;
  value: string | number;
  progress: number; // 0-100
  color: string;
}

const STAT_COLORS = {
  sports: '#10B981', // Green
  pushup: '#3B82F6', // Blue
  hydration: '#06B6D4', // Cyan
  nutrition: '#F59E0B', // Amber
  weight: '#8B5CF6', // Purple
};

const STAT_ICONS = {
  sports: '🏃',
  pushup: '💪',
  hydration: '💧',
  nutrition: '🥩',
  weight: '⚖️',
};

/**
 * Hook to get carousel stats for the selected date
 * Transforms tracking data into carousel format
 * Respects WeekContext.selectedDate
 */
export function useCarouselStats(): CarouselStat[] {
  const { t, language } = useTranslation();
  const tracking = useStore((state) => state.tracking);
  const user = useStore((state) => state.user);
  const { selectedDate } = useWeekContext();

  return useMemo(() => {
    // Convert selected date to YYYY-MM-DD format
    const activeDate = format(parseISO(selectedDate), 'yyyy-MM-dd');
    const dayTracking = tracking[activeDate];

    // Calculate goals
    const waterGoal = resolveWaterGoal(user);

    // Sports stat
    const sportsCount = countActiveSports(dayTracking?.sports);
    const sportsDone = sportsCount > 0;
    const sportsValue = sportsDone ? t('common.completed') : t('common.notCompleted');

    // Pushup stat
    const pushupTotal = dayTracking?.pushups?.total ?? 0;
    const pushupDone = pushupTotal > 0;
    const pushupValue = `${pushupTotal} ${t('tracking.total')}`;

    // Hydration stat (formatted)
    const waterValue = dayTracking?.water ?? 0;
    const localeCode = language === 'de' ? 'de-DE' : 'en-US';
    const waterDisplay = `${formatMl(waterValue, { locale: localeCode, maximumFractionDigits: 1 })}L / ${formatMl(waterGoal, { locale: localeCode, maximumFractionDigits: 1 })}L`;
    const waterProgress = getPercent(waterValue, waterGoal);

    // Nutrition stat (calories primary)
    const calorieValue = dayTracking?.calories ?? 0;
    let calorieProgress = 0;
    if (user?.weight && user?.activityLevel) {
      const tdee = calculateTDEE(user.weight, user.activityLevel, user.bodyFat);
      calorieProgress = getPercent(calorieValue, tdee);
    }

    // Weight stat (all info)
    const weightValue = dayTracking?.weight?.value ?? 0;
    const weightDone = weightValue > 0;
    const weightDisplay = weightDone ? `${weightValue} kg` : '—';

    // BMI calculation: prefer tracked weight, fallback to user profile weight
    const effectiveWeight = (weightValue > 0 ? weightValue : user?.weight) ?? 0;
    const bmiValue = effectiveWeight > 0 && user?.height && user.height > 0
      ? (effectiveWeight / ((user.height / 100) ** 2)).toFixed(1)
      : '—';

    return [
      {
        id: 'sports',
        icon: STAT_ICONS.sports,
        label: t('tracking.sports'),
        value: sportsValue,
        progress: sportsDone ? 100 : 0,
        color: STAT_COLORS.sports,
      },
      {
        id: 'pushup',
        icon: STAT_ICONS.pushup,
        label: t('tracking.pushups'),
        value: pushupValue,
        progress: pushupDone ? 100 : 0,
        color: STAT_COLORS.pushup,
      },
      {
        id: 'hydration',
        icon: STAT_ICONS.hydration,
        label: t('tracking.water'),
        value: waterDisplay,
        progress: waterProgress,
        color: STAT_COLORS.hydration,
      },
      {
        id: 'nutrition',
        icon: STAT_ICONS.nutrition,
        label: t('tracking.calories'),
        value: `${calorieValue} ${t('tracking.kcal')}`,
        progress: calorieProgress,
        color: STAT_COLORS.nutrition,
      },
      {
        id: 'weight',
        icon: STAT_ICONS.weight,
        label: t('tracking.weight'),
        value: `${weightDisplay} | ${t('tracking.bmi')}: ${bmiValue}`,
        progress: weightDone ? 100 : 0,
        color: STAT_COLORS.weight,
      },
    ];
  }, [tracking, user, selectedDate, t, language]);
}


