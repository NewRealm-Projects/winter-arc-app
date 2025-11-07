'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import type { DailyTracking } from '@/types';

export type TrackingListenerError = 'no-permission' | 'unavailable' | 'unknown';

let lastRemoteTracking: Record<string, DailyTracking> = {};

export function getLastRemoteTracking(): Record<string, DailyTracking> {
  return lastRemoteTracking;
}

interface UseTrackingEntriesResult {
  readonly data: Record<string, DailyTracking>;
  readonly loading: boolean;
  readonly error: TrackingListenerError | null;
  readonly retry: () => void;
}

export function useTrackingEntries(): UseTrackingEntriesResult {
  const authLoading = useStore((state) => state.authLoading);
  const userId = useStore((state) => state.user?.id);
  const tracking = useStore((state) => state.tracking);
  const setTracking = useStore((state) => state.setTracking);

  const [error, setError] = useState<TrackingListenerError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => {
    if (!authLoading && userId) {
      setRetryKey((key) => key + 1);
      setError(null);
    }
  }, [authLoading, userId]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!userId) {
      setLoading(false);
      setError(null);
      setTracking({});
      lastRemoteTracking = {};
      return;
    }

    let isActive = true;
    setLoading(true);
    setError(null);

    const fetchTrackingData = async () => {
      try {
        // Get data for the last 90 days
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const response = await fetch(`/api/tracking?startDate=${startDate}&endDate=${endDate}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('no-permission');
          } else if (response.status === 503) {
            setError('unavailable');
          } else {
            setError('unknown');
          }
          setLoading(false);
          return;
        }

        const entries = await response.json();
        
        if (!isActive) return;

        const trackingMap: Record<string, DailyTracking> = {};
        entries.forEach((entry: any) => {
          trackingMap[entry.date] = {
            pushups: entry.pushups || 0,
            sports: entry.sports || 0,
            water: entry.water || 0,
            protein: entry.protein || 0,
            weight: entry.weight || null,
            completed: entry.completed || false,
          };
        });

        lastRemoteTracking = trackingMap;
        setTracking(trackingMap);
        setLoading(false);
        setError(null);
      } catch (err) {
        if (!isActive) return;
        console.error('Error fetching tracking data:', err);
        setError('unknown');
        setLoading(false);
      }
    };

    fetchTrackingData();

    // Poll for updates every 30 seconds
    const intervalId = setInterval(fetchTrackingData, 30000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [authLoading, retryKey, setTracking, userId]);

  return useMemo(
    () => ({
      data: tracking,
      loading,
      error,
      retry,
    }),
    [tracking, loading, error, retry]
  );
}


