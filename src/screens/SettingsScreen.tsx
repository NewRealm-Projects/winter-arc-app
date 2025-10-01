import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform, Linking } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import {
  requestPermissions,
  scheduleWaterReminder,
  scheduleWorkoutReminder,
  cancelAllNotifications,
  getScheduledNotifications,
} from '../services/notifications';
import { deleteUserData } from '../services/database';

const APP_CLIP_URL = process.env.EXPO_PUBLIC_APP_CLIP_URL;

export default function SettingsScreen() {
  const { user, logout, refreshUserData } = useAuth();
  const { colors, theme, setTheme } = useTheme();
  const [nickname, setNickname] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [waterReminder, setWaterReminder] = useState(false);
  const [workoutReminder, setWorkoutReminder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const notificationsSupported = Platform.OS !== 'web';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db!, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setNickname(data.nickname || '');
        setGroupCode(data.groupCode || '');
        setWaterReminder(data.waterReminder || false);
        setWorkoutReminder(data.workoutReminder || false);
      }
      if (notificationsSupported) {
        await getScheduledNotifications();
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db!, 'users', user.uid), {
        nickname: nickname.trim(),
        groupCode: groupCode.toLowerCase().trim() || null,
      });
      await refreshUserData();
      Alert.alert('Erfolg', 'Profil gespeichert!');
    } catch (error: any) {
      Alert.alert('Fehler', error.message);
    }
  };

  const ensureNotificationsAllowed = async () => {
    if (!notificationsSupported) {
      Alert.alert('Nicht verfügbar', 'Benachrichtigungen werden im Web derzeit nicht unterstützt.');
      return false;
    }

    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Benachrichtigungen', 'Bitte erlaube Benachrichtigungen in den Einstellungen.');
      return false;
    }
    return true;
  };

  const toggleWaterReminder = async (value: boolean) => {
    if (!user) return;
    if (!(await ensureNotificationsAllowed())) {
      return;
    }

    setWaterReminder(value);

    if (value) {
      await scheduleWaterReminder();
    } else {
      await cancelAllNotifications();
      if (workoutReminder) {
        await scheduleWorkoutReminder();
      }
    }

    await updateDoc(doc(db!, 'users', user.uid), {
      waterReminder: value,
    });
  };

  const toggleWorkoutReminder = async (value: boolean) => {
    if (!user) return;
    if (!(await ensureNotificationsAllowed())) {
      return;
    }

    setWorkoutReminder(value);

    if (value) {
      await scheduleWorkoutReminder();
    } else {
      await cancelAllNotifications();
      if (waterReminder) {
        await scheduleWaterReminder();
      }
    }

    await updateDoc(doc(db!, 'users', user.uid), {
      workoutReminder: value,
    });
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Hell';
    if (theme === 'dark') return 'Dunkel';
    return 'Automatisch';
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('auto');
    else setTheme('light');
  };

  const handleDeleteAccount = () => {
    if (!user) return;
    Alert.alert(
      'Konto löschen',
      'Möchtest du dein Konto und alle Daten dauerhaft löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Konto löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteUserData(user.uid);
              if (auth?.currentUser) {
                try {
                  await deleteUser(auth.currentUser);
                } catch (error: any) {
                  if (error.code === 'auth/requires-recent-login') {
                    Alert.alert('Hinweis', 'Bitte melde dich erneut an, bevor du dein Konto löschst.');
                  } else {
                    console.error('Error deleting auth user:', error);
                    Alert.alert('Fehler', 'Konnte den Nutzer nicht löschen.');
                  }
                }
              }
              await logout();
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Fehler', 'Konnte Konto nicht löschen.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const openAppClip = async () => {
    if (!APP_CLIP_URL) {
      Alert.alert('Nicht verfügbar', 'App Clip URL ist nicht konfiguriert.');
      return;
    }
    try {
      await Linking.openURL(APP_CLIP_URL);
    } catch (error) {
      console.error('Error opening App Clip URL:', error);
      Alert.alert('Fehler', 'App Clip konnte nicht geöffnet werden.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <Text style={{ color: colors.text }}>Lädt...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.card }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profil</Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Spitzname</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="z.B. Max"
              placeholderTextColor={colors.textSecondary}
              value={nickname}
              onChangeText={setNickname}
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Gruppen-Code</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="z.B. winter-warriors"
              placeholderTextColor={colors.textSecondary}
              value={groupCode}
              onChangeText={setGroupCode}
              autoCapitalize="none"
            />
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Profil speichern</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Benachrichtigungen</Text>
          {!notificationsSupported && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>Benachrichtigungen werden im Web nicht unterstützt.</Text>
          )}
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>?? Wasser-Erinnerung</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Täglich um 10:00 Uhr</Text>
            </View>
            <Switch
              value={waterReminder}
              onValueChange={toggleWaterReminder}
              trackColor={{ false: colors.border, true: '#4ECDC4' }}
              thumbColor={waterReminder ? '#fff' : '#f4f3f4'}
              disabled={!notificationsSupported}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>?? Workout-Erinnerung</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Täglich um 18:00 Uhr</Text>
            </View>
            <Switch
              value={workoutReminder}
              onValueChange={toggleWorkoutReminder}
              trackColor={{ false: colors.border, true: '#FF6B6B' }}
              thumbColor={workoutReminder ? '#fff' : '#f4f3f4'}
              disabled={!notificationsSupported}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Darstellung</Text>
          <TouchableOpacity style={[styles.themeButton, { backgroundColor: colors.background }]} onPress={cycleTheme}>
            <Text style={[styles.themeText, { color: colors.text }]}>Theme: {getThemeLabel()}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          {Platform.OS === 'ios' && APP_CLIP_URL && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={openAppClip}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>App Clip installieren</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Abmelden</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, deleting && { opacity: 0.6 }]}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            <Text style={styles.deleteText}>{deleting ? 'Lösche Konto…' : 'Konto löschen'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
  },
  themeButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  themeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#B00020',
  },
  deleteText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});


