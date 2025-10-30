import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../store/useStore';
import { noteStore } from '../../store/noteStore';
import DrinkLogModal, { type DrinkLogData } from './DrinkLogModal';
import FoodLogModal, { type FoodLogData } from './FoodLogModal';
import WorkoutLogModal, { type WorkoutLogData } from './WorkoutLogModal';
import WeightLogModal, { type WeightLogData } from './WeightLogModal';
import { saveDailyTracking, getDailyTracking } from '../../services/firestoreService';
import { auth } from '../../firebase';
import { generateDrinkSummary, generateFoodSummary, generateWorkoutSummary, generateWeightSummary } from '../../utils/activitySummary';
import type { SportTracking } from '../../types';
import type { SmartNote } from '../../types/events';

type ModalType = 'drink' | 'food' | 'workout' | 'weight' | null;

interface QuickAction {
  type: 'drink' | 'food' | 'pushup' | 'workout' | 'weight';
  icon: string;
  label: string;
  color: string;
}

// Helper to create empty tracking data with proper defaults
const createEmptyTracking = (dateKey: string) => ({
  date: dateKey,
  water: 0,
  protein: 0,
  calories: 0,
  carbsG: 0,
  fatG: 0,
  sports: {
    hiit: false,
    cardio: false,
    gym: false,
    schwimmen: false,
    soccer: false,
    rest: false,
  } as SportTracking,
  completed: false,
});

function QuickLogPanel() {
  const { t } = useTranslation();
  const router = useRouter();
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

    // Get current tracking data with proper defaults
    const currentTracking = tracking[dateKey] || createEmptyTracking(dateKey);

    // Update water amount
    const updatedTracking = {
      ...currentTracking,
      water: (currentTracking.water || 0) + data.amountMl,
    };

    // Update local state (optimistic)
    updateDayTracking(dateKey, updatedTracking);

    // Sync to Firebase
    await saveDailyTracking(userId, dateKey, updatedTracking);

    // Save note to Input section if provided
    if (data.note?.trim()) {
      const { summary, details } = generateDrinkSummary(data.amountMl, 'water');
      const note: SmartNote = {
        id: uuidv4(),
        ts: Date.now(),
        raw: data.note,
        summary: data.note,
        events: [],
        activityType: 'drink',
        activitySummary: summary,
        activityDetails: details,
        content: data.note,
      };
      await noteStore.add(note);
    }
  };

  const handleFoodSave = async (data: FoodLogData) => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const dateKey = data.date;

    // Calculate aggregated nutrition from all cart items
    const aggregatedNutrition = data.cart.reduce(
      (acc, item) => ({
        calories: acc.calories + item.nutrition.calories,
        proteinG: acc.proteinG + item.nutrition.proteinG,
        carbsG: acc.carbsG + item.nutrition.carbsG,
        fatG: acc.fatG + item.nutrition.fatG,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );

    // Get current tracking data with proper defaults
    const currentTracking = tracking[dateKey] || createEmptyTracking(dateKey);

    // Update nutrition amounts with aggregated totals
    const updatedTracking = {
      ...currentTracking,
      calories: (currentTracking.calories || 0) + aggregatedNutrition.calories,
      protein: (currentTracking.protein || 0) + aggregatedNutrition.proteinG,
      carbsG: (currentTracking.carbsG || 0) + aggregatedNutrition.carbsG,
      fatG: (currentTracking.fatG || 0) + aggregatedNutrition.fatG,
    };

    // Update local state (optimistic)
    updateDayTracking(dateKey, updatedTracking);

    // Sync to Firebase
    await saveDailyTracking(userId, dateKey, updatedTracking);

    // Save ONE consolidated note for entire food session (not per item)
    if (data.note?.trim() || data.cart.length > 0) {
      // Prepare items for summary
      const foodItems = data.cart.map(item => ({
        name: item.foodName,
        grams: item.portionGrams || 100,
      }));

      // Generate consolidated summary with ALL items
      const { summary, details } = generateFoodSummary(foodItems);

      // Create SINGLE note with all items
      const note: SmartNote = {
        id: uuidv4(),
        ts: Date.now(),
        raw: data.note || '',
        summary: data.note || `Food logged: ${foodItems.length} items`,
        events: [],
        activityType: 'food',
        activitySummary: summary,
        activityDetails: details,
        content: data.note || `Food logged: ${foodItems.length} items`,
      };
      await noteStore.add(note);
    }
  };

  const handleActionClick = (actionType: QuickAction['type']) => {
    if (actionType === 'pushup') {
      // Navigate to pushup training page
      router.push('/tracking/pushup-training');
    } else {
      // Open modal for other actions
      setActiveModal(actionType);
    }
  };

  const handleWorkoutSave = async (data: WorkoutLogData) => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const dateKey = data.date;

    // Get current tracking data
    const result = await getDailyTracking(userId, dateKey);
    const currentTracking = result.success && result.data
      ? result.data
      : { date: dateKey, water: 0, protein: 0, sports: {} as SportTracking, completed: false };

    // Update sports tracking
    const sportEntry = data.sport === 'rest'
      ? true
      : {
        active: true,
        duration: data.durationMin,
        intensity: data.intensity === 'easy' ? 3 : data.intensity === 'moderate' ? 6 : 9,
      };

    const updatedTracking = {
      ...currentTracking,
      sports: {
        ...currentTracking.sports,
        [data.sport]: sportEntry,
      } as typeof currentTracking.sports,
    };

    // Update local state (optimistic)
    updateDayTracking(dateKey, updatedTracking);

    // Sync to Firebase
    await saveDailyTracking(userId, dateKey, updatedTracking);

    // Save note to Input section if provided
    if (data.note?.trim()) {
      const { summary, details } = generateWorkoutSummary(data.sport, data.durationMin, data.intensity);
      const note: SmartNote = {
        id: uuidv4(),
        ts: Date.now(),
        raw: data.note,
        summary: data.note,
        events: [],
        activityType: 'workout',
        activitySummary: summary,
        activityDetails: details,
        content: data.note,
      };
      await noteStore.add(note);
    }
  };

  const handleWeightSave = async (data: WeightLogData) => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const dateKey = data.date;

    // Get current tracking data with proper defaults
    const currentTracking = tracking[dateKey] || createEmptyTracking(dateKey);

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

    // Save note to Input section if provided
    if (data.note?.trim()) {
      const { summary, details } = generateWeightSummary(data.weight, data.bodyFat);
      const note: SmartNote = {
        id: uuidv4(),
        ts: Date.now(),
        raw: data.note,
        summary: data.note,
        events: [],
        activityType: 'weight',
        activitySummary: summary,
        activityDetails: details,
        content: data.note,
      };
      await noteStore.add(note);
    }
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
              onClick={() => handleActionClick(action.type)}
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
