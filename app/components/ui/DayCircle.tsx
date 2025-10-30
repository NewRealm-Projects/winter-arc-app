import { format } from 'date-fns';
import type { Locale } from 'date-fns';
import { memo, useMemo } from 'react';

type DayCircleClickHandler = (date: Date) => void;

export interface DayCircleProps {
  readonly date: Date;
  readonly percent: number;
  readonly isToday: boolean;
  readonly streakMet: boolean;
  readonly isSelected?: boolean;
  readonly onClick?: DayCircleClickHandler;
  readonly locale?: Locale;
}

const PROGRESS_RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

function resolveProgressStroke(percent: number): string {
  if (percent >= 100) {
    return 'stroke-emerald-400';
  }
  if (percent >= 50) {
    return 'stroke-amber-400';
  }
  return 'stroke-white/25';
}

function DayCircleComponent({
  date,
  percent,
  isToday,
  streakMet,
  isSelected = false,
  onClick,
  locale,
}: DayCircleProps) {
  const safePercent = Number.isFinite(percent)
    ? Math.max(Math.min(percent, 100), 0)
    : 0;

  const dashOffset = useMemo(
    () => CIRCUMFERENCE - (CIRCUMFERENCE * safePercent) / 100,
    [safePercent]
  );

  const label = format(date, 'EEE', { locale });
  const dayNumber = format(date, 'd');
  const fullLabel = `${format(date, 'EEEE', { locale })} · ${Math.round(safePercent)}%`;
  const progressStroke = resolveProgressStroke(safePercent);

  const handleClick = () => {
    if (onClick) {
      onClick(date);
    }
  };

  return (
    <button
      type="button"
      className={`group relative flex flex-col items-center gap-1.5 text-white overflow-visible transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
        isSelected ? 'scale-[1.04]' : 'scale-100'
      }`}
      onClick={handleClick}
      title={fullLabel}
      aria-label={fullLabel}
      aria-pressed={isSelected}
    >
      <span className="text-[10px] uppercase tracking-wide text-white/60 group-hover:text-white/80 transition-colors">
        {label}
      </span>
      <div
        className={`relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-shadow duration-200 sm:h-16 sm:w-16 ${
          isToday ? 'ring-2 ring-sky-400/70 ring-offset-2 ring-offset-transparent' : ''
        } ${isSelected ? 'shadow-[0_8px_18px_rgba(56,189,248,0.35)]' : ''}`}
      >
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48" role="presentation">
          <circle
            cx="24"
            cy="24"
            r={PROGRESS_RADIUS}
            fill="none"
            className="stroke-white/10"
            strokeWidth="4"
          />
          <circle
            cx="24"
            cy="24"
            r={PROGRESS_RADIUS}
            fill="none"
            className={`${progressStroke} transition-all duration-300 ease-out`}
            strokeWidth="4"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="relative text-xs font-semibold text-white sm:text-sm">{Math.round(safePercent)}%</span>
        <span className="absolute bottom-1 text-[9px] font-medium text-white/50 sm:text-[10px]">{dayNumber}</span>
        {streakMet ? (
          <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs shadow-lg" aria-hidden>
            🔥
          </span>
        ) : null}
      </div>
    </button>
  );
}

const DayCircle = memo(DayCircleComponent);
DayCircle.displayName = 'DayCircle';

export default DayCircle;

export function DayCircleSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="h-2 w-10 animate-pulse rounded bg-white/10" aria-hidden />
      <div className="relative h-12 w-12 animate-pulse rounded-full bg-white/10 sm:h-16 sm:w-16" />
    </div>
  );
}
