import { useState } from 'react';
import { Gender } from '../types';
import { useStore } from '../store/useStore';
import { initPushupPlan } from '../utils/pushupAlgorithm';

function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [maxPushups, setMaxPushups] = useState('');

  const setUser = useStore((state) => state.setUser);
  const setIsOnboarded = useStore((state) => state.setIsOnboarded);

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    const pushupState = initPushupPlan(parseInt(maxPushups));

    // Get current Firebase user
    const { auth } = await import('../firebase/config');
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert('Fehler: Nicht angemeldet');
      return;
    }

    const newUser = {
      nickname,
      gender,
      height: parseInt(height),
      weight: parseInt(weight),
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      maxPushups: parseInt(maxPushups),
      groupCode: '',
      createdAt: new Date(),
      pushupState,
    };

    // Save to Firebase
    const { saveUser } = await import('../services/firestoreService');
    const result = await saveUser(currentUser.uid, newUser);

    if (result.success) {
      setUser({
        id: currentUser.uid,
        ...newUser,
      });
      setIsOnboarded(true);
    } else {
      alert('Fehler beim Speichern der Daten');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return nickname.trim().length > 0;
      case 2:
        return gender !== undefined;
      case 3:
        return height && parseInt(height) > 0;
      case 4:
        return weight && parseInt(weight) > 0;
      case 5:
        return true; // bodyFat is optional
      case 6:
        return maxPushups && parseInt(maxPushups) > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-winter-50 to-winter-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Schritt {step} von {totalSteps}
              </span>
              <span className="text-sm font-medium text-winter-600 dark:text-winter-400">
                {Math.round((step / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-winter-600 dark:bg-winter-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Wie sollen wir dich nennen?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Wähle einen Spitznamen für dein Profil
                </p>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                  placeholder="z.B. Max"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-600 dark:focus:ring-winter-400 focus:border-transparent outline-none"
                  autoFocus
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Dein Geschlecht
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Dies hilft uns bei der Berechnung deiner Ziele
                </p>
                <div className="space-y-3">
                  {[
                    { value: 'male' as Gender, label: 'Männlich', icon: '👨' },
                    { value: 'female' as Gender, label: 'Weiblich', icon: '👩' },
                    { value: 'diverse' as Gender, label: 'Divers', icon: '🧑' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGender(option.value)}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                        gender === option.value
                          ? 'border-winter-600 dark:border-winter-400 bg-winter-50 dark:bg-winter-900'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      } flex items-center gap-3`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Deine Größe
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  In Zentimetern (cm)
                </p>
                <div className="relative">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                    placeholder="z.B. 180"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-600 dark:focus:ring-winter-400 focus:border-transparent outline-none"
                    autoFocus
                  />
                  <span className="absolute right-4 top-3 text-gray-500 dark:text-gray-400">
                    cm
                  </span>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Dein Gewicht
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  In Kilogramm (kg)
                </p>
                <div className="relative">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                    placeholder="z.B. 75"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-600 dark:focus:ring-winter-400 focus:border-transparent outline-none"
                    autoFocus
                  />
                  <span className="absolute right-4 top-3 text-gray-500 dark:text-gray-400">
                    kg
                  </span>
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Körperfettanteil (optional)
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Wenn du deinen KFA kennst, gib ihn hier ein
                </p>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                    placeholder="z.B. 15.5"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-600 dark:focus:ring-winter-400 focus:border-transparent outline-none"
                    autoFocus
                  />
                  <span className="absolute right-4 top-3 text-gray-500 dark:text-gray-400">
                    %
                  </span>
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Maximale Liegestütze
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Wie viele Liegestütze schaffst du maximal am Stück?
                </p>
                <div className="relative">
                  <input
                    type="number"
                    value={maxPushups}
                    onChange={(e) => setMaxPushups(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleComplete()}
                    placeholder="z.B. 30"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-600 dark:focus:ring-winter-400 focus:border-transparent outline-none"
                    autoFocus
                  />
                  <span className="absolute right-4 top-3 text-gray-500 dark:text-gray-400">
                    Reps
                  </span>
                </div>
                {maxPushups && parseInt(maxPushups) > 0 && (
                  <div className="mt-4 p-4 bg-winter-50 dark:bg-winter-900 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Dein Trainingsplan startet mit{' '}
                      <span className="font-bold text-winter-600 dark:text-winter-400">
                        {initPushupPlan(parseInt(maxPushups)).baseReps}
                      </span>{' '}
                      Wiederholungen pro Satz
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Zurück
              </button>
            )}
            {step < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 px-6 py-3 rounded-lg bg-winter-600 dark:bg-winter-500 text-white font-semibold hover:bg-winter-700 dark:hover:bg-winter-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed()}
                className="flex-1 px-6 py-3 rounded-lg bg-winter-600 dark:bg-winter-500 text-white font-semibold hover:bg-winter-700 dark:hover:bg-winter-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Fertig
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
