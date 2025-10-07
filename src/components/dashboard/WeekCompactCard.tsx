import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  format,
  isAfter,
  isSameDay,
  isValid,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import WeekDayCircle from './WeekDayCircle';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useCombinedTracking } from '../../hooks/useCombinedTracking';
import type { Activity } from '../../types';
import {
  calculateCompletionStreak,
  formatGrams,
  formatMl,
  getDayCompletion,
} from '../../utils/progress';

const DEFAULT_ACTIVITIES: Activity[] = ['pushups', 'sports', 'water', 'protein'];

export default function WeekCompactCard() {
  const { t, language } = useTranslation();
  const combinedTracking = useCombinedTracking();
  const user = useStore((state) => state.user);
  const selectedDate = useStore((state) => state.selectedDate);
  const setSelectedDate = useStore((state) => state.setSelectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const today = useMemo(() => parseISO(todayKey), [todayKey]);
  const activeDate = selectedDate || todayKey;
  const locale = language === 'de' ? de : enUS;
  const localeCode = language === 'de' ? 'de-DE' : 'en-US';

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

  const enabledActivities = useMemo(
    () => user?.enabledActivities ?? DEFAULT_ACTIVITIES,
    [user?.enabledActivities]
  );

  const completionStreak = useMemo(
    () => calculateCompletionStreak(combinedTracking, user, enabledActivities),
    [combinedTracking, enabledActivities, user]
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(displayedWeekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTracking = combinedTracking[dateStr];
      const isToday = isSameDay(date, today);
      const isSelected = dateStr === activeDate;

      const completion = getDayCompletion({
        tracking: dayTracking,
        user,
        enabledActivities,
      });

      const summaryParts: string[] = [];

      if (completion.goals.water > 0) {
        summaryParts.push(
          `💧 ${formatMl(completion.totals.water, {
            locale: localeCode,
            maximumFractionDigits: 1,
          })}/${formatMl(completion.goals.water, {
            locale: localeCode,
            maximumFractionDigits: 1,
          })}L`
        );
      }

      if (completion.goals.protein > 0) {
        summaryParts.push(
          `🥩 ${formatGrams(completion.totals.protein, {
            locale: localeCode,
          })}/${formatGrams(completion.goals.protein, {
            locale: localeCode,
          })}g`
        );
      }

      if (completion.movement.pushupsDone) {
        summaryParts.push('💪');
      }
      if (completion.movement.sportsCount > 0) {
        summaryParts.push('🏃');
      }
      if (!completion.movement.pushupsDone && completion.movement.sportsCount === 0) {
        summaryParts.push('💤');
      }

      const tooltipSummary = summaryParts.join(' · ');
      const tooltipLabel = `${format(date, 'EEEE', { locale })} · ${completion.percent}%${
        tooltipSummary ? `\n${tooltipSummary}` : ''
      }`;

      return {
        label: format(date, 'EEE', { locale }),
        dayNumber: format(date, 'd'),
        date: dateStr,
        percent: completion.percent,
        isToday,
        isSelected,
        isStreak: completion.percent >= 100,
        tooltip: tooltipLabel,
      };
    });
  }, [
    activeDate,
    combinedTracking,
    displayedWeekStart,
    enabledActivities,
    locale,
    localeCode,
    today,
    user,
  ]);

  return (
    <div className="rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)] p-4 lg:p-5 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg lg:text-xl font-semibold text-white mb-0.5">
            {headingLabel}
          </h2>
          <p className="text-xs text-white/70">{t('dashboard.tapToEdit')}</p>
          <p className="text-xs text-white/50 mt-1">
            {t('dashboard.weekRangeLabel', { range: weekRangeLabel })}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              handleWeekChange('previous');
            }}
            className="p-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors"
            aria-label={t('dashboard.previousWeek')}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={() => {
              handleWeekChange('next');
            }}
            disabled={disableNextWeek}
            className="p-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={t('dashboard.nextWeek')}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-7">
        {weekDays.map((day) => (
          <WeekDayCircle
            key={day.date}
            percent={day.percent}
            isStreak={day.isStreak}
            label={day.label}
            dayNumber={day.dayNumber}
            isToday={day.isToday}
            isSelected={day.isSelected}
            tooltip={day.tooltip}
            onClick={() => setSelectedDate(day.date)}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-white/60">
        <span className="flex items-center gap-1">
          <span aria-hidden="true">🔥</span>
          <span>
            {completionStreak} {t('dashboard.streakDays')}
          </span>
        </span>
        <span>{t('dashboard.streakInfo')}</span>
      </div>
    </div>
  );
}
