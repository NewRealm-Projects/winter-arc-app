import { doc, onSnapshot, type FirestoreError } from 'firebase/firestore';
import { useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { useStore } from '../store/useStore';
import type { DailyTrainingLoad } from '../types';
import { isDemoModeActive } from '../constants/demo';

export function useTrainingLoadSubscription(dateKey?: string): void {
  const isTestEnv = typeof process !== 'undefined' && process.env?.VITEST === 'true';
  const userId = useStore((state) => state.user?.id);
  const setTrainingLoadForDate = useStore((state) => state.setTrainingLoadForDate);
  const isDemoMode = isDemoModeActive();

  useEffect(() => {
    if (isTestEnv || isDemoMode || !userId || !dateKey) {
      return undefined;
    }

    const currentUser = auth.currentUser;

    if (!currentUser || currentUser.uid !== userId) {
      return undefined;
    }

    const ref = doc(db, 'users', userId, 'trainingLoad', dateKey);

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
        if (error.code === 'permission-denied') {
          setTrainingLoadForDate(dateKey, null);
        }
      }
    );

    return unsubscribe;
  }, [isTestEnv, isDemoMode, userId, dateKey, setTrainingLoadForDate]);
}
