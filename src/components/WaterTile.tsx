import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { calculateWaterGoal } from '../utils/calculations';
import { useTranslation } from '../hooks/useTranslation';

function WaterTile() {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const isToday = activeDate === todayKey;
  const activeTracking = tracking[activeDate];
  const currentWater = activeTracking?.water || 0;

  const displayDayLabel = isToday
    ? t('tracking.today')
    : format(new Date(activeDate), 'dd.MM.');

  const waterGoal = user?.weight ? calculateWaterGoal(user.weight) : 3000;

  const addWater = (amount: number) => {
    updateDayTracking(activeDate, {
      water: currentWater + amount,
    });
  };

  const progress = Math.min((currentWater / waterGoal) * 100, 100);
  const liters = (currentWater / 1000).toFixed(2);
  const goalLiters = (waterGoal / 1000).toFixed(2);

  return (
    <div className="glass-dark touchable p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-3xl">💧</div>
            <div>
              <div className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">WA</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('tracking.water')}
              </h3>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{displayDayLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {liters}L
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('tracking.goal')}: {goalLiters}L
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-center text-gray-500 dark:text-gray-400">
          {Math.round(progress)}%
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[250, 500, 1000].map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => addWater(amount)}
            className="touch-target px-3 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 active:scale-95 transition-all font-medium text-sm"
          >
            +{amount}ml
          </button>
        ))}
      </div>
    </div>
  );
}

export default WaterTile;
