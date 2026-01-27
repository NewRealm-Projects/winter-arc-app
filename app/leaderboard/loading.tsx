import { ListItemSkeleton } from '../components/ui/Skeleton';

export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary">
      <div className="p-4 space-y-4">
        {/* Header skeleton */}
        <div className="h-12 bg-card/50 rounded-lg animate-pulse" />

        {/* Leaderboard list skeleton */}
        <div className="glass rounded-2xl shadow-lg overflow-hidden">
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </div>
    </div>
  );
}
