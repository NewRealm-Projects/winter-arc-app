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
import { db } from '../../firebase';
import type { Activity, DailyTracking } from '../../types';
import { getDayProgressSummary } from '../../utils/progress';
import CheckInModal from '../checkin/CheckInModal';
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
  const document = await getDoc(doc(db, 'tracking', userId, 'days', dateKey));
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
  const trainingLoadMap = useStore((state) => state.trainingLoad);

  const [days, setDays] = useState<WeekDaySummary[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [averagePercent, setAveragePercent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  const locale = useMemo(() => getLocale(language), [language]);

  const today = useMemo(() => parseISO(todayKey()), []);
  const enabledActivities = user?.enabledActivities ?? DEFAULT_ACTIVITIES;

  const activeDateKey = selectedDate ?? format(today, 'yyyy-MM-dd');

  const loadSummary = useMemo(() => {
    const entry = trainingLoadMap[activeDateKey];
    if (!entry) {
      return { score: '—', level: '—' };
    }

    const statusKey: 'low' | 'optimal' | 'high' =
      entry.load >= 600 ? 'high' : entry.load >= 200 ? 'optimal' : 'low';
    return {
      score: `${entry.load}`,
      level: t(`dashboard.trainingLoadStatus.${statusKey}`),
    };
  }, [activeDateKey, trainingLoadMap, t]);

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
      setStreakDays(0);
      setAveragePercent(0);
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

      const streakCount = summaries.reduce(
        (total, day) => (day.streakMet ? total + 1 : total),
        0
      );
      const avgPercent =
        summaries.length > 0
          ? summaries.reduce((total, day) => total + day.percent, 0) / summaries.length
          : 0;

      setDays(summaries);
      setStreakDays(streakCount);
      setAveragePercent(Math.round(avgPercent));
    } catch {
      setDays([]);
      setStreakDays(0);
      setAveragePercent(0);
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

  const openCheckIn = useCallback(() => {
    setIsCheckInOpen(true);
  }, []);

  const closeCheckIn = useCallback(() => {
    setIsCheckInOpen(false);
  }, []);

  const handleCheckInSuccess = useCallback(() => {
    void fetchWeekData();
  }, [fetchWeekData]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 text-white shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md md:p-6"
      data-testid="weekly-tile"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold md:text-xl">{t('dashboard.weekOverview')}</h3>
              <span className="text-sm font-medium text-white/70">
                {t('dashboard.streakDays')}: {streakDays}
              </span>
            </div>
            <div className="text-sm text-white/70">{weekLabel}</div>
          </div>
          <div className="flex items-start md:items-center">
            <button
              type="button"
              onClick={openCheckIn}
              className="relative inline-flex h-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-winter-500 via-winter-600 to-winter-700 px-5 text-sm font-semibold shadow-[0_12px_30px_rgba(14,116,144,0.35)] transition-all duration-200 hover:from-winter-400 hover:via-winter-500 hover:to-winter-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-winter-600"
              aria-haspopup="dialog"
              aria-expanded={isCheckInOpen}
              aria-controls="daily-check-in-modal"
            >
              <span className="mr-2" aria-hidden>
                📝
              </span>
              {t('dashboard.trainingLoadCheckIn')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleWeekChange('previous')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-white/30 hover:text-white"
            aria-label={t('dashboard.previousWeek')}
          >
            <span aria-hidden>‹</span>
          </button>

          <div className="flex-1 overflow-hidden">
            <div className="flex flex-nowrap items-center justify-start gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar lg:justify-center">
              {isLoading
                ? Array.from({ length: 7 }).map((_, index) => (
                    <div key={`skeleton-${index}`} className="flex-shrink-0 snap-center">
                      <DayCircleSkeleton />
                    </div>
                  ))
                : days.map((day) => (
                    <div key={day.dateKey} className="flex-shrink-0 snap-center">
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
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('dashboard.nextWeek')}
          >
            <span aria-hidden>›</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-white/50">
          <span>Ø {averagePercent}%</span>
          <span>
            {t('dashboard.trainingLoad')}: {loadSummary.score} | {loadSummary.level}
          </span>
        </div>
      </div>

      <CheckInModal
        dateKey={activeDateKey}
        isOpen={isCheckInOpen}
        onClose={closeCheckIn}
        onSuccess={handleCheckInSuccess}
      />
    </div>
  );
});

export default WeeklyTile;
