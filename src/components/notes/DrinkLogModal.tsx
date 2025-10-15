import { useState } from 'react';
import { format } from 'date-fns';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from '../ui/AppModal';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import PresetButton from '../hydration/PresetButton';
import type { DrinkPreset } from '../../types';

export type BeverageType = 'water' | 'protein' | 'coffee' | 'tea' | 'other';

export interface DrinkLogData {
  beverage: BeverageType;
  amountMl: number;
  note?: string;
  date: string;
}

interface DrinkLogModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: DrinkLogData) => Promise<void>;
  currentDate?: string;
}

const BEVERAGE_OPTIONS: Array<{ type: BeverageType; icon: string; labelKey: string }> = [
  { type: 'water', icon: '💧', labelKey: 'quickLog.drinkModal.beverageWater' },
  { type: 'coffee', icon: '☕', labelKey: 'quickLog.drinkModal.beverageCoffee' },
  { type: 'tea', icon: '🍵', labelKey: 'quickLog.drinkModal.beverageTea' },
  { type: 'protein', icon: '🥤', labelKey: 'quickLog.drinkModal.beverageProtein' },
  { type: 'other', icon: '🧃', labelKey: 'quickLog.drinkModal.beverageOther' },
];

function DrinkLogModal({ open, onClose, onSave, currentDate }: DrinkLogModalProps) {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);

  const [beverage, setBeverage] = useState<BeverageType>('water');
  const [amountMl, setAmountMl] = useState<number>(250);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const presets = user?.hydrationPresets || [];
  const sortedPresets = [...presets].sort((a, b) => a.order - b.order);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = currentDate || todayKey;

  const handleSave = async () => {
    if (amountMl <= 0) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        beverage,
        amountMl,
        note: note.trim() || undefined,
        date: activeDate,
      });

      // Reset form
      setBeverage('water');
      setAmountMl(250);
      setCustomAmount('');
      setNote('');
      onClose();
    } catch (error) {
      console.error('Error saving drink log:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePresetClick = (preset: DrinkPreset) => {
    setAmountMl(preset.amountMl);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      setAmountMl(Math.round(numeric));
    }
  };

  const handleClose = () => {
    if (!saving) {
      // Reset form on close
      setBeverage('water');
      setAmountMl(250);
      setCustomAmount('');
      setNote('');
      onClose();
    }
  };

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={t('quickLog.drinkModal.title')}
      icon={<span className="text-2xl">🥤</span>}
      size="md"
      preventCloseOnBackdrop={saving}
      footer={
        <>
          <ModalSecondaryButton onClick={handleClose} disabled={saving}>
            {t('common.actions.cancel')}
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSave} disabled={amountMl <= 0 || saving}>
            {saving ? t('common.saving') : t('common.actions.save')}
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Beverage Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('quickLog.drinkModal.beverageType')}
          </label>
          <div className="grid grid-cols-5 gap-2">
            {BEVERAGE_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => setBeverage(option.type)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  beverage === option.type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <span className="text-2xl mb-1">{option.icon}</span>
                <span className="text-[10px] text-gray-600 dark:text-gray-400 text-center">
                  {t(option.labelKey)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('quickLog.drinkModal.amount')}
          </label>

          {/* Preset Buttons */}
          {sortedPresets.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {sortedPresets.map((preset) => (
                <PresetButton
                  key={preset.id}
                  preset={preset}
                  onClick={() => handlePresetClick(preset)}
                  // Don't show edit button in this modal
                  onEdit={undefined}
                  selected={amountMl === preset.amountMl && !customAmount}
                />
              ))}
            </div>
          )}

          {/* Custom Amount Input */}
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder={t('quickLog.drinkModal.customAmount')}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
              ml
            </span>
          </div>

          {/* Current Amount Display */}
          <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('quickLog.drinkModal.selected')}: <strong>{amountMl} ml</strong> ({(amountMl / 1000).toFixed(2)}L)
          </div>
        </div>

        {/* Optional Note */}
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
          {note.length > 0 && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
              {note.length}/200
            </div>
          )}
        </div>
      </div>
    </AppModal>
  );
}

export default DrinkLogModal;
