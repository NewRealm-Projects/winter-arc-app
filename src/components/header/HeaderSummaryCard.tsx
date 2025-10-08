import { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useWeekContext } from '../../contexts/WeekContext';
import { useCombinedTracking } from '../../hooks/useCombinedTracking';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../store/useStore';
import { calculateStreak } from '../../utils/calculations';
import CheckInModal from '../checkin/CheckInModal';

const DEFAULT_ACTIVITIES: Array<'pushups' | 'sports' | 'water' | 'protein'> = [
  'pushups',
  'sports',
  'water',
  'protein',
];

export default function HeaderSummaryCard() {
  const { t, language } = useTranslation();
  const { activeWeekStart, activeWeekEnd, selectedDate, weekOffset } = useWeekContext();
  const combinedTracking = useCombinedTracking();
  const user = useStore((state) => state.user);

  const [isModalOpen, setModalOpen] = useState(false);

  const locale = language === 'de' ? de : enUS;
  const enabledActivities = user?.enabledActivities ?? DEFAULT_ACTIVITIES;

  const streak = useMemo(() => calculateStreak(combinedTracking, enabledActivities), [
    combinedTracking,
    enabledActivities,
  ]);

  const weekRangeFormat = language === 'de' ? 'd. MMM' : 'MMM d';
  const isoWeekNumber = format(activeWeekStart, 'I');
  const weekHeading = useMemo(() => {
    if (weekOffset === 0) {
      return t('dashboard.weekOverview');
    }
    if (weekOffset === -1) {
      return t('dashboard.lastWeek');
    }
    return t('dashboard.weekNumberTitle', { week: isoWeekNumber });
  }, [isoWeekNumber, t, weekOffset]);
  const weekLabel = useMemo(
    () =>
      `${format(activeWeekStart, weekRangeFormat, { locale })} – ${format(
        activeWeekEnd,
        weekRangeFormat,
        { locale }
      )}`,
    [activeWeekEnd, activeWeekStart, locale, weekRangeFormat]
  );

  const openModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 text-white shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md md:p-6"
      data-testid="header-summary-card"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
      <div className="relative grid gap-4 md:grid-cols-3 md:items-center">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden>
            🔥
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/70">{t('dashboard.streak')}</p>
            <p className="text-3xl font-semibold text-white" data-testid="header-streak-value">
              {streak}
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-1 text-sm md:text-base">
          <span className="font-medium text-white/70">{weekHeading}</span>
          <span className="font-semibold" data-testid="header-week-range">
            {weekLabel}
          </span>
        </div>
        <div className="flex items-stretch md:justify-end">
          <button
            type="button"
            onClick={openModal}
            className="relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-winter-500 via-winter-600 to-winter-700 px-5 text-sm font-semibold shadow-[0_12px_30px_rgba(14,116,144,0.35)] transition-all duration-200 hover:from-winter-400 hover:via-winter-500 hover:to-winter-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-winter-600 md:w-auto"
            aria-haspopup="dialog"
            aria-expanded={isModalOpen}
            aria-controls="daily-check-in-modal"
          >
            <span className="mr-2" aria-hidden>
              📝
            </span>
            {t('dashboard.trainingLoadCheckIn')}
          </button>
        </div>
      </div>
      <CheckInModal dateKey={selectedDate} isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}
