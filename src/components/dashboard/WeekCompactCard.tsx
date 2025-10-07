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
  const user = useStore((state) => state.user);
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

  const enabledActivities = user?.enabledActivities || ['pushups', 'sports', 'water', 'protein'];
  const totalTasks = enabledActivities.length + 1; // +1 for weight
  const requiredTasks = Math.ceil(totalTasks * 0.6);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(displayedWeekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTracking = combinedTracking[dateStr] || {};
    const isToday = isSameDay(date, today);
    const isSelected = dateStr === activeDate;

    // Check what's completed based on enabled activities
    const completedList = [];

    if (enabledActivities.includes('pushups') && (dayTracking?.pushups?.total || 0) > 0) {
      completedList.push('pushups');
    }
    if (enabledActivities.includes('sports') && countActiveSports(dayTracking.sports) > 0) {
      completedList.push('sports');
    }
    if (enabledActivities.includes('water') && (dayTracking.water || 0) >= 2000) {
      completedList.push('water');
    }
    if (enabledActivities.includes('protein') && (dayTracking?.protein || 0) >= 100) {
      completedList.push('protein');
    }
    // Weight is always tracked
    if (dayTracking.weight?.value) {
      completedList.push('weight');
    }

    const tasksCompleted = completedList.length;
    const isDone = tasksCompleted >= requiredTasks;

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
            onClick={() => handleWeekChange('previous')}
            className="p-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors"
            aria-label={t('dashboard.previousWeek')}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={() => handleWeekChange('next')}
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
              title={`${day.label} - ${day.tasksCompleted}/${totalTasks} ${t('dashboard.tasks')}`}
            >
              {day.label}
            </button>
          );
        })}
      </div>

      {/* Week Progress Circles */}
      <div className="mt-3 grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const progress = (day.tasksCompleted / totalTasks) * 100; // Dynamic total tasks

          return (
            <div key={day.date} className="flex flex-col items-center gap-0.5">
              {/* Progress Circle */}
              <div className="w-8 h-8 relative">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className="stroke-white/20"
                    strokeWidth="3"
                  />
                  {/* Progress circle */}
                  {progress > 0 && (
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className={`${
                        day.done
                          ? 'stroke-emerald-400'
                          : day.tasksCompleted > 0
                          ? 'stroke-amber-400'
                          : 'stroke-white/40'
                      } ${day.isToday ? 'drop-shadow-[0_0_4px_rgba(96,165,250,0.8)]' : ''}`}
                      strokeWidth="3"
                      strokeDasharray={`${progress} 100`}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                {/* Task count */}
                <div
                  className={`absolute inset-0 flex items-center justify-center text-[10px] font-semibold ${
                    day.isToday
                      ? 'text-sky-400'
                      : 'text-white'
                  }`}
                >
                  {day.tasksCompleted}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
