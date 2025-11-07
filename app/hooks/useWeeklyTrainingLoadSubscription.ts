'use client';

import { useEffect, useMemo } from 'react';
import { startOfWeek, addDays, format } from 'date-fns';
import { useStore } from '../store/useStore';
import type { DailyTrainingLoad } from '../types';
import { isDemoModeActive } from '../constants/demo';

/**
 * Fetches training load data for all 7 days of the week containing the given date.
 * Polls for updates to keep data fresh.
 *
 * @param selectedDate - The date within the week to fetch (defaults to today)
 */
export function useWeeklyTrainingLoadSubscription(selectedDate?: Date): void {
  const isTestEnv = typeof process !== 'undefined' && process.env?.VITEST === 'true';
  const userId = useStore((state) => state.user?.id);
  const setTrainingLoadForDate = useStore((state) => state.setTrainingLoadForDate);
  const isDemoMode = isDemoModeActive();

  // Calculate stable week key to prevent re-fetches when only the day changes
  const weekKey = useMemo(() => {
    const weekStart = startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 });
    return format(weekStart, 'yyyy-MM-dd');
  }, [selectedDate]);

  useEffect(() => {
    if (isTestEnv || isDemoMode || !userId) {
      return undefined;
    }

    let isActive = true;

    const fetchWeeklyTrainingLoad = async () => {
      // Calculate Monday of the week (week starts on Monday)
      const weekStart = startOfWeek(new Date(weekKey), { weekStartsOn: 1 });

      // Fetch all 7 days of the week
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        const dateKey = format(date, 'yyyy-MM-dd');

        try {
          const response = await fetch(`/api/training-load/${dateKey}`);
          
          if (!response.ok) {
            if (response.status === 404) {
              if (isActive) setTrainingLoadForDate(dateKey, null);
            } else if (response.status === 401) {
              if (isActive) setTrainingLoadForDate(dateKey, null);
            }
            continue;
          }

          const data = await response.json();
          if (isActive) {
            setTrainingLoadForDate(dateKey, data as DailyTrainingLoad);
          }
        } catch (error) {
          console.warn(`Error fetching training load for ${dateKey}:`, error);
        }
      }
    };

    fetchWeeklyTrainingLoad();

    // Poll for updates every 30 seconds
    const intervalId = setInterval(fetchWeeklyTrainingLoad, 30000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [isTestEnv, isDemoMode, userId, weekKey, setTrainingLoadForDate]);
}


