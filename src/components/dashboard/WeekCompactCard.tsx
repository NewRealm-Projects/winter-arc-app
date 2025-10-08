import { addDays, format, isSameDay } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useMemo } from 'react';
import WeekDayCircle from './WeekDayCircle';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useCombinedTracking } from '../../hooks/useCombinedTracking';
import type { Activity } from '../../types';
import { STREAK_COMPLETION_THRESHOLD } from '../../constants/streak';
import {
  calculateCompletionStreak,
  formatGrams,
  formatMl,
  getDayCompletion,
} from '../../utils/progress';
import { useWeekContext } from '../../contexts/WeekContext';

const DEFAULT_ACTIVITIES: Activity[] = ['pushups', 'sports', 'water', 'protein'];

export default function WeekCompactCard() {
  const { t, language } = useTranslation();
  const combinedTracking = useCombinedTracking();
  const user = useStore((state) => state.user);
  const {
    selectedDate,
    setSelectedDate,
    activeWeekStart,
    activeWeekEnd,
    weekOffset,
    setWeekOffset,
    isCurrentWeek,
  } = useWeekContext();
  const today = useMemo(() => new Date(), []);
  const locale = language === 'de' ? de : enUS;
  const localeCode = language === 'de' ? 'de-DE' : 'en-US';

  const weekRangeFormat = language === 'de' ? 'd. MMM' : 'MMM d';
  const weekRangeLabel = `${format(activeWeekStart, weekRangeFormat, { locale })} – ${format(
    activeWeekEnd,
    weekRangeFormat,
    { locale }
  )}`;

  const isoWeekNumber = format(activeWeekStart, 'I');
  const headingLabel = (() => {
    if (weekOffset === 0) {
      return t('dashboard.weekOverview');
    }
    if (weekOffset === -1) {
      return t('dashboard.lastWeek');
    }
    return t('dashboard.weekNumberTitle', { week: isoWeekNumber });
  })();

  const disableNextWeek = isCurrentWeek;

  const handleWeekChange = (direction: 'previous' | 'next') => {
    if (direction === 'next' && disableNextWeek) {
      return;
    }

    const delta = direction === 'previous' ? -1 : 1;
    setWeekOffset((previous) => previous + delta);
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
      const date = addDays(activeWeekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTracking = combinedTracking[dateStr];
      const isToday = isSameDay(date, today);
      const isSelected = dateStr === selectedDate;

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
        isStreak: completion.percent >= STREAK_COMPLETION_THRESHOLD,
        tooltip: tooltipLabel,
      };
    });
  }, [
    combinedTracking,
    selectedDate,
    activeWeekStart,
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

      <div
        className="mt-4 flex flex-nowrap items-center justify-center gap-2 overflow-x-auto scroll-smooth no-scrollbar sm:grid sm:grid-cols-7 sm:items-stretch sm:justify-start sm:overflow-visible sm:gap-3"
      >
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
