import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { calculateProteinGoal } from '../utils/calculations';
import { useTranslation } from '../hooks/useTranslation';

function ProteinTile() {
  const { t } = useTranslation();
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const isToday = activeDate === todayKey;
  const activeTracking = tracking[activeDate];
  const currentProtein = activeTracking?.protein || 0;

  const displayDayLabel = isToday
    ? t('tracking.today')
    : format(new Date(activeDate), 'dd.MM.');

  const proteinGoal = user?.weight ? calculateProteinGoal(user.weight) : 150;

  const addProtein = () => {
    const amount = parseInt(inputValue);
    if (!isNaN(amount) && amount > 0) {
      updateDayTracking(activeDate, {
        protein: currentProtein + amount,
      });
      setInputValue('');
      setShowInput(false);
    }
  };

  const progress = Math.min((currentProtein / proteinGoal) * 100, 100);

  return (
    <div className="glass-dark touchable p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-3xl">🥩</div>
            <div>
              <div className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">PR</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('tracking.protein')}
              </h3>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{displayDayLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {currentProtein}g
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('tracking.goal')}: {proteinGoal}g
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-center text-gray-500 dark:text-gray-400">
          {Math.round(progress)}%
        </div>
      </div>

      {showInput ? (
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder='Gramm'
            className="flex-1 px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-orange-500 outline-none"
            autoFocus
          />
          <button
            onClick={addProtein}
            className="touch-target px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 active:scale-95 transition-all font-medium"
          >
            +
          </button>
          <button
            onClick={() => {
              setShowInput(false);
              setInputValue('');
            }}
            className="touch-target px-3 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all"
          >
            x
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="touch-target w-full px-4 py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 active:scale-95 transition-all font-medium"
        >
          {t('tracking.addProtein')}
        </button>
      )}
    </div>
  );
}

export default ProteinTile;
