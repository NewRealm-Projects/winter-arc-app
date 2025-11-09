import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from '../ui/AppModal';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import { validatePreset, sanitizePreset, PRESET_CONSTRAINTS } from '../../utils/presetValidation';
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

const EMOJI_SUGGESTIONS = ['💧', '🥤', '☕', '🍵', '🥛', '🧃', '🍷', '🍺'];

function DrinkLogModal({ open, onClose, onSave, currentDate }: DrinkLogModalProps) {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const updateUserPresets = useStore((state) => state.updateUserPresets);

  const [beverage, setBeverage] = useState<BeverageType>('water');
  const [amountMl, setAmountMl] = useState<number>(250);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Preset saving state
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [presetName, setPresetName] = useState<string>('');
  const [presetEmoji, setPresetEmoji] = useState<string>('');

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
      // Save drink log
      await onSave({
        beverage,
        amountMl,
        note: note.trim() || undefined,
        date: activeDate,
      });

      // Save as preset if requested
      if (saveAsPreset && presetName.trim() && user) {
        const newPreset: Omit<DrinkPreset, 'id' | 'order'> = {
          name: presetName.trim(),
          amountMl,
          emoji: presetEmoji.trim() || undefined,
        };

        // Validate preset
        const validationError = validatePreset(newPreset);
        if (validationError) {
          alert(`Preset error: ${validationError.message}`);
          setSaving(false);
          return;
        }

        const sanitized = sanitizePreset(newPreset);
        const fullPreset: DrinkPreset = {
          ...sanitized,
          id: uuidv4(),
          order: presets.length,
        };

        const updatedPresets = [...presets, fullPreset];

        // Update local state (optimistic)
        updateUserPresets(updatedPresets);

        // TODO: Sync to PostgreSQL API when endpoint is available
      }

      // Reset form
      setBeverage('water');
      setAmountMl(250);
      setCustomAmount('');
      setNote('');
      setSaveAsPreset(false);
      setPresetName('');
      setPresetEmoji('');
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
      setSaveAsPreset(false);
      setPresetName('');
      setPresetEmoji('');
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
      <div className="space-y-4 p-1">
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

        {/* Save as Preset */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsPreset}
              onChange={(e) => setSaveAsPreset(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              💾 Save this drink as preset
            </span>
          </label>

          {saveAsPreset && (
            <div className="mt-3 space-y-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              {/* Preset Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preset Name
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., Morning Water"
                  maxLength={PRESET_CONSTRAINTS.MAX_NAME_LENGTH}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {presetName.length}/{PRESET_CONSTRAINTS.MAX_NAME_LENGTH}
                </div>
              </div>

              {/* Preset Emoji (Optional) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Emoji (optional)
                </label>
                <input
                  type="text"
                  value={presetEmoji}
                  onChange={(e) => setPresetEmoji(e.target.value)}
                  placeholder={PRESET_CONSTRAINTS.DEFAULT_EMOJI}
                  maxLength={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-center text-xl"
                />

                {/* Emoji Suggestions */}
                <div className="mt-2">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {t('hydration.emojiSuggestions')}:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_SUGGESTIONS.map((suggestedEmoji) => (
                      <button
                        key={suggestedEmoji}
                        type="button"
                        onClick={() => setPresetEmoji(suggestedEmoji)}
                        className="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xl transition-colors"
                      >
                        {suggestedEmoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400">
                ℹ️ This preset will be available in both Dashboard and Notes Page
              </div>
            </div>
          )}
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
