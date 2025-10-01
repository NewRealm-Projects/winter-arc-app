import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import WeeklyOverview from '../components/WeeklyOverview';
import WeightGraph from '../components/WeightGraph';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import AnimatedGradient from '../components/AnimatedGradient';
import {
  addPushUpEntry,
  addWaterEntry,
  addSportEntry,
  addProteinEntry,
  getPushUpEntries,
  getWaterEntries,
  getSportEntries,
  getProteinEntries,
} from '../services/database';

export default function HomeScreen({ navigation }: any) {
  const { user, userData } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [todayPushUps, setTodayPushUps] = useState(0);
  const [todayWater, setTodayWater] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todaySport, setTodaySport] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [pushUps, water, sport, protein] = await Promise.all([
      getPushUpEntries(user.uid),
      getWaterEntries(user.uid),
      getSportEntries(user.uid),
      getProteinEntries(user.uid),
    ]);

    const isToday = (dateValue: Date | string) => {
      const date = new Date(dateValue);
      return date >= today && date < tomorrow;
    };

    setTodayPushUps(pushUps.filter(entry => isToday(entry.date)).reduce((sum, entry) => sum + entry.count, 0));
    setTodayWater(water.filter(entry => isToday(entry.date)).reduce((sum, entry) => sum + entry.amount, 0));
    setTodayProtein(protein.filter(entry => isToday(entry.date)).reduce((sum, entry) => sum + entry.grams, 0));
    setTodaySport(!!sport.find(entry => isToday(entry.date)));
  };

  const handleQuickAddPushUps = async (count: number) => {
    try {
      await addPushUpEntry(user!.uid, { count, date: new Date() });
      Alert.alert('?', `${count} Push-ups geloggt!`, [{ text: 'OK' }], { cancelable: false });
      loadAllData();
    } catch (error) {
      console.error('Error adding push-ups:', error);
      Alert.alert('Fehler', 'Konnte nicht speichern');
    }
  };

  const handleQuickAddWater = async (amount: number) => {
    try {
      await addWaterEntry(user!.uid, { amount, date: new Date() });
      Alert.alert('?', `${amount}ml Wasser geloggt!`, [{ text: 'OK' }], { cancelable: false });
      loadAllData();
    } catch (error) {
      console.error('Error adding water:', error);
      Alert.alert('Fehler', 'Konnte nicht speichern');
    }
  };

  const handleQuickAddProtein = async (grams: number) => {
    try {
      await addProteinEntry(user!.uid, { grams, date: new Date() });
      Alert.alert('?', `${grams}g Protein geloggt!`, [{ text: 'OK' }], { cancelable: false });
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
      Alert.alert('?', 'Sport abgehakt!', [{ text: 'OK' }], { cancelable: false });
      loadAllData();
    } catch (error) {
      console.error('Error adding sport:', error);
      Alert.alert('Fehler', 'Konnte nicht speichern');
    }
  };

  const proteinGoal = userData?.weight ? Math.round(userData.weight * 2) : 150;

  const handleOpenHistory = (type: 'pushups' | 'water' | 'protein' | 'sport') => {
    navigation.navigate('History', { type });
  };

  return (
    <AnimatedGradient>
      <ScrollView style={styles.container}>
        <View style={[styles.content, isDesktop && styles.contentDesktop]}>
          <GlassCard style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>Hallo, {userData?.nickname || user?.displayName || 'User'}!</Text>
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')} style={styles.headerButton}>
                <Text style={[styles.headerIcon, { color: colors.text }]}>??</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerButton}>
                <Text style={[styles.headerIcon, { color: colors.text }]}>??</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          <WeeklyOverview />
          <WeightGraph onPress={() => navigation.navigate('WeightTracker')} />

          <GlassCard style={styles.trackingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>??</Text>
              <View style={styles.cardTitleContainer}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Push-ups</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Heute: {todayPushUps}</Text>
              </View>
            </View>
            <View style={styles.quickAddButtons}>
              {[10, 20, 30, 50].map(count => (
                <GlassButton
                  key={count}
                  title={`+${count}`}
                  color="#FF6B6B"
                  onPress={() => handleQuickAddPushUps(count)}
                  style={styles.quickButton}
                  textStyle={styles.quickButtonText}
                />
              ))}
            </View>
            <GlassButton
              title="Historie ansehen"
              color="#4ECDC4"
              onPress={() => handleOpenHistory('pushups')}
              style={styles.historyButton}
              textStyle={styles.historyButtonText}
            />
          </GlassCard>

          <GlassCard style={styles.trackingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>??</Text>
              <View style={styles.cardTitleContainer}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Wasser</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Heute: {todayWater} ml</Text>
              </View>
            </View>
            <View style={styles.quickAddButtons}>
              {[250, 500, 750, 1000].map(amount => (
                <GlassButton
                  key={amount}
                  title={`+${amount}`}
                  color="#45AAF2"
                  onPress={() => handleQuickAddWater(amount)}
                  style={styles.quickButton}
                  textStyle={styles.quickButtonText}
                />
              ))}
            </View>
            <GlassButton
              title="Historie ansehen"
              color="#45AAF2"
              onPress={() => handleOpenHistory('water')}
              style={styles.historyButton}
              textStyle={styles.historyButtonText}
            />
          </GlassCard>

          <GlassCard style={styles.trackingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>??</Text>
              <View style={styles.cardTitleContainer}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Protein</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Heute: {todayProtein} g · Ziel: {proteinGoal} g</Text>
              </View>
            </View>
            <View style={styles.quickAddButtons}>
              {[20, 30, 40, 50].map(grams => (
                <GlassButton
                  key={grams}
                  title={`+${grams}`}
                  color="#FFB347"
                  onPress={() => handleQuickAddProtein(grams)}
                  style={styles.quickButton}
                  textStyle={styles.quickButtonText}
                />
              ))}
            </View>
            <GlassButton
              title="Historie ansehen"
              color="#FF6B6B"
              onPress={() => handleOpenHistory('protein')}
              style={styles.historyButton}
              textStyle={styles.historyButtonText}
            />
          </GlassCard>

          <GlassCard style={styles.trackingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>?????</Text>
              <View style={styles.cardTitleContainer}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Sport</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Heute: {todaySport ? 'Erledigt ?' : 'Noch offen'}
                </Text>
              </View>
            </View>
            <GlassButton
              title={todaySport ? '? Erledigt' : 'Abhaken'}
              color={todaySport ? '#00D084' : '#95E1D3'}
              onPress={handleToggleSport}
              disabled={todaySport}
              style={styles.sportButton}
              textStyle={styles.sportButtonText}
            />
            <GlassButton
              title="Historie ansehen"
              color="#45AAF2"
              onPress={() => handleOpenHistory('sport')}
              style={styles.historyButton}
              textStyle={styles.historyButtonText}
            />
          </GlassCard>
        </View>
      </ScrollView>
    </AnimatedGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  contentDesktop: {
    paddingHorizontal: 40,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 16,
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
  },
  quickButtonText: {
    fontSize: 14,
  },
  sportButton: {
    width: '100%',
    marginBottom: 12,
  },
  sportButtonText: {
    fontSize: 18,
  },
  historyButton: {
    width: '100%',
  },
  historyButtonText: {
    fontSize: 16,
  },
});

