import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { getTileClasses, designTokens } from '../theme/tokens';
import { useCombinedDailyTracking } from '../hooks/useCombinedTracking';
import { formatMl, getPercent, resolveWaterGoal } from '../utils/progress';

const WATER_DEBOUNCE_MS = 180;

const sanitizeMlValue = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return Math.round(numeric);
};

const parseWaterInput = (value: string): number | null => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(',', '.');
  const numeric = Number.parseFloat(normalized.replace(/[^0-9.]/g, ''));

  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  if (normalized.includes('l') || (normalized.includes('.') && numeric <= 25)) {
    return Math.round(numeric * 1000);
  }

  return Math.round(numeric);
};

function WaterTile() {
  const { t, language } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [exactValue, setExactValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAmountRef = useRef(0);

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const activeTracking = tracking[activeDate];
  const combinedTracking = useCombinedDailyTracking(activeDate);
  const manualWater = sanitizeMlValue(activeTracking?.water);
  const totalWater = sanitizeMlValue(combinedTracking?.water ?? manualWater);

  const waterGoal = Math.max(resolveWaterGoal(user), 0);
  const percent = getPercent(totalWater, waterGoal);
  const localeCode = language === 'de' ? 'de-DE' : 'en-US';
  const liters = `${formatMl(totalWater, { locale: localeCode, maximumFractionDigits: 2 })}L`;
  const goalLiters = `${formatMl(waterGoal, { locale: localeCode, maximumFractionDigits: 2 })}L`;
  const isTracked = totalWater >= 1000; // mindestens 1L

  const flushPendingWater = useCallback(() => {
    if (pendingAmountRef.current === 0) {
      return;
    }
    const pending = pendingAmountRef.current;
    pendingAmountRef.current = 0;

    const state = useStore.getState();
    const latestManual = sanitizeMlValue(state.tracking[activeDate]?.water);
    const nextValue = Math.max(latestManual + pending, 0);
    updateDayTracking(activeDate, { water: nextValue });
  }, [activeDate, updateDayTracking]);

  const scheduleWaterUpdate = useCallback(
    (amount: number) => {
      if (!Number.isFinite(amount) || amount === 0) {
        return;
      }

      pendingAmountRef.current += Math.round(amount);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        flushPendingWater();
      }, WATER_DEBOUNCE_MS);
    },
    [flushPendingWater]
  );

  const addWater = (amount: number) => {
    scheduleWaterUpdate(amount);
  };

  const setExactWater = () => {
    const amount = parseWaterInput(exactValue);
    if (amount === null) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    pendingAmountRef.current = 0;

    updateDayTracking(activeDate, {
      water: amount,
    });
    setExactValue('');
    setShowModal(false);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    flushPendingWater();
  }, [activeDate, flushPendingWater]);

  return (
    <>
      <div className={`${getTileClasses(isTracked)} ${designTokens.padding.compact} text-white`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-xl">💧</div>
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('tracking.water')}
            </h3>
          </div>
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {liters}
          </div>
        </div>

        <div className="mb-4 text-center">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {percent}% / {goalLiters}
          </div>
        </div>

        <div className="space-y-1.5">
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
          <button
            type="button"
            onClick={() => {
              setExactValue(manualWater ? manualWater.toString() : '');
              setShowModal(true);
            }}
            className="px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-xs"
          >
            ✏️ {t('tracking.edit')}
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              💧 {t('tracking.water')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('tracking.setExactAmount')}
            </p>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={exactValue}
              onChange={(e) => setExactValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setExactWater()}
              placeholder="ml / L"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={setExactWater}
                disabled={!exactValue}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('tracking.save')}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setExactValue('');
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

export default WaterTile;
