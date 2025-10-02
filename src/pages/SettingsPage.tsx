import { useState } from 'react';
import { signOut } from 'firebase/auth';
import * as Sentry from '@sentry/react';
import { auth } from '../firebase/config';
import { useStore } from '../store/useStore';
import { Language } from '../types';

function SettingsPage() {
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [groupCode, setGroupCode] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editLanguage, setEditLanguage] = useState<Language>('de');
  const [editNickname, setEditNickname] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editBodyFat, setEditBodyFat] = useState('');
  const [editMaxPushups, setEditMaxPushups] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('20:00');
  const [showTimeModal, setShowTimeModal] = useState(false);

  const user = useStore((state) => state.user);
  const darkMode = useStore((state) => state.darkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const setUser = useStore((state) => state.setUser);

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
        maxPushups: parseInt(editMaxPushups),
      };

      const result = await updateUser(user.id, updates);

      if (result.success) {
        setUser({
          ...user,
          ...updates,
        });
        setIsEditingProfile(false);
        alert('Profil erfolgreich aktualisiert!');
      } else {
        alert('Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Fehler beim Speichern');
    }
  };

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

        alert('Erfolgreich der Gruppe beigetreten!');
      } else {
        alert('Fehler beim Beitreten der Gruppe');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Fehler beim Beitreten der Gruppe');
    } finally {
      setShowGroupInput(false);
      setGroupCode('');
    }
  };

  const handleTestError = () => {
    try {
      console.log('🧪 Testing Sentry error capture...');
      throw new Error('Test error for Sentry - triggered from Settings page');
    } catch (error) {
      Sentry.captureException(error);
      alert('Test-Fehler wurde an Sentry gesendet! Prüfe dein Sentry Dashboard.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset-top">
      {/* Header */}
      <div className="bg-gradient-to-r from-winter-600 to-winter-700 dark:from-winter-700 dark:to-winter-800 text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">⚙️ Einstellungen</h1>
          <p className="text-winter-100">Passe dein Profil an</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 pb-20 space-y-4">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            👤 Profil
          </h2>
          {isEditingProfile ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sprache
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditLanguage('de')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                      editLanguage === 'de'
                        ? 'border-winter-600 bg-winter-50 dark:bg-winter-900 text-winter-600 dark:text-winter-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-winter-400'
                    }`}
                  >
                    🇩🇪 Deutsch
                  </button>
                  <button
                    onClick={() => setEditLanguage('en')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                      editLanguage === 'en'
                        ? 'border-winter-600 bg-winter-50 dark:bg-winter-900 text-winter-600 dark:text-winter-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-winter-400'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spitzname
                </label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Größe (cm)
                </label>
                <input
                  type="number"
                  value={editHeight}
                  onChange={(e) => setEditHeight(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gewicht (kg)
                </label>
                <input
                  type="number"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  KFA (%) - Optional
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editBodyFat}
                  onChange={(e) => setEditBodyFat(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max. Liegestütze
                </label>
                <input
                  type="number"
                  value={editMaxPushups}
                  onChange={(e) => setEditMaxPushups(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-4 py-3 bg-winter-600 text-white rounded-lg hover:bg-winter-700 transition-colors font-medium"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Sprache</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user?.language === 'de' ? '🇩🇪 Deutsch' : '🇬🇧 English'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Spitzname</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user?.nickname}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Geschlecht</span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">
                    {user?.gender === 'male' ? 'Männlich' : user?.gender === 'female' ? 'Weiblich' : 'Divers'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Größe</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user?.height} cm
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Gewicht</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user?.weight} kg
                  </span>
                </div>
                {user?.bodyFat && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">KFA</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {user.bodyFat}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Max. Liegestütze</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user?.maxPushups}
                  </span>
                </div>
              </div>
              <button
                onClick={handleEditProfile}
                className="mt-4 w-full px-4 py-3 bg-winter-600 text-white rounded-lg hover:bg-winter-700 transition-colors font-medium"
              >
                Profil bearbeiten
              </button>
            </>
          )}
        </div>

        {/* Groups Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            👥 Gruppe
          </h2>
          {user?.groupCode ? (
            <div className="space-y-3">
              <div className="p-4 bg-winter-50 dark:bg-winter-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Dein Gruppencode
                </div>
                <div className="text-2xl font-bold text-winter-600 dark:text-winter-400">
                  {user.groupCode}
                </div>
              </div>
              <button className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium">
                Gruppe verlassen
              </button>
            </div>
          ) : showGroupInput ? (
            <div className="space-y-3">
              <input
                type="text"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                placeholder="GRUPPENCODE"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-500 outline-none font-mono"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleJoinGroup}
                  disabled={!groupCode}
                  className="flex-1 px-4 py-3 bg-winter-600 text-white rounded-lg hover:bg-winter-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Beitreten
                </button>
                <button
                  onClick={() => {
                    setShowGroupInput(false);
                    setGroupCode('');
                  }}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowGroupInput(true)}
              className="w-full px-4 py-3 bg-winter-50 dark:bg-winter-900/20 text-winter-600 dark:text-winter-400 rounded-lg hover:bg-winter-100 dark:hover:bg-winter-900/30 transition-colors font-medium"
            >
              Gruppe beitreten oder erstellen
            </button>
          )}
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🎨 Darstellung
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                Dark Mode
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Dunkles Farbschema verwenden
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                darkMode ? 'bg-winter-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🔔 Benachrichtigungen
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Tägliche Erinnerung
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {notificationTime} Uhr
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  notificationsEnabled
                    ? 'bg-winter-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    notificationsEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
          {notificationsEnabled && (
            <button
              onClick={() => setShowTimeModal(true)}
              className="mt-4 w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Zeit ändern
            </button>
          )}
        </div>

        {/* Time Modal */}
        {showTimeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Erinnerungszeit
              </h2>
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-500 outline-none mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTimeModal(false)}
                  className="flex-1 px-4 py-3 bg-winter-600 text-white rounded-lg font-semibold hover:bg-winter-700 transition-colors"
                >
                  Speichern
                </button>
                <button
                  onClick={() => {
                    setShowTimeModal(false);
                    setNotificationTime('20:00');
                  }}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🔐 Konto
          </h2>
          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-left"
            >
              Abmelden
            </button>
            <button className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium text-left">
              Konto löschen
            </button>
          </div>
        </div>

        {/* Legal Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            📄 Rechtliches
          </h2>
          <div className="space-y-2">
            <button className="w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
              Datenschutzerklärung
            </button>
            <button className="w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
              Nutzungsbedingungen
            </button>
          </div>
        </div>

        {/* Debug Section (only in development) */}
        {import.meta.env.DEV && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl shadow-lg p-6 border-2 border-yellow-300 dark:border-yellow-700">
            <h2 className="text-lg font-bold text-yellow-900 dark:text-yellow-300 mb-4">
              🧪 Debug Tools
            </h2>
            <div className="space-y-2">
              <button
                onClick={handleTestError}
                className="w-full px-4 py-3 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors font-medium text-left"
              >
                Test Sentry Error Tracking
              </button>
              <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                Sentry Status: {import.meta.env.VITE_SENTRY_DSN ? '✅ Konfiguriert' : '⚠️ Nicht konfiguriert'}
              </div>
            </div>
          </div>
        )}

        {/* App Version */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
          Winter Arc Tracker v0.0.1
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
