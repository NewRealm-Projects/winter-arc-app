import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from './ui/Skeleton';

/**
 * Lazy-loaded component wrapper with loading fallback
 */
export function withLazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <Skeleton className="h-32 w-full" />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Lazy load heavy chart components
export const LazyTrainingLoadGraph = withLazyLoad(
  () => import('./TrainingLoadGraph'),
  <div className="h-[100px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
);

export const LazyWeightTile = withLazyLoad(
  () => import('./WeightTile'),
  <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
);

// Lazy load modal components
export const LazyCheckInModal = withLazyLoad(
  () => import('./checkin/CheckInModal')
);

// Lazy load pages
export const LazyPushupTrainingPage = withLazyLoad(
  () => import('../pages/PushupTrainingPage')
);

export const LazyLeaderboardPage = withLazyLoad(
  () => import('../pages/LeaderboardPage')
);

export const LazyNotesPage = withLazyLoad(
  () => import('../pages/NotesPage')
);

export const LazyHistoryPage = withLazyLoad(
  () => import('../pages/HistoryPage')
);

export const LazySettingsPage = withLazyLoad(
  () => import('../pages/SettingsPage')
);

export const LazyOnboardingPage = withLazyLoad(
  () => import('../pages/OnboardingPage')
);