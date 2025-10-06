import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  generateProgressivePlan,
  getLastPushupTotal,
  countPushupDays,
  calculateTotalReps,
} from '../utils/pushupAlgorithm';
import { useTranslation } from '../hooks/useTranslation';
import { getTileClasses, designTokens } from '../theme/tokens';

function PushupTile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const isToday = activeDate === todayKey;
  const activeTracking = tracking[activeDate];
  const currentPushups = activeTracking?.pushups;
  const workoutTotal =
    currentPushups?.workout?.reps?.reduce((sum, reps) => sum + reps, 0) ?? 0;
  const pushupsForDay = (currentPushups?.total ?? workoutTotal) ?? 0;

  const displayDayLabel = isToday
    ? t('tracking.today')
    : format(new Date(activeDate), 'dd.MM.');

  // Check if today's workout is complete (5 sets done)
  const isWorkoutComplete = currentPushups?.workout?.reps?.length === 5;

  // Generiere Plan basierend auf Historie
  const lastTotal = getLastPushupTotal(tracking);
  const daysCompleted = countPushupDays(tracking);
  const initialTotal = lastTotal > 0 ? lastTotal : Math.round((user?.maxPushups || 20) * 2.5);
  const todayPlan = generateProgressivePlan(initialTotal, daysCompleted);
  const plannedTotal = calculateTotalReps(todayPlan);

  const handleSave = () => {
    const amount = parseInt(inputValue);
    if (!isNaN(amount) && amount > 0) {
      updateDayTracking(activeDate, {
        pushups: {
          ...currentPushups,
          total: (currentPushups?.total ?? 0) + amount,
        },
      });
      setInputValue('');
      setShowModal(false);
    }
  };

  const isTracked = pushupsForDay > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`w-full ${getTileClasses(isTracked)} ${designTokens.padding.compact} text-left text-white hover:bg-white/8`}
      >
        {/* Header with Icon and Count */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-xl">💪</div>
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('tracking.pushups')}
            </h3>
          </div>
          <div className="text-sm font-bold text-winter-600 dark:text-winter-400">
            {pushupsForDay}
          </div>
        </div>

        {/* Training plan info */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            navigate('/tracking/pushup-training');
          }}
          className="p-2 bg-winter-50 dark:bg-winter-900/30 rounded-lg border border-winter-200 dark:border-winter-700 hover:shadow-md transition-all cursor-pointer text-center"
        >
          <div className="text-xs font-semibold text-winter-700 dark:text-winter-300 mb-1">
            📊 {isWorkoutComplete ? t('tracking.tomorrowsPlan') : t('tracking.todaysPlan')}
          </div>
          <div className="text-xs text-gray-900 dark:text-white mb-1">
            <span className="font-medium">{t('tracking.sets')}:</span> {todayPlan.join(' • ')} = {plannedTotal} {t('tracking.reps')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ⏱️ {t('tracking.rest')}: 60s • 💡 {t('tracking.startWorkout')}
          </div>
        </div>
      </button>

      {/* Modal - Quick Input */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('tracking.addPushups')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('tracking.howMany')} ({displayDayLabel})
            </p>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={t('tracking.enterAmount')}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-500 outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!inputValue || parseInt(inputValue) <= 0}
                className="flex-1 px-4 py-3 bg-winter-600 text-white rounded-lg font-semibold hover:bg-winter-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('tracking.add')}
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

export default PushupTile;
