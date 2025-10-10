import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDays,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  type Locale,
} from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { doc, getDoc } from 'firebase/firestore';
import DayCircle, { DayCircleSkeleton } from '../ui/DayCircle';
import { useTranslation } from '../../hooks/useTranslation';
import { useWeekContext } from '../../contexts/WeekContext';
import { useStore } from '../../store/useStore';
import { useTrainingLoadWeek } from '../../hooks/useTrainingLoadWeek';
import { db } from '../../firebase';
import type { Activity, DailyTracking } from '../../types';
import { getDayProgressSummary } from '../../utils/progress';
import { todayKey } from '../../lib/date';

interface DayDocument extends Partial<DailyTracking> {
  readonly dayProgressPct?: number;
  readonly dayStreakMet?: boolean;
  readonly tasksCompleted?: number;
  readonly tasksTotal?: number;
}

type WeekDaySummary = {
  readonly date: Date;
  readonly dateKey: string;
  readonly percent: number;
  readonly streakMet: boolean;
  readonly tasksCompleted: number;
  readonly tasksTotal: number;
};

const WEEK_OPTIONS = { weekStartsOn: 1 as const };
const DEFAULT_ACTIVITIES: Activity[] = ['pushups', 'sports', 'water', 'protein'];

function getLocale(language: string) {
  return language === 'de' ? de : enUS;
}

async function fetchDayDocument(
  userId: string,
  dateKey: string
): Promise<DayDocument | null> {
  const document = await getDoc(doc(db, 'tracking', userId, 'entries', dateKey));
  if (!document.exists()) {
    return null;
  }
  return document.data() as DayDocument;
}

function buildWeekDays(weekStart: Date): Array<{ date: Date; key: string }> {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return { date, key: format(date, 'yyyy-MM-dd') };
  });
}

function getWeekLabel(
  start: Date,
  end: Date,
  language: string,
  locale: Locale
): string {
  const pattern = language === 'de' ? 'd. MMM' : 'MMM d';
  return `${format(start, pattern, { locale })} – ${format(end, pattern, { locale })}`;
}

const WeeklyTile = memo(function WeeklyTile() {
  const { t, language } = useTranslation();
  const {
    activeWeekStart,
    activeWeekEnd,
    isCurrentWeek,
    setWeekOffset,
    selectedDate,
    setSelectedDate,
  } = useWeekContext();
  const user = useStore((state) => state.user);
  const weekStats = useTrainingLoadWeek();

  const [days, setDays] = useState<WeekDaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const locale = useMemo(() => getLocale(language), [language]);

  const today = useMemo(() => parseISO(todayKey()), []);
  const enabledActivities = user?.enabledActivities ?? DEFAULT_ACTIVITIES;

  const weekLabel = useMemo(
    () => getWeekLabel(activeWeekStart, activeWeekEnd, language, locale),
    [activeWeekEnd, activeWeekStart, language, locale]
  );

  const handleWeekChange = useCallback(
    (direction: 'previous' | 'next') => {
      if (direction === 'next' && isCurrentWeek) {
        return;
      }
      const delta = direction === 'previous' ? -1 : 1;
      setWeekOffset((current) => current + delta);
    },
    [isCurrentWeek, setWeekOffset]
  );

  const fetchWeekData = useCallback(async () => {
    if (!user?.id) {
      setDays([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const weekStart = startOfWeek(activeWeekStart, WEEK_OPTIONS);
      const weekDays = buildWeekDays(weekStart);
      const summaries = await Promise.all(
        weekDays.map(async ({ date, key }) => {
          const tracking = await fetchDayDocument(user.id, key);
          const summary = getDayProgressSummary({
            tracking: tracking ?? undefined,
            user,
            enabledActivities,
          });
          const percent = typeof tracking?.dayProgressPct === 'number'
            ? Math.round(tracking.dayProgressPct)
            : summary.percent;
          const streakMet = typeof tracking?.dayStreakMet === 'boolean'
            ? tracking.dayStreakMet
            : summary.streakMet;
          const tasksCompleted = typeof tracking?.tasksCompleted === 'number'
            ? tracking.tasksCompleted
            : summary.tasksCompleted;
          const tasksTotal = typeof tracking?.tasksTotal === 'number'
            ? tracking.tasksTotal
            : summary.tasksTotal;
          return {
            date,
            dateKey: key,
            percent,
            streakMet,
            tasksCompleted,
            tasksTotal,
          } satisfies WeekDaySummary;
        })
      );

      setDays(summaries);
    } catch {
      setDays([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeWeekStart, enabledActivities, user]);

  useEffect(() => {
    void fetchWeekData();
  }, [fetchWeekData]);

  const handleSelectDay = useCallback(
    (dateKey: string) => {
      setSelectedDate(dateKey);
    },
    [setSelectedDate]
  );

  return (
    <div
      className="relative overflow-visible rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-4 text-white shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] md:p-6"
      data-testid="weekly-tile"
    >
      <div className="relative flex flex-col gap-4">
        {/* Header: Title + Week Range + Streak */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold md:text-xl">{t('dashboard.weekOverview')}</h3>
            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
              <span aria-hidden>🔥</span>
              <span>{weekStats.streakDays} {t('dashboard.streakDays')}</span>
            </div>
          </div>
          <div className="text-sm text-white/70">{weekLabel}</div>
        </div>

        {/* Navigation + Day Circles */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleWeekChange('previous')}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-white/30 hover:text-white"
            aria-label={t('dashboard.previousWeek')}
          >
            <span aria-hidden>‹</span>
          </button>

          {/* Circle Container - Fixed Clipping */}
          <div className="flex-1 overflow-x-auto overflow-y-visible">
            <div className="flex flex-nowrap items-center justify-start gap-2 min-w-max px-3 py-2 lg:justify-center">
              {isLoading
                ? Array.from({ length: 7 }).map((_, index) => (
                    <div key={`skeleton-${index}`} className="flex-shrink-0">
                      <DayCircleSkeleton />
                    </div>
                  ))
                : days.map((day) => (
                    <div key={day.dateKey} className="flex-shrink-0 min-w-[60px]">
                      <DayCircle
                        date={day.date}
                        percent={day.percent}
                        streakMet={day.streakMet}
                        isToday={isSameDay(day.date, today)}
                        isSelected={day.dateKey === selectedDate}
                        onClick={() => handleSelectDay(day.dateKey)}
                        locale={locale}
                      />
                    </div>
                  ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleWeekChange('next')}
            disabled={isCurrentWeek}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('dashboard.nextWeek')}
          >
            <span aria-hidden>›</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default WeeklyTile;
