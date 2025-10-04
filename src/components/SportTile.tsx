import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

type SportKey = 'hiit' | 'cardio' | 'gym' | 'schwimmen' | 'soccer' | 'rest';

const defaultSportsState: Record<SportKey, boolean> = {
  hiit: false,
  cardio: false,
  gym: false,
  schwimmen: false,
  soccer: false,
  rest: false,
};

function SportTile() {
  const { t } = useTranslation();
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const activeTracking = tracking[activeDate];
  const currentSports: Record<SportKey, boolean> = activeTracking?.sports
    ? { ...defaultSportsState, ...activeTracking.sports }
    : { ...defaultSportsState };

  const toggleSport = (sport: SportKey) => {
    updateDayTracking(activeDate, {
      sports: {
        ...currentSports,
        [sport]: !currentSports[sport],
      },
    });
  };

  const sportOptions = [
    { key: 'hiit' as SportKey, label: t('tracking.hiit'), icon: '🔥' },
    { key: 'cardio' as SportKey, label: t('tracking.cardio'), icon: '🏃' },
    { key: 'gym' as SportKey, label: t('tracking.gym'), icon: '🏋️' },
    { key: 'schwimmen' as SportKey, label: t('tracking.swimming'), icon: '🏊' },
    { key: 'soccer' as SportKey, label: t('tracking.soccer'), icon: '⚽' },
    { key: 'rest' as SportKey, label: t('tracking.rest'), icon: '😴' },
  ];

  const completedCount = Object.values(currentSports).filter(Boolean).length;

  return (
    <div className="glass-dark touchable p-3 text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-xl">🏃</div>
          <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t('tracking.sport')}
          </h3>
        </div>
        <div className="text-sm font-bold text-winter-600 dark:text-winter-400">
          {completedCount}
        </div>
      </div>

      {/* Sport Options Grid - Compact 3x2, smaller icons with labels */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {sportOptions.map((sport) => {
          const isChecked = currentSports[sport.key] || false;

          return (
            <button
              key={sport.key}
              type="button"
              onClick={() => toggleSport(sport.key)}
              className={`p-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${
                isChecked
                  ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400'
                  : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              title={sport.label}
            >
              <div className="text-xl">
                {sport.icon}
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                {sport.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SportTile;
