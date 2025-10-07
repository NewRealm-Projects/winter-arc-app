import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { calculateWaterGoal } from '../utils/calculations';
import { useTranslation } from '../hooks/useTranslation';
import { getTileClasses, designTokens } from '../theme/tokens';
import { useCombinedDailyTracking } from '../hooks/useCombinedTracking';

function WaterTile() {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const activeTracking = tracking[activeDate];
  const combinedTracking = useCombinedDailyTracking(activeDate);
  const manualWater = activeTracking?.water || 0;
  const totalWater = combinedTracking?.water ?? manualWater;
  const smartWater = Math.max(0, totalWater - manualWater);

  const [showAdjustInput, setShowAdjustInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const waterGoal = user?.weight ? calculateWaterGoal(user.weight) : 3000;

  const addWater = (amount: number) => {
    updateDayTracking(activeDate, {
      water: manualWater + amount,
    });
  };

  const progressPercent = waterGoal ? (totalWater / waterGoal) * 100 : 0;
  const progress = Math.min(progressPercent, 100);
  const displayedPercent = Number.isFinite(progressPercent) ? Math.round(progressPercent) : 0;
  const liters = (totalWater / 1000).toFixed(2);
  const goalLiters = (waterGoal / 1000).toFixed(2);
  const isTracked = totalWater >= 1000; // mindestens 1L

  const openAdjust = () => {
    setInputValue(totalWater ? String(Math.round(totalWater)) : '');
    setShowAdjustInput(true);
  };

  const saveAdjust = () => {
    const parsed = Math.round(Number.parseFloat(inputValue));
    if (Number.isNaN(parsed) || parsed < 0) {
      return;
    }

    const nextManual = Math.max(0, parsed - smartWater);
    updateDayTracking(activeDate, {
      water: nextManual,
    });
    setShowAdjustInput(false);
    setInputValue('');
  };

  const cancelAdjust = () => {
    setShowAdjustInput(false);
    setInputValue('');
  };

  return (
    <div className={`${getTileClasses(isTracked)} ${designTokens.padding.compact} text-white`}>
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
          {displayedPercent}% / {goalLiters}L
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[250, 500, 1000].map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => addWater(amount)}
            className="px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-xs"
          >
            +{amount}
          </button>
        ))}
      </div>

      {showAdjustInput ? (
        <div className="mt-3 flex gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={(event) => { setInputValue(event.target.value); }}
            onKeyDown={(event) => { if (event.key === 'Enter') saveAdjust(); }}
            placeholder="ml"
            className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={saveAdjust}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs"
          >
            {t('tracking.save')}
          </button>
          <button
            type="button"
            onClick={cancelAdjust}
            className="px-2 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-xs"
          >
            {t('tracking.cancel')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openAdjust}
          className="mt-3 w-full px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-xs"
        >
          {t('tracking.adjustAmount')}
        </button>
      )}
    </div>
  );
}

export default WaterTile;
