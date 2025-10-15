import { useTranslation } from '../../hooks/useTranslation';

interface EmptyStateProps {
  onAddPreset: () => void;
}

function EmptyState({ onAddPreset }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="text-center py-4">
      <div className="text-4xl mb-2">💧</div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
        {t('hydration.noPresets')}
      </p>
      <p className="text-[10px] text-gray-500 dark:text-gray-500 mb-4">
        {t('hydration.noPresetsHint')}
      </p>
      <button
        type="button"
        onClick={onAddPreset}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
      >
        + {t('hydration.addPreset')}
      </button>
    </div>
  );
}

export default EmptyState;
