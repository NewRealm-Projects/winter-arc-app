import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../store/useStore';
import { noteStore } from '../../store/noteStore';
import { useToast } from '../../hooks/useToast';
import DrinkLogModal, { type DrinkLogData } from './DrinkLogModal';
import FoodLogModal, { type FoodLogData } from './FoodLogModal';
import WorkoutLogModal, { type WorkoutLogData } from './WorkoutLogModal';
import WeightLogModal, { type WeightLogData } from './WeightLogModal';
import { generateDrinkSummary, generateFoodSummary, generateWorkoutSummary, generateWeightSummary } from '../../utils/activitySummary';
import type { DailyTracking, SportTracking } from '../../types';
import type { SmartNote } from '../../types/events';

type ModalType = 'drink' | 'food' | 'workout' | 'weight' | null;

interface QuickAction {
  type: 'drink' | 'food' | 'pushup' | 'workout' | 'weight';
  icon: string;
  label: string;
  color: string;
}

const hasUserId = (user: Session['user'] | undefined | null): user is Session['user'] & { id: string } =>
  !!user && typeof (user as { id?: unknown }).id === 'string';

// Helper to create empty tracking data with proper defaults
const createEmptyTracking = (dateKey: string): DailyTracking => ({
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

const cloneTrackingEntry = (entry: DailyTracking): DailyTracking =>
  JSON.parse(JSON.stringify(entry)) as DailyTracking;

function QuickLogPanel() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);

  const requireUserId = (): string | null => {
    const userId = hasUserId(session?.user) ? session.user.id : null;
    if (!userId && !sessionWarningShown) {
      setSessionWarningShown(true);
      console.error('QuickLogPanel: Missing authenticated user id for quick-log action.');
      showToast({ message: 'Your session expired. Please sign in again.', type: 'error' });
      router.push('/auth/signin');
    }
    return userId;
  };

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
    if (!requireUserId()) {
      return;
    }
    const dateKey = data.date;

    // Get current tracking data with proper defaults
    const currentTracking: DailyTracking = tracking[dateKey] ?? createEmptyTracking(dateKey);

    // Update water amount
    const updatedTracking = {
      ...currentTracking,
      water: (currentTracking.water || 0) + data.amountMl,
    };

    // Update local state (optimistic)
    updateDayTracking(dateKey, updatedTracking);

    // Sync to API
    await fetch(`/api/tracking/${dateKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTracking),
    });

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
    if (!requireUserId()) {
      return;
    }
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
    const currentTracking: DailyTracking = tracking[dateKey] ?? createEmptyTracking(dateKey);

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

    // Sync to API
    await fetch(`/api/tracking/${dateKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTracking),
    });

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
    if (!requireUserId()) {
      return;
    }
    const dateKey = data.date;

    // Prefer local tracking state; only fetch if missing
    let currentTracking: DailyTracking | undefined = tracking[dateKey];
    if (!currentTracking) {
      const resp = await fetch(`/api/tracking/${dateKey}`);
      if (resp.ok) {
        currentTracking = (await resp.json()) as DailyTracking;
      } else {
        currentTracking = createEmptyTracking(dateKey);
      }
    }

    // Update sports tracking
    const sportEntry = data.sport === 'rest'
      ? true
      : {
        active: true,
        duration: data.durationMin,
        intensity: data.intensity === 'easy' ? 3 : data.intensity === 'moderate' ? 6 : 9,
      };

    const baseTracking: DailyTracking = currentTracking ?? createEmptyTracking(dateKey);

    const updatedTracking: DailyTracking = {
      ...baseTracking,
      sports: {
        ...baseTracking.sports,
        [data.sport]: sportEntry,
      },
    };

    // Update local state (optimistic)
    updateDayTracking(dateKey, updatedTracking);

    // Sync to API (create if absent then patch) - ignore 409 on create
    try {
      const createResp = await fetch(`/api/tracking/${dateKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTracking),
      });
      if (createResp.status === 409) {
        await fetch(`/api/tracking/${dateKey}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTracking),
        });
      }
    } catch (e) {
      console.error('Workout save failed, reverting locally:', e);
      // Revert optimistic update if network fails
      updateDayTracking(dateKey, baseTracking);
    }

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
    const userId = requireUserId();
    if (!userId) {
      return;
    }
    const dateKey = data.date;

    const currentTracking: DailyTracking = tracking[dateKey] ?? createEmptyTracking(dateKey);
    const previousTracking = tracking[dateKey] ? cloneTrackingEntry(tracking[dateKey]) : undefined;

    const updatedTracking: DailyTracking = {
      ...currentTracking,
      weight: {
        value: data.weight,
        bodyFat: data.bodyFat,
        bmi: data.bmi,
      },
    };

    updateDayTracking(dateKey, updatedTracking);

    const rollbackProfileWeight = async (): Promise<boolean> => {
      if (!user || !previousTracking?.weight?.value) {
        return true;
      }
      const payload = JSON.stringify({ weight: previousTracking.weight.value });
      const url = `/api/users/${userId}`;

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          });
          if (response.ok) {
            return true;
          }
          const responseBody = await response.text();
          console.error(`[QuickLogPanel] Profile weight rollback attempt ${attempt} failed`, {
            status: response.status,
            body: responseBody,
          });
        } catch (rollbackError) {
          console.error(`[QuickLogPanel] Profile weight rollback attempt ${attempt} threw`, rollbackError);
        }
      }
      return false;
    };

    try {
      const createResp = await fetch(`/api/tracking/${dateKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTracking),
      });
      if (createResp.status === 409) {
        const patchResp = await fetch(`/api/tracking/${dateKey}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTracking),
        });
        if (!patchResp.ok) {
          const errorBody = await patchResp.text();
          console.error('Weight patch failed', { status: patchResp.status, body: errorBody });
          throw new Error('Weight patch failed');
        }
      } else if (!createResp.ok) {
        const errorBody = await createResp.text();
        console.error('Weight create failed', { status: createResp.status, body: errorBody });
        throw new Error('Weight create failed');
      }
    } catch (error) {
      console.error('Weight save failed, reverting locally:', error);
      updateDayTracking(dateKey, previousTracking ?? currentTracking);
      const rollbackSuccess = await rollbackProfileWeight();
      if (!rollbackSuccess) {
        showToast({ message: 'Saving weight failed and rollback unsuccessful. Please refresh the page.', type: 'error' });
        return;
      }
      showToast({ message: 'Saving weight failed. Please try again.', type: 'error' });
      return;
    }
    if (user) {
      void fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: data.weight }),
      }).catch((profileError) => {
        console.error('Unable to update profile weight after successful tracking save', profileError);
        showToast({ message: 'Weight saved locally, but profile update failed.', type: 'warning' });
      });
    }

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
