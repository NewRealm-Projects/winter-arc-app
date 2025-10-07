import { memo, useMemo } from 'react';

interface WeekDayCircleProps {
  percent: number;
  isStreak: boolean;
  label: string;
  dayNumber: string;
  isToday?: boolean;
  isSelected?: boolean;
  tooltip?: string;
  onClick: () => void;
}

const PROGRESS_RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

function getProgressStroke(percent: number): string {
  if (percent >= 100) {
    return 'stroke-emerald-400';
  }
  if (percent >= 50) {
    return 'stroke-amber-400';
  }
  return 'stroke-white/25';
}

function WeekDayCircleComponent({
  percent,
  isStreak,
  label,
  dayNumber,
  isToday = false,
  isSelected = false,
  tooltip,
  onClick,
}: WeekDayCircleProps) {
  const safePercent = Number.isFinite(percent) ? Math.max(Math.min(percent, 100), 0) : 0;
  const dashOffset = useMemo(() => {
    return CIRCUMFERENCE - (CIRCUMFERENCE * safePercent) / 100;
  }, [safePercent]);

  const progressStroke = getProgressStroke(safePercent);

  return (
    <button
      type="button"
      className={`group relative flex flex-col items-center gap-1.5 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent transition-transform duration-200 ${
        isSelected ? 'scale-[1.04]' : 'scale-100'
      }`}
      onClick={onClick}
      title={tooltip}
      aria-label={tooltip ?? `${label} ${safePercent}%`}
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
        {isStreak ? (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs shadow-lg">
            🔥
          </span>
        ) : null}
      </div>
    </button>
  );
}

const WeekDayCircle = memo(WeekDayCircleComponent);
WeekDayCircle.displayName = 'WeekDayCircle';

export default WeekDayCircle;
