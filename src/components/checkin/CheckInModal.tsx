import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Timestamp } from 'firebase/firestore';
import { saveDailyCheckInAndRecalc } from '../../services/checkin';
import {
  buildWorkoutEntriesFromTracking,
  computeDailyTrainingLoadV1,
  resolvePushupsFromTracking,
} from '../../services/trainingLoad';
import { useCombinedDailyTracking } from '../../hooks/useCombinedTracking';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../store/useStore';
import type { DailyCheckIn, DailyTrainingLoad } from '../../types';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from '../ui/AppModal';

interface CheckInModalProps {
  dateKey: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const clampScore = (value: number): number => {
  if (Number.isNaN(value)) {
    return 5;
  }
  return Math.min(10, Math.max(1, Math.round(value)));
};

export default function CheckInModal({
  dateKey,
  isOpen,
  onClose,
  onSuccess,
}: CheckInModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const checkIn = useStore((state) => state.checkIns[dateKey]);
  const existingTrainingLoad = useStore((state) => state.trainingLoad[dateKey]);
  const setCheckInForDate = useStore((state) => state.setCheckInForDate);
  const setTrainingLoadForDate = useStore((state) => state.setTrainingLoadForDate);
  const trackingRecord = useStore((state) => state.tracking);

  const combinedDaily = useCombinedDailyTracking(dateKey);
  const manualDaily = trackingRecord[dateKey];

  const [sleepScore, setSleepScore] = useState<number>(checkIn?.sleepScore ?? 5);
  const [recoveryScore, setRecoveryScore] = useState<number>(checkIn?.recoveryScore ?? 5);
  const [isSick, setIsSick] = useState<boolean>(checkIn?.sick ?? false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setSleepScore(checkIn?.sleepScore ?? 5);
    setRecoveryScore(checkIn?.recoveryScore ?? 5);
    setIsSick(checkIn?.sick ?? false);
  }, [isOpen, checkIn?.sleepScore, checkIn?.recoveryScore, checkIn?.sick]);

  const aggregatedTracking = useMemo(() => {
    return combinedDaily ?? manualDaily;
  }, [combinedDaily, manualDaily]);

  // Use existing workouts from tracking
  const allWorkouts = useMemo(() => {
    return buildWorkoutEntriesFromTracking(aggregatedTracking);
  }, [aggregatedTracking]);

  const pushupsReps = useMemo(
    () => resolvePushupsFromTracking(aggregatedTracking),
    [aggregatedTracking]
  );

  // Live computation for preview
  const liveComputation = useMemo(() => {
    return computeDailyTrainingLoadV1({
      workouts: allWorkouts,
      pushupsReps,
      sleepScore,
      recoveryScore,
      sick: isSick,
    });
  }, [allWorkouts, pushupsReps, sleepScore, recoveryScore, isSick]);

  const handleSave = useCallback(async () => {
    if (isSaving) {
      return;
    }

    const normalizedSleep = clampScore(sleepScore);
    const normalizedRecovery = clampScore(recoveryScore);

    setIsSaving(true);

    const previousCheckIn = checkIn ? { ...checkIn } : null;
    const previousTrainingLoad = existingTrainingLoad ? { ...existingTrainingLoad } : null;

    // Use the live computation which includes manual activities
    const computation = liveComputation;

    const optimisticTimestamp = Timestamp.now();

    const optimisticCheckIn: DailyCheckIn = previousCheckIn
      ? {
          ...previousCheckIn,
          sleepScore: normalizedSleep,
          recoveryScore: normalizedRecovery,
          sick: isSick,
          updatedAt: optimisticTimestamp,
        }
      : {
          date: dateKey,
          sleepScore: normalizedSleep,
          recoveryScore: normalizedRecovery,
          sick: isSick,
          createdAt: optimisticTimestamp,
          updatedAt: optimisticTimestamp,
          source: 'manual',
        };

    const optimisticTrainingLoad: DailyTrainingLoad = previousTrainingLoad
      ? {
          ...previousTrainingLoad,
          load: computation.load,
          components: computation.components,
          inputs: computation.inputs,
          updatedAt: optimisticTimestamp,
        }
      : {
          date: dateKey,
          load: computation.load,
          components: computation.components,
          inputs: computation.inputs,
          createdAt: optimisticTimestamp,
          updatedAt: optimisticTimestamp,
          calcVersion: 'v1',
        };

    setCheckInForDate(dateKey, optimisticCheckIn);
    setTrainingLoadForDate(dateKey, optimisticTrainingLoad);

    try {
      await saveDailyCheckInAndRecalc(dateKey, {
        sleepScore: normalizedSleep,
        recoveryScore: normalizedRecovery,
        sick: isSick,
      });
      showToast({ message: t('checkIn.toastSuccess'), type: 'success' });
      onSuccess?.();
      onClose();
    } catch {
      if (previousCheckIn) {
        setCheckInForDate(dateKey, previousCheckIn);
      } else {
        setCheckInForDate(dateKey, null);
      }

      if (previousTrainingLoad) {
        setTrainingLoadForDate(dateKey, previousTrainingLoad);
      } else {
        setTrainingLoadForDate(dateKey, null);
      }

      showToast({ message: t('checkIn.toastError'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [
    checkIn,
    dateKey,
    existingTrainingLoad,
    isSick,
    isSaving,
    liveComputation,
    recoveryScore,
    setCheckInForDate,
    setTrainingLoadForDate,
    showToast,
    sleepScore,
    t,
    onClose,
    onSuccess,
  ]);

  return (
    <AppModal
      open={isOpen}
      onClose={onClose}
      title={t('checkIn.title')}
      subtitle={t('checkIn.subtitle')}
      size="lg"
      preventCloseOnBackdrop={isSaving}
      footer={
        <>
          <ModalSecondaryButton onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? t('common.saving') : t('common.save')}
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-6">
        <SliderField
          id="sleep-score"
          label={t('checkIn.sleepLabel')}
          value={sleepScore}
          onChange={setSleepScore}
          minLabel={t('checkIn.scoreMin')}
          maxLabel={t('checkIn.scoreMax')}
        />

        <SliderField
          id="recovery-score"
          label={t('checkIn.recoveryLabel')}
          value={recoveryScore}
          onChange={setRecoveryScore}
          minLabel={t('checkIn.scoreMin')}
          maxLabel={t('checkIn.scoreMax')}
        />

        <ToggleField
          id="sick-toggle"
          label={t('checkIn.sickLabel')}
          hint={t('checkIn.sickHint')}
          checked={isSick}
          onChange={setIsSick}
        />
      </div>
    </AppModal>
  );
}

interface SliderFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  minLabel: string;
  maxLabel: string;
}

function SliderField({ id, label, value, onChange, minLabel, maxLabel }: SliderFieldProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(Number(event.target.value));
    },
    [onChange]
  );

  return (
    <div>
      <label htmlFor={id} className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-200">
        <span>{label}</span>
        <span className="text-base font-semibold text-gray-900 dark:text-gray-50">{value}</span>
      </label>
      <input
        id={id}
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={handleChange}
        className="mt-3 w-full accent-winter-500"
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value}
        aria-valuetext={`${value}`}
      />
      <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

interface ToggleFieldProps {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleField({ id, label, hint, checked, onChange }: ToggleFieldProps) {
  const handleClick = useCallback(() => {
    onChange(!checked);
  }, [checked, onChange]);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
          <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        </div>
        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={checked}
          onClick={handleClick}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            checked ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              checked ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
