import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { calculateProteinGoal } from '../utils/calculations';
import { useTranslation } from '../hooks/useTranslation';
import { getTileClasses, designTokens } from '../theme/tokens';
import { useCombinedDailyTracking } from '../hooks/useCombinedTracking';

function ProteinTile() {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<'add' | 'set' | null>(null);

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const activeTracking = tracking[activeDate];
  const combinedTracking = useCombinedDailyTracking(activeDate);
  const manualProtein = activeTracking?.protein || 0;
  const totalProtein = combinedTracking?.protein ?? manualProtein;
  const smartProtein = Math.max(0, totalProtein - manualProtein);

  const proteinGoal = user?.weight ? calculateProteinGoal(user.weight) : 150;

  const addProtein = (amount: number) => {
    updateDayTracking(activeDate, {
      protein: manualProtein + amount,
    });
  };

  const setProteinTotal = (amount: number) => {
    const nextManual = Math.max(0, amount - smartProtein);
    updateDayTracking(activeDate, {
      protein: nextManual,
    });
  };

  const confirmInput = () => {
    if (!inputMode) return;

    const parsed = Math.round(Number.parseFloat(inputValue));
    if (Number.isNaN(parsed) || parsed < 0) {
      return;
    }

    if (inputMode === 'add') {
      addProtein(parsed);
    } else {
      setProteinTotal(parsed);
    }

    setInputValue('');
    setInputMode(null);
  };

  const cancelInput = () => {
    setInputValue('');
    setInputMode(null);
  };

  const openAddInput = () => {
    setInputValue('');
    setInputMode('add');
  };

  const openAdjustInput = () => {
    setInputValue(totalProtein ? String(Math.round(totalProtein)) : '');
    setInputMode('set');
  };

  const progressPercent = proteinGoal ? (totalProtein / proteinGoal) * 100 : 0;
  const progress = Math.min(progressPercent, 100);
  const displayedPercent = Number.isFinite(progressPercent) ? Math.round(progressPercent) : 0;
  const isTracked = totalProtein > 0;

  return (
    <div className={`${getTileClasses(isTracked)} ${designTokens.padding.compact} text-white`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-xl">🥩</div>
          <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t('tracking.protein')}
          </h3>
        </div>
        <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
          {totalProtein}g
        </div>
      </div>

      <div className="mb-2 text-center">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {displayedPercent}% / {proteinGoal}g
        </div>
      </div>

      <div className="text-center">
        {inputMode ? (
          <div className="flex gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && confirmInput()}
              placeholder="g"
              className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={confirmInput}
              className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-xs"
            >
              {inputMode === 'add' ? t('tracking.add') : t('tracking.save')}
            </button>
            <button
              type="button"
              onClick={cancelInput}
              className="px-2 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-xs"
            >
              {t('tracking.cancel')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={openAddInput}
              className="w-full px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors font-medium text-xs"
            >
              {t('tracking.addProtein')}
            </button>
            <button
              type="button"
              onClick={openAdjustInput}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-xs"
            >
              {t('tracking.adjustAmount')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProteinTile;
