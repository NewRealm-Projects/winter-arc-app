import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';
import { db } from '../firebase/config';
import { useStore } from '../store/useStore';
import type { DailyCheckIn } from '../types';

export function useCheckInSubscription(dateKey?: string): void {
  const isTestEnv = typeof process !== 'undefined' && process.env?.VITEST === 'true';
  const userId = useStore((state) => state.user?.id);
  const setCheckInForDate = useStore((state) => state.setCheckInForDate);

  useEffect(() => {
    if (isTestEnv || !userId || !dateKey) {
      return undefined;
    }

    const ref = doc(db, 'users', userId, 'checkins', dateKey);

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        setCheckInForDate(dateKey, { ...(snapshot.data() as DailyCheckIn) });
      } else {
        setCheckInForDate(dateKey, null);
      }
    });

    return unsubscribe;
  }, [isTestEnv, userId, dateKey, setCheckInForDate]);
}
