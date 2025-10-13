import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { getTileClasses, designTokens } from '../theme/tokens';
import { useCombinedDailyTracking } from '../hooks/useCombinedTracking';
import { getPercent } from '../utils/progress';
import { calculateNutritionGoals } from '../utils/nutrition';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from './ui/AppModal';

const sanitizeValue = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return Math.round(numeric);
};

interface MacroInputs {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

type QuickAddTab = 'calories' | 'protein' | 'carbs' | 'fat';

function NutritionTile() {
  const { t, language } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<QuickAddTab>('calories');
  const [inputValues, setInputValues] = useState<MacroInputs>({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const activeTracking = tracking[activeDate];
  const combinedTracking = useCombinedDailyTracking(activeDate);

  // Get manual and combined values
  const manualCalories = sanitizeValue(activeTracking?.calories);
  const manualProtein = sanitizeValue(activeTracking?.protein);
  const manualCarbs = sanitizeValue(activeTracking?.carbsG);
  const manualFat = sanitizeValue(activeTracking?.fatG);

  const totalCalories = sanitizeValue(combinedTracking?.calories ?? manualCalories);
  const totalProtein = sanitizeValue(combinedTracking?.protein ?? manualProtein);
  const totalCarbs = sanitizeValue(combinedTracking?.carbsG ?? manualCarbs);
  const totalFat = sanitizeValue(combinedTracking?.fatG ?? manualFat);

  // Check if there are smart contributions (from notes)
  const hasSmartContributions = useMemo(() => {
    const smartCalories = (combinedTracking?.calories ?? 0) - manualCalories;
    const smartProtein = (combinedTracking?.protein ?? 0) - manualProtein;
    const smartCarbs = (combinedTracking?.carbsG ?? 0) - manualCarbs;
    const smartFat = (combinedTracking?.fatG ?? 0) - manualFat;
    return smartCalories > 0 || smartProtein > 0 || smartCarbs > 0 || smartFat > 0;
  }, [combinedTracking, manualCalories, manualProtein, manualCarbs, manualFat]);

  // Calculate nutrition goals
  const goals = useMemo(() => {
    if (!user || !user.weight || user.weight <= 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    }
    return calculateNutritionGoals(
      user.weight,
      user.activityLevel || 'moderate',
      user.bodyFat
    );
  }, [user]);

  const hasGoals = goals.calories > 0;
  const hasWeight = user && user.weight > 0;

  // Calculate percentages
  const caloriesPercent = hasGoals ? getPercent(totalCalories, goals.calories) : 0;
  const proteinPercent = hasGoals ? getPercent(totalProtein, goals.protein) : 0;
  const carbsPercent = hasGoals ? getPercent(totalCarbs, goals.carbs) : 0;
  const fatPercent = hasGoals ? getPercent(totalFat, goals.fat) : 0;

  const isTracked = totalCalories > 0 || totalProtein > 0 || totalCarbs > 0 || totalFat > 0;

  const localeCode = language === 'de' ? 'de-DE' : 'en-US';

  const formatNumber = (value: number) => {
    return value.toLocaleString(localeCode);
  };

  const quickAddAmounts: Record<QuickAddTab, number[]> = {
    calories: [100, 200, 300],
    protein: [10, 20, 30],
    carbs: [25, 50, 100],
    fat: [10, 20, 30],
  };

  const addMacro = (type: QuickAddTab, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const updates: Record<string, number> = {};
    switch (type) {
      case 'calories':
        updates.calories = sanitizeValue(manualCalories + amount);
        break;
      case 'protein':
        updates.protein = sanitizeValue(manualProtein + amount);
        break;
      case 'carbs':
        updates.carbsG = sanitizeValue(manualCarbs + amount);
        break;
      case 'fat':
        updates.fatG = sanitizeValue(manualFat + amount);
        break;
    }

    updateDayTracking(activeDate, updates);
  };

  const saveExact = () => {
    const parsedValues = {
      calories: Number.parseInt(inputValues.calories, 10) || 0,
      protein: Number.parseInt(inputValues.protein, 10) || 0,
      carbs: Number.parseInt(inputValues.carbs, 10) || 0,
      fat: Number.parseInt(inputValues.fat, 10) || 0,
    };

    const updates: Record<string, number> = {};
    if (parsedValues.calories > 0) updates.calories = parsedValues.calories;
    if (parsedValues.protein > 0) updates.protein = parsedValues.protein;
    if (parsedValues.carbs > 0) updates.carbsG = parsedValues.carbs;
    if (parsedValues.fat > 0) updates.fatG = parsedValues.fat;

    if (Object.keys(updates).length > 0) {
      updateDayTracking(activeDate, updates);
    }

    setInputValues({ calories: '', protein: '', carbs: '', fat: '' });
    setShowModal(false);
  };

  const openModal = () => {
    setInputValues({
      calories: manualCalories > 0 ? manualCalories.toString() : '',
      protein: manualProtein > 0 ? manualProtein.toString() : '',
      carbs: manualCarbs > 0 ? manualCarbs.toString() : '',
      fat: manualFat > 0 ? manualFat.toString() : '',
    });
    setShowModal(true);
  };

  return (
    <>
      <div className={`${getTileClasses(isTracked)} ${designTokens.padding.compact} text-white`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-xl">🍽️</div>
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('dashboard.nutrition.title')}
            </h3>
          </div>
          <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
            {formatNumber(totalCalories)} {t('dashboard.nutrition.kcal')}
          </div>
        </div>

        {/* Main Progress Bar (Calories) */}
        <div className="mb-3">
          {hasGoals ? (
            <>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(caloriesPercent, 100)}%` }}
                />
              </div>
              <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 text-center">
                {caloriesPercent}% / {formatNumber(goals.calories)} {t('dashboard.nutrition.kcal')}
              </div>
            </>
          ) : (
            <div className="mt-2 text-xs text-orange-200 bg-orange-500/10 rounded-lg px-3 py-2 text-center">
              {hasWeight ? t('tracking.setGoal') : t('dashboard.nutrition.hintSetWeight')}
            </div>
          )}
        </div>

        {/* Macro Breakdown */}
        {hasGoals && (
          <div className="space-y-1.5 text-xs mb-3">
            {/* Protein */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {t('dashboard.nutrition.protein')}:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(totalProtein)} / {formatNumber(goals.protein)} {t('dashboard.nutrition.grams')} ({proteinPercent}%)
              </span>
            </div>

            {/* Carbs */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {t('dashboard.nutrition.carbs')}:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(totalCarbs)} / {formatNumber(goals.carbs)} {t('dashboard.nutrition.grams')} ({carbsPercent}%)
              </span>
            </div>

            {/* Fat */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {t('dashboard.nutrition.fat')}:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(totalFat)} / {formatNumber(goals.fat)} {t('dashboard.nutrition.grams')} ({fatPercent}%)
              </span>
            </div>
          </div>
        )}

        {/* Hints */}
        {hasGoals && (
          <div className="space-y-1 mb-3 text-[10px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <span>💡</span>
              <span>
                {user?.bodyFat ? t('dashboard.nutrition.hintGoal') : t('dashboard.nutrition.hintGoalNoBodyFat')}
              </span>
            </div>
            {hasSmartContributions && (
              <div className="flex items-center gap-1">
                <span>🔗</span>
                <span>{t('dashboard.nutrition.hintSmartContributions')}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {quickAddAmounts.calories.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  addMacro('calories', amount);
                }}
                className="px-2 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors font-medium text-xs"
              >
                +{amount} {t('dashboard.nutrition.kcal')}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={openModal}
            className="w-full py-1 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
          >
            ✏️ {t('dashboard.nutrition.edit')}
          </button>
        </div>
      </div>

      {/* Nutrition Modal */}
      <AppModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setInputValues({ calories: '', protein: '', carbs: '', fat: '' });
        }}
        title={t('dashboard.nutrition.title')}
        subtitle={t('tracking.setExactAmount')}
        icon={<span className="text-2xl">🍽️</span>}
        size="md"
        footer={
          <>
            <ModalSecondaryButton
              onClick={() => {
                setShowModal(false);
                setInputValues({ calories: '', protein: '', carbs: '', fat: '' });
              }}
            >
              {t('tracking.cancel')}
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={saveExact}>
              {t('tracking.save')}
            </ModalPrimaryButton>
          </>
        }
      >
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
          {(['calories', 'protein', 'carbs', 'fat'] as QuickAddTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
              }}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t(`dashboard.nutrition.${tab}`)}
            </button>
          ))}
        </div>

        {/* Quick Add Buttons for Active Tab */}
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2">
            {quickAddAmounts[activeTab].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  addMacro(activeTab, amount);
                  setShowModal(false);
                }}
                className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors font-medium text-sm"
              >
                +{amount}
                {activeTab === 'calories' ? ` ${t('dashboard.nutrition.kcal')}` : ` ${t('dashboard.nutrition.grams')}`}
              </button>
            ))}
          </div>
        </div>

        {/* Exact Input Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('dashboard.nutrition.calories')} ({t('dashboard.nutrition.kcal')})
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValues.calories}
              onChange={(e) => {
                setInputValues({ ...inputValues, calories: e.target.value });
              }}
              placeholder="0"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('dashboard.nutrition.protein')} ({t('dashboard.nutrition.grams')})
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValues.protein}
              onChange={(e) => {
                setInputValues({ ...inputValues, protein: e.target.value });
              }}
              placeholder="0"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('dashboard.nutrition.carbs')} ({t('dashboard.nutrition.grams')})
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValues.carbs}
              onChange={(e) => {
                setInputValues({ ...inputValues, carbs: e.target.value });
              }}
              placeholder="0"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('dashboard.nutrition.fat')} ({t('dashboard.nutrition.grams')})
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValues.fat}
              onChange={(e) => {
                setInputValues({ ...inputValues, fat: e.target.value });
              }}
              placeholder="0"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>
      </AppModal>
    </>
  );
}

export default NutritionTile;
