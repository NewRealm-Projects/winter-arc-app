import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { getTileClasses, designTokens } from '../theme/tokens';
import { useCombinedDailyTracking } from '../hooks/useCombinedTracking';
import { formatGrams, getPercent, resolveProteinGoal } from '../utils/progress';

const sanitizeGramValue = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return Math.round(numeric);
};

const parseProteinInput = (value: string): number | null => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(',', '.');
  const numeric = Number.parseFloat(normalized.replace(/[^0-9.]/g, ''));

  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  if (normalized.includes('kg')) {
    return Math.round(numeric * 1000);
  }

  return Math.round(numeric);
};

function ProteinTile() {
  const { t, language } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const activeTracking = tracking[activeDate];
  const combinedTracking = useCombinedDailyTracking(activeDate);
  const manualProtein = sanitizeGramValue(activeTracking?.protein);
  const totalProtein = sanitizeGramValue(combinedTracking?.protein ?? manualProtein);

  const proteinGoal = Math.max(resolveProteinGoal(user), 0);
  const hasGoal = proteinGoal > 0;
  const percent = hasGoal ? getPercent(totalProtein, proteinGoal) : 0;
  const localeCode = language === 'de' ? 'de-DE' : 'en-US';
  const formattedTotal = `${formatGrams(totalProtein, { locale: localeCode })}g`;
  const formattedGoal = hasGoal
    ? `${formatGrams(proteinGoal, { locale: localeCode })}g`
    : '';
  const isTracked = totalProtein > 0;

  const addProtein = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    updateDayTracking(activeDate, {
      protein: sanitizeGramValue(manualProtein + amount),
    });
  };

  const parsedProteinInput = useMemo(() => parseProteinInput(inputValue), [inputValue]);

  const saveProtein = () => {
    if (parsedProteinInput === null) {
      return;
    }

    updateDayTracking(activeDate, {
      protein: parsedProteinInput,
    });
    setInputValue('');
    setShowModal(false);
  };

  return (
    <>
      <div className={`${getTileClasses(isTracked)} ${designTokens.padding.compact} text-white`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-xl">🥩</div>
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('tracking.protein')}
            </h3>
          </div>
          <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
            {formattedTotal}
          </div>
        </div>

        <div className="mb-4 text-center">
          {hasGoal ? (
            <>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {percent}% / {formattedGoal}
              </div>
            </>
          ) : (
            <div className="mt-2 text-xs text-orange-200 bg-orange-500/10 rounded-lg px-3 py-2">
              {t('tracking.setGoal')}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[10, 20, 30].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => { addProtein(amount); }}
                className="px-2 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors font-medium text-xs"
              >
                +{amount}g
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setInputValue(manualProtein ? manualProtein.toString() : '');
              setShowModal(true);
            }}
            className="w-full py-1 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
          >
            ✏️ {t('tracking.edit')}
          </button>
        </div>
      </div>

      {/* Protein Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              🥩 {t('tracking.protein')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('tracking.setExactAmount')}
            </p>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveProtein();
              }}
              placeholder="g / kg"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={saveProtein}
                disabled={parsedProteinInput === null}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('tracking.save')}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setInputValue('');
                }}
                className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t('tracking.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProteinTile;
