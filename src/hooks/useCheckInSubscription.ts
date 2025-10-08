import { doc, onSnapshot, type FirestoreError } from 'firebase/firestore';
import { useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { useStore } from '../store/useStore';
import type { DailyCheckIn } from '../types';
import { isDemoModeActive } from '../constants/demo';

export function useCheckInSubscription(dateKey?: string): void {
  const isTestEnv = typeof process !== 'undefined' && process.env?.VITEST === 'true';
  const userId = useStore((state) => state.user?.id);
  const setCheckInForDate = useStore((state) => state.setCheckInForDate);
  const isDemoMode = isDemoModeActive();

  useEffect(() => {
    if (isTestEnv || isDemoMode || !userId || !dateKey) {
      return undefined;
    }

    const currentUser = auth.currentUser;

    if (!currentUser || currentUser.uid !== userId) {
      return undefined;
    }

    const ref = doc(db, 'users', userId, 'checkins', dateKey);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setCheckInForDate(dateKey, { ...(snapshot.data() as DailyCheckIn) });
        } else {
          setCheckInForDate(dateKey, null);
        }
      },
      (error: FirestoreError) => {
        if (error.code === 'permission-denied') {
          setCheckInForDate(dateKey, null);
        }
      }
    );

    return unsubscribe;
  }, [isTestEnv, isDemoMode, userId, dateKey, setCheckInForDate]);
}
