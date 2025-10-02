import { format } from 'date-fns';
import { useStore } from '../store/useStore';

const WATER_GOAL = 3000; // 3L in ml

function WaterTile() {
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTracking = tracking[today];
  const currentWater = todayTracking?.water || 0;

  const addWater = (amount: number) => {
    updateDayTracking(today, {
      water: currentWater + amount,
    });
  };

  const progress = Math.min((currentWater / WATER_GOAL) * 100, 100);
  const liters = (currentWater / 1000).toFixed(1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl mb-2">💧</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Wasser
          </h3>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {liters}L
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            von 3L
          </div>
        </div>
      </div>

      {/* Progress Bar */}
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

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => addWater(250)}
          className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm"
        >
          +250ml
        </button>
        <button
          onClick={() => addWater(500)}
          className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm"
        >
          +500ml
        </button>
        <button
          onClick={() => addWater(1000)}
          className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm"
        >
          +1L
        </button>
      </div>
    </div>
  );
}

export default WaterTile;
