import { useStore } from '../store/useStore';
import WeekOverview from '../components/WeekOverview';
import LeaderboardPreview from '../components/LeaderboardPreview';
import { useState, useEffect } from 'react';
import { generateDailyMotivation } from '../services/aiService';

function DashboardPage() {
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const [motivation, setMotivation] = useState({
    quote: 'Der Winter formt Champions!',
    subtext: 'Bleib fokussiert und tracke deine Fortschritte jeden Tag.',
  });
  const [loadingQuote, setLoadingQuote] = useState(true);

  useEffect(() => {
    const loadMotivation = async () => {
      if (!user) return;

      setLoadingQuote(true);
      try {
        const result = await generateDailyMotivation(tracking, user.nickname, user.birthday);
        setMotivation(result);
      } catch (error) {
        console.error('Error loading motivation:', error);
      } finally {
        setLoadingQuote(false);
      }
    };

    loadMotivation();
  }, [user, tracking]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset-top">
      {/* Header */}
      <div className="bg-gradient-to-r from-winter-600 to-winter-700 dark:from-winter-700 dark:to-winter-800 text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-3xl font-bold">
              Hey, {user?.nickname || 'User'}! 👋
            </h1>
            <div className="text-2xl">❄️</div>
          </div>

          {/* AI Motivation Quote */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-3">
            <div className="flex items-start gap-3">
              <div className="text-3xl">💡</div>
              <div className="flex-1">
                {loadingQuote ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-white/20 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-white/20 rounded w-full"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-semibold mb-1">
                      "{motivation.quote}"
                    </p>
                    <p className="text-winter-100 text-sm">
                      {motivation.subtext}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
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
      </div>
    </div>
  );
}

export default DashboardPage;
