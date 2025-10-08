import { useMemo } from 'react';
import { useCombinedDailyTracking } from '../hooks/useCombinedTracking';
import { useCheckInSubscription } from '../hooks/useCheckInSubscription';
import { useTrainingLoadSubscription } from '../hooks/useTrainingLoadSubscription';
import {
  buildWorkoutEntriesFromTracking,
  computeDailyTrainingLoadV1,
  resolvePushupsFromTracking,
} from '../services/trainingLoad';
import { useStore } from '../store/useStore';
import { getTileClasses, designTokens } from '../theme/tokens';
import { normalizeSports } from '../utils/sports';
import { useTranslation } from '../hooks/useTranslation';

const MAX_TRAINING_LOAD = 1000;

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

interface SessionSummary {
  type: string;
  duration: number;
  intensity: number;
}

function buildSessions(
  sportsSource: Parameters<typeof normalizeSports>[0]
): SessionSummary[] {
  const normalized = normalizeSports(sportsSource);

  return Object.entries(normalized).reduce<SessionSummary[]>((sessions, [key, entry]) => {
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
  const trainingLoadMap = useStore((state) => state.trainingLoad);
  const checkIns = useStore((state) => state.checkIns);

  const activeDate = selectedDate ?? new Date().toISOString().split('T')[0];

  useTrainingLoadSubscription(activeDate);
  useCheckInSubscription(activeDate);

  const combinedDaily = useCombinedDailyTracking(activeDate);
  const manualDaily = Object.prototype.hasOwnProperty.call(tracking, activeDate) ? tracking[activeDate] : undefined;
  const aggregatedTracking = combinedDaily ?? manualDaily;
  const aggregatedRecovery = aggregatedTracking?.recovery;

  const sessions = useMemo(
    () => buildSessions(aggregatedTracking?.sports),
    [aggregatedTracking?.sports]
  );

  const pushupsDisplayTotal = useMemo(() => {
    const pushups = aggregatedTracking?.pushups;
    if (!pushups) {
      return 0;
    }
    if (typeof pushups.total === 'number') {
      return pushups.total;
    }
    const reps = pushups.workout?.reps ?? [];
    return reps.reduce((total, value) => total + value, 0);
  }, [aggregatedTracking?.pushups]);

  const workoutsForCalculation = useMemo(
    () => buildWorkoutEntriesFromTracking(aggregatedTracking),
    [aggregatedTracking]
  );
  const pushupsReps = useMemo(
    () => resolvePushupsFromTracking(aggregatedTracking),
    [aggregatedTracking]
  );

  const storedTrainingLoad = trainingLoadMap[activeDate];
  const checkIn = checkIns[activeDate];

  const computedLoad = useMemo(() => {
    const sleepScore = checkIn?.sleepScore ?? clampNumber(aggregatedRecovery?.sleepQuality, 5);
    const recoveryScore = checkIn?.recoveryScore ?? clampNumber(aggregatedRecovery?.recovery, 5);
    const sick = checkIn?.sick ?? Boolean(aggregatedRecovery?.illness);
    return computeDailyTrainingLoadV1({
      workouts: workoutsForCalculation,
      pushupsReps,
      sleepScore,
      recoveryScore,
      sick,
    });
  }, [
    aggregatedRecovery?.illness,
    aggregatedRecovery?.recovery,
    aggregatedRecovery?.sleepQuality,
    checkIn?.recoveryScore,
    checkIn?.sick,
    checkIn?.sleepScore,
    pushupsReps,
    workoutsForCalculation,
  ]);

  const loadValue = storedTrainingLoad?.load ?? computedLoad.load;
  const inputs = storedTrainingLoad?.inputs ?? computedLoad.inputs;

  const sleepQuality = inputs.sleepScore;
  const recoveryScore = inputs.recoveryScore;

  const recoveryTracked =
    storedTrainingLoad !== undefined ||
    checkIn !== undefined ||
    aggregatedRecovery?.sleepQuality !== undefined ||
    aggregatedRecovery?.recovery !== undefined;
  const pushupsTracked = pushupsDisplayTotal > 0;
  const sportsTracked = sessions.length > 0;

  const percent = Math.min(
    100,
    Math.max(0, Math.round((loadValue / MAX_TRAINING_LOAD) * 100))
  );

  const statusKey: 'low' | 'optimal' | 'high' =
    loadValue >= 600 ? 'high' : loadValue >= 200 ? 'optimal' : 'low';
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
  const pushupDisplay = pushupsTracked ? `${pushupsDisplayTotal}` : '—';

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
          {loadValue}
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
    </div>
  );
}

export default TrainingLoadTile;
