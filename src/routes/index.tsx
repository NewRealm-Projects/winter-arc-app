import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Layout from '../components/Layout';
import { CardSkeleton } from '../components/ui/Skeleton';

// Eager load critical pages
import LoginPage from '../pages/LoginPage';
import OnboardingPage from '../pages/OnboardingPage';
import DashboardPage from '../pages/DashboardPage';

// Lazy load non-critical pages
const LeaderboardPage = lazy(() => import('../pages/LeaderboardPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const HistoryPage = lazy(() => import('../pages/HistoryPage'));
const PushupTrainingPage = lazy(() => import('../pages/PushupTrainingPage'));
const NotesPage = lazy(() => import('../pages/NotesPage'));

function AppRoutes() {
  const user = useStore((state) => state.user);
  const isOnboarded = useStore((state) => state.isOnboarded);

  // Not logged in
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Logged in but not onboarded
  if (!isOnboarded) {
    // Check if user has basic data but missing birthday
    const birthdayOnly = user.nickname && user.height && !user.birthday;

    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage birthdayOnly={!!birthdayOnly} />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Logged in and onboarded
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="p-6 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tracking/history" element={<HistoryPage />} />
          <Route path="/tracking/pushup-training" element={<PushupTrainingPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default AppRoutes;
