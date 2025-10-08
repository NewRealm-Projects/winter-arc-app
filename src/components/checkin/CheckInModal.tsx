import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from 'react';
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

interface CheckInModalProps {
  dateKey: string;
  isOpen: boolean;
  onClose: () => void;
}

const clampScore = (value: number): number => {
  if (Number.isNaN(value)) {
    return 5;
  }
  return Math.min(10, Math.max(1, Math.round(value)));
};

const getFocusableSelectors = (): string =>
  [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

export default function CheckInModal({ dateKey, isOpen, onClose }: CheckInModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const dialogRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousActiveElement = document.activeElement as HTMLElement | null;

    const focusFirstElement = () => {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(getFocusableSelectors());
      focusable?.[0]?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!isSaving) {
          onClose();
        }
        return;
      }

      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(getFocusableSelectors());
        if (!focusable || focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    focusFirstElement();
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [isOpen, isSaving, onClose]);

  const aggregatedTracking = useMemo(() => {
    return combinedDaily ?? manualDaily;
  }, [combinedDaily, manualDaily]);

  const handleOverlayClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && !isSaving) {
        onClose();
      }
    },
    [isSaving, onClose]
  );

  const handleSave = useCallback(async () => {
    if (isSaving) {
      return;
    }

    const normalizedSleep = clampScore(sleepScore);
    const normalizedRecovery = clampScore(recoveryScore);

    setIsSaving(true);

    const previousCheckIn = checkIn ? { ...checkIn } : null;
    const previousTrainingLoad = existingTrainingLoad ? { ...existingTrainingLoad } : null;

    const workouts = buildWorkoutEntriesFromTracking(aggregatedTracking);
    const pushupsReps = resolvePushupsFromTracking(aggregatedTracking);

    const computation = computeDailyTrainingLoadV1({
      workouts,
      pushupsReps,
      sleepScore: normalizedSleep,
      recoveryScore: normalizedRecovery,
      sick: isSick,
    });

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
    aggregatedTracking,
    checkIn,
    dateKey,
    existingTrainingLoad,
    isSick,
    isSaving,
    recoveryScore,
    setCheckInForDate,
    setTrainingLoadForDate,
    showToast,
    sleepScore,
    t,
    onClose,
  ]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="presentation"
      onClick={handleOverlayClick}
    >
      <div
        id="daily-check-in-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="check-in-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl focus:outline-none dark:bg-gray-900"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 id="check-in-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('checkIn.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('checkIn.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full bg-gray-100 px-2 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-winter-500 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

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

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-winter-500 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-winter-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-winter-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-winter-200 disabled:opacity-50"
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
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
