import { useState, useMemo, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { useCombinedDailyTracking } from '../hooks/useCombinedTracking';
import { useTrainingLoadWeek } from '../hooks/useTrainingLoadWeek';
import { useWeeklyTrainingLoadSubscription } from '../hooks/useWeeklyTrainingLoadSubscription';
import { getTileClasses, designTokens } from '../theme/tokens';
import { normalizeSports, countActiveSports } from '../utils/sports';
import type { SportKey, SportEntry } from '../types';
import CheckInModal from './checkin/CheckInModal';
import TrainingLoadGraph from './TrainingLoadGraph';
import { AppModal } from './ui/AppModal';

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
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);
  const trainingLoadMap = useStore((state) => state.trainingLoad);
  const checkIns = useStore((state) => state.checkIns);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [showSportModal, setShowSportModal] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportKey>('hiit');
  const [duration, setDuration] = useState<number>(60);
  const [intensity, setIntensity] = useState<number>(5);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate ?? todayKey;
  const activeTracking = tracking[activeDate];

  // Subscribe to training load for all 7 days of current week
  useWeeklyTrainingLoadSubscription(selectedDate ? new Date(selectedDate) : new Date());

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
  const currentSports: Record<SportKey, SportEntry> = useMemo(
    () => normalizeSports(activeTracking?.sports),
    [activeTracking?.sports]
  );
  const displaySports = useMemo(
    () => normalizeSports(combinedDaily?.sports),
    [combinedDaily?.sports]
  );

  const [draftSports, setDraftSports] = useState<Record<SportKey, SportEntry>>(currentSports);

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

  // Sport Modal Functions
  const updateDraftSport = useCallback(
    (sport: SportKey, updates: Partial<SportEntry>) => {
      setDraftSports((prev) => ({
        ...prev,
        [sport]: {
          ...prev[sport],
          ...updates,
        },
      }));
    },
    []
  );

  const toggleSportActive = useCallback(
    (sport: SportKey, nextActive: boolean) => {
      setDraftSports((prev) => {
        const previous = prev[sport];
        const updated: SportEntry = {
          ...previous,
          active: nextActive,
        };

        if (sport === 'rest') {
          updated.duration = undefined;
          updated.intensity = undefined;
        } else if (nextActive) {
          updated.duration = previous.duration ?? 60;
          updated.intensity = previous.intensity ?? 5;
        } else {
          updated.duration = undefined;
          updated.intensity = undefined;
        }

        return {
          ...prev,
          [sport]: updated,
        };
      });
    },
    []
  );

  const saveSports = () => {
    updateDayTracking(activeDate, {
      sports: {
        ...activeTracking?.sports,
        ...draftSports,
      },
    });
    setShowSportModal(false);
  };

  const removeSport = () => {
    updateDraftSport(selectedSport, { active: false, duration: undefined, intensity: undefined });
  };

  const handleManageSports = () => {
    const fallbackSport = activeSportOptions[0]?.key ?? 'hiit';
    setDraftSports(normalizeSports(currentSports));
    setSelectedSport(fallbackSport);
    setShowSportModal(true);
  };

  // Sync draft sports and form fields
  useEffect(() => {
    if (!showSportModal) {
      return;
    }

    setDraftSports(normalizeSports(currentSports));
  }, [showSportModal, currentSports]);

  useEffect(() => {
    if (!showSportModal) {
      return;
    }

    const sportData = draftSports[selectedSport as keyof typeof draftSports];
    if (selectedSport === 'rest') {
      return;
    }

    setDuration(sportData.duration ?? 60);
    setIntensity(sportData.intensity ?? 5);
  }, [showSportModal, selectedSport, draftSports]);

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
          <button
            type="button"
            onClick={handleManageSports}
            className="w-full rounded-lg border border-blue-500/40 bg-blue-600/20 py-1.5 text-xs font-medium text-blue-100 transition-colors hover:bg-blue-600/30"
          >
            {t('tracking.manageSports')}
          </button>
        </div>
      </div>

      <CheckInModal
        dateKey={activeDate}
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
      />

      {/* Sport Management Modal */}
      <AppModal
        open={showSportModal}
        onClose={() => setShowSportModal(false)}
        title={t('tracking.manageSports')}
        size="md"
      >
        <div className="space-y-4">
          {/* Sport Selection Grid */}
          <div>
            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-2">
              {t('tracking.chooseSport')}
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              {sportOptions.map((sport) => {
                const isSelected = sport.key === selectedSport;
                const isActive = draftSports[sport.key]?.active ?? false;

                return (
                  <label
                    key={sport.key}
                    className={`relative p-2 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                      isActive
                        ? 'border-emerald-400 bg-emerald-100 dark:bg-emerald-600/30 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]'
                        : isSelected
                          ? 'border-blue-400 bg-blue-100 dark:bg-blue-600/30 shadow-inner'
                          : 'border-gray-200 dark:border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                    } ${isSelected && isActive ? 'ring-1 ring-emerald-300/60' : ''}`}
                    onClick={() => {
                      setSelectedSport(sport.key);
                    }}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isActive}
                      onChange={(event) => {
                        toggleSportActive(sport.key, event.target.checked);
                        setSelectedSport(sport.key);
                      }}
                      onFocus={() => {
                        setSelectedSport(sport.key);
                      }}
                    />
                    {isActive && (
                      <div className="absolute top-1 right-1 text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                        {t('tracking.trackedLabel')}
                      </div>
                    )}
                    <div className="text-xl">{sport.icon}</div>
                    <div className="text-xs text-gray-800 dark:text-white/80 font-medium">
                      {sport.label}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rest Day or Sport Details */}
          {selectedSport === 'rest' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('tracking.restDescription')}
              </p>
              <button
                onClick={() => {
                  const nextActive = !(draftSports.rest?.active ?? false);
                  toggleSportActive('rest', nextActive);
                }}
                className={`w-full px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  draftSports.rest?.active
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/30 dark:text-red-100 dark:hover:bg-red-500/40'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {draftSports.rest?.active ? t('tracking.unsetRestDay') : t('tracking.setRestDay')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Duration */}
              <div>
                <label className="block text-xs text-gray-700 dark:text-gray-300 mb-2">
                  {t('tracking.duration')} ({t('tracking.minutes')})
                </label>
                <div className="flex gap-2 mb-2">
                  {[30, 60, 90].map((min) => (
                    <button
                      key={min}
                      onClick={() => {
                        setDuration(min);
                        updateDraftSport(selectedSport, { duration: min, active: true });
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        duration === min
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20'
                      }`}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setDuration(value);
                    updateDraftSport(selectedSport, { duration: value, active: true });
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400 outline-none dark:border-white/20 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
                  placeholder="Custom"
                />
              </div>

              {/* Intensity */}
              <div>
                <label className="block text-xs text-gray-700 dark:text-gray-300 mb-2">
                  {t('tracking.intensity')} (1-10)
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setIntensity(level);
                        updateDraftSport(selectedSport, { intensity: level, active: true });
                      }}
                      className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                        intensity === level
                          ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white scale-110'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {selectedSport !== 'rest' && (draftSports[selectedSport]?.active ?? false) && (
              <button
                onClick={removeSport}
                className="flex-1 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-600/30 dark:text-red-200 dark:hover:bg-red-600/50 transition-colors"
              >
                {t('tracking.remove')}
              </button>
            )}
            <button
              onClick={saveSports}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('tracking.save')}
            </button>
          </div>
        </div>
      </AppModal>
    </>
  );
}

export default UnifiedTrainingCard;
