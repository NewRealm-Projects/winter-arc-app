'use client';

import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  generateProgressivePlan,
  getLastPushupTotal,
  countPushupDays,
  calculateTotalReps,
} from '../utils/pushupAlgorithm';
import { useTranslation } from '../hooks/useTranslation';
import { getTileClasses, designTokens } from '../theme/tokens';
import { useCombinedTracking, useCombinedDailyTracking } from '../hooks/useCombinedTracking';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from './ui/AppModal';
import EditIcon from './ui/EditIcon';

function PushupTile() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSetMode, setIsSetMode] = useState(false); // false = add, true = set exact

  const inputRef = useRef<HTMLInputElement>(null);

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);
  const combinedTracking = useCombinedTracking();

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const isToday = activeDate === todayKey;
  const activeTracking = tracking[activeDate];
  const combinedDaily = useCombinedDailyTracking(activeDate);
  const currentPushups = activeTracking?.pushups;
  const workoutTotal = currentPushups?.workout?.reps?.reduce((sum, reps) => sum + reps, 0) ?? 0;
  const pushupsForDay = combinedDaily?.pushups?.total ?? workoutTotal ?? 0;

  const displayDayLabel = isToday
    ? t('tracking.today')
    : format(new Date(activeDate), 'dd.MM.');

  // Check if today's workout is complete (5 sets done)
  const isWorkoutComplete = currentPushups?.workout?.reps?.length === 5;

  // Generiere Plan basierend auf Historie
  const lastTotal = getLastPushupTotal(combinedTracking);
  const daysCompleted = countPushupDays(combinedTracking);
  const initialTotal = lastTotal > 0 ? lastTotal : Math.round((user?.maxPushups || 20) * 2.5);
  const todayPlan = generateProgressivePlan(initialTotal, daysCompleted);
  const plannedTotal = calculateTotalReps(todayPlan);

  const handleSave = () => {
    const amount = parseInt(inputValue);
    if (!isNaN(amount) && amount >= 0) {
      updateDayTracking(activeDate, {
        pushups: {
          ...currentPushups,
          total: isSetMode ? amount : (currentPushups?.total ?? 0) + amount,
        },
      });
      setInputValue('');
      setShowModal(false);
      setIsSetMode(false);
    }
  };

  const isTracked = pushupsForDay > 0;

  return (
    <>
      <div className={`relative w-full ${getTileClasses(isTracked)} ${designTokens.padding.compact} text-white`}>
        {/* Edit Icon */}
        <EditIcon
          onClick={() => { setShowModal(true); }}
          ariaLabel={t('tracking.edit')}
        />

        {/* Header with Icon and Count */}
        <div className="flex items-center justify-between mb-2 pr-12">
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
            router.push('/tracking/pushup-training');
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
      </div>

      {/* Modal - Quick Input */}
      <AppModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setInputValue('');
          setIsSetMode(false);
        }}
        title={t('tracking.addPushups')}
        subtitle={`${t('tracking.howMany')} (${displayDayLabel})`}
        icon={<span className="text-2xl">💪</span>}
        size="sm"
        initialFocusRef={inputRef}
        footer={
          <>
            <ModalSecondaryButton
              onClick={() => {
                setShowModal(false);
                setInputValue('');
                setIsSetMode(false);
              }}
            >
              {t('tracking.cancel')}
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={handleSave} disabled={!inputValue || parseInt(inputValue) < 0}>
              {t('tracking.save')}
            </ModalPrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => { setIsSetMode(false); }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!isSetMode
                ? 'bg-winter-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              ➕ {t('tracking.add')}
            </button>
            <button
              onClick={() => { setIsSetMode(true); }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isSetMode
                ? 'bg-winter-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              ✏️ {t('tracking.setExact')}
            </button>
          </div>

          {!isSetMode && pushupsForDay > 0 && (
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              💡 {t('tracking.currentTotal')}: {pushupsForDay}
            </div>
          )}

          <input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={isSetMode ? t('tracking.totalAmount') : t('tracking.enterAmount')}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-500 outline-none"
          />
        </div>
      </AppModal>
    </>
  );
}

export default PushupTile;
