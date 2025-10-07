import { useEffect, useState, ChangeEvent, useRef } from 'react';
import { Gender, Language, Activity } from '../types';
import { useStore } from '../store/useStore';
import { initPushupPlan } from '../utils/pushupAlgorithm';
import { useTranslation } from '../hooks/useTranslation';
import { glassCardClasses, designTokens } from '../theme/tokens';

interface OnboardingPageProps {
  birthdayOnly?: boolean; // If true, only ask for birthday
}

function OnboardingPage({ birthdayOnly = false }: OnboardingPageProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState<Language>('de');
  const [nickname, setNickname] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(user?.photoURL ?? '');
  const [shareProfilePicture, setShareProfilePicture] = useState(user?.shareProfilePicture ?? true);
  const profilePictureInputRef = useRef<HTMLInputElement | null>(null);
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [maxPushups, setMaxPushups] = useState('');
  const [enabledActivities, setEnabledActivities] = useState<Activity[]>(['pushups', 'sports', 'water', 'protein']);
  const [birthday, setBirthday] = useState('');

  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const setIsOnboarded = useStore((state) => state.setIsOnboarded);

  const totalSteps = birthdayOnly ? 1 : 9;

  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (profilePicturePreview && profilePicturePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profilePicturePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setProfilePictureFile(file);
    setProfilePicturePreview(previewUrl);
    event.target.value = '';
  };

  useEffect(() => {
    return () => {
      if (profilePicturePreview && profilePicturePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicturePreview);
      }
    };
  }, [profilePicturePreview]);

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

      let photoURL = user?.photoURL;

      if (profilePictureFile) {
        const { uploadProfilePictureFile } = await import('../services/storageService');
        const uploadResult = await uploadProfilePictureFile(profilePictureFile, currentUser.uid);

        if (!uploadResult.success || !uploadResult.url) {
          alert(t('onboarding.profilePictureUploadError'));
          return;
        }

        photoURL = uploadResult.url;
      }

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
        photoURL: photoURL || undefined,
        shareProfilePicture,
        enabledActivities,
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
        return true; // Profile picture is optional
      case 4:
        return gender !== undefined;
      case 5:
        return height && parseInt(height) > 0;
      case 6:
        return true; // bodyFat is optional
      case 7:
        return maxPushups && parseInt(maxPushups) > 0;
      case 8:
        return enabledActivities.length > 0; // at least one activity required
      case 9:
        return true; // birthday is optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen-mobile safe-pt pb-20 overflow-y-auto viewport-safe">
      <div className="mobile-container dashboard-container safe-pb px-4 pt-6 md:px-6 md:pt-10 lg:px-0">
        <div
          className={`${glassCardClasses} ${designTokens.padding.spacious} text-white rounded-[28px] shadow-[0_24px_60px_rgba(15,23,42,0.45)] space-y-8`}
        >
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                Schritt {step} von {totalSteps}
              </span>
              <span className="text-sm font-semibold text-sky-300">
                {Math.round((step / totalSteps) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-winter-500 via-sky-500 to-winter-400 transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
  
          {/* Step Content */}
          <div className="space-y-8">
            {birthdayOnly && step === 1 && (
              <div className="space-y-4">
                <h2 className="text-fluid-h2 font-semibold text-white">
                  🎂 Wann hast du Geburtstag?
                </h2>
                <p className="text-sm text-white/70">
                  Damit wir dir an deinem besonderen Tag gratulieren können!
                </p>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => {
                    setBirthday(e.target.value);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/60 focus:border-transparent focus:ring-2 focus:ring-sky-400/80 focus:outline-none"
                  autoFocus
                />
              </div>
            )}
  
            {!birthdayOnly && step === 1 && (
              <div className="space-y-4">
                <h2 className="text-fluid-h2 font-semibold text-white">
                  🌍 Wähle deine Sprache / Choose your language
                </h2>
                <p className="text-sm text-white/70">
                  In welcher Sprache möchtest du die App nutzen?
                </p>
                <div className="space-y-3">
                  {[
                    { value: 'de' as Language, label: 'Deutsch', icon: '🇩🇪' },
                    { value: 'en' as Language, label: 'English', icon: '🇺🇸' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setLanguage(option.value);
                      }}
                      className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 transition-all backdrop-blur-sm ${
                        language === option.value
                          ? 'border-transparent bg-gradient-to-r from-winter-500/90 via-sky-500/90 to-winter-400/90 text-white shadow-[0_12px_40px_rgba(56,189,248,0.35)]'
                          : 'border-white/10 bg-white/10 text-white/80 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-3xl">{option.icon}</span>
                      <span className="text-lg font-semibold">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
  
            {!birthdayOnly && step === 2 && (
              <div className="space-y-4">
                <h2 className="text-fluid-h2 font-semibold text-white">
                  {language === 'de' ? 'Wie sollen wir dich nennen?' : 'What should we call you?'}
                </h2>
                <p className="text-sm text-white/70">
                  {language === 'de'
                    ? 'Wähle einen Spitznamen für dein Profil'
                    : 'Choose a nickname for your profile'}
                </p>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                  placeholder={language === 'de' ? 'z.B. Max' : 'e.g. Max'}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/60 focus:border-transparent focus:ring-2 focus:ring-sky-400/80 focus:outline-none"
                  autoFocus
                />
              </div>
            )}
  
            {!birthdayOnly && step === 3 && (
              <div className="space-y-4">
                <h2 className="text-fluid-h2 font-semibold text-white">{t('onboarding.profilePictureTitle')}</h2>
                <p className="text-sm text-white/70">{t('onboarding.profilePictureDescription')}</p>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-24 w-24 overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-inner">
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt={t('onboarding.profilePictureAlt')}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">👤</div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          profilePictureInputRef.current?.click();
                        }}
                        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-winter-900 shadow-[0_14px_40px_rgba(15,23,42,0.35)] transition hover:shadow-[0_18px_50px_rgba(15,23,42,0.45)]"
                      >
                        {profilePicturePreview
                          ? t('onboarding.changeProfilePicture')
                          : t('onboarding.uploadProfilePicture')}
                      </button>
                      <input
                        ref={profilePictureInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 text-sm text-white/70 md:pl-6">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p>{t('onboarding.profilePictureInfo')}</p>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div>
                        <p className="font-semibold text-white">{t('onboarding.shareProfilePicture')}</p>
                        <p>{t('onboarding.shareProfilePictureDescription')}</p>
                      </div>
                      <button
                        type="button"
                        aria-pressed={shareProfilePicture}
                        onClick={() => {
                          setShareProfilePicture((prev) => !prev);
                        }}
                        className={`relative h-9 w-16 rounded-full border transition-all duration-200 ${
                          shareProfilePicture
                            ? 'border-white/40 bg-gradient-to-r from-winter-400 to-winter-600 shadow-[0_14px_40px_rgba(15,23,42,0.45)]'
                            : 'border-white/20 bg-white/10 hover:border-white/30'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 h-7 w-7 rounded-full bg-white transition-transform duration-200 ${
                            shareProfilePicture ? 'translate-x-7 drop-shadow-[0_8px_20px_rgba(15,23,42,0.35)]' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!birthdayOnly && step === 4 && (
              <div className="space-y-4">
                <h2 className="text-fluid-h2 font-semibold text-white">Dein Geschlecht</h2>
                <p className="text-sm text-white/70">Dies hilft uns bei der Berechnung deiner Ziele</p>
                <div className="space-y-3">
                  {[
                    { value: 'male' as Gender, label: 'Männlich', icon: '👨' },
                    { value: 'female' as Gender, label: 'Weiblich', icon: '👩' },
                    { value: 'diverse' as Gender, label: 'Divers', icon: '🧑' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setGender(option.value);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-5 py-3.5 transition-all ${
                        gender === option.value
                          ? 'border-transparent bg-gradient-to-r from-winter-500/90 via-sky-500/90 to-winter-400/90 text-white shadow-[0_12px_40px_rgba(56,189,248,0.35)]'
                          : 'border-white/10 bg-white/10 text-white/80 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-semibold text-white">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!birthdayOnly && step === 5 && (
              <div className="space-y-4">
                <h2 className="text-fluid-h2 font-semibold text-white">Deine Größe</h2>
                <p className="text-sm text-white/70">In Zentimetern (cm)</p>
                <div className="relative">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => {
                      setHeight(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                    placeholder="z.B. 180"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 pr-16 text-white placeholder-white/60 focus:border-transparent focus:ring-2 focus:ring-sky-400/80 focus:outline-none"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/60">
                    cm
                  </span>
                </div>
              </div>
            )}
  
            {!birthdayOnly && step === 6 && (
              <div className="space-y-4">
                <h2 className="text-fluid-h2 font-semibold text-white">Körperfettanteil (optional)</h2>
                <p className="text-sm text-white/70">Wenn du deinen KFA kennst, gib ihn hier ein</p>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={bodyFat}
                    onChange={(e) => {
                      setBodyFat(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                    placeholder="z.B. 15.5"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 pr-16 text-white placeholder-white/60 focus:border-transparent focus:ring-2 focus:ring-sky-400/80 focus:outline-none"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/60">
                    %
                  </span>
                </div>
              </div>
            )}
  
            {!birthdayOnly && step === 7 && (
              <div className="space-y-4">
                <h2 className="text-fluid-h2 font-semibold text-white">Maximale Liegestütze</h2>
                <p className="text-sm text-white/70">Wie viele Liegestütze schaffst du maximal am Stück?</p>
                <div className="relative">
                  <input
                    type="number"
                    value={maxPushups}
                    onChange={(e) => {
                      setMaxPushups(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                    placeholder="z.B. 30"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 pr-20 text-white placeholder-white/60 focus:border-transparent focus:ring-2 focus:ring-sky-400/80 focus:outline-none"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/60">
                    Reps
                  </span>
                </div>
                {maxPushups && parseInt(maxPushups) > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-sm text-white/80">
                      Dein Trainingsplan startet mit{' '}
                      <span className="font-semibold text-sky-300">
                        {initPushupPlan(parseInt(maxPushups)).baseReps}
                      </span>{' '}
                      Wiederholungen pro Satz
                    </p>
                  </div>
                )}
              </div>
            )}
  
            {!birthdayOnly && step === 8 && (
              <div className="space-y-4">
                <h2 className="text-fluid-h2 font-semibold text-white">✅ {t('onboarding.selectActivities')}</h2>
                <p className="text-sm text-white/70">{t('onboarding.activitiesHelp')}</p>
                <div className="space-y-3">
                  {([
                    { value: 'pushups' as Activity, label: t('onboarding.activityPushups'), icon: '💪' },
                    { value: 'sports' as Activity, label: t('onboarding.activitySports'), icon: '🏃' },
                    { value: 'water' as Activity, label: t('onboarding.activityWater'), icon: '💧' },
                    { value: 'protein' as Activity, label: t('onboarding.activityProtein'), icon: '🥩' },
                  ]).map((activity) => (
                    <button
                      key={activity.value}
                      onClick={() => {
                        if (enabledActivities.includes(activity.value)) {
                          setEnabledActivities(enabledActivities.filter((a) => a !== activity.value));
                        } else {
                          setEnabledActivities([...enabledActivities, activity.value]);
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-5 py-3.5 transition-all ${
                        enabledActivities.includes(activity.value)
                          ? 'border-transparent bg-gradient-to-r from-winter-500/90 via-sky-500/90 to-winter-400/90 text-white shadow-[0_12px_40px_rgba(56,189,248,0.35)]'
                          : 'border-white/10 bg-white/10 text-white/80 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl">{activity.icon}</span>
                      <span className="flex-1 text-left text-base font-semibold">{activity.label}</span>
                      {enabledActivities.includes(activity.value) && (
                        <span className="text-xl text-sky-200">✓</span>
                      )}
                    </button>
                  ))}
                </div>
                {enabledActivities.length === 0 && (
                  <p className="text-sm text-rose-300">
                    {language === 'de'
                      ? 'Bitte wähle mindestens eine Aktivität aus'
                      : 'Please select at least one activity'}
                  </p>
                )}
              </div>
            )}
  
            {!birthdayOnly && step === 9 && (
              <div className="space-y-4">
                <h2 className="text-fluid-h2 font-semibold text-white">🎂 {t('onboarding.birthdayOptional')}</h2>
                <p className="text-sm text-white/70">{t('onboarding.birthdayHelp')}</p>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => { setBirthday(e.target.value); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleComplete()}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/60 focus:border-transparent focus:ring-2 focus:ring-sky-400/80 focus:outline-none"
                  autoFocus
                />
              </div>
            )}
          </div>
  
          {/* Navigation Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Zurück
              </button>
            )}
            {step < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 rounded-2xl bg-gradient-to-r from-winter-500 via-sky-500 to-winter-400 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(56,189,248,0.35)] transition-all hover:shadow-[0_16px_40px_rgba(56,189,248,0.45)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed()}
                className="flex-1 rounded-2xl bg-gradient-to-r from-winter-500 via-sky-500 to-winter-400 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(56,189,248,0.35)] transition-all hover:shadow-[0_16px_40px_rgba(56,189,248,0.45)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
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
