import { useStore } from '../store/useStore';
import WeekOverview from '../components/WeekOverview';
import LeaderboardPreview from '../components/LeaderboardPreview';

function DashboardPage() {
  const user = useStore((state) => state.user);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset-top">
      {/* Header */}
      <div className="bg-gradient-to-r from-winter-600 to-winter-700 dark:from-winter-700 dark:to-winter-800 text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">
              Hey, {user?.nickname || 'User'}! 👋
            </h1>
            <div className="text-2xl">❄️</div>
          </div>
          <p className="text-winter-100">
            Bereit für dein Winter Arc Training?
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 pb-20 space-y-6">
        {/* Week Overview */}
        <WeekOverview />

        {/* Leaderboard Preview */}
        <LeaderboardPreview />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              0
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Tage Streak
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-3xl mb-2">💪</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              0
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Liegestütze heute
            </div>
          </div>
        </div>

        {/* Motivation Quote */}
        <div className="bg-gradient-to-r from-winter-500 to-winter-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="text-4xl mb-3">💡</div>
          <p className="text-lg font-semibold mb-2">
            "Der Winter formt Champions!"
          </p>
          <p className="text-winter-100 text-sm">
            Bleib fokussiert und tracke deine Fortschritte jeden Tag.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
