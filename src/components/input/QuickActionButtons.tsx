import { memo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface QuickActionButtonsProps {
  onFoodClick: () => void;
  onWaterClick: () => void;
  onNotesClick: () => void;
  onTrainingClick: () => void;
}

/**
 * Quick Action Buttons for Mobile Input Page (<481px)
 * 2x2 grid showing Food, Water, Notes, Training
 * Each button is 56px+ for touch targets
 */
const QuickActionButtons = memo(function QuickActionButtons({
  onFoodClick,
  onWaterClick,
  onNotesClick,
  onTrainingClick,
}: QuickActionButtonsProps) {
  const { t } = useTranslation();

  const buttonClass =
    'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] active:scale-95 min-h-[64px]';

  return (
    <div className="grid grid-cols-2 gap-3" data-testid="quick-action-buttons">
      {/* Food Button */}
      <button
        type="button"
        onClick={onFoodClick}
        className={buttonClass}
        data-testid="quick-action-food"
      >
        <span className="text-2xl">🍗</span>
        <span className="text-xs font-semibold text-center">{t('quickLog.food')}</span>
      </button>

      {/* Water Button */}
      <button
        type="button"
        onClick={onWaterClick}
        className={buttonClass}
        data-testid="quick-action-water"
      >
        <span className="text-2xl">💧</span>
        <span className="text-xs font-semibold text-center">{t('quickLog.water')}</span>
      </button>

      {/* Notes Button */}
      <button
        type="button"
        onClick={onNotesClick}
        className={buttonClass}
        data-testid="quick-action-notes"
      >
        <span className="text-2xl">📝</span>
        <span className="text-xs font-semibold text-center">{t('quickLog.notes')}</span>
      </button>

      {/* Training Button */}
      <button
        type="button"
        onClick={onTrainingClick}
        className={buttonClass}
        data-testid="quick-action-training"
      >
        <span className="text-2xl">🏋️</span>
        <span className="text-xs font-semibold text-center">{t('quickLog.training')}</span>
      </button>
    </div>
  );
});

export default QuickActionButtons;
