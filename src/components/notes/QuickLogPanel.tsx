import { useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../store/useStore';
import DrinkLogModal, { type DrinkLogData } from './DrinkLogModal';
import FoodLogModal, { type FoodLogData } from './FoodLogModal';
import WorkoutLogModal, { type WorkoutLogData } from './WorkoutLogModal';
import WeightLogModal, { type WeightLogData } from './WeightLogModal';
import PushupLogModal, { type PushupLogData } from './PushupLogModal';
import { saveDailyTracking, getDailyTracking } from '../../services/firestoreService';
import { auth } from '../../firebase';

type ModalType = 'drink' | 'food' | 'pushup' | 'workout' | 'weight' | null;

interface QuickAction {
  type: Exclude<ModalType, null>;
  icon: string;
  label: string;
  color: string;
}

function QuickLogPanel() {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;

  const quickActions: QuickAction[] = [
    { type: 'drink', icon: '🥤', label: t('quickLog.drink'), color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400' },
    { type: 'food', icon: '🍎', label: t('quickLog.food'), color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400' },
    { type: 'pushup', icon: '💪', label: t('quickLog.pushups'), color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400' },
    { type: 'workout', icon: '🏃', label: t('quickLog.workout'), color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400' },
    { type: 'weight', icon: '⚖️', label: t('quickLog.weight'), color: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400' },
  ];

  const handleDrinkSave = async (data: DrinkLogData) => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const dateKey = data.date;

    // Get current tracking data
    const currentTracking = tracking[dateKey] || { date: dateKey, water: 0, protein: 0, sports: {}, completed: false };

    // Update water amount
    const updatedTracking = {
      ...currentTracking,
      water: (currentTracking.water || 0) + data.amountMl,
    };

    // Update local state (optimistic)
    updateDayTracking(dateKey, updatedTracking);

    // Sync to Firebase
    await saveDailyTracking(userId, dateKey, updatedTracking);

    // TODO: Create DrinkEvent for history (future implementation)
    console.log('Drink logged:', data);
  };

  const handleFoodSave = async (data: FoodLogData) => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const dateKey = data.date;

    // Get current tracking data
    const currentTracking = tracking[dateKey] || { date: dateKey, water: 0, protein: 0, sports: {}, completed: false };

    // Update nutrition amounts
    const updatedTracking = {
      ...currentTracking,
      calories: (currentTracking.calories || 0) + data.nutrition.calories,
      protein: (currentTracking.protein || 0) + data.nutrition.proteinG,
      carbsG: (currentTracking.carbsG || 0) + data.nutrition.carbsG,
      fatG: (currentTracking.fatG || 0) + data.nutrition.fatG,
    };

    // Update local state (optimistic)
    updateDayTracking(dateKey, updatedTracking);

    // Sync to Firebase
    await saveDailyTracking(userId, dateKey, updatedTracking);

    // TODO: Create FoodEvent for history (future implementation)
    console.log('Food logged:', data);
  };

  const handlePushupSave = async (data: PushupLogData) => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const dateKey = data.date;

    // Get current tracking data
    const currentTracking = tracking[dateKey] || { date: dateKey, water: 0, protein: 0, sports: {}, completed: false };

    // Update pushup count
    const updatedTracking = {
      ...currentTracking,
      pushups: {
        ...currentTracking.pushups,
        total: (currentTracking.pushups?.total || 0) + data.count,
      },
    };

    // Update local state (optimistic)
    updateDayTracking(dateKey, updatedTracking);

    // Sync to Firebase
    await saveDailyTracking(userId, dateKey, updatedTracking);

    // TODO: Create PushupEvent for history (future implementation)
    console.log('Pushups logged:', data);
  };

  const handleWorkoutSave = async (data: WorkoutLogData) => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const dateKey = data.date;

    // Get current tracking data
    const result = await getDailyTracking(userId, dateKey);
    const currentTracking = result.success && result.data
      ? result.data
      : { date: dateKey, water: 0, protein: 0, sports: {}, completed: false };

    // Update sports tracking
    const sportEntry = data.sport === 'rest'
      ? true
      : {
          active: true,
          duration: data.durationMin,
          intensity: data.intensity === 'easy' ? 3 : data.intensity === 'moderate' ? 6 : 9,
        };

    const updatedTracking: typeof currentTracking = {
      ...currentTracking,
      sports: {
        ...currentTracking.sports,
        [data.sport]: sportEntry,
      },
    };

    // Update local state (optimistic)
    updateDayTracking(dateKey, updatedTracking as any);

    // Sync to Firebase
    await saveDailyTracking(userId, dateKey, updatedTracking as any);

    // TODO: Create WorkoutEvent for history (future implementation)
    console.log('Workout logged:', data);
  };

  const handleWeightSave = async (data: WeightLogData) => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const dateKey = data.date;

    // Get current tracking data
    const currentTracking = tracking[dateKey] || { date: dateKey, water: 0, protein: 0, sports: {}, completed: false };

    // Update weight data
    const updatedTracking = {
      ...currentTracking,
      weight: {
        value: data.weight,
        bodyFat: data.bodyFat,
        bmi: data.bmi,
      },
    };

    // Update local state (optimistic)
    updateDayTracking(dateKey, updatedTracking);

    // Sync to Firebase
    await saveDailyTracking(userId, dateKey, updatedTracking);

    // Also update user's current weight in profile
    if (user) {
      const { updateUser } = await import('../../services/firestoreService');
      await updateUser(userId, { weight: data.weight, bodyFat: data.bodyFat });
    }

    // TODO: Create WeightEvent for history (future implementation)
    console.log('Weight logged:', data);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {t('quickLog.title')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.type}
              type="button"
              onClick={() => setActiveModal(action.type)}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:scale-105 ${action.color}`}
            >
              <span className="text-3xl mb-2">{action.icon}</span>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      <DrinkLogModal
        open={activeModal === 'drink'}
        onClose={() => setActiveModal(null)}
        onSave={handleDrinkSave}
        currentDate={activeDate}
      />

      <FoodLogModal
        open={activeModal === 'food'}
        onClose={() => setActiveModal(null)}
        onSave={handleFoodSave}
        currentDate={activeDate}
      />

      <PushupLogModal
        open={activeModal === 'pushup'}
        onClose={() => setActiveModal(null)}
        onSave={handlePushupSave}
        currentDate={activeDate}
      />

      <WorkoutLogModal
        open={activeModal === 'workout'}
        onClose={() => setActiveModal(null)}
        onSave={handleWorkoutSave}
        currentDate={activeDate}
      />

      <WeightLogModal
        open={activeModal === 'weight'}
        onClose={() => setActiveModal(null)}
        onSave={handleWeightSave}
        currentDate={activeDate}
      />
    </>
  );
}

export default QuickLogPanel;
