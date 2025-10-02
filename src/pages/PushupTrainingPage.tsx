import { useState, useEffect } from 'react';
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

function PushupTrainingPage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

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
  const lastTotal = getLastPushupTotal(tracking);
  const daysCompleted = countPushupDays(tracking);

  // Initial total: Wenn noch keine Historie, nutze maxPushups * 2.5
  const initialTotal = lastTotal > 0 ? lastTotal : Math.round((user?.maxPushups || 20) * 2.5);
  const plan = generateProgressivePlan(initialTotal, daysCompleted);
  const plannedTotal = calculateTotalReps(plan);

  const restTime = 60; // 60 Sekunden Pause

  // Start countdown timer
  useEffect(() => {
    if (!isStarted && startCountdown > 0) {
      const timer = setTimeout(() => setStartCountdown(startCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!isStarted && startCountdown === 0) {
      setIsStarted(true);
    }
  }, [startCountdown, isStarted]);

  // Rest timer
  useEffect(() => {
    if (restTimeLeft > 0) {
      const timer = setTimeout(() => setRestTimeLeft(restTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [restTimeLeft]);


  // Automatischer Satzabschluss, wenn Ziel erreicht
  useEffect(() => {
    if (currentReps > 0 && currentReps >= plan[currentSet] && restTimeLeft === 0 && currentSet < 5) {
      handleCompleteSet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentReps]);

  const handleTap = () => {
    // Verhindere Scrollen auf Mobilgeräten
    window.scrollTo({ top: 0, behavior: 'auto' });
    setCurrentReps(currentReps + 1);
  };

  const handleCompleteSet = () => {
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
        saveDailyTracking(user.id, activeDate, newTracking);
      }
    }
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
  <div className="min-h-screen glass-dark rounded-2xl safe-area-inset-top">
  <div className="glass-dark rounded-2xl text-white p-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 text-winter-100 hover:text-white"
            >
              ← Zurück
            </button>
            <h1 className="text-3xl font-bold">Training Abgeschlossen! 🎉</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-4 pb-20">
          <div className="glass-dark rounded-2xl shadow-lg p-8">
            {/* Stats */}
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-winter-600 dark:text-winter-400 mb-2">
                {totalReps}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                Liegestütze insgesamt
              </div>
              <div className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
                {performance}% des Plans
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Geplant waren {plannedReps}
              </div>
            </div>

            {/* Set Breakdown */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Deine Sätze:
              </h3>
              <div className="space-y-3">
                {reps.map((rep, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-winter-600 dark:bg-winter-500 text-white flex items-center justify-center font-bold" style={{ borderRadius: 0 }}>
                        {index + 1}
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">
                        Satz {index + 1}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {rep}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Ziel: {plan[index]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivation */}
            <div className="bg-winter-50 dark:bg-winter-900/20 p-6 mb-6" style={{ borderRadius: 0 }}>
              <p className="text-center text-gray-900 dark:text-white font-medium">
                {totalReps >= plannedReps
                  ? '🔥 Fantastisch! Du hast dein Ziel erreicht!'
                  : '💪 Weiter so! Morgen wird noch besser!'}
              </p>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                Nächstes Mal sind {plannedReps + 1} Wiederholungen geplant.
              </p>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-4 bg-winter-600 dark:bg-winter-500 text-white hover:bg-winter-700 dark:hover:bg-winter-600 transition-colors font-semibold text-lg"
              style={{ borderRadius: 0 }}
            >
              Fertig
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show countdown before starting
  if (!isStarted) {
    return (
  <div className="min-h-screen glass-dark rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-9xl font-bold text-winter-600 dark:text-winter-400 mb-4">
            {startCountdown}
          </div>
          <p className="text-2xl text-gray-600 dark:text-gray-400">
            Mach dich bereit...
          </p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen glass-dark rounded-2xl safe-area-inset-top overflow-hidden">
      {/* Header */}
  <div className="glass-dark rounded-2xl text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-winter-100 hover:text-white"
          >
            ← Zurück
          </button>
          <h1 className="text-3xl font-bold mb-2">Liegestütze Training</h1>
          <p className="text-winter-100">
            {displayDayLabel} geplant: {plannedTotal} Wiederholungen
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 pb-20">
  <div className="glass-dark rounded-2xl shadow-lg p-6">
          {/* Plan Overview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dein Plan für heute:
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {plan.map((targetReps, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-center transition-all ${
                    index < currentSet
                      ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                      : index === currentSet
                      ? 'bg-winter-100 dark:bg-winter-900/30 border-2 border-winter-500'
                      : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Satz {index + 1}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {targetReps}
                  </div>
                  {index < currentSet && reps[index] !== undefined && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ {reps[index]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Set */}
          {currentSet < 5 && (
            <div className="mb-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Satz {currentSet + 1}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Ziel: {plan[currentSet]} Wiederholungen
                </p>
              </div>

              {/* Rest Timer */}
              {restTimeLeft > 0 ? (
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-winter-600 dark:text-winter-400 mb-2">
                    {restTimeLeft}s
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Pause läuft...
                  </p>
                  <button
                    onClick={handleSkipRest}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
                        className="w-64 h-64 rounded-full bg-gradient-to-br from-winter-500 to-winter-700 hover:from-winter-600 hover:to-winter-800 active:scale-95 transition-all shadow-2xl flex flex-col items-center justify-center text-white focus:outline-none"
                        style={{ userSelect: 'none' }}
                      >
                        <div className="text-7xl font-bold mb-2">{currentReps}</div>
                        <div className="text-lg opacity-90">Tippe mit der Nase</div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCompleteSet}
                    disabled={currentReps === 0}
                    className="w-full py-4 bg-winter-600 dark:bg-winter-500 text-white rounded-xl hover:bg-winter-700 dark:hover:bg-winter-600 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Satz abschließen ({currentReps} Wiederholungen)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Fortschritt</span>
              <span>
                {currentSet} / 5 Sätze
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-winter-500 to-winter-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(currentSet / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PushupTrainingPage;
