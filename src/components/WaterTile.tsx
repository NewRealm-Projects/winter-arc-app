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
  const activeTracking = tracking[activeDate];
  const currentWater = activeTracking?.water || 0;

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
    <div className="rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)] transition-all duration-200 p-3 text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-xl">💧</div>
          <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t('tracking.water')}
          </h3>
        </div>
        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
          {liters}L
        </div>
      </div>

      <div className="mb-2 text-center">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {Math.round(progress)}% / {goalLiters}L
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[
          { amount: 250, label: '250ml' },
          { amount: 500, label: '500ml' },
          { amount: 1000, label: '1L' },
        ].map((item) => (
          <button
            key={item.amount}
            type="button"
            onClick={() => addWater(item.amount)}
            className="px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-xs"
          >
            +{item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default WaterTile;
