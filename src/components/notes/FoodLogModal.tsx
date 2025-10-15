import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from '../ui/AppModal';
import { useTranslation } from '../../hooks/useTranslation';
import { searchFoods } from '../../utils/foodSearch';
import { calculateNutrition, validateNutrition, calculateCaloriesFromMacros } from '../../utils/nutritionCalculator';
import type { FoodItem, FoodCategory } from '../../data/foodDatabase';
import type { NutritionResult } from '../../utils/nutritionCalculator';

export interface FoodLogData {
  source: 'database' | 'manual';
  foodName: string;
  portionGrams?: number;
  nutrition: NutritionResult;
  note?: string;
  date: string;
}

interface FoodLogModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: FoodLogData) => Promise<void>;
  currentDate?: string;
}

type TabType = 'database' | 'manual';

const CATEGORIES: FoodCategory[] = ['fruits', 'vegetables', 'proteins', 'grains', 'dairy', 'snacks', 'beverages'];

function FoodLogModal({ open, onClose, onSave, currentDate }: FoodLogModalProps) {
  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabType>('database');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | undefined>();
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionGrams, setPortionGrams] = useState<number>(100);
  const [customPortionInput, setCustomPortionInput] = useState<string>('100');

  // Manual entry state
  const [manualFoodName, setManualFoodName] = useState('');
  const [manualCalories, setManualCalories] = useState<string>('');
  const [manualProtein, setManualProtein] = useState<string>('');
  const [manualCarbs, setManualCarbs] = useState<string>('');
  const [manualFat, setManualFat] = useState<string>('');
  const [useManualMacros, setUseManualMacros] = useState(true);

  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = currentDate || todayKey;

  // Search results
  const searchResults = useMemo(() => {
    return searchFoods({
      query: searchQuery,
      category: selectedCategory,
      language,
      limit: 20,
    });
  }, [searchQuery, selectedCategory, language]);

  // Calculate nutrition for database selection
  const databaseNutrition = useMemo(() => {
    if (!selectedFood || portionGrams <= 0) {
      return null;
    }
    return calculateNutrition(selectedFood, portionGrams);
  }, [selectedFood, portionGrams]);

  // Calculate nutrition for manual entry
  const manualNutrition = useMemo((): NutritionResult | null => {
    if (useManualMacros) {
      const protein = Number(manualProtein) || 0;
      const carbs = Number(manualCarbs) || 0;
      const fat = Number(manualFat) || 0;

      if (protein === 0 && carbs === 0 && fat === 0) {
        return null;
      }

      const calculatedCalories = calculateCaloriesFromMacros(protein, carbs, fat);
      return {
        calories: calculatedCalories,
        proteinG: protein,
        carbsG: carbs,
        fatG: fat,
      };
    } else {
      const calories = Number(manualCalories) || 0;
      if (calories === 0) {
        return null;
      }
      return {
        calories,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
      };
    }
  }, [useManualMacros, manualProtein, manualCarbs, manualFat, manualCalories]);

  const canSave = useMemo(() => {
    if (activeTab === 'database') {
      return selectedFood !== null && portionGrams > 0;
    } else {
      return manualFoodName.trim().length > 0 && manualNutrition !== null;
    }
  }, [activeTab, selectedFood, portionGrams, manualFoodName, manualNutrition]);

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      let data: FoodLogData;

      if (activeTab === 'database' && selectedFood && databaseNutrition) {
        data = {
          source: 'database',
          foodName: selectedFood.name[language],
          portionGrams,
          nutrition: databaseNutrition,
          note: note.trim() || undefined,
          date: activeDate,
        };
      } else if (activeTab === 'manual' && manualNutrition) {
        // Validate manual nutrition
        const validationError = validateNutrition(manualNutrition);
        if (validationError) {
          alert(`${t('quickLog.foodModal.validationError')}: ${validationError.message}`);
          setSaving(false);
          return;
        }

        data = {
          source: 'manual',
          foodName: manualFoodName.trim(),
          nutrition: manualNutrition,
          note: note.trim() || undefined,
          date: activeDate,
        };
      } else {
        setSaving(false);
        return;
      }

      await onSave(data);
      handleClose();
    } catch (error) {
      console.error('Error saving food log:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      // Reset form
      setActiveTab('database');
      setSearchQuery('');
      setSelectedCategory(undefined);
      setSelectedFood(null);
      setPortionGrams(100);
      setCustomPortionInput('100');
      setManualFoodName('');
      setManualCalories('');
      setManualProtein('');
      setManualCarbs('');
      setManualFat('');
      setUseManualMacros(true);
      setNote('');
      onClose();
    }
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    // Reset portion to 100g when selecting new food
    setPortionGrams(100);
    setCustomPortionInput('100');
  };

  const handleSelectServing = (grams: number) => {
    setPortionGrams(grams);
    setCustomPortionInput(grams.toString());
  };

  const handleCustomPortionChange = (value: string) => {
    setCustomPortionInput(value);
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      setPortionGrams(Math.round(numeric));
    }
  };

  // Reset search when changing category
  useEffect(() => {
    setSearchQuery('');
  }, [selectedCategory]);

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={t('quickLog.foodModal.title')}
      icon={<span className="text-2xl">🍎</span>}
      size="lg"
      preventCloseOnBackdrop={saving}
      footer={
        <>
          <ModalSecondaryButton onClick={handleClose} disabled={saving}>
            {t('common.actions.cancel')}
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSave} disabled={!canSave || saving}>
            {saving ? t('common.saving') : t('common.actions.save')}
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'database'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('quickLog.foodModal.searchTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'manual'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('quickLog.foodModal.manualTab')}
          </button>
        </div>

        {/* Database Search Tab */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('quickLog.foodModal.searchPlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedCategory(undefined)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === undefined
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('quickLog.foodModal.allCategories')}
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {t(`foodDatabase.categories.${cat}`)}
                </button>
              ))}
            </div>

            {/* Search Results */}
            {!selectedFood && (
              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    {searchQuery ? t('quickLog.foodModal.noResults') : t('quickLog.foodModal.startTyping')}
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <button
                      key={result.item.id}
                      type="button"
                      onClick={() => handleSelectFood(result.item)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {result.item.name[language]}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t(`foodDatabase.categories.${result.item.category}`)} · {result.item.calories} kcal/100g
                          </div>
                        </div>
                        <div className="text-xs text-blue-500">
                          {Math.round(result.score * 100)}% match
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected Food - Serving Selection */}
            {selectedFood && (
              <div className="space-y-4 border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {selectedFood.name[language]}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedFood(null)}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ✕ {t('common.actions.remove')}
                  </button>
                </div>

                {/* Common Servings */}
                {selectedFood.commonServings && selectedFood.commonServings.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('quickLog.foodModal.servingSize')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedFood.commonServings.map((serving, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectServing(serving.grams)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            portionGrams === serving.grams
                              ? 'bg-blue-500 text-white'
                              : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {serving.name[language]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Portion */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('quickLog.foodModal.customGrams')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={customPortionInput}
                      onChange={(e) => handleCustomPortionChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                      g
                    </span>
                  </div>
                </div>

                {/* Nutrition Preview */}
                {databaseNutrition && (
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      {t('quickLog.foodModal.nutritionPreview')}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{databaseNutrition.calories}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">kcal</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{databaseNutrition.proteinG}g</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{language === 'de' ? 'Eiweiß' : 'Protein'}</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{databaseNutrition.carbsG}g</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{language === 'de' ? 'Kohlenhydrate' : 'Carbs'}</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{databaseNutrition.fatG}g</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{language === 'de' ? 'Fett' : 'Fat'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual Entry Tab */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            {/* Food Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('quickLog.foodModal.manualFoodName')}
              </label>
              <input
                type="text"
                value={manualFoodName}
                onChange={(e) => setManualFoodName(e.target.value)}
                placeholder={t('quickLog.foodModal.foodNamePlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
                maxLength={100}
              />
            </div>

            {/* Entry Mode Toggle */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={useManualMacros}
                  onChange={() => setUseManualMacros(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('quickLog.foodModal.enterMacros')}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!useManualMacros}
                  onChange={() => setUseManualMacros(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('quickLog.foodModal.enterCalories')}
                </span>
              </label>
            </div>

            {/* Macro Inputs */}
            {useManualMacros ? (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('quickLog.foodModal.manualProtein')} (g)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={manualProtein}
                    onChange={(e) => setManualProtein(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('quickLog.foodModal.manualCarbs')} (g)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={manualCarbs}
                    onChange={(e) => setManualCarbs(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('quickLog.foodModal.manualFat')} (g)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={manualFat}
                    onChange={(e) => setManualFat(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('quickLog.foodModal.manualCalories')} (kcal)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}

            {/* Nutrition Preview for Manual Entry */}
            {manualNutrition && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('quickLog.foodModal.nutritionPreview')}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{manualNutrition.calories}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">kcal</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{manualNutrition.proteinG}g</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{language === 'de' ? 'E' : 'P'}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{manualNutrition.carbsG}g</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{language === 'de' ? 'K' : 'C'}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{manualNutrition.fatG}g</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">F</div>
                  </div>
                </div>
                {useManualMacros && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    {t('quickLog.foodModal.calculatedFrom')} {manualNutrition.proteinG}g·{manualNutrition.carbsG}g·{manualNutrition.fatG}g
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Optional Note (Both Tabs) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('quickLog.optionalNote')}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('quickLog.notePlaceholder')}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            maxLength={200}
          />
        </div>
      </div>
    </AppModal>
  );
}

export default FoodLogModal;
