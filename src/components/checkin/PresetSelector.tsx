import { useCallback, type ChangeEvent } from 'react';
import { CHECK_IN_PRESETS } from '../../config/checkInPresets';
import { useTranslation } from '../../hooks/useTranslation';

interface PresetSelectorProps {
  onSelectPreset: (presetId: string) => void;
  isDisabled?: boolean;
}

export function PresetSelector({ onSelectPreset, isDisabled = false }: PresetSelectorProps) {
  const { t } = useTranslation();

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const presetId = event.target.value;
      if (presetId) {
        onSelectPreset(presetId);
        // Reset selector after selection
        event.target.value = '';
      }
    },
    [onSelectPreset]
  );

  return (
    <div>
      <label htmlFor="preset-selector" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
        {t('checkIn.presetsLabel')}
      </label>
      <select
        id="preset-selector"
        onChange={handleChange}
        disabled={isDisabled}
        defaultValue=""
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-winter-500 focus:outline-none focus:ring-2 focus:ring-winter-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
      >
        <option value="">{t('checkIn.presetsPlaceholder')}</option>
        {CHECK_IN_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {t(preset.nameKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
