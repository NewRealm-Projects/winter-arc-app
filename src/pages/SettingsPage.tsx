import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useStore } from '../store/useStore';
import { Language, Activity, ActivityLevel } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { glassCardClasses, glassCardHoverClasses, designTokens } from '../theme/tokens';
import { SentryErrorButton } from '../components/SentryErrorButton';
import { UserAvatar } from '../components/ui/UserAvatar';

type SectionId = 'general' | 'profile' | 'account';

function SettingsPage() {
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem('weather-city');
    } catch {
      // Ignore storage access issues (e.g., private mode)
    }
  }, []);
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [groupCode, setGroupCode] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editLanguage, setEditLanguage] = useState<Language>('de');
  const [editNickname, setEditNickname] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editBodyFat, setEditBodyFat] = useState('');
  const [editActivityLevel, setEditActivityLevel] = useState<ActivityLevel>('moderate');
  const [editMaxPushups, setEditMaxPushups] = useState('');

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('notification-enabled') === 'true';
  });

  const [notificationTime, setNotificationTime] = useState('20:00');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('general');
  const [activeLegalDocument, setActiveLegalDocument] = useState<'privacy' | 'terms' | null>(null);
  const showDebugTools =
    import.meta.env.DEV || (import.meta.env.VITE_ENABLE_DEBUG_TOOLS ?? '').toLowerCase() === 'true';

  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const pwaInstallPrompt = useStore((state) => state.pwaInstallPrompt);
  const setPwaInstallPrompt = useStore((state) => state.setPwaInstallPrompt);
  const isIOS = typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone));

  const handleInstallApp = async () => {
    if (pwaInstallPrompt) {
      try {
        setShowInstallHelp(false);
        await pwaInstallPrompt.prompt();
        const { outcome } = await pwaInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          setPwaInstallPrompt(null);
        } else {
          localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        }
      } catch (error) {
        console.error('Install prompt failed:', error);
      }
      return;
    }
    setShowInstallHelp(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEditProfile = () => {
    if (!user) return;
    setEditLanguage(user.language || 'de');
    setEditNickname(user.nickname);
    setEditHeight(user.height.toString());
    setEditWeight(user.weight.toString());
    setEditBodyFat(user.bodyFat?.toString() || '');
    setEditActivityLevel(user.activityLevel || 'moderate');
    setEditMaxPushups(user.maxPushups.toString());
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { updateUser } = await import('../services/firestoreService');

      const updates = {
        language: editLanguage,
        nickname: editNickname,
        height: parseInt(editHeight),
        weight: parseInt(editWeight),
        bodyFat: editBodyFat ? parseFloat(editBodyFat) : undefined,
        activityLevel: editActivityLevel,
        maxPushups: parseInt(editMaxPushups),
      };

      const result = await updateUser(user.id, updates);

      if (result.success) {
        setUser({
          ...user,
          ...updates,
        });
        setIsEditingProfile(false);
        alert(t('settings.profileUpdated'));
      } else {
        alert(t('settings.saveError'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(t('settings.saveError'));
    }
  };

  // REMOVED: Manual profile picture upload functionality (UI removed)
  // Profile pictures are automatically synced from Google OAuth (handled by useAuth.ts)
  // Users see initials in colored avatar if no Google picture is available

  const handleJoinGroup = async () => {
    if (!user) return;

    try {
      const { joinGroup } = await import('../services/firestoreService');
      const { updateUser } = await import('../services/firestoreService');

      // Join the group
      const groupResult = await joinGroup(groupCode, user.id);

      if (groupResult.success) {
        // Update user's groupCode
        await updateUser(user.id, { groupCode });

        // Update local state
        setUser({
          ...user,
          groupCode,
        });

        alert(t('settings.joinedGroup'));
      } else {
        alert(t('settings.joinGroupError'));
      }
    } catch (error) {
      console.error('Error joining group:', error);
      alert(t('settings.joinGroupError'));
    } finally {
      setShowGroupInput(false);
      setGroupCode('');
    }
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Request permission when enabling
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          setNotificationsEnabled(true);
          scheduleNotification(notificationTime);
          console.warn('✅ Benachrichtigungen aktiviert für', notificationTime);
        } else if (permission === 'denied') {
          alert('❌ Benachrichtigungs-Berechtigung wurde verweigert. Bitte erlaube Benachrichtigungen in deinen Browser-Einstellungen.');
        } else {
          alert('⚠️ Benachrichtigungs-Berechtigung wurde nicht erteilt.');
        }
      } else {
        alert('❌ Dein Browser unterstützt keine Benachrichtigungen.');
      }
    } else {
      // Disable notifications
      setNotificationsEnabled(false);
      console.warn('🔕 Benachrichtigungen deaktiviert');
    }
  };

  const scheduleNotification = (time: string) => {
    // Calculate time until notification
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ Winter Arc Tracker', {
          body: 'Zeit für dein Training! Logge deine Fortschritte.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        });

        // Reschedule for next day
        scheduleNotification(time);
      }
    }, timeUntilNotification);

    console.warn(`🔔 Benachrichtigung geplant für ${scheduledTime.toLocaleString()}`);
  };

  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🧪 Test-Benachrichtigung', {
        body: 'Benachrichtigungen funktionieren! Du wirst täglich um ' + notificationTime + ' Uhr erinnert.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
      console.warn('📬 Test-Benachrichtigung gesendet');
    } else {
      alert('❌ Benachrichtigungen sind nicht aktiviert oder die Berechtigung wurde verweigert.');
    }
  };

  const closeTimeModal = () => {
    setShowTimeModal(false);
  };

  const handleSaveNotificationTime = () => {
    closeTimeModal();

    if (notificationsEnabled) {
      scheduleNotification(notificationTime);
    }
  };

  const handleResetNotificationTime = () => {
    closeTimeModal();
    setNotificationTime('20:00');
  };

  const sections: Array<{ id: SectionId; label: string; description: string }> = [
    {
      id: 'general',
      label: `✨ ${t('settings.quickSettings')}`,
      description: t('settings.quickSettingsDesc'),
    },
    {
      id: 'profile',
      label: `👤 ${t('settings.profile')}`,
      description: t('settings.profileSettingsDesc'),
    },
    {
      id: 'account',
      label: `🔐 ${t('settings.account')}`,
      description: t('settings.accountSettingsDesc'),
    },
  ];

  const currentSection = sections.find((section) => section.id === activeSection) ?? sections[0];
  const enabledActivities = user?.enabledActivities || ['pushups', 'sports', 'water', 'protein'];

  const profileSummaryItems: Array<{ label: string; value: string }> = [
    { label: t('settings.language'), value: user?.language === 'de' ? '🇩🇪 Deutsch' : '🇺🇸 English' },
    { label: t('settings.nickname'), value: user?.nickname || '—' },
    {
      label: t('settings.gender'),
      value: user?.gender === 'male'
        ? t('settings.male')
        : user?.gender === 'female'
          ? t('settings.female')
          : t('settings.diverse'),
    },
    { label: t('settings.height'), value: `${user?.height ?? '—'} cm` },
    { label: t('settings.weight'), value: `${user?.weight ?? '—'} kg` },
    { label: t('settings.maxPushups'), value: `${user?.maxPushups ?? '—'}` },
  ];

  useEffect(() => {
    if (!activeLegalDocument) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveLegalDocument(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeLegalDocument]);

  const renderTimeModal = () => {
    if (!showTimeModal) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
        <div className={`${glassCardClasses} ${designTokens.padding.spacious} max-w-md w-full text-white`}>
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">{t('settings.reminderTime')}</h2>
            <input
              type="time"
              value={notificationTime}
              onChange={(e) => { setNotificationTime(e.target.value); }}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/30"
            />
            <div className="flex flex-col gap-2 md:flex-row">
              <button
                type="button"
                onClick={handleSaveNotificationTime}
                className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-winter-900 shadow-[0_14px_40px_rgba(15,23,42,0.35)] transition hover:shadow-[0_18px_50px_rgba(15,23,42,0.45)]"
              >
                {t('common.save')}
              </button>
              <button
                type="button"
                onClick={handleResetNotificationTime}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLegalModal = () => {
    if (!activeLegalDocument) {
      return null;
    }

    const legalContent =
      activeLegalDocument === 'privacy'
        ? {
            title: t('settings.privacy'),
            intro: t('settings.privacyIntro'),
            sections: [
              {
                heading: t('settings.privacyDataTitle'),
                body: [t('settings.privacyDataBody1'), t('settings.privacyDataBody2')],
              },
              {
                heading: t('settings.privacyUsageTitle'),
                body: [t('settings.privacyUsageBody1'), t('settings.privacyUsageBody2')],
              },
              {
                heading: t('settings.privacyRightsTitle'),
                body: [t('settings.privacyRightsBody1'), t('settings.privacyRightsBody2')],
              },
            ],
            lastUpdated: t('settings.privacyLastUpdated'),
          }
        : {
            title: t('settings.terms'),
            intro: t('settings.termsIntro'),
            sections: [
              {
                heading: t('settings.termsUsageTitle'),
                body: [t('settings.termsUsageBody1'), t('settings.termsUsageBody2')],
              },
              {
                heading: t('settings.termsResponsibilitiesTitle'),
                body: [t('settings.termsResponsibilitiesBody1'), t('settings.termsResponsibilitiesBody2')],
              },
              {
                heading: t('settings.termsChangesTitle'),
                body: [t('settings.termsChangesBody1'), t('settings.termsChangesBody2')],
              },
            ],
            lastUpdated: t('settings.termsLastUpdated'),
          };

    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        aria-describedby="legal-modal-intro"
        onClick={() => {
          setActiveLegalDocument(null);
        }}
      >
        <div
          className={`${glassCardClasses} ${designTokens.padding.spacious} max-h-[80vh] w-full max-w-2xl overflow-y-auto text-white`}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="legal-modal-title" className="text-2xl font-semibold">
                  {legalContent.title}
                </h2>
                <p id="legal-modal-intro" className="text-sm text-white/70">
                  {legalContent.intro}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveLegalDocument(null);
                }}
                className="rounded-full border border-white/20 bg-white/10 p-2 text-white transition hover:border-white/30 hover:bg-white/15"
                aria-label={t('settings.legalClose')}
              >
                ×
              </button>
            </div>
            <div className="flex flex-col gap-5 text-sm leading-relaxed text-white/80">
              {legalContent.sections.map((section) => (
                <section key={section.heading} className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-white">{section.heading}</h3>
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </div>
            <div className="flex flex-col gap-2 text-xs text-white/60">
              <span>{legalContent.lastUpdated}</span>
              <span>{t('settings.legalContact')}</span>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveLegalDocument(null);
                }}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
              >
                {t('settings.legalClose')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (user?.bodyFat) {
    profileSummaryItems.splice(5, 0, { label: t('settings.bodyFat'), value: `${user.bodyFat}%` });
  }

  if (user?.activityLevel) {
    const activityLevelLabels: Record<ActivityLevel, string> = {
      sedentary: t('onboarding.activityLevelSedentary'),
      light: t('onboarding.activityLevelLight'),
      moderate: t('onboarding.activityLevelModerate'),
      active: t('onboarding.activityLevelActive'),
      very_active: t('onboarding.activityLevelVeryActive'),
    };
    profileSummaryItems.push({ label: t('settings.activityLevel'), value: activityLevelLabels[user.activityLevel] });
  }

  return (
    <div className="min-h-screen-mobile safe-pt pb-32 overflow-y-auto viewport-safe">
      <div className="mobile-container dashboard-container safe-pb px-3 pt-4 md:px-6 md:pt-8 lg:px-0">
        <div className="flex flex-col gap-3 md:gap-4">
          <section className={`${glassCardClasses} ${designTokens.padding.spacious} text-white`}>
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="flex items-center gap-2 text-fluid-h1 font-semibold tracking-tight">
                  <span aria-hidden="true">⚙️</span>
                  {t('settings.title')}
                </h1>
                <p className="text-sm text-white/70">{t('settings.subtitle')}</p>
              </div>
              <nav className="flex flex-wrap gap-2" aria-label={t('settings.title')}>
                {sections.map((section) => {
                  const isActive = section.id === activeSection;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => { setActiveSection(section.id); }}
                      className={`group flex-1 min-w-[140px] rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'border-transparent bg-white text-winter-900 shadow-[0_14px_40px_rgba(15,23,42,0.35)]'
                          : 'border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/15'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
              <p className="text-xs text-white/60">{currentSection.description}</p>
            </div>
          </section>

          <div className="flex flex-col gap-3 md:gap-4">
            {activeSection === 'general' && (
              <>
                <section className={`${glassCardHoverClasses} ${designTokens.padding.spacious} text-white`}>
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <span aria-hidden="true">✅</span>
                        {t('settings.activities')}
                      </h2>
                      <p className="text-sm text-white/70">{t('settings.activitiesDesc')}</p>
                    </div>
                    <div className="space-y-4">
                      {([
                        { value: 'pushups' as Activity, label: t('tracking.pushups'), icon: '💪' },
                        { value: 'sports' as Activity, label: t('tracking.sport'), icon: '🏃' },
                        { value: 'water' as Activity, label: t('tracking.water'), icon: '💧' },
                        { value: 'protein' as Activity, label: t('tracking.protein'), icon: '🥩' },
                      ]).map((activity) => {
                        const activityEnabled = enabledActivities.includes(activity.value);
                        return (
                          <div key={activity.value} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl" aria-hidden="true">{activity.icon}</span>
                              <div className="flex flex-col">
                                <span className="font-semibold">{activity.label}</span>
                                <span className="text-xs uppercase tracking-[0.2em] text-white/50">
                                  {activityEnabled ? t('common.yes') : t('common.no')}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              aria-pressed={activityEnabled}
                              onClick={async () => {
                                if (!user) return;
                                const currentActivities = user.enabledActivities || ['pushups', 'sports', 'water', 'protein'];
                                let newActivities: Activity[];

                                if (currentActivities.includes(activity.value)) {
                                  if (currentActivities.length === 1) {
                                    alert(t('common.error') + ': ' + (user.language === 'de'
                                      ? 'Mindestens eine Aktivität muss aktiviert bleiben'
                                      : 'At least one activity must remain enabled'));
                                    return;
                                  }
                                  newActivities = currentActivities.filter((item) => item !== activity.value);
                                } else {
                                  newActivities = [...currentActivities, activity.value];
                                }

                                const { updateUser } = await import('../services/firestoreService');
                                const result = await updateUser(user.id, { enabledActivities: newActivities });
                                if (result.success) {
                                  setUser({ ...user, enabledActivities: newActivities });
                                }
                              }}
                              className={`relative h-9 w-16 rounded-full border transition-all duration-200 ${
                                activityEnabled
                                  ? 'border-white/40 bg-gradient-to-r from-winter-400 to-winter-600 shadow-[0_14px_40px_rgba(15,23,42,0.45)]'
                                  : 'border-white/20 bg-white/10 hover:border-white/30'
                              }`}
                            >
                              <span
                                className={`absolute top-1 left-1 h-7 w-7 rounded-full bg-white transition-transform duration-200 ${
                                  activityEnabled ? 'translate-x-7 drop-shadow-[0_8px_20px_rgba(15,23,42,0.35)]' : ''
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-white/60">
                      {user?.language === 'de'
                        ? '💡 Gewicht wird immer getrackt und kann nicht deaktiviert werden'
                        : '💡 Weight is always tracked and cannot be disabled'}
                    </p>
                  </div>
                </section>

                <section className={`${glassCardHoverClasses} ${designTokens.padding.spacious} text-white`}>
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                          <span aria-hidden="true">🔔</span>
                          {t('settings.notifications')}
                        </h2>
                        <p className="text-sm text-white/70">{t('settings.dailyReminder')}</p>
                      </div>
                      <button
                        type="button"
                        aria-pressed={notificationsEnabled}
                        onClick={handleToggleNotifications}
                        className={`relative h-9 w-16 rounded-full border transition-all duration-200 ${
                          notificationsEnabled
                            ? 'border-white/40 bg-gradient-to-r from-winter-400 to-winter-600 shadow-[0_14px_40px_rgba(15,23,42,0.45)]'
                            : 'border-white/20 bg-white/10 hover:border-white/30'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 h-7 w-7 rounded-full bg-white transition-transform duration-200 ${
                            notificationsEnabled ? 'translate-x-7 drop-shadow-[0_8px_20px_rgba(15,23,42,0.35)]' : ''
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>{t('settings.reminderTime')}</span>
                      <span className="font-semibold text-white">{notificationTime}</span>
                    </div>
                    {notificationsEnabled && (
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => { setShowTimeModal(true); }}
                          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
                        >
                          {t('settings.changeTime')}
                        </button>
                        <button
                          type="button"
                          onClick={sendTestNotification}
                          className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-winter-900 shadow-[0_14px_40px_rgba(15,23,42,0.35)] transition hover:shadow-[0_18px_50px_rgba(15,23,42,0.45)]"
                        >
                          {t('settings.testNotification')}
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <section className={`${glassCardHoverClasses} ${designTokens.padding.spacious} text-white`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <span aria-hidden="true">🎨</span>
                        {t('settings.appearance')}
                      </h2>
                      <p className="text-sm text-white/70">{t('settings.themeDesc')}</p>
                    </div>
                    <ThemeToggle />
                  </div>
                </section>

                <section className={`${glassCardHoverClasses} ${designTokens.padding.spacious} text-white`}>
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <span aria-hidden="true">📲</span>
                        {t('settings.installSection')}
                      </h2>
                      <p className="text-sm text-white/70">{t('settings.installDescription')}</p>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <button
                        type="button"
                        onClick={handleInstallApp}
                        disabled={isStandalone}
                        className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-winter-900 shadow-[0_14px_40px_rgba(15,23,42,0.35)] transition hover:shadow-[0_18px_50px_rgba(15,23,42,0.45)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {pwaInstallPrompt ? t('settings.installButton') : t('settings.installHelp')}
                      </button>
                      {!pwaInstallPrompt && (
                        <button
                          type="button"
                          onClick={() => { setShowInstallHelp((prev) => !prev); }}
                          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
                        >
                          {showInstallHelp ? t('settings.hideInstructions') : t('settings.showInstructions')}
                        </button>
                      )}
                    </div>
                    {(showInstallHelp || !pwaInstallPrompt) && (
                      <p className="text-xs leading-relaxed text-white/60">
                        {isStandalone
                          ? t('settings.installAlready')
                          : isIOS
                            ? t('settings.installInstructionsIos')
                            : t('settings.installInstructions')}
                      </p>
                    )}
                  </div>
                </section>
              </>
            )}

            {activeSection === 'profile' && (
              <>
                <section className={`${glassCardHoverClasses} ${designTokens.padding.spacious} text-white`}>
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-4">
                      {user && <UserAvatar user={user} size="lg" />}
                      <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                          <span aria-hidden="true">👤</span>
                          {t('settings.profile')}
                        </h2>
                        <p className="text-sm text-white/70">{user?.nickname}</p>
                      </div>
                    </div>

                    {isEditingProfile ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">
                            {t('settings.language')}
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => { setEditLanguage('de'); }}
                              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                editLanguage === 'de'
                                  ? 'border-transparent bg-white text-winter-900 shadow-[0_14px_40px_rgba(15,23,42,0.35)]'
                                  : 'border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/15'
                              }`}
                            >
                              🇩🇪 Deutsch
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditLanguage('en'); }}
                              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                editLanguage === 'en'
                                  ? 'border-transparent bg-white text-winter-900 shadow-[0_14px_40px_rgba(15,23,42,0.35)]'
                                  : 'border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/15'
                              }`}
                            >
                              🇺🇸 English
                            </button>
                          </div>
                        </div>

                        {([{
                          key: 'nickname',
                          label: t('settings.nickname'),
                          value: editNickname,
                          onChange: (value: string) => { setEditNickname(value); },
                          type: 'text' as const,
                        }, {
                          key: 'height',
                          label: t('settings.height'),
                          value: editHeight,
                          onChange: (value: string) => { setEditHeight(value); },
                          type: 'number' as const,
                        }, {
                          key: 'weight',
                          label: t('settings.weight'),
                          value: editWeight,
                          onChange: (value: string) => { setEditWeight(value); },
                          type: 'number' as const,
                        }, {
                          key: 'bodyFat',
                          label: t('settings.bodyFat'),
                          value: editBodyFat,
                          onChange: (value: string) => { setEditBodyFat(value); },
                          type: 'number' as const,
                          step: '0.1',
                        }, {
                          key: 'maxPushups',
                          label: t('settings.maxPushups'),
                          value: editMaxPushups,
                          onChange: (value: string) => { setEditMaxPushups(value); },
                          type: 'number' as const,
                        }] as const).map((field) => (
                          <label key={field.key} className="flex flex-col gap-2 text-sm font-medium">
                            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">{field.label}</span>
                            <input
                              type={field.type}
                              value={field.value}
                              step={'step' in field ? field.step : undefined}
                              onChange={(event) => { field.onChange(event.target.value); }}
                              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/30"
                            />
                          </label>
                        ))}

                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">
                            {t('settings.activityLevel')}
                          </span>
                          <p className="text-xs text-white/60 -mt-1 mb-1">{t('settings.activityLevelDescription')}</p>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { value: 'sedentary' as ActivityLevel, label: t('onboarding.activityLevelSedentary'), icon: '🪑' },
                              { value: 'light' as ActivityLevel, label: t('onboarding.activityLevelLight'), icon: '🚶' },
                              { value: 'moderate' as ActivityLevel, label: t('onboarding.activityLevelModerate'), icon: '🏃' },
                              { value: 'active' as ActivityLevel, label: t('onboarding.activityLevelActive'), icon: '🏋️' },
                              { value: 'very_active' as ActivityLevel, label: t('onboarding.activityLevelVeryActive'), icon: '💪' },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => { setEditActivityLevel(option.value); }}
                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                  editActivityLevel === option.value
                                    ? 'border-transparent bg-white text-winter-900 shadow-[0_14px_40px_rgba(15,23,42,0.35)]'
                                    : 'border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/15'
                                }`}
                              >
                                <span className="text-xl">{option.icon}</span>
                                <span className="flex-1 text-left">{option.label}</span>
                                {editActivityLevel === option.value && <span className="text-lg">✓</span>}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 md:flex-row">
                          <button
                            type="button"
                            onClick={handleSaveProfile}
                            className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-winter-900 shadow-[0_14px_40px_rgba(15,23,42,0.35)] transition hover:shadow-[0_18px_50px_rgba(15,23,42,0.45)]"
                          >
                            {t('common.save')}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsEditingProfile(false); }}
                            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 gap-3 text-sm text-white/80">
                          {profileSummaryItems.map((item) => (
                            <div key={item.label} className="flex items-center justify-between gap-2">
                              <span className="text-xs uppercase tracking-[0.28em] text-white/50">{item.label}</span>
                              <span className="font-semibold text-white">{item.value}</span>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handleEditProfile}
                          className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-winter-900 shadow-[0_14px_40px_rgba(15,23,42,0.35)] transition hover:shadow-[0_18px_50px_rgba(15,23,42,0.45)]"
                        >
                          {t('settings.editProfile')}
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <section className={`${glassCardHoverClasses} ${designTokens.padding.spacious} text-white`}>
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <span aria-hidden="true">👥</span>
                        {t('settings.group')}
                      </h2>
                      <p className="text-sm text-white/70">{t('settings.joinOrCreateGroup')}</p>
                    </div>
                    {user?.groupCode ? (
                      <div className="flex flex-col gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-4">
                          <span className="text-xs uppercase tracking-[0.28em] text-white/50">
                            {t('settings.yourGroupCode')}
                          </span>
                          <span className="mt-1 block text-2xl font-semibold text-white">
                            {user.groupCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:border-red-200/60 hover:bg-red-500/20"
                        >
                          {t('settings.leaveGroup')}
                        </button>
                      </div>
                    ) : showGroupInput ? (
                      <div className="flex flex-col gap-3">
                        <label className="flex flex-col gap-2 text-sm font-semibold text-white">
                          <span className="text-xs uppercase tracking-[0.28em] text-white/50">
                            {t('settings.groupCodePlaceholder')}
                          </span>
                          <input
                            type="text"
                            value={groupCode}
                            onChange={(e) => { setGroupCode(e.target.value.toUpperCase()); }}
                            placeholder={t('settings.groupCodePlaceholder')}
                            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-mono text-white outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/30"
                            autoFocus
                          />
                        </label>
                        <div className="flex flex-col gap-2 md:flex-row">
                          <button
                            type="button"
                            onClick={handleJoinGroup}
                            disabled={!groupCode}
                            className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-winter-900 shadow-[0_14px_40px_rgba(15,23,42,0.35)] transition hover:shadow-[0_18px_50px_rgba(15,23,42,0.45)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {t('settings.joinGroup')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowGroupInput(false);
                              setGroupCode('');
                            }}
                            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setShowGroupInput(true); }}
                        className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
                      >
                        {t('settings.joinOrCreateGroup')}
                      </button>
                    )}
                  </div>
                </section>
              </>
            )}

            {activeSection === 'account' && (
              <>
                <section className={`${glassCardHoverClasses} ${designTokens.padding.spacious} text-white`}>
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <span aria-hidden="true">🔐</span>
                        {t('settings.account')}
                      </h2>
                      <p className="text-sm text-white/70">{t('settings.subtitle')}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
                      >
                        {t('settings.logout')}
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-left text-sm font-semibold text-red-200 transition hover:border-red-200/60 hover:bg-red-500/20"
                      >
                        {t('settings.deleteAccount')}
                      </button>
                    </div>
                  </div>
                </section>

                <section className={`${glassCardHoverClasses} ${designTokens.padding.spacious} text-white`}>
                  <div className="flex flex-col gap-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <span aria-hidden="true">📄</span>
                      {t('settings.legal')}
                    </h2>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLegalDocument('privacy');
                        }}
                        aria-haspopup="dialog"
                        className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
                      >
                        {t('settings.privacy')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLegalDocument('terms');
                        }}
                        aria-haspopup="dialog"
                        className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
                      >
                        {t('settings.terms')}
                      </button>
                    </div>
                  </div>
                </section>

                {showDebugTools && (
                  <section className={`${glassCardHoverClasses} ${designTokens.padding.spacious} border border-yellow-300/40 bg-yellow-500/10 text-yellow-50`}>
                    <div className="flex flex-col gap-4">
                      <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                          <span aria-hidden="true">🧪</span>
                          {t('settings.debugToolsTitle')}
                        </h2>
                        <p className="text-sm text-yellow-100/80">{t('settings.debugToolsDescription')}</p>
                      </div>
                      <SentryErrorButton
                        label={t('settings.debugToolsTrigger')}
                        errorMessage={t('settings.debugToolsErrorMessage')}
                        className="rounded-xl border border-yellow-200/40 bg-yellow-400/20 px-4 py-3 text-left text-sm font-semibold text-yellow-50 transition hover:border-yellow-200/60 hover:bg-yellow-400/30"
                      />
                      <div className="text-xs text-yellow-100/80">
                        {t('settings.debugToolsStatus', {
                          status: import.meta.env.VITE_SENTRY_DSN
                            ? t('settings.debugToolsStatusConfigured')
                            : t('settings.debugToolsStatusMissing'),
                        })}
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          <div className="text-center text-xs text-white/50">
            Winter Arc Tracker v0.0.1
          </div>
        </div>
      </div>

      {renderLegalModal()}
      {renderTimeModal()}
    </div>
  );
}

export default SettingsPage;
