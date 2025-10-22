import { withLazyLoad } from '../utils/lazyLoad';

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

export const LazyInputPage = withLazyLoad(
  () => import('../pages/InputPage')
);

export const LazyNotesPage = LazyInputPage; // Backward compatibility

export const LazyHistoryPage = withLazyLoad(
  () => import('../pages/HistoryPage')
);

export const LazySettingsPage = withLazyLoad(
  () => import('../pages/SettingsPage')
);

export const LazyOnboardingPage = withLazyLoad(
  () => import('../pages/OnboardingPage')
);