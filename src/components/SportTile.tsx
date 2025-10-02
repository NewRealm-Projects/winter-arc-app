import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

function SportTile() {
  const { t } = useTranslation();
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTracking = tracking[today];
  const currentSports = todayTracking?.sports || { hiit: false, cardio: false, gym: false, schwimmen: false, soccer: false, rest: false } as Record<string, boolean>;

  const toggleSport = (sport: 'hiit' | 'cardio' | 'gym' | 'schwimmen' | 'soccer' | 'rest') => {
    updateDayTracking(today, {
      sports: {
        ...currentSports,
        [sport]: !currentSports[sport],
      },
    });
  };

  const sportOptions = [
    { key: 'hiit' as const, label: t('tracking.hiit'), icon: '🔥' },
    { key: 'cardio' as const, label: t('tracking.cardio'), icon: '🏃' },
    { key: 'gym' as const, label: t('tracking.gym'), icon: '🏋️' },
    { key: 'schwimmen' as const, label: t('tracking.swimming'), icon: '🏊' },
    { key: 'soccer' as const, label: t('tracking.soccer'), icon: '⚽' },
    { key: 'rest' as const, label: t('tracking.rest'), icon: '😴' },
  ];

  const completedCount = Object.values(currentSports).filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl mb-2">🏃</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('tracking.sport')}
          </h3>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-winter-600 dark:text-winter-400">
            {completedCount}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('tracking.sessions')}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {sportOptions.map((sport) => {
          const isChecked = currentSports[sport.key] || false;

          return (
            <button
              key={sport.key}
              onClick={() => toggleSport(sport.key)}
              className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                isChecked
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-2xl">{sport.icon}</div>
              <div className="flex-1 text-left">
                <span
                  className={`font-medium ${
                    isChecked
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {sport.label}
                </span>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isChecked
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {isChecked && <span className="text-white text-sm">✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SportTile;
