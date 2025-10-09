import type { TrainingLoadComputationResult } from '../../types/tracking';
import { useTranslation } from '../../hooks/useTranslation';

interface LoadPreviewProps {
  computation: TrainingLoadComputationResult;
}

export function LoadPreview({ computation }: LoadPreviewProps) {
  const { t } = useTranslation();

  const { load, components } = computation;

  const formatModifier = (value: number): string => {
    return `${(value * 100).toFixed(0)}%`;
  };

  return (
    <div className="rounded-xl border border-winter-200 bg-winter-50/30 p-4 dark:border-winter-800 dark:bg-winter-900/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('checkIn.loadPreviewTitle')}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-winter-600 dark:text-winter-400">
            {load}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            / 1000
          </span>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
          <span>{t('checkIn.baseLoad')}</span>
          <span className="font-mono font-semibold">
            {Math.round(components.baseFromWorkouts)}
          </span>
        </div>

        <div className="my-2 h-px bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span>{t('checkIn.sleepModifier')}</span>
            <span className="font-mono">{formatModifier(components.modifierSleep)}</span>
          </div>
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span>{t('checkIn.recoveryModifier')}</span>
            <span className="font-mono">{formatModifier(components.modifierRecovery)}</span>
          </div>
          {components.modifierSick < 1 && (
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span>{t('checkIn.sickModifier')}</span>
              <span className="font-mono">{formatModifier(components.modifierSick)}</span>
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-[10px] italic text-gray-500 dark:text-gray-400">
        {t('checkIn.loadPreviewHint')}
      </p>
    </div>
  );
}
