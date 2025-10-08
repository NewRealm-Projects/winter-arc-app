import { addDays, format, isSameDay } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useMemo } from 'react';
import WeekDayCircle from './WeekDayCircle';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useCombinedTracking } from '../../hooks/useCombinedTracking';
import type { Activity } from '../../types';
import { STREAK_COMPLETION_THRESHOLD } from '../../constants/streak';
import { getDayCompletion } from '../../utils/progress';
import { useWeekContext } from '../../contexts/WeekContext';

const DEFAULT_ACTIVITIES: Activity[] = ['pushups', 'sports', 'water', 'protein'];

export default function WeekCirclesCard() {
  const { t, language } = useTranslation();
  const combinedTracking = useCombinedTracking();
  const user = useStore((state) => state.user);
  const {
    selectedDate,
    setSelectedDate,
    activeWeekStart,
    setWeekOffset,
    isCurrentWeek,
  } = useWeekContext();

  const today = useMemo(() => new Date(), []);
  const locale = language === 'de' ? de : enUS;

  const enabledActivities = useMemo(
    () => user?.enabledActivities ?? DEFAULT_ACTIVITIES,
    [user?.enabledActivities]
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(activeWeekStart, index);
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayTracking = combinedTracking[dateKey];
      const isToday = isSameDay(date, today);
      const isSelected = dateKey === selectedDate;

      const completion = getDayCompletion({
        tracking: dayTracking,
        user,
        enabledActivities,
      });

      const safePercent = Number.isFinite(completion.percent)
        ? completion.percent
        : 0;

      const tooltip = `${format(date, 'EEEE', { locale })} · ${Math.round(
        safePercent
      )}%`;

      return {
        label: format(date, 'EEE', { locale }),
        dayNumber: format(date, 'd'),
        dateKey,
        percent: safePercent,
        isToday,
        isSelected,
        isStreak: safePercent >= STREAK_COMPLETION_THRESHOLD,
        tooltip,
      };
    });
  }, [activeWeekStart, combinedTracking, enabledActivities, locale, selectedDate, today, user]);

  const handleWeekChange = (direction: 'previous' | 'next') => {
    if (direction === 'next' && isCurrentWeek) {
      return;
    }

    const delta = direction === 'previous' ? -1 : 1;
    setWeekOffset((current) => current + delta);
  };

  return (
    <div
      data-testid="week-circles-card"
      className="rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)] p-4 lg:p-5 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            handleWeekChange('previous');
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors"
          aria-label={t('dashboard.previousWeek')}
        >
          <span aria-hidden="true">‹</span>
        </button>

        <div className="flex-1 overflow-hidden">
          <div className="flex flex-nowrap items-center justify-start gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar lg:justify-center">
            {weekDays.map((day) => (
              <div key={day.dateKey} className="flex-shrink-0 snap-center">
                <WeekDayCircle
                  percent={day.percent}
                  isStreak={day.isStreak}
                  label={day.label}
                  dayNumber={day.dayNumber}
                  isToday={day.isToday}
                  isSelected={day.isSelected}
                  tooltip={day.tooltip}
                  onClick={() => {
                    setSelectedDate(day.dateKey);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            handleWeekChange('next');
          }}
          disabled={isCurrentWeek}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={t('dashboard.nextWeek')}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
