import { useMemo } from 'react';
import { computeTrainingLoad, type DayRecovery, type DaySession } from '../logic/trainingLoad';
import { useCombinedDailyTracking } from '../hooks/useCombinedTracking';
import { useStore } from '../store/useStore';
import { getTileClasses, designTokens } from '../theme/tokens';
import { normalizeSports } from '../utils/sports';
import { useTranslation } from '../hooks/useTranslation';

const MAX_TRAINING_LOAD = 1500;

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

function buildSessions(
  sportsSource: Parameters<typeof normalizeSports>[0]
): DaySession[] {
  const normalized = normalizeSports(sportsSource);

  return Object.entries(normalized).reduce<DaySession[]>((sessions, [key, entry]) => {
    if (!entry.active) {
      return sessions;
    }

    const duration = clampNumber(entry.duration, 0);
    const intensity = clampNumber(entry.intensity, 0);

    if (duration <= 0 || intensity <= 0) {
      return sessions;
    }

    sessions.push({
      type: key,
      duration,
      intensity,
    });

    return sessions;
  }, []);
}

function TrainingLoadTile() {
  const { t } = useTranslation();
  const tracking = useStore((state) => state.tracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const activeDate = selectedDate ?? new Date().toISOString().split('T')[0];
  const combinedDaily = useCombinedDailyTracking(activeDate);
  const manualDaily = tracking[activeDate];

  const recoverySource = manualDaily?.recovery ?? combinedDaily?.recovery;
  const sessions = useMemo(
    () => buildSessions(combinedDaily?.sports ?? manualDaily?.sports),
    [combinedDaily?.sports, manualDaily?.sports]
  );

  const pushupsTotal = clampNumber(
    combinedDaily?.pushups?.total ?? manualDaily?.pushups?.total,
    0
  );

  const sleepQuality = clampNumber(recoverySource?.sleepQuality, 5);
  const recoveryScore = clampNumber(recoverySource?.recovery, 5);
  const illness = Boolean(recoverySource?.illness);

  const recoveryTracked =
    recoverySource?.sleepQuality !== undefined || recoverySource?.recovery !== undefined;
  const pushupsTracked = pushupsTotal > 0;
  const sportsTracked = sessions.length > 0;

  const loadInput: DayRecovery = {
    sleepQuality,
    recovery: recoveryScore,
    illness,
    sessions,
    pushupsTotal,
  };

  const trainingLoad = computeTrainingLoad(loadInput);
  const percent = Math.min(
    100,
    Math.max(0, Math.round((trainingLoad / MAX_TRAINING_LOAD) * 100))
  );

  const statusKey: 'low' | 'optimal' | 'high' = trainingLoad >= 900 ? 'high' : trainingLoad >= 300 ? 'optimal' : 'low';
  const statusLabel = t(`dashboard.trainingLoadStatus.${statusKey}`);
  const hasData = recoveryTracked || pushupsTracked || sportsTracked;
  const description = hasData
    ? t('dashboard.trainingLoadSubtitle')
    : t('dashboard.trainingLoadNoData');

  const totalDuration = sessions.reduce((total, session) => total + session.duration, 0);
  const workoutsDisplay = sportsTracked
    ? `${sessions.length} · ${Math.round(totalDuration)} min`
    : '—';
  const sleepDisplay = recoveryTracked ? `${formatScore(sleepQuality)}/10` : '—';
  const recoveryDisplay = recoveryTracked ? `${formatScore(recoveryScore)}/10` : '—';
  const pushupDisplay = pushupsTracked ? `${pushupsTotal}` : '—';

  return (
    <div
      className={`w-full ${getTileClasses(hasData)} ${designTokens.padding.compact} text-left text-white`}
      data-testid="training-load-tile"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>
            📈
          </span>
          <h3 className="text-xs font-medium text-gray-100/80 dark:text-gray-100/70">
            {t('dashboard.trainingLoad')}
          </h3>
        </div>
        <div className="text-sm font-bold text-winter-50 dark:text-winter-300">
          {trainingLoad}
        </div>
      </div>

      <p className="text-[11px] text-gray-100/70 dark:text-gray-100/60 mb-3">{description}</p>

      <div className="mt-1">
        <div className="flex items-center justify-between text-[11px] font-medium text-gray-100/80 mb-1">
          <span>{statusLabel}</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-winter-400 via-winter-500 to-winter-600 transition-all duration-500"
            style={{ width: `${percent}%` }}
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-gray-100/80">
        <div className="rounded-xl bg-white/10 px-2 py-2">
          <div className="text-[9px] uppercase tracking-wide text-gray-100/60">
            {t('dashboard.trainingLoadSleep')}
          </div>
          <div
            className="font-semibold text-gray-50 dark:text-white"
            data-testid="training-load-sleep-value"
          >
            {sleepDisplay}
          </div>
        </div>
        <div className="rounded-xl bg-white/10 px-2 py-2">
          <div className="text-[9px] uppercase tracking-wide text-gray-100/60">
            {t('dashboard.trainingLoadRecovery')}
          </div>
          <div
            className="font-semibold text-gray-50 dark:text-white"
            data-testid="training-load-recovery-value"
          >
            {recoveryDisplay}
          </div>
        </div>
        <div className="rounded-xl bg-white/10 px-2 py-2">
          <div className="text-[9px] uppercase tracking-wide text-gray-100/60">
            {t('dashboard.trainingLoadWorkouts')}
          </div>
          <div
            className="font-semibold text-gray-50 dark:text-white"
            data-testid="training-load-workouts-value"
          >
            {workoutsDisplay}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-[11px] text-gray-100/80">
        <span className="text-gray-100/60">{t('dashboard.trainingLoadPushups')}:</span>{' '}
        <span
          className="font-semibold text-gray-50 dark:text-white"
          data-testid="training-load-pushups-value"
        >
          {pushupDisplay}
        </span>
      </div>
    </div>
  );
}

export default TrainingLoadTile;
