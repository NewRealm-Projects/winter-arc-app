'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { useCombinedDailyTracking } from '../hooks/useCombinedTracking';
import { useTrainingLoadWeek } from '../hooks/useTrainingLoadWeek';
import { useWeeklyTrainingLoadSubscription } from '../hooks/useWeeklyTrainingLoadSubscription';
import { useCheckInSubscription } from '../hooks/useCheckInSubscription';
import { getTileClasses, designTokens } from '../theme/tokens';
import { normalizeSports, countActiveSports } from '../utils/sports';
import type { SportKey } from '../types';
import CheckInModal from './checkin/CheckInModal';
import TrainingLoadGraph from './TrainingLoadGraph';

const SPORT_OPTION_CONFIG: Array<{ key: SportKey; labelKey: string; icon: string }> = [
  { key: 'hiit', labelKey: 'tracking.hiit', icon: '🔥' },
  { key: 'cardio', labelKey: 'tracking.cardio', icon: '🏃' },
  { key: 'gym', labelKey: 'tracking.gym', icon: '🏋️' },
  { key: 'schwimmen', labelKey: 'tracking.swimming', icon: '🏊' },
  { key: 'soccer', labelKey: 'tracking.soccer', icon: '⚽' },
  { key: 'rest', labelKey: 'tracking.rest', icon: '😴' },
];

const clampNumber = (value: number | undefined, fallback: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return value;
};

const formatScore = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};

function UnifiedTrainingCard() {
  const { t } = useTranslation();
  const tracking = useStore((state) => state.tracking);
  const selectedDate = useStore((state) => state.selectedDate);
  const trainingLoadMap = useStore((state) => state.trainingLoad);
  const checkIns = useStore((state) => state.checkIns);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate ?? todayKey;

  // Subscribe to training load for all 7 days of current week
  useWeeklyTrainingLoadSubscription(selectedDate ? new Date(selectedDate) : new Date());

  // Subscribe to check-in data for the active date when enabled
  useCheckInSubscription(activeDate);

  // Weekly statistics
  const weekStats = useTrainingLoadWeek();

  // Daily tracking data
  const combinedDaily = useCombinedDailyTracking(activeDate);
  const manualDaily = Object.prototype.hasOwnProperty.call(tracking, activeDate)
    ? tracking[activeDate]
    : undefined;
  const aggregatedTracking = combinedDaily ?? manualDaily;
  const aggregatedRecovery = aggregatedTracking?.recovery;

  // Current day training load
  const storedTrainingLoad = trainingLoadMap[activeDate];
  const checkIn = checkIns[activeDate];

  const sleepScore = checkIn?.sleepScore ?? clampNumber(aggregatedRecovery?.sleepQuality, 5);
  const recoveryScore = checkIn?.recoveryScore ?? clampNumber(aggregatedRecovery?.recovery, 5);

  const loadValue = storedTrainingLoad?.load ?? 0;

  const recoveryTracked =
    storedTrainingLoad !== undefined ||
    checkIn !== undefined ||
    aggregatedRecovery?.sleepQuality !== undefined ||
    aggregatedRecovery?.recovery !== undefined;

  const hasData = recoveryTracked;

  // Sport data
  const displaySports = useMemo(
    () => normalizeSports(combinedDaily?.sports),
    [combinedDaily?.sports]
  );


  const sportOptions = useMemo(
    () =>
      SPORT_OPTION_CONFIG.map((config) => ({
        ...config,
        label: t(config.labelKey),
      })),
    [t]
  );

  const activeSportOptions = useMemo(
    () => sportOptions.filter((option) => displaySports[option.key].active),
    [displaySports, sportOptions]
  );

  const activeSportsCount = countActiveSports(displaySports);

  const sleepDisplay = recoveryTracked ? `${formatScore(sleepScore)}/10` : '—';
  const recoveryDisplay = recoveryTracked ? `${formatScore(recoveryScore)}/10` : '—';

  const badgeColorClass =
    weekStats.badgeLevel === 'high'
      ? 'bg-red-500/20 text-red-300 border-red-500/40'
      : weekStats.badgeLevel === 'optimal'
        ? 'bg-green-500/20 text-green-300 border-green-500/40'
        : 'bg-blue-500/20 text-blue-300 border-blue-500/40';


  return (
    <>
      <div
        className={`w-full ${getTileClasses(hasData)} ${designTokens.padding.compact} text-white`}
        data-testid="unified-training-card"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>
              💪
            </span>
            <h3 className="text-sm font-semibold text-gray-100/90 dark:text-gray-100/80">
              {t('dashboard.training')}
            </h3>
            <span
              className={`ml-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeColorClass}`}
            >
              {t(`dashboard.trainingLoadStatus.${weekStats.badgeLevel}`)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCheckInOpen(true)}
            className="relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:bg-[var(--accent-primary-hover)] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-primary)]"
            aria-haspopup="dialog"
            aria-expanded={isCheckInOpen}
            aria-controls="daily-check-in-modal"
          >
            <span className="mr-1.5" aria-hidden>
              📝
            </span>
            {t('dashboard.trainingLoadCheckIn')}
          </button>
        </div>

        {/* Subheader: Weekly Summary */}
        <div className="mb-3 flex items-center gap-4 text-[11px] text-gray-100/70">
          <span>
            {t('dashboard.streakDays')}: <strong>{weekStats.streakDays}</strong>
          </span>
          <span>
            Ø {t('dashboard.completion')}: <strong>{weekStats.averagePercent}%</strong>
          </span>
        </div>

        {/* Section A: Training Load Graph */}
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between text-[11px] text-gray-100/80">
            <span className="font-medium">{t('dashboard.trainingLoad')}</span>
            <span className="font-bold text-winter-300">{loadValue}</span>
          </div>
          <TrainingLoadGraph height={100} />
        </div>

        {/* Current Day Stats */}
        <div className="mb-3 grid grid-cols-2 gap-2 text-[10px] text-gray-100/80">
          <div className="rounded-lg bg-white/10 px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wide text-gray-100/60">
              {t('dashboard.trainingLoadSleep')}
            </div>
            <div className="font-semibold text-gray-50 dark:text-white">{sleepDisplay}</div>
          </div>
          <div className="rounded-lg bg-white/10 px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wide text-gray-100/60">
              {t('dashboard.trainingLoadRecovery')}
            </div>
            <div className="font-semibold text-gray-50 dark:text-white">{recoveryDisplay}</div>
          </div>
        </div>

        {/* Section B: Sport Status */}
        <div className="mb-1">
          <div className="mb-2 flex items-center justify-between text-[11px] text-gray-100/80">
            <span className="font-medium">
              {t('tracking.sport')} ({activeSportsCount})
            </span>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2 min-h-[32px]">
            {activeSportOptions.length > 0 ? (
              activeSportOptions.map((sport) => (
                <span key={sport.key} className="text-2xl leading-none" title={sport.label}>
                  {sport.icon}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">
                {t('tracking.noSportsTracked')}
              </span>
            )}
          </div>
        </div>
      </div>

      <CheckInModal
        dateKey={activeDate}
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
      />
    </>
  );
}

export default UnifiedTrainingCard;
