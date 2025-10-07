import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { combineTrackingWithSmart } from '../utils/tracking';

export function useCombinedTracking() {
  const tracking = useStore((state) => state.tracking);
  const smartContributions = useStore((state) => state.smartContributions);

  return useMemo(
    () => combineTrackingWithSmart(tracking, smartContributions),
    [tracking, smartContributions]
  );
}

export function useCombinedDailyTracking(dateKey?: string) {
  const combined = useCombinedTracking();
  if (!dateKey) {
    return undefined;
  }
  return Object.prototype.hasOwnProperty.call(combined, dateKey) ? combined[dateKey] : undefined;
}
