'use client';

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store/useStore';
import { CardSkeleton } from '../components/ui/Skeleton';

function InputContent() {
  const user = useStore((state) => state.user);
  const isOnboarded = useStore((state) => state.isOnboarded);

  if (!user) {
    redirect('/auth/signin');
  }

  if (!isOnboarded) {
    redirect('/onboarding');
  }

  return (
    <Layout>
      <div className="space-y-6 p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h1 className="text-2xl font-bold text-white mb-2">Input</h1>
          <p className="text-white/80">
            Manual entry tools are coming soon. Stay tuned for streamlined tracking.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default function InputPage() {
  useAuth();

  return (
    <Suspense fallback={<CardSkeleton />}>
      <InputContent />
    </Suspense>
  );
}
