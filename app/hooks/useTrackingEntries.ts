'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FirestoreError } from 'firebase/firestore';
import { onUserTrackingEntriesSnapshot } from '@/services/firestoreClient';
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

function mapErrorCode(error: FirestoreError): TrackingListenerError {
  if (error.code === 'permission-denied') {
    return 'no-permission';
  }

  if (error.code === 'unavailable') {
    return 'unavailable';
  }

  return 'unknown';
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
      return () => undefined;
    }

    if (!userId) {
      setLoading(false);
      setError(null);
      setTracking({});
      lastRemoteTracking = {};
      return () => undefined;
    }

    let isActive = true;
    setLoading(true);
    setError(null);

    const unsubscribe = onUserTrackingEntriesSnapshot<DailyTracking>(
      userId,
      (entries) => {
        if (!isActive) {
          return;
        }
        const next: Record<string, DailyTracking> = entries.reduce<Record<string, DailyTracking>>(
          (acc, entry) => {
            const { id, ...rest } = entry;
            acc[id] = rest as DailyTracking;
            return acc;
          },
          {}
        );
        lastRemoteTracking = next;
        setTracking(next);
        setLoading(false);
      },
      (fsError) => {
        if (!isActive) {
          return;
        }
        if (fsError.code === 'permission-denied') {
          setTracking({});
          lastRemoteTracking = {};
        }
        setError(mapErrorCode(fsError));
        setLoading(false);
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
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


