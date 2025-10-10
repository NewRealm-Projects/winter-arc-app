import { useState, useEffect, useCallback } from 'react';
import { generateDailyMotivation } from '../services/aiService';
import { saveDailyTracking } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import {
  generateProgressivePlan,
  getLastPushupTotal,
  countPushupDays,
  calculateTotalReps,
  evaluateWorkout,
} from '../utils/pushupAlgorithm';
import { useCombinedTracking } from '../hooks/useCombinedTracking';
import { combineTrackingWithSmart } from '../utils/tracking';
import { glassCardClasses, designTokens } from '../theme/tokens';
import { useTrackingEntries } from '../hooks/useTrackingEntries';
import { useTranslation } from '../hooks/useTranslation';

function PushupTrainingPage() {
  const { t } = useTranslation();
  const { error: trackingError, retry: retryTracking } = useTrackingEntries();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);
  const smartContributions = useStore((state) => state.smartContributions);
  const combinedTracking = useCombinedTracking();

  const [currentSet, setCurrentSet] = useState(0);
  const [reps, setReps] = useState<number[]>([]);
  const [currentReps, setCurrentReps] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [startCountdown, setStartCountdown] = useState(3);
  const [isStarted, setIsStarted] = useState(false);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const isToday = activeDate === todayKey;
  const displayDayLabel = isToday ? 'Heute' : format(new Date(activeDate), 'dd.MM.');

  // Generiere den Trainingsplan basierend auf Historie
  const lastTotal = getLastPushupTotal(combinedTracking);
  const daysCompleted = countPushupDays(combinedTracking);

  // Initial total: Wenn noch keine Historie, nutze maxPushups * 2.5
  const initialTotal = lastTotal > 0 ? lastTotal : Math.round((user?.maxPushups || 20) * 2.5);
  const plan = generateProgressivePlan(initialTotal, daysCompleted);
  const currentTarget = plan[currentSet];
  const plannedTotal = calculateTotalReps(plan);

  const restTime = 60; // 60 Sekunden Pause

  const containerClasses = 'min-h-screen-mobile safe-pt pb-32 overflow-y-auto viewport-safe';
  const contentClasses = 'mobile-container dashboard-container safe-pb px-3 pt-4 md:px-6 md:pt-8 lg:px-0 space-y-4';
  const headlineCardClasses = `${glassCardClasses} ${designTokens.padding.compact} text-white flex items-center gap-3`;
  const statsCardClasses = `${glassCardClasses} ${designTokens.padding.spacious} text-white space-y-6`;
  const motivationCardClasses = `${glassCardClasses} ${designTokens.padding.compact} text-white text-center space-y-2`;

  const trackingPermissionNotice = trackingError ? (
    <div className="rounded-3xl border border-amber-300/30 bg-amber-500/10 p-4 text-amber-100 shadow-[0_8px_20px_rgba(245,158,11,0.2)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium">
          {trackingError === 'no-permission' ? t('tracking.permissionDeniedMessage') : t('tracking.unavailableMessage')}
        </p>
        <button
          type="button"
          onClick={retryTracking}
          className="self-start rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors hover:border-white/40 hover:bg-white/10 md:self-auto"
        >
          {t('common.retry')}
        </button>
      </div>
    </div>
  ) : null;

  // Start countdown timer
  useEffect(() => {
    if (!isStarted && startCountdown > 0) {
      const timer = setTimeout(() => { setStartCountdown(startCountdown - 1); }, 1000);
      return () => { clearTimeout(timer); };
    } else if (!isStarted && startCountdown === 0) {
      setIsStarted(true);
    }
    return undefined;
  }, [startCountdown, isStarted]);

  // Rest timer
  useEffect(() => {
    if (restTimeLeft > 0) {
      const timer = setTimeout(() => { setRestTimeLeft(restTimeLeft - 1); }, 1000);
      return () => { clearTimeout(timer); };
    }
    return undefined;
  }, [restTimeLeft]);

  const handleCompleteSet = useCallback(async () => {
    const newReps = [...reps, currentReps];
    setReps(newReps);
    setCurrentReps(0);

    if (newReps.length < 5) {
      // Nächster Satz - starte Pause
      setCurrentSet(currentSet + 1);
      setRestTimeLeft(restTime);
    } else {
      // Training abgeschlossen
      setIsComplete(true);
      const total = calculateTotalReps(newReps);

      const prevPushups = tracking[activeDate]?.pushups || {};
      // Ermittle Status korrekt
      const planState = user?.pushupState || { baseReps: 10, sets: 5, restTime: 60 };
      const { status } = evaluateWorkout(planState, newReps);
      const newTracking = {
        ...tracking[activeDate],
        pushups: {
          ...prevPushups,
          total,
          workout: {
            reps: newReps,
            status,
            timestamp: new Date(),
          },
        },
      };
      updateDayTracking(activeDate, newTracking);
      if (user?.id) {
        void saveDailyTracking(user.id, activeDate, newTracking);
      }
      // AI Prompt Log für Training
      if (user) {
        const nickname = user.nickname;
        const birthday = user.birthday;
        // Tracking für den aktuellen User (kann auch alle Tage enthalten)
        try {
          const updatedManual = {
            ...tracking,
            [activeDate]: newTracking,
          };
          const trackingForAi = combineTrackingWithSmart(updatedManual, smartContributions);
          await generateDailyMotivation(trackingForAi, nickname, birthday);
        } catch (e) {
          console.warn('AI Prompt Log (PushupTraining) Fehler:', e);
        }
      }
    }
  }, [activeDate, currentReps, currentSet, reps, restTime, smartContributions, tracking, updateDayTracking, user]);

  // Automatischer Satzabschluss, wenn Ziel erreicht
  useEffect(() => {
    if (currentReps > 0 && typeof currentTarget === 'number' && currentReps >= currentTarget && restTimeLeft === 0 && currentSet < 5) {
      void handleCompleteSet();
    }
  }, [currentReps, currentSet, currentTarget, handleCompleteSet, restTimeLeft]);

  const handleTap = () => {
    // Verhindere Scrollen auf Mobilgeräten
    window.scrollTo({ top: 0, behavior: 'auto' });
    setCurrentReps(currentReps + 1);
  };

  const handleSkipRest = () => {
    setRestTimeLeft(0);
  };

  const handleFinish = () => {
    navigate('/tracking');
  };

  if (isComplete) {
    const totalReps = calculateTotalReps(reps);
    const plannedReps = plannedTotal;
    const performance = ((totalReps / plannedReps) * 100).toFixed(0);

    return (
      <div className={containerClasses}>
        <div className={contentClasses}>
          {trackingPermissionNotice}
          <header className={headlineCardClasses}>
            <button
              onClick={() => { navigate(-1); }}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
            >
              <span className="text-lg leading-none">←</span>
              Zurück
            </button>
            <div>
              <h1 className="text-fluid-h2 font-semibold">Training abgeschlossen! 🎉</h1>
              <p className="text-fluid-sm text-white/70">Starker Einsatz heute!</p>
            </div>
          </header>

          <section className={statsCardClasses}>
            <div className="text-center space-y-2">
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-winter-200 via-winter-100 to-winter-300">
                {totalReps}
              </div>
              <p className="text-white/70">Liegestütze insgesamt</p>
            </div>

            <div className="tile-grid-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-5 text-center shadow-inner">
                <p className="text-sm text-white/60">Planerfüllung</p>
                <p className="text-3xl font-semibold text-white">{performance}%</p>
                <p className="text-xs text-white/60">Geplant waren {plannedReps}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-winter-500/70 to-winter-700/70 px-4 py-5 text-center shadow-[0_10px_40px_rgba(14,165,233,0.45)]">
                <p className="text-sm text-white/80">Nächste Challenge</p>
                <p className="text-2xl font-semibold text-white">{totalReps + 1} Wiederholungen</p>
                <p className="text-xs text-white/80">als Startpunkt für morgen</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-fluid-base font-semibold text-white/90">Deine Sätze</h3>
              <div className="mobile-stack">
                {reps.map((rep, index) => {
                  const target = plan[index];
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white/90"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-winter-500 to-winter-700 text-base font-semibold text-white shadow-lg">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">Satz {index + 1}</p>
                          <p className="text-xs text-white/60">Ziel: {target}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold text-white">{rep}</p>
                        <p className="text-xs text-white/60">Differenz: {rep - target >= 0 ? `+${rep - target}` : rep - target}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={motivationCardClasses}>
            <p className="text-fluid-base font-semibold text-white">
              {totalReps >= plannedReps
                ? '🔥 Fantastisch! Du hast dein Ziel übertroffen.'
                : '💪 Stark! Morgen wirst du noch stärker.'}
            </p>
            <p className="text-fluid-sm text-white/70">
              Bleib dran – Kontinuität bringt dir deinen Winter Arc!
            </p>
          </section>

          <button
            onClick={handleFinish}
            className="w-full rounded-2xl bg-gradient-to-r from-winter-500 via-winter-600 to-winter-700 py-4 text-lg font-semibold text-white shadow-[0_12px_40px_rgba(56,189,248,0.35)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/40 active:translate-y-0"
          >
            Fertig
          </button>
        </div>
      </div>
    );
  }

  // Show countdown before starting
  if (!isStarted) {
    return (
      <div className={containerClasses}>
        <div className="mobile-container dashboard-container safe-pb px-3 pt-10 md:px-6 md:pt-16 lg:px-0 flex flex-col items-center gap-4">
          {trackingPermissionNotice}
          <div className={`${glassCardClasses} ${designTokens.padding.spacious} text-white text-center space-y-4 animate-fade-in`}>
            <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-winter-200 via-winter-100 to-winter-300">
              {startCountdown}
            </div>
            <p className="text-fluid-base text-white/70">Mach dich bereit...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {trackingPermissionNotice}
        <header className={`${headlineCardClasses} justify-between`}>
          <button
            onClick={() => { navigate(-1); }}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
          >
            <span className="text-lg leading-none">←</span>
            Zurück
          </button>
          <div className="text-right">
            <h1 className="text-fluid-h2 font-semibold">Liegestütze Training</h1>
            <p className="text-fluid-sm text-white/70">
              {displayDayLabel} · geplant: {plannedTotal} Wiederholungen
            </p>
          </div>
        </header>

        <section className={`${glassCardClasses} ${designTokens.padding.spacious} text-white space-y-8`}>
          {/* Plan Overview */}
          <div className="space-y-4">
            <h3 className="text-fluid-base font-semibold text-white/90">Dein Plan für heute</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {plan.map((targetReps, index) => {
                const isDone = index < currentSet;
                const isActive = index === currentSet && restTimeLeft === 0;
                const stateClasses = isDone
                  ? 'border-green-300/60 bg-green-500/20 text-green-100 shadow-[0_0_25px_rgba(34,197,94,0.35)]'
                  : isActive
                  ? 'bg-gradient-to-br from-winter-500/80 to-winter-700/80 text-white shadow-[0_10px_40px_rgba(14,165,233,0.45)]'
                  : 'text-white/70 hover:bg-white/10';

                return (
                  <div
                    key={index}
                    className={`rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center transition-all ${stateClasses}`}
                  >
                    <p className="text-xs uppercase tracking-wide text-white/60">Satz {index + 1}</p>
                    <p className="text-2xl font-semibold">{targetReps}</p>
                    {isDone && reps[index] !== undefined && (
                      <p className="text-xs text-white/80 mt-1">✓ {reps[index]} geschafft</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Set */}
          {currentSet < 5 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-fluid-h2 font-semibold text-white">Satz {currentSet + 1}</h2>
                <p className="text-white/70">Ziel: {plan[currentSet]} Wiederholungen</p>
              </div>

              {/* Rest Timer */}
              {restTimeLeft > 0 ? (
                <div className="space-y-4 text-center">
                  <div className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4">
                    <span className="text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-br from-winter-200 via-winter-100 to-winter-300">
                      {restTimeLeft}s
                    </span>
                  </div>
                  <p className="text-white/70">Pause läuft...</p>
                  <button
                    onClick={handleSkipRest}
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/20"
                  >
                    Pause überspringen
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Tap Circle */}
                  <div className="flex flex-col items-center">
                    <div className="w-72 h-72 flex items-center justify-center overflow-hidden select-none" style={{ touchAction: 'manipulation' }}>
                      <button
                        onClick={handleTap}
                        className="w-64 h-64 rounded-full bg-gradient-to-br from-winter-500 to-winter-700 hover:from-winter-600 hover:to-winter-800 active:scale-95 transition-all shadow-[0_20px_60px_rgba(14,165,233,0.45)] flex flex-col items-center justify-center text-white focus:outline-none"
                        style={{ userSelect: 'none' }}
                      >
                        <div className="text-7xl font-bold mb-2">{currentReps}</div>
                        <div className="text-fluid-base text-white/80">Tippe mit der Nase</div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCompleteSet}
                    disabled={currentReps === 0}
                    className="w-full rounded-2xl bg-gradient-to-r from-winter-500 via-winter-600 to-winter-700 py-4 text-lg font-semibold text-white shadow-[0_12px_40px_rgba(56,189,248,0.35)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    Satz abschließen ({currentReps} Wiederholungen)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Fortschritt</span>
              <span>
                {currentSet} / 5 Sätze
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-winter-300 via-winter-500 to-winter-700 transition-all duration-300"
                style={{ width: `${(currentSet / 5) * 100}%` }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PushupTrainingPage;
