'use client';

import { Suspense } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { redirect } from 'next/navigation';
import Layout from '../components/Layout';
import { CardSkeleton } from '../components/ui/Skeleton';

function SettingsContent() {
  const storeUser = useStore((state) => state.user);
  const { status, user: contextUser } = useAuth();

  const user = storeUser ?? contextUser;

  if (status === 'unauthenticated' || !user) {
    redirect('/auth/signin');
  }

  return (
    <Layout>
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Nickname
              </label>
              <p className="text-white">{user.nickname || 'Not set'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Height
              </label>
              <p className="text-white">{user.height ? `${user.height} cm` : 'Not set'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Weight Goal
              </label>
              <p className="text-white">{user.weight ? `${user.weight} kg` : 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
