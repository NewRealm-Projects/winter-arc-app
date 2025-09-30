import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  requestPermissions,
  scheduleWaterReminder,
  scheduleWorkoutReminder,
  cancelAllNotifications,
  getScheduledNotifications,
} from '../services/notifications';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { colors, theme, setTheme } = useTheme();
  const [nickname, setNickname] = useState('');
  const [waterReminder, setWaterReminder] = useState(false);
  const [workoutReminder, setWorkoutReminder] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setNickname(data.nickname || '');
        setWaterReminder(data.waterReminder || false);
        setWorkoutReminder(data.workoutReminder || false);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const saveNickname = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        nickname: nickname.trim(),
      });
      Alert.alert('Erfolg', 'Spitzname gespeichert!');
    } catch (error: any) {
      Alert.alert('Fehler', error.message);
    }
  };

  const toggleWaterReminder = async (value: boolean) => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Benachrichtigungen', 'Bitte erlaube Benachrichtigungen in den Einstellungen');
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

    await updateDoc(doc(db, 'users', user!.uid), {
      waterReminder: value,
    });
  };

  const toggleWorkoutReminder = async (value: boolean) => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Benachrichtigungen', 'Bitte erlaube Benachrichtigungen in den Einstellungen');
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

    await updateDoc(doc(db, 'users', user!.uid), {
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
        {/* Profile Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profil</Text>

          <View style={styles.userInfo}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>E-Mail</Text>
            <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Spitzname</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Dein Spitzname"
              placeholderTextColor={colors.textSecondary}
              value={nickname}
              onChangeText={setNickname}
            />
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={saveNickname}
            >
              <Text style={styles.saveButtonText}>Speichern</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Darstellung</Text>

          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Design</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {getThemeLabel()}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.themeButton, { backgroundColor: colors.background }]}
              onPress={cycleTheme}
            >
              <Text style={styles.themeIcon}>
                {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🔄'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Benachrichtigungen</Text>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>💧 Wasser-Erinnerung</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Täglich um 10:00 Uhr
              </Text>
            </View>
            <Switch
              value={waterReminder}
              onValueChange={toggleWaterReminder}
              trackColor={{ false: colors.border, true: '#4ECDC4' }}
              thumbColor={waterReminder ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>💪 Workout-Erinnerung</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Täglich um 18:00 Uhr
              </Text>
            </View>
            <Switch
              value={workoutReminder}
              onValueChange={toggleWorkoutReminder}
              trackColor={{ false: colors.border, true: '#FF6B6B' }}
              thumbColor={workoutReminder ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Abmelden</Text>
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
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  userInfo: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
  },
  inputGroup: {
    marginTop: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 12,
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  themeButton: {
    padding: 12,
    borderRadius: 12,
  },
  themeIcon: {
    fontSize: 24,
  },
  divider: {
    height: 1,
    marginVertical: 12,
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
});
