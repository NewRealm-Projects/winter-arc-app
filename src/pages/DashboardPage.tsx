import { useStore } from '../store/useStore';
import WeekOverview from '../components/WeekOverview';
import PushupTile from '../components/PushupTile';
import SportTile from '../components/SportTile';
import WaterTile from '../components/WaterTile';
import ProteinTile from '../components/ProteinTile';
import WeightTile from '../components/WeightTile';
import { useState, useEffect } from 'react';
import { generateDailyMotivation } from '../services/aiService';
import { getWeatherForAachen } from '../services/weatherService';
import { format } from 'date-fns';
import { calculateStreak, calculateWaterGoal } from '../utils/calculations';
import { useTranslation } from '../hooks/useTranslation';
import { useTracking } from '../hooks/useTracking';
import { Link } from 'react-router-dom';

function DashboardPage() {
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const selectedDate = useStore((state) => state.selectedDate);
  const { t } = useTranslation();
  // Auto-save tracking data to Firebase
  useTracking();
  const [motivation, setMotivation] = useState({
    quote: 'Der Winter formt Champions!',
    subtext: 'Bleib fokussiert und tracke deine Fortschritte jeden Tag.',
  });
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [weather, setWeather] = useState<{ temperature: number; emoji: string; description: string } | null>(null);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const isToday = activeDate === todayKey;
  const activeTracking = tracking[activeDate];
  const activePushups = activeTracking?.pushups;
  const activeWorkoutTotal =
    activePushups?.workout?.reps?.reduce((sum, reps) => sum + reps, 0) ?? 0;



  useEffect(() => {
    const loadMotivation = async () => {
      if (!user) return;

      setLoadingQuote(true);
      try {
        // Load weather
        const weatherData = await getWeatherForAachen();
        if (weatherData) {
          setWeather({
            temperature: weatherData.temperature,
            emoji: weatherData.weatherEmoji,
            description: weatherData.weatherDescription,
          });
        }

        // Generate motivation with weather context
        const weatherContext = weatherData
          ? `Weather: ${weatherData.temperature}°C, ${weatherData.weatherDescription}`
          : '';
        const result = await generateDailyMotivation(tracking, user.nickname, user.birthday, weatherContext);
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
      <div className="relative text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.nickname}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full border-2 border-white/30 shadow-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <h1 className="text-3xl font-bold">
                {t('dashboard.greeting', { nickname: user?.nickname || 'User' })}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {weather && (
                <div className="glass-dark px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2">
                  <span>{weather.emoji}</span>
                  <span>{weather.temperature}°C</span>
                </div>
              )}
              <Link
                to="/tracking/history"
                className="glass-dark px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                📋 {t('tracking.history')}
              </Link>
              <Link
                to="/settings"
                className="glass-dark px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                ⚙️ {t('nav.settings')}
              </Link>
            </div>
          </div>

          {/* AI Motivation Quote */}
          <div className="glass-dark touchable animate-fade-in-up p-4">
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
      <div className="max-w-7xl mx-auto px-4 pb-20 space-y-6">
        {/* Week Overview */}
        <div className="animate-fade-in-up delay-100">
          <WeekOverview />
        </div>

        {/* Tracking Tiles */}
        <div className="space-y-4 animate-fade-in-up delay-300">
          {/* Pushups & Sport Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PushupTile />
            <SportTile />
          </div>

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
