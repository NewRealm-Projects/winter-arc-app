import { memo } from 'react';
import { CarouselStat } from './StatCarousel';

interface CarouselItemProps {
  stat: CarouselStat;
  isActive: boolean;
  onTap: () => void;
}

/**
 * Carousel Item Component
 * Displays a single stat card with icon, label, value, and progress
 *
 * Layout (270px height):
 * ┌─────────────────┐
 * │   🏋️ Sports    │
 * │    12/14 hrs    │
 * │      85%        │
 * │      ✓          │
 * └─────────────────┘
 */
const CarouselItem = memo(function CarouselItem({
  stat,
  isActive,
  onTap,
}: CarouselItemProps) {
  // Determine completion indicator
  const isComplete = (stat.progress as number) >= 100;
  const completionLabel = isComplete
    ? '✓'
    : `${Math.round(stat.progress as number)}%`;

  return (
    <button
      onClick={onTap}
      className="w-full h-full flex flex-col items-center justify-center gap-4 px-4 py-6 bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] active:scale-95 cursor-pointer"
      data-testid={`carousel-item-${stat.id}`}
      role="article"
      aria-label={`${stat.label}: ${stat.value}`}
      tabIndex={isActive ? 0 : -1}
    >
      {/* Icon */}
      <div
        className="text-5xl"
        role="img"
        aria-hidden="true"
      >
        {stat.icon}
      </div>

      {/* Label */}
      <div className="text-center">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          {stat.label}
        </h3>
      </div>

      {/* Value */}
      <div className="text-center">
        <p className="text-2xl font-bold text-[var(--text-primary)]">
          {stat.value}
        </p>
      </div>

      {/* Progress/Completion Indicator */}
      <div
        className={`text-xl font-semibold ${
          isComplete
            ? 'text-green-500'
            : 'text-[var(--text-tertiary)]'
        }`}
        aria-label={isComplete ? 'Complete' : `${Math.round(stat.progress as number)} percent complete`}
      >
        {completionLabel}
      </div>
    </button>
  );
});

export default CarouselItem;
