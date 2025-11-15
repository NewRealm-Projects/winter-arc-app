'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import Layout from '../../components/Layout';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { useCombinedTracking, useCombinedDailyTracking } from '../../hooks/useCombinedTracking';
import { useStore } from '../../store/useStore';
import {
  calculateTotalReps,
  countPushupDays,
  generateProgressivePlan,
  getLastPushupTotal,
} from '../../utils/pushupAlgorithm';

function PushupTrainingContent() {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const isOnboarded = useStore((state) => state.isOnboarded);
  const selectedDate = useStore((state) => state.selectedDate);

  if (!user) {
    redirect('/auth/signin');
  }

  if (!isOnboarded) {
    redirect('/onboarding');
  }

  const combinedTracking = useCombinedTracking();
  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const activeDate = selectedDate || todayKey;
  const combinedDaily = useCombinedDailyTracking(activeDate);

  const lastTotal = getLastPushupTotal(combinedTracking);
  const daysCompleted = countPushupDays(combinedTracking);
  const baseReference = lastTotal > 0 ? lastTotal : Math.round((user.maxPushups || 20) * 2.5);
  const plan = generateProgressivePlan(baseReference, daysCompleted);
  const plannedTotal = calculateTotalReps(plan);

  const todaysReps = combinedDaily?.pushups?.total ?? 0;
  const restTime = user.pushupState?.restTime ?? 60;
  const baseReps = Math.max(3, Math.floor((user.maxPushups || 20) * 0.45));
  const workout = combinedDaily?.pushups?.workout;
  const workoutComplete = Array.isArray(workout?.reps) && workout.reps.length === 5;

  const displayDate = activeDate === todayKey ? t('tracking.today') : format(new Date(activeDate), 'dd.MM.yyyy');

  return (
    <Layout>
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-100 hover:text-white transition-colors"
          >
            ← {t('tracking.back')}
          </Link>
          <div className="text-sm text-blue-100">
            {t('tracking.planHint')}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/10 shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-blue-200">{t('tracking.pushups')}</p>
              <h1 className="text-2xl font-semibold text-white">
                {workoutComplete ? t('tracking.tomorrowsPlan') : t('tracking.todaysPlan')}
              </h1>
            </div>
            <div className="flex flex-col text-right text-sm text-blue-100">
              <span>{displayDate}</span>
              <span>{t('tracking.total')}: {plannedTotal} {t('tracking.reps')}</span>
            </div>
          </div>

          <div className="space-y-3">
            {plan.map((target, index) => {
              const isAmrap = index === plan.length - 1;
              return (
                <div
                  key={`set-${index}`}
                  className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                >
                  <div>
                    <p className="text-xs uppercase text-blue-200">
                      {t('tracking.sets')} {index + 1}
                    </p>
                    <p className="text-base font-semibold text-white">
                      {target} {t('tracking.reps')}
                    </p>
                    <p className="text-xs text-blue-100">{isAmrap ? 'AMRAP' : t('tracking.plan')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{target}</p>
                    <p className="text-xs text-blue-100">{t('tracking.reps')}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-100">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-200">{t('tracking.today')}</p>
              <p className="text-lg font-semibold text-white">{todaysReps} {t('tracking.reps')}</p>
              <p className="text-xs text-blue-100">{t('tracking.total')}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-200">{t('tracking.plan')}</p>
              <p className="text-lg font-semibold text-white">{baseReps} {t('tracking.reps')}</p>
              <p className="text-xs text-blue-100">{t('tracking.sets')}: 5</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-200">{t('tracking.rest')}</p>
              <p className="text-lg font-semibold text-white">{restTime}s</p>
              <p className="text-xs text-blue-100">{t('tracking.startWorkout')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white space-y-4">
          <h2 className="text-lg font-semibold">💡 {t('tracking.startWorkout')}</h2>
          <p className="text-sm text-blue-100">
            {t('tracking.planHint')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors px-4 py-2 text-sm font-semibold text-white"
            >
              {t('tracking.addPushups')}
            </Link>
          </div>
          <p className="text-xs text-blue-100">
            {t('tracking.historySubtitle')}
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default function PushupTrainingPage() {
  useAuth();

  return (
    <Suspense fallback={<CardSkeleton />}>
      <PushupTrainingContent />
    </Suspense>
  );
}

