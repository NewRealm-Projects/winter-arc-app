import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { getTileClasses, designTokens } from '../theme/tokens';
import { useCombinedDailyTracking } from '../hooks/useCombinedTracking';
import { formatMl, getPercent, resolveWaterGoal } from '../utils/progress';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from './ui/AppModal';
import PresetButton from './hydration/PresetButton';
import PresetManagementModal from './hydration/PresetManagementModal';
import EmptyState from './hydration/EmptyState';
import { updateHydrationPresets } from '../services/firestoreService';
import { reorderPresets, validatePresetCount } from '../utils/presetValidation';
import type { DrinkPreset } from '../types';

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

function HydrationTile() {
  const { t, language } = useTranslation();
  const [showManualModal, setShowManualModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetModalMode, setPresetModalMode] = useState<'add' | 'edit'>('add');
  const [editingPreset, setEditingPreset] = useState<DrinkPreset | undefined>(undefined);
  const [exactValue, setExactValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAmountRef = useRef(0);

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const updateUserPresets = useStore((state) => state.updateUserPresets);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const activeTracking = tracking[activeDate];
  const combinedTracking = useCombinedDailyTracking(activeDate);
  const manualWater = sanitizeMlValue(activeTracking?.water);
  const totalWater = sanitizeMlValue(combinedTracking?.water ?? manualWater);

  // Check if there are smart contributions (from notes)
  const hasSmartContributions = useMemo(() => {
    const smartWater = (combinedTracking?.water ?? 0) - manualWater;
    return smartWater > 0;
  }, [combinedTracking, manualWater]);

  const waterGoal = Math.max(resolveWaterGoal(user), 0);
  const percent = getPercent(totalWater, waterGoal);
  const localeCode = language === 'de' ? 'de-DE' : 'en-US';
  const liters = `${formatMl(totalWater, { locale: localeCode, maximumFractionDigits: 2 })}L`;
  const goalLiters = `${formatMl(waterGoal, { locale: localeCode, maximumFractionDigits: 2 })}L`;
  const isTracked = totalWater >= 1000; // mindestens 1L

  const presets = user?.hydrationPresets || [];
  const sortedPresets = [...presets].sort((a, b) => a.order - b.order);
  const canAddPreset = presets.length < 5;

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

  const addWaterViaPreset = (amount: number) => {
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
    setShowManualModal(false);
  };

  const handleOpenAddPreset = () => {
    const countError = validatePresetCount(presets.length);
    if (countError) {
      alert(t('hydration.maxPresetsReached'));
      return;
    }

    setPresetModalMode('add');
    setEditingPreset(undefined);
    setShowPresetModal(true);
  };

  const handleOpenEditPreset = (preset: DrinkPreset) => {
    setPresetModalMode('edit');
    setEditingPreset(preset);
    setShowPresetModal(true);
  };

  const handleSavePreset = async (presetData: Omit<DrinkPreset, 'id' | 'order'>) => {
    if (!user) return;

    let updatedPresets: DrinkPreset[];

    if (presetModalMode === 'add') {
      const newPreset: DrinkPreset = {
        ...presetData,
        id: uuidv4(),
        order: presets.length,
      };
      updatedPresets = [...presets, newPreset];
    } else if (editingPreset) {
      updatedPresets = presets.map((p) =>
        p.id === editingPreset.id
          ? { ...p, ...presetData }
          : p
      );
    } else {
      return;
    }

    // Update local state (optimistic)
    updateUserPresets(updatedPresets);

    // Sync to Firebase
    await updateHydrationPresets(user.id, updatedPresets);
  };

  const handleDeletePreset = async () => {
    if (!user || !editingPreset) return;

    const updatedPresets = presets.filter((p) => p.id !== editingPreset.id);
    const reorderedPresets = reorderPresets(updatedPresets);

    // Update local state (optimistic)
    updateUserPresets(reorderedPresets);

    // Sync to Firebase
    await updateHydrationPresets(user.id, reorderedPresets);
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
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-xl">💧</div>
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('tracking.hydration')}
            </h3>
          </div>
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {liters}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 text-center">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {percent}% / {goalLiters}
          </div>
        </div>

        {/* Hints */}
        {hasSmartContributions && (
          <div className="mb-3 text-[10px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <span>🔗</span>
              <span>{t('hydration.hintSmartContributions')}</span>
            </div>
          </div>
        )}

        {/* Preset Buttons or Empty State */}
        <div className="space-y-1.5">
          {presets.length === 0 ? (
            <EmptyState onAddPreset={handleOpenAddPreset} />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {sortedPresets.map((preset) => (
                  <PresetButton
                    key={preset.id}
                    preset={preset}
                    onClick={() => {
                      addWaterViaPreset(preset.amountMl);
                    }}
                    onEdit={() => {
                      handleOpenEditPreset(preset);
                    }}
                  />
                ))}
                {canAddPreset && (
                  <button
                    type="button"
                    onClick={handleOpenAddPreset}
                    className="px-3 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors font-medium text-xs"
                  >
                    + {t('hydration.addPreset')}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Manual Input Button (Always Available) */}
          <button
            type="button"
            onClick={() => {
              setExactValue(manualWater ? manualWater.toString() : '');
              setShowManualModal(true);
            }}
            className="w-full py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            ✏️ {t('tracking.edit')}
          </button>
        </div>
      </div>

      {/* Manual Input Modal */}
      <AppModal
        open={showManualModal}
        onClose={() => {
          setShowManualModal(false);
          setExactValue('');
        }}
        title={t('tracking.hydration')}
        subtitle={t('tracking.setExactAmount')}
        icon={<span className="text-2xl">💧</span>}
        size="sm"
        footer={
          <>
            <ModalSecondaryButton
              onClick={() => {
                setShowManualModal(false);
                setExactValue('');
              }}
            >
              {t('tracking.cancel')}
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={setExactWater} disabled={!exactValue}>
              {t('tracking.save')}
            </ModalPrimaryButton>
          </>
        }
      >
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={exactValue}
          onChange={(e) => {
            setExactValue(e.target.value);
          }}
          onKeyDown={(e) => e.key === 'Enter' && setExactWater()}
          placeholder="ml / L"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          autoFocus
        />
      </AppModal>

      {/* Preset Management Modal */}
      <PresetManagementModal
        open={showPresetModal}
        onClose={() => {
          setShowPresetModal(false);
        }}
        onSave={handleSavePreset}
        onDelete={presetModalMode === 'edit' ? handleDeletePreset : undefined}
        existingPreset={editingPreset}
        mode={presetModalMode}
      />
    </>
  );
}

export default HydrationTile;
