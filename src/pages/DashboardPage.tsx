import { useStore } from '../store/useStore';
import WeekOverview from '../components/WeekOverview';
import PushupTile from '../components/PushupTile';
import SportTile from '../components/SportTile';
import WaterTile from '../components/WaterTile';
import ProteinTile from '../components/ProteinTile';
import WeightTile from '../components/WeightTile';
import { useState, useEffect } from 'react';
import { generateDailyMotivation } from '../services/aiService';
import { format } from 'date-fns';
import { calculateStreak } from '../utils/calculations';
import { useTranslation } from '../hooks/useTranslation';
import { useTracking } from '../hooks/useTracking';
import { Link } from 'react-router-dom';

function DashboardPage() {
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const { t } = useTranslation();
  // Auto-save tracking data to Firebase
  useTracking();
  const [motivation, setMotivation] = useState({
    quote: 'Der Winter formt Champions!',
    subtext: 'Bleib fokussiert und tracke deine Fortschritte jeden Tag.',
  });
  const [loadingQuote, setLoadingQuote] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTracking = tracking[today];
  const todayPushups = todayTracking?.pushups?.total ||
    (todayTracking?.pushups?.workout?.reps.reduce((sum, reps) => sum + reps, 0)) || 0;

  const streak = calculateStreak(Object.keys(tracking));

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
    <div className="min-h-screen safe-area-inset-top">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-winter-600 to-winter-700 dark:from-winter-700 dark:to-winter-800 text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-3xl font-bold">
              {t('dashboard.greeting', { nickname: user?.nickname || 'User' })}
            </h1>
            <Link
              to="/tracking/history"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              📋 {t('tracking.history')}
            </Link>
          </div>

          {/* AI Motivation Quote */}
          <div className="glass animate-fade-in-up rounded-[20px] p-4 mb-3 border border-white/20">
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
        <div className="animate-fade-in-up delay-100">
          <WeekOverview />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in-up delay-200">
          <div className="glass dark:glass-dark rounded-[20px] p-4 hover:scale-105 transition-transform duration-200">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {streak}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.streak')}
            </div>
          </div>

          <div className="glass dark:glass-dark rounded-[20px] p-4 hover:scale-105 transition-transform duration-200">
            <div className="text-3xl mb-2">💪</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {todayPushups}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.pushupsToday')}
            </div>
          </div>
        </div>

        {/* Tracking Tiles */}
        <div className="space-y-4 animate-fade-in-up delay-300">
          {/* Pushups */}
          <PushupTile />

          {/* Sport */}
          <SportTile />

          {/* Water & Protein Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WaterTile />
            <ProteinTile />
          </div>

          {/* Weight */}
          <WeightTile />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
