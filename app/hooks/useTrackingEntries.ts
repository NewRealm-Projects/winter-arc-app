'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const fetchingRef = useRef(false);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
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
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      const abortController = new AbortController();
      activeAbortControllerRef.current = abortController;
      let attempt = 0;
      const maxAttempts = 5;
      const baseDelay = 800;
      const exec = async () => {
        attempt++;
        try {
          const endStr = new Date().toLocaleDateString('en-CA');
          const startStr = new Date(Date.now() - 90 * 86400000).toLocaleDateString('en-CA');
          const resp = await fetch(`/api/tracking?startDate=${startStr}&endDate=${endStr}`, { signal: abortController.signal });
          if (!resp.ok) {
            if (resp.status === 401) setError('no-permission');
            else if (resp.status === 503) setError('unavailable');
            else setError('unknown');
            throw new Error('Bad status ' + resp.status);
          }
          const entries = await resp.json();
          if (!isActive) return;
          const map: Record<string, DailyTracking> = {};
          entries.forEach((entry: any) => {
            map[entry.date] = {
              pushups: entry.pushups || 0,
              sports: entry.sports || 0,
              water: entry.water || 0,
              protein: entry.protein || 0,
              weight: entry.weight || null,
              completed: entry.completed || false,
            };
          });
          lastRemoteTracking = map;
          setTracking(map);
          setLoading(false);
          setError(null);
        } catch (e) {
          if (!isActive) return;
          if (abortController.signal.aborted) {
            setLoading(false);
            return;
          }
            if (attempt < maxAttempts) {
              const backoff = baseDelay * Math.pow(2, attempt - 1);
              await new Promise(r => setTimeout(r, backoff));
              return exec();
            }
            console.error('Tracking fetch failed permanently:', e);
            setError('unknown');
            setLoading(false);
        } finally {
          fetchingRef.current = false;
        }
      };
      await exec();
    };

    fetchTrackingData();

    // Poll for updates every 30 seconds
  const intervalId = setInterval(() => { void fetchTrackingData(); }, 30000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [authLoading, retryKey, setTracking, userId]);

  return useMemo(() => ({ data: tracking, loading, error, retry }), [tracking, loading, error, retry]);
}




