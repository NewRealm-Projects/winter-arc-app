import { useState } from 'react';
import { Gender, Language } from '../types';
import { useStore } from '../store/useStore';
import { initPushupPlan } from '../utils/pushupAlgorithm';
import { useTranslation } from '../hooks/useTranslation';

interface OnboardingPageProps {
  birthdayOnly?: boolean; // If true, only ask for birthday
}

function OnboardingPage({ birthdayOnly = false }: OnboardingPageProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState<Language>('de');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [maxPushups, setMaxPushups] = useState('');
  const [birthday, setBirthday] = useState('');

  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const setIsOnboarded = useStore((state) => state.setIsOnboarded);

  const totalSteps = birthdayOnly ? 1 : 7;

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
    // Get current Firebase user
    const { auth } = await import('../firebase/config');
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert('Fehler: Nicht angemeldet');
      return;
    }

    if (birthdayOnly) {
      // Only update birthday for existing user
      const { updateUser } = await import('../services/firestoreService');
      const result = await updateUser(currentUser.uid, { birthday });

      if (result.success && user) {
        setUser({
          ...user,
          birthday,
        });
        setIsOnboarded(true);
      } else {
        alert('Fehler beim Speichern des Geburtstags');
      }
    } else {
      // Full onboarding
      const pushupState = initPushupPlan(parseInt(maxPushups));

      const newUser = {
        language,
        nickname,
        gender,
        height: parseInt(height),
        weight: 0, // Weight will be set in tracking page
        bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
        maxPushups: parseInt(maxPushups),
        birthday: birthday || undefined,
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
    }
  };

  const canProceed = () => {
    if (birthdayOnly) {
      return birthday.length > 0;
    }

    switch (step) {
      case 1:
        return language !== undefined;
      case 2:
        return nickname.trim().length > 0;
      case 3:
        return gender !== undefined;
      case 4:
        return height && parseInt(height) > 0;
      case 5:
        return true; // bodyFat is optional
      case 6:
        return maxPushups && parseInt(maxPushups) > 0;
      case 7:
        return true; // birthday is optional
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
            {birthdayOnly && step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  🎂 Wann hast du Geburtstag?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Damit wir dir an deinem besonderen Tag gratulieren können!
                </p>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-600 dark:focus:ring-winter-400 focus:border-transparent outline-none"
                  autoFocus
                />
              </div>
            )}

            {!birthdayOnly && step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  🌍 Wähle deine Sprache / Choose your language
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  In welcher Sprache möchtest du die App nutzen?
                </p>
                <div className="space-y-3">
                  {[
                    { value: 'de' as Language, label: 'Deutsch', icon: '🇩🇪' },
                    { value: 'en' as Language, label: 'English', icon: '🇺🇸' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLanguage(option.value)}
                      className={`w-full px-6 py-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                        language === option.value
                          ? 'border-winter-600 dark:border-winter-400 bg-winter-50 dark:bg-winter-900 text-winter-600 dark:text-winter-400'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-winter-400 dark:hover:border-winter-500'
                      }`}
                    >
                      <span className="text-3xl">{option.icon}</span>
                      <span className="text-lg font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!birthdayOnly && step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {language === 'de' ? 'Wie sollen wir dich nennen?' : 'What should we call you?'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {language === 'de' ? 'Wähle einen Spitznamen für dein Profil' : 'Choose a nickname for your profile'}
                </p>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                  placeholder={language === 'de' ? 'z.B. Max' : 'e.g. Max'}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-600 dark:focus:ring-winter-400 focus:border-transparent outline-none"
                  autoFocus
                />
              </div>
            )}

            {!birthdayOnly && step === 3 && (
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

            {!birthdayOnly && step === 4 && (
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

            {!birthdayOnly && step === 5 && (
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

            {!birthdayOnly && step === 6 && (
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
                    onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
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

            {!birthdayOnly && step === 7 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  🎂 Geburtstag (optional)
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Damit wir dir an deinem besonderen Tag gratulieren können!
                </p>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComplete()}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-600 dark:focus:ring-winter-400 focus:border-transparent outline-none"
                  autoFocus
                />
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
