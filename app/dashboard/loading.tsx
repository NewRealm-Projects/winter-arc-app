import { CardSkeleton } from '../components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary">
      <div className="p-4 space-y-6">
        {/* Header skeleton */}
        <div className="h-12 bg-card/50 rounded-lg animate-pulse" />

        {/* Main Tracking Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Training Load Graph skeleton */}
        <div className="glass rounded-2xl p-6 shadow-lg">
          <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
          <div className="h-48 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
