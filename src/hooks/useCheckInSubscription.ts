import { doc, onSnapshot, type FirestoreError } from 'firebase/firestore';
import { useEffect } from 'react';
import { auth, db } from '../firebase';
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
    const pathString = `users/${userId}/checkins/${dateKey}`;

    if (import.meta.env.DEV) {
      console.warn('[Auth]', auth.currentUser?.uid ?? null);
      console.warn('[Subscribe]', pathString);
      console.warn('[FS]', { userId, path: pathString });
    }

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
        console.warn('[FirestoreError]', { code: error.code, message: error.message, path: pathString });
        if (error.code === 'permission-denied') {
          setCheckInForDate(dateKey, null);
        }
      }
    );

    return unsubscribe;
  }, [isTestEnv, isDemoMode, userId, dateKey, setCheckInForDate]);
}
