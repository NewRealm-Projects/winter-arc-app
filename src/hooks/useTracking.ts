import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { saveDailyTracking } from '../services/firestoreService';
import { getLastRemoteTracking } from './useTrackingEntries';

/**
 * Hook that auto-saves tracking data to Firebase when it changes
 */
export function useTracking() {
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);

  useEffect(() => {
    if (!user) return;

    if (tracking === getLastRemoteTracking()) {
      return;
    }

    // Debounce saving to Firebase (wait 1 second after last change)
    const timeoutId = setTimeout(() => {
      Object.entries(tracking).forEach(([date, data]) => {
        void saveDailyTracking(user.id, date, data);
      });
    }, 1000);

    return () => { clearTimeout(timeoutId); };
  }, [tracking, user]);
}
