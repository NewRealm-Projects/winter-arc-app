import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import WeeklyOverview from '../components/WeeklyOverview';
import {
  addPushUpEntry,
  addWaterEntry,
  addSportEntry,
  addProteinEntry,
  getPushUpEntries,
  getWaterEntries,
  getSportEntries,
  getProteinEntries
} from '../services/database';
import { PushUpEntry, WaterEntry, SportEntry, ProteinEntry } from '../types';

export default function HomeScreen({ navigation }: any) {
  const { user, userData } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  // Today's data
  const [todayPushUps, setTodayPushUps] = useState(0);
  const [todayWater, setTodayWater] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todaySport, setTodaySport] = useState(false);

  // Recent entries
  const [recentPushUps, setRecentPushUps] = useState<PushUpEntry[]>([]);
  const [recentWater, setRecentWater] = useState<WaterEntry[]>([]);
  const [recentProtein, setRecentProtein] = useState<ProteinEntry[]>([]);

  useEffect(() => {
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Load all entries
    const [pushUps, water, sport, protein] = await Promise.all([
      getPushUpEntries(user.uid),
      getWaterEntries(user.uid),
      getSportEntries(user.uid),
      getProteinEntries(user.uid),
    ]);

    // Filter today's entries
    const todayPushUpsEntries = pushUps.filter(e => {
      const date = new Date(e.date);
      return date >= today && date < tomorrow;
    });
    const todayWaterEntries = water.filter(e => {
      const date = new Date(e.date);
      return date >= today && date < tomorrow;
    });
    const todayProteinEntries = protein.filter(e => {
      const date = new Date(e.date);
      return date >= today && date < tomorrow;
    });
    const todaySportEntry = sport.find(e => {
      const date = new Date(e.date);
      return date >= today && date < tomorrow;
    });

    // Calculate today's totals
    setTodayPushUps(todayPushUpsEntries.reduce((sum, e) => sum + e.count, 0));
    setTodayWater(todayWaterEntries.reduce((sum, e) => sum + e.amount, 0));
    setTodayProtein(todayProteinEntries.reduce((sum, e) => sum + e.grams, 0));
    setTodaySport(!!todaySportEntry);

    // Set recent entries (last 3)
    setRecentPushUps(pushUps.slice(0, 3));
    setRecentWater(water.slice(0, 3));
    setRecentProtein(protein.slice(0, 3));
  };

  const handleQuickAddPushUps = async (count: number) => {
    try {
      await addPushUpEntry(user!.uid, { count, date: new Date() });
      Alert.alert('✅', `${count} Push-ups geloggt!`, [{ text: 'OK' }], { cancelable: false });
      loadAllData();
    } catch (error) {
      console.error('Error adding push-ups:', error);
      Alert.alert('Fehler', 'Konnte nicht speichern');
    }
  };

  const handleQuickAddWater = async (amount: number) => {
    try {
      await addWaterEntry(user!.uid, { amount, date: new Date() });
      Alert.alert('✅', `${amount}ml Wasser geloggt!`, [{ text: 'OK' }], { cancelable: false });
      loadAllData();
    } catch (error) {
      console.error('Error adding water:', error);
      Alert.alert('Fehler', 'Konnte nicht speichern');
    }
  };

  const handleQuickAddProtein = async (grams: number) => {
    try {
      await addProteinEntry(user!.uid, { grams, date: new Date() });
      Alert.alert('✅', `${grams}g Protein geloggt!`, [{ text: 'OK' }], { cancelable: false });
      loadAllData();
    } catch (error) {
      console.error('Error adding protein:', error);
      Alert.alert('Fehler', 'Konnte nicht speichern');
    }
  };

  const handleToggleSport = async () => {
    if (todaySport) {
      Alert.alert('Info', 'Heute bereits erledigt!');
      return;
    }
    try {
      await addSportEntry(user!.uid);
      Alert.alert('✅', 'Sport abgehakt!', [{ text: 'OK' }], { cancelable: false });
      loadAllData();
    } catch (error) {
      console.error('Error adding sport:', error);
      Alert.alert('Fehler', 'Konnte nicht speichern');
    }
  };

  const proteinGoal = userData?.weight ? Math.round(userData.weight * 2) : 150;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hallo, {userData?.nickname || user?.displayName || 'User'}!
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')} style={styles.headerButton}>
              <Text style={styles.headerIcon}>🏆</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerButton}>
              <Text style={styles.headerIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Overview */}
        <WeeklyOverview />

        {/* Push-ups Card */}
        <View style={[styles.trackingCard, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>💪</Text>
            <View style={styles.cardTitleContainer}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Push-ups</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Heute: {todayPushUps}
              </Text>
            </View>
          </View>
          <View style={styles.quickAddButtons}>
            {[10, 20, 30, 50].map(count => (
              <TouchableOpacity
                key={count}
                style={[styles.quickButton, { backgroundColor: '#FF6B6B' }]}
                onPress={() => handleQuickAddPushUps(count)}
              >
                <Text style={styles.quickButtonText}>+{count}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {recentPushUps.length > 0 && (
            <View style={styles.recentEntries}>
              {recentPushUps.map(entry => (
                <View key={entry.id} style={[styles.entryRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.entryText, { color: colors.textSecondary }]}>
                    {new Date(entry.date).toLocaleDateString('de-DE')}
                  </Text>
                  <Text style={[styles.entryValue, { color: colors.text }]}>{entry.count}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Water Card */}
        <View style={[styles.trackingCard, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>💧</Text>
            <View style={styles.cardTitleContainer}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Wasser</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Heute: {todayWater}ml / 2000ml
              </Text>
            </View>
          </View>
          <View style={styles.quickAddButtons}>
            {[250, 500, 750, 1000].map(amount => (
              <TouchableOpacity
                key={amount}
                style={[styles.quickButton, { backgroundColor: '#4ECDC4' }]}
                onPress={() => handleQuickAddWater(amount)}
              >
                <Text style={styles.quickButtonText}>{amount}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
          {recentWater.length > 0 && (
            <View style={styles.recentEntries}>
              {recentWater.map(entry => (
                <View key={entry.id} style={[styles.entryRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.entryText, { color: colors.textSecondary }]}>
                    {new Date(entry.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={[styles.entryValue, { color: colors.text }]}>{entry.amount}ml</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Sport Card */}
        <View style={[styles.trackingCard, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🏃</Text>
            <View style={styles.cardTitleContainer}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Sport</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Heute: {todaySport ? 'Erledigt ✓' : 'Nicht erledigt'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.sportButton,
              { backgroundColor: todaySport ? '#00D084' : '#95E1D3' }
            ]}
            onPress={handleToggleSport}
            disabled={todaySport}
          >
            <Text style={styles.sportButtonText}>
              {todaySport ? '✓ Erledigt' : 'Abhaken'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Protein Card */}
        <View style={[styles.trackingCard, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🥩</Text>
            <View style={styles.cardTitleContainer}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Protein</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Heute: {todayProtein}g / {proteinGoal}g
              </Text>
            </View>
          </View>
          <View style={styles.quickAddButtons}>
            {[20, 30, 40, 50].map(grams => (
              <TouchableOpacity
                key={grams}
                style={[styles.quickButton, { backgroundColor: '#F9CA24' }]}
                onPress={() => handleQuickAddProtein(grams)}
              >
                <Text style={styles.quickButtonText}>{grams}g</Text>
              </TouchableOpacity>
            ))}
          </View>
          {recentProtein.length > 0 && (
            <View style={styles.recentEntries}>
              {recentProtein.map(entry => (
                <View key={entry.id} style={[styles.entryRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.entryText, { color: colors.textSecondary }]}>
                    {new Date(entry.date).toLocaleDateString('de-DE')}
                  </Text>
                  <Text style={[styles.entryValue, { color: colors.text }]}>{entry.grams}g</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Weight Tracker Button */}
        <TouchableOpacity
          style={[styles.weightButton, { backgroundColor: '#A29BFE' }]}
          onPress={() => navigation.navigate('WeightTracker')}
        >
          <Text style={styles.weightButtonIcon}>⚖️</Text>
          <Text style={styles.weightButtonText}>Gewicht tracken</Text>
        </TouchableOpacity>
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
  },
  contentDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 12,
    borderRadius: 12,
  },
  headerIcon: {
    fontSize: 28,
  },
  trackingCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  quickAddButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  sportButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sportButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  recentEntries: {
    marginTop: 12,
    paddingTop: 12,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  entryText: {
    fontSize: 14,
  },
  entryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  weightButton: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  weightButtonIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  weightButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
});
