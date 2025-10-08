import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';
import { db } from '../firebase/config';
import { useStore } from '../store/useStore';
import type { DailyTrainingLoad } from '../types';

export function useTrainingLoadSubscription(dateKey?: string): void {
  const isTestEnv = typeof process !== 'undefined' && process.env?.VITEST === 'true';
  const userId = useStore((state) => state.user?.id);
  const setTrainingLoadForDate = useStore((state) => state.setTrainingLoadForDate);

  useEffect(() => {
    if (isTestEnv || !userId || !dateKey) {
      return undefined;
    }

    const ref = doc(db, 'users', userId, 'trainingLoad', dateKey);

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        setTrainingLoadForDate(dateKey, { ...(snapshot.data() as DailyTrainingLoad) });
      } else {
        setTrainingLoadForDate(dateKey, null);
      }
    });

    return unsubscribe;
  }, [isTestEnv, userId, dateKey, setTrainingLoadForDate]);
}
