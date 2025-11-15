'use client';

import { Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';
import { redirect } from 'next/navigation';
import Layout from '../components/Layout';
import { CardSkeleton } from '../components/ui/Skeleton';

function LeaderboardContent() {
  const { status, user } = useAuth();

  if (status === 'unauthenticated' || !user) {
    redirect('/auth/signin');
  }

  return (
    <Layout>
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Performers</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white font-medium">🥇 Top Performer</span>
              <span className="text-white/80">Coming soon...</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white font-medium">🥈 Runner Up</span>
              <span className="text-white/80">Coming soon...</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white font-medium">🥉 Third Place</span>
              <span className="text-white/80">Coming soon...</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <LeaderboardContent />
    </Suspense>
  );
}
