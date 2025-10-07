import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  addWeeks,
  differenceInCalendarWeeks,
  parseISO,
  isValid,
  differenceInCalendarDays,
  isAfter,
} from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import { countActiveSports } from '../../utils/sports';
import { useCombinedTracking } from '../../hooks/useCombinedTracking';

export default function WeekCompactCard() {
  const { t, language } = useTranslation();
  const combinedTracking = useCombinedTracking();
  const selectedDate = useStore((state) => state.selectedDate);
  const setSelectedDate = useStore((state) => state.setSelectedDate);

  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const locale = language === 'de' ? de : enUS;

  const parseActiveDate = () => {
    if (!activeDate) {
      return today;
    }
    const parsed = parseISO(activeDate);
    return isValid(parsed) ? parsed : today;
  };

  const [weekOffset, setWeekOffset] = useState(() => {
    const todayStart = parseISO(todayKey);
    const parsedDate = activeDate ? parseISO(activeDate) : null;
    const validDate = parsedDate && isValid(parsedDate) ? parsedDate : todayStart;
    return differenceInCalendarWeeks(
      startOfWeek(validDate, { weekStartsOn: 1 }),
      startOfWeek(todayStart, { weekStartsOn: 1 }),
      { weekStartsOn: 1 }
    );
  });

  useEffect(() => {
    const todayStart = parseISO(todayKey);
    const parsedDate = activeDate ? parseISO(activeDate) : null;
    const validDate = parsedDate && isValid(parsedDate) ? parsedDate : todayStart;
    const offset = differenceInCalendarWeeks(
      startOfWeek(validDate, { weekStartsOn: 1 }),
      startOfWeek(todayStart, { weekStartsOn: 1 }),
      { weekStartsOn: 1 }
    );
    setWeekOffset(offset);
  }, [activeDate, todayKey]);

  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const displayedWeekStart = addWeeks(currentWeekStart, weekOffset);
  const displayedWeekEnd = addDays(displayedWeekStart, 6);

  const activeDateObj = parseActiveDate();
  const activeWeekStart = startOfWeek(activeDateObj, { weekStartsOn: 1 });
  const activeDayIndex = Math.min(
    Math.max(differenceInCalendarDays(activeDateObj, activeWeekStart), 0),
    6
  );

  const weekRangeFormat = language === 'de' ? 'd. MMM' : 'MMM d';
  const weekRangeLabel = `${format(displayedWeekStart, weekRangeFormat, { locale })} – ${format(
    displayedWeekEnd,
    weekRangeFormat,
    { locale }
  )}`;

  const isoWeekNumber = format(displayedWeekStart, 'I');
  const headingLabel = (() => {
    if (weekOffset === 0) {
      return t('dashboard.weekOverview');
    }
    if (weekOffset === -1) {
      return t('dashboard.lastWeek');
    }
    return t('dashboard.weekNumberTitle', { week: isoWeekNumber });
  })();

  const disableNextWeek = weekOffset >= 0;

  const handleWeekChange = (direction: 'previous' | 'next') => {
    if (direction === 'next' && disableNextWeek) {
      return;
    }

    const delta = direction === 'previous' ? -1 : 1;
    const newWeekOffset = weekOffset + delta;
    const newWeekStart = addWeeks(displayedWeekStart, delta);
    const targetDate = addDays(newWeekStart, activeDayIndex);

    const safeTargetDate =
      newWeekOffset === 0 && isAfter(targetDate, today) ? today : targetDate;

    setWeekOffset(newWeekOffset);
    setSelectedDate(format(safeTargetDate, 'yyyy-MM-dd'));
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(displayedWeekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTracking = combinedTracking[dateStr] || {};
    const isToday = isSameDay(date, today);
    const isSelected = dateStr === activeDate;

    // Check what's completed
    const hasPushups = (dayTracking.pushups?.total || 0) > 0;
    const hasSports = countActiveSports(dayTracking.sports) > 0;
    const hasWater = (dayTracking.water || 0) >= 2000;
    const hasProtein = (dayTracking.protein || 0) >= 100;

    const tasksCompleted = [hasPushups, hasSports, hasWater, hasProtein].filter(Boolean).length;
    const isDone = tasksCompleted >= 3;

    return {
      label: format(date, 'EEE', { locale }),
      date: dateStr,
      isToday,
      done: isDone,
      tasksCompleted,
      isSelected,
    };
  });

  return (
    <div className="rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)] p-4 lg:p-5 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg lg:text-xl font-semibold text-white mb-0.5">
            {headingLabel}
          </h2>
          <p className="text-xs text-white/70">
            {t('dashboard.tapToEdit')}
          </p>
          <p className="text-xs text-white/50 mt-1">
            {t('dashboard.weekRangeLabel', { range: weekRangeLabel })}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => { handleWeekChange('previous'); }}
            className="p-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors"
            aria-label={t('dashboard.previousWeek')}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={() => { handleWeekChange('next'); }}
            disabled={disableNextWeek}
            className="p-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={t('dashboard.nextWeek')}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      {/* Week Days Chips - Grid Layout (7 equal columns) */}
      <div className="grid grid-cols-7 gap-1 lg:gap-1.5">
        {weekDays.map((day) => {
          let chipClasses = 'flex items-center justify-center h-9 rounded-full border text-xs sm:text-sm font-medium transition-all cursor-pointer select-none';

          if (day.done) {
            // Completed: glow effect
            chipClasses += ' bg-emerald-500/20 border-emerald-400/70 text-emerald-100 shadow-[inset_0_0_14px_rgba(16,185,129,0.45)]';
          } else if (day.tasksCompleted > 0) {
            // Partial: amber ring
            chipClasses += ' bg-white/6 border-amber-400/60 text-amber-200';
          } else {
            // Empty
            chipClasses += ' bg-white/6 border-white/10 text-white/60';
          }

          if (day.isToday) {
            // Today: accent ring
            chipClasses += ' ring-2 ring-sky-400/70 ring-offset-2 ring-offset-transparent';
          }

          if (day.isSelected) {
            chipClasses += ' scale-105';
          }

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={chipClasses}
              title={`${day.label} - ${day.tasksCompleted}/4 ${t('dashboard.tasks')}`}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
