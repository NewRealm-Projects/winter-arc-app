'use client';

import { Suspense } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { redirect } from 'next/navigation';
import Layout from '../components/Layout';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ThemeToggle } from '../components/ui/ThemeToggle';

function SettingsContent() {
  const user = useStore((state) => state.user);

  if (!user) {
    redirect('/handler/sign-in');
  }

  return (
    <Layout>
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>

        {/* Appearance */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-white/80">
                Theme
              </label>
              <p className="text-xs text-white/60">Choose your preferred color scheme</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Profile */}
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
  useAuth();

  return (
    <Suspense fallback={<CardSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
