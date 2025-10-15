import { useState, useEffect } from 'react';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from '../ui/AppModal';
import { useTranslation } from '../../hooks/useTranslation';
import type { DrinkPreset } from '../../types';
import {
  validatePreset,
  sanitizePreset,
  PRESET_CONSTRAINTS,
} from '../../utils/presetValidation';

interface PresetManagementModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (preset: Omit<DrinkPreset, 'id' | 'order'>) => void;
  onDelete?: () => void;
  existingPreset?: DrinkPreset;
  mode: 'add' | 'edit';
}

const EMOJI_SUGGESTIONS = ['💧', '🥤', '☕', '🍵', '🥛', '🧃', '🍷', '🍺'];

function PresetManagementModal({
  open,
  onClose,
  onSave,
  onDelete,
  existingPreset,
  mode,
}: PresetManagementModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [amountMl, setAmountMl] = useState('');
  const [emoji, setEmoji] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form with existing preset data
  useEffect(() => {
    if (open) {
      if (existingPreset) {
        setName(existingPreset.name);
        setAmountMl(existingPreset.amountMl.toString());
        setEmoji(existingPreset.emoji || '');
      } else {
        setName('');
        setAmountMl('');
        setEmoji('');
      }
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [open, existingPreset]);

  const handleSave = () => {
    const parsedAmount = Number.parseInt(amountMl, 10);

    if (!name.trim()) {
      setError(t('hydration.presetName') + ' is required');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Valid amount required');
      return;
    }

    const preset = {
      name: name.trim(),
      amountMl: parsedAmount,
      emoji: emoji.trim() || undefined,
    };

    const validationError = validatePreset(preset);
    if (validationError) {
      setError(validationError.message);
      return;
    }

    const sanitized = sanitizePreset(preset);
    onSave(sanitized);
    onClose();
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={mode === 'add' ? t('hydration.addPreset') : t('hydration.editPreset')}
      icon={<span className="text-2xl">💧</span>}
      size="md"
      footer={
        <>
          {mode === 'edit' && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="mr-auto px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              {showDeleteConfirm ? '⚠️ Confirm Delete' : t('hydration.deletePreset')}
            </button>
          )}
          <ModalSecondaryButton onClick={onClose}>
            {t('tracking.cancel')}
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSave}>
            {t('tracking.save')}
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('hydration.presetName')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder={t('hydration.presetNamePlaceholder')}
            maxLength={PRESET_CONSTRAINTS.MAX_NAME_LENGTH}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            autoFocus
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {name.length}/{PRESET_CONSTRAINTS.MAX_NAME_LENGTH} characters
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('hydration.presetAmount')}
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={amountMl}
            onChange={(e) => {
              setAmountMl(e.target.value);
              setError(null);
            }}
            placeholder={t('hydration.presetAmountPlaceholder')}
            min={PRESET_CONSTRAINTS.MIN_AMOUNT_ML}
            max={PRESET_CONSTRAINTS.MAX_AMOUNT_ML}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {PRESET_CONSTRAINTS.MIN_AMOUNT_ML}ml - {PRESET_CONSTRAINTS.MAX_AMOUNT_ML}ml
          </div>
        </div>

        {/* Emoji Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('hydration.presetEmoji')}
          </label>
          <input
            type="text"
            value={emoji}
            onChange={(e) => {
              setEmoji(e.target.value);
            }}
            placeholder={PRESET_CONSTRAINTS.DEFAULT_EMOJI}
            maxLength={2}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl"
          />
        </div>

        {/* Emoji Suggestions */}
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {t('hydration.emojiSuggestions')}:
          </div>
          <div className="flex flex-wrap gap-2">
            {EMOJI_SUGGESTIONS.map((suggestedEmoji) => (
              <button
                key={suggestedEmoji}
                type="button"
                onClick={() => {
                  setEmoji(suggestedEmoji);
                }}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xl transition-colors"
              >
                {suggestedEmoji}
              </button>
            ))}
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg text-sm text-orange-600 dark:text-orange-400">
            {t('hydration.deleteConfirm', { name: existingPreset?.name || '' })}
          </div>
        )}
      </div>
    </AppModal>
  );
}

export default PresetManagementModal;
