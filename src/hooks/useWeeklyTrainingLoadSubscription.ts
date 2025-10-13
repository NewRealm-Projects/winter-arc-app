import { doc, onSnapshot, type FirestoreError } from 'firebase/firestore';
import { useEffect } from 'react';
import { startOfWeek, addDays, format } from 'date-fns';
import { auth, db } from '../firebase';
import { useStore } from '../store/useStore';
import type { DailyTrainingLoad } from '../types';
import { isDemoModeActive } from '../constants/demo';

/**
 * Subscribes to training load data for all 7 days of the week containing the given date.
 * This ensures the training load graph updates in real-time when any day's data changes.
 *
 * @param selectedDate - The date within the week to subscribe to (defaults to today)
 */
export function useWeeklyTrainingLoadSubscription(selectedDate?: Date): void {
  const isTestEnv = typeof process !== 'undefined' && process.env?.VITEST === 'true';
  const userId = useStore((state) => state.user?.id);
  const setTrainingLoadForDate = useStore((state) => state.setTrainingLoadForDate);
  const isDemoMode = isDemoModeActive();

  useEffect(() => {
    if (isTestEnv || isDemoMode || !userId) {
      return undefined;
    }

    const currentUser = auth.currentUser;

    if (!currentUser || currentUser.uid !== userId) {
      return undefined;
    }

    // Calculate Monday of the week (week starts on Monday)
    const weekStart = startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 });

    // Array to store all unsubscribe functions
    const unsubscribes: (() => void)[] = [];

    // Subscribe to all 7 days of the week
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const ref = doc(db, 'users', userId, 'trainingLoad', dateKey);
      const pathString = `users/${userId}/trainingLoad/${dateKey}`;

      if (import.meta.env.DEV) {
        console.warn('[WeeklySubscribe]', pathString);
      }

      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          if (snapshot.exists()) {
            setTrainingLoadForDate(dateKey, { ...(snapshot.data() as DailyTrainingLoad) });
          } else {
            setTrainingLoadForDate(dateKey, null);
          }
        },
        (error: FirestoreError) => {
          console.warn('[FirestoreError]', {
            code: error.code,
            message: error.message,
            path: pathString,
          });
          if (error.code === 'permission-denied') {
            setTrainingLoadForDate(dateKey, null);
          }
        }
      );

      unsubscribes.push(unsubscribe);
    }

    // Cleanup function: unsubscribe from all 7 listeners
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [isTestEnv, isDemoMode, userId, selectedDate, setTrainingLoadForDate]);
}
