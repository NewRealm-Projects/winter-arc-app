import { Skeleton } from '../components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary">
      <div className="p-4 space-y-6">
        {/* Header skeleton */}
        <div className="h-12 bg-card/50 rounded-lg animate-pulse" />

        {/* Settings sections skeleton */}
        <div className="glass rounded-2xl p-6 shadow-lg space-y-4">
          <Skeleton width="120px" height="24px" variant="text" />
          <Skeleton height="48px" />
          <Skeleton height="48px" />
          <Skeleton height="48px" />
        </div>

        <div className="glass rounded-2xl p-6 shadow-lg space-y-4">
          <Skeleton width="150px" height="24px" variant="text" />
          <Skeleton height="48px" />
          <Skeleton height="48px" />
        </div>
      </div>
    </div>
  );
}
