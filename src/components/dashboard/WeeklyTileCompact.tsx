import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, format, isSameDay, parseISO, startOfWeek, type Locale } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from '../../hooks/useTranslation';
import { useWeekContext } from '../../contexts/WeekContext';
import { useTrainingLoadWeek } from '../../hooks/useTrainingLoadWeek';
import { useStore } from '../../store/useStore';
import { db } from '../../firebase';
import { getDayProgressSummary } from '../../utils/progress';
import { todayKey } from '../../lib/date';
import type { Activity, DailyTracking } from '../../types';

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
}

const WEEK_OPTIONS = { weekStartsOn: 1 as const };
const DEFAULT_ACTIVITIES: Activity[] = ['pushups', 'sports', 'water', 'protein'];

function getLocale(language: string) {
  return language === 'de' ? de : enUS;
}

function getWeekLabel(
  start: Date,
  end: Date,
  language: string,
  locale: Locale,
): string {
  const pattern = language === 'de' ? 'd. MMM' : 'MMM d';
  return `${format(start, pattern, { locale })} – ${format(end, pattern, { locale })}`;
}

async function fetchDayDocument(
  userId: string,
  dateKey: string,
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

/**
 * Compact Weekly Tile for Mobile (<481px)
 * Shows arc progress visualization instead of 7 circles
 * Height: ~60px (vs 110px for full version)
 */
const WeeklyTileCompact = memo(function WeeklyTileCompact() {
  const { t, language } = useTranslation();
  const {
    activeWeekStart,
    activeWeekEnd,
    isCurrentWeek,
    setWeekOffset,
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
    [activeWeekEnd, activeWeekStart, language, locale],
  );

  const handleWeekChange = useCallback(
    (direction: 'previous' | 'next') => {
      if (direction === 'next' && isCurrentWeek) {
        return;
      }
      const delta = direction === 'previous' ? -1 : 1;
      setWeekOffset((current) => current + delta);
    },
    [isCurrentWeek, setWeekOffset],
  );

  // Fetch week data from Firebase
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

  // Calculate progress for arc
  const completedDays = useMemo(() => {
    return isLoading ? 0 : days.filter((d) => d.streakMet).length;
  }, [days, isLoading]);

  const percentage = (completedDays / 7) * 100;

  // Get key days (Mon, Wed, Fri, Sun)
  const keyDays = useMemo(() => {
    const weekStart = startOfWeek(activeWeekStart, WEEK_OPTIONS);
    const allDays = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      return { date, index };
    });
    // Indices 0 (Mon), 2 (Wed), 4 (Fri), 6 (Sun)
    return [0, 2, 4, 6].map((idx) => allDays[idx]);
  }, [activeWeekStart]);

  return (
    <div
      className="relative overflow-visible rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-3 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)]"
      data-testid="weekly-tile-compact"
    >
      <div className="relative flex flex-col gap-3">
        {/* Header: Title + Streak */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t('dashboard.weekOverview')}</h3>
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
            <span aria-hidden>🔥</span>
            <span>{weekStats.streakDays}</span>
          </div>
        </div>

        {/* Week Label */}
        <div className="text-xs text-white/60">{weekLabel}</div>

        {/* Arc Progress Visualization */}
        {!isLoading && (
          <div className="flex flex-col items-center gap-2">
            {/* Arc SVG */}
            <svg
              viewBox="0 0 200 120"
              className="h-20 w-full"
              role="img"
              aria-label={`${completedDays} of 7 days complete`}
            >
              {/* Arc background */}
              <path
                d="M 30 100 A 70 70 0 0 1 170 100"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-white/20"
              />

              {/* Arc progress */}
              <defs>
                <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <path
                d="M 30 100 A 70 70 0 0 1 170 100"
                stroke="url(#arcGradient)"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(percentage / 100) * 196} 196`}
                className="transition-all duration-500"
              />

              {/* Center text */}
              <text
                x="100"
                y="115"
                textAnchor="middle"
                className="text-lg font-bold"
                fill="currentColor"
              >
                {completedDays}/7
              </text>
            </svg>

            {/* Key Days Indicators (Mon, Wed, Fri, Sun) */}
            <div className="flex w-full justify-around gap-1">
              {keyDays.map(({ date, index }) => {
                const dayData = days[index];
                const dayName = format(date, 'EEE', { locale }).substring(0, 1);
                const isToday = isSameDay(date, today);
                const isComplete = dayData?.streakMet ?? false;

                return (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div
                      className={`text-xs font-semibold ${isToday ? 'text-emerald-400' : 'text-white/70'}`}
                    >
                      {dayName}
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${
                        isComplete ? 'bg-emerald-500' : 'bg-white/20'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleWeekChange('previous')}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-xs text-white/70 transition-colors hover:border-white/30 hover:text-white"
            aria-label={t('dashboard.previousWeek')}
          >
            <span aria-hidden>‹</span>
          </button>

          <span className="text-xs text-white/60">{isCurrentWeek ? 'This week' : 'Archived'}</span>

          <button
            type="button"
            onClick={() => handleWeekChange('next')}
            disabled={isCurrentWeek}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-xs text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('dashboard.nextWeek')}
          >
            <span aria-hidden>›</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default WeeklyTileCompact;
