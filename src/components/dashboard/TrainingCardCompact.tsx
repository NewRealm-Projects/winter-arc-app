import { memo, useMemo } from 'react';
import { useTrainingLoadWeek } from '../../hooks/useTrainingLoadWeek';
import { useTranslation } from '../../hooks/useTranslation';

interface TrainingCardCompactProps {
  onClick: () => void;
}

/**
 * Compact Training Card for Mobile (<481px)
 * Shows badge + tap to expand in modal
 * Height: ~48px (vs 200px full card)
 */
const TrainingCardCompact = memo(function TrainingCardCompact({ onClick }: TrainingCardCompactProps) {
  const { t } = useTranslation();
  const weekStats = useTrainingLoadWeek();

  const badgeColorClass = useMemo(() => {
    switch (weekStats.badgeLevel) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'optimal':
        return 'bg-green-500/20 text-green-300 border-green-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  }, [weekStats.badgeLevel]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] active:scale-95 text-left"
      data-testid="training-card-compact"
    >
      {/* Left: Icon + Title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg flex-shrink-0" aria-hidden>
          🏋️
        </span>
        <span className="text-sm font-semibold truncate">
          {t('dashboard.training')}
        </span>
      </div>

      {/* Middle: Badge */}
      <span
        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap flex-shrink-0 ${badgeColorClass}`}
      >
        {t(`dashboard.trainingLoadStatus.${weekStats.badgeLevel}`)}
      </span>

      {/* Right: Arrow */}
      <span className="text-lg flex-shrink-0" aria-hidden>
        →
      </span>
    </button>
  );
});

export default TrainingCardCompact;
