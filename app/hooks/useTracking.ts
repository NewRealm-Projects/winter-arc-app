'use client';

import { useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';

/**
 * Hook that auto-saves tracking data to PostgreSQL API when it changes
 */
export function useTracking() {
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);

  const saveTracking = useCallback(async (date: string, data: any) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/tracking/${date}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Failed to save tracking data:', await response.text());
      }
    } catch (error) {
      console.error('Error saving tracking data:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Debounce saving to API (wait 1 second after last change)
    const timeoutId = setTimeout(() => {
      Object.entries(tracking).forEach(([date, data]) => {
        void saveTracking(date, data);
      });
    }, 1000);

    return () => { clearTimeout(timeoutId); };
  }, [tracking, user, saveTracking]);
}


