import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions, Alert, TextInput } from 'react-native';
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
  deleteEntry,
  updatePushUpEntry,
  updateWaterEntry,
  updateProteinEntry
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

  // Edit states
  const [editingEntry, setEditingEntry] = useState<{type: string; id: string; value: number} | null>(null);

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

  const handleDeleteEntry = async (type: string, id: string, collectionName: string) => {
    Alert.alert(
      'Eintrag löschen',
      'Möchtest du diesen Eintrag wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(collectionName, id);
              Alert.alert('✅', 'Eintrag gelöscht!', [{ text: 'OK' }], { cancelable: false });
              loadAllData();
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Fehler', 'Konnte nicht löschen');
            }
          },
        },
      ]
    );
  };

  const handleEditEntry = (type: string, id: string, currentValue: number) => {
    setEditingEntry({ type, id, value: currentValue });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    try {
      const { type, id, value } = editingEntry;

      if (type === 'pushups') {
        await updatePushUpEntry(id, value);
      } else if (type === 'water') {
        await updateWaterEntry(id, value);
      } else if (type === 'protein') {
        await updateProteinEntry(id, value);
      }

      Alert.alert('✅', 'Eintrag aktualisiert!', [{ text: 'OK' }], { cancelable: false });
      setEditingEntry(null);
      loadAllData();
    } catch (error) {
      console.error('Error updating entry:', error);
      Alert.alert('Fehler', 'Konnte nicht speichern');
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const proteinGoal = userData?.weight ? Math.round(userData.weight * 2) : 150;

  return (
    <AnimatedGradient>
      <ScrollView style={styles.container}>
        <View style={[styles.content, isDesktop && styles.contentDesktop]}>
          {/* Header */}
          <GlassCard style={styles.header}>
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
          </GlassCard>

        {/* Weekly Overview */}
        <WeeklyOverview />

        {/* Push-ups Card */}
        <GlassCard style={styles.trackingCard}>
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
          {recentPushUps.length > 0 && (
            <View style={styles.recentEntries}>
              {recentPushUps.map(entry => (
                <View key={entry.id} style={[styles.entryRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.entryText, { color: colors.textSecondary }]}>
                    {new Date(entry.date).toLocaleDateString('de-DE')}
                  </Text>
                  {editingEntry?.id === entry.id ? (
                    <View style={styles.editContainer}>
                      <TextInput
                        style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                        value={editingEntry.value.toString()}
                        onChangeText={(text) => setEditingEntry({ ...editingEntry, value: parseInt(text) || 0 })}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity onPress={handleSaveEdit} style={styles.iconButton}>
                        <Text style={styles.saveIcon}>✓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancelEdit} style={styles.iconButton}>
                        <Text style={styles.cancelIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.entryActions}>
                      <Text style={[styles.entryValue, { color: colors.text }]}>{entry.count}</Text>
                      <TouchableOpacity onPress={() => handleEditEntry('pushups', entry.id, entry.count)} style={styles.iconButton}>
                        <Text style={styles.editIcon}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteEntry('pushups', entry.id, 'pushUpEntries')} style={styles.iconButton}>
                        <Text style={styles.deleteIcon}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Water Card */}
        <GlassCard style={styles.trackingCard}>
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
              <GlassButton
                key={amount}
                title={`${amount}ml`}
                color="#4ECDC4"
                onPress={() => handleQuickAddWater(amount)}
                style={styles.quickButton}
                textStyle={styles.quickButtonText}
              />
            ))}
          </View>
          {recentWater.length > 0 && (
            <View style={styles.recentEntries}>
              {recentWater.map(entry => (
                <View key={entry.id} style={[styles.entryRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.entryText, { color: colors.textSecondary }]}>
                    {new Date(entry.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {editingEntry?.id === entry.id ? (
                    <View style={styles.editContainer}>
                      <TextInput
                        style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                        value={editingEntry.value.toString()}
                        onChangeText={(text) => setEditingEntry({ ...editingEntry, value: parseInt(text) || 0 })}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity onPress={handleSaveEdit} style={styles.iconButton}>
                        <Text style={styles.saveIcon}>✓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancelEdit} style={styles.iconButton}>
                        <Text style={styles.cancelIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.entryActions}>
                      <Text style={[styles.entryValue, { color: colors.text }]}>{entry.amount}ml</Text>
                      <TouchableOpacity onPress={() => handleEditEntry('water', entry.id, entry.amount)} style={styles.iconButton}>
                        <Text style={styles.editIcon}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteEntry('water', entry.id, 'waterEntries')} style={styles.iconButton}>
                        <Text style={styles.deleteIcon}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Sport Card */}
        <GlassCard style={styles.trackingCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🏃</Text>
            <View style={styles.cardTitleContainer}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Sport</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Heute: {todaySport ? 'Erledigt ✓' : 'Nicht erledigt'}
              </Text>
            </View>
          </View>
          <GlassButton
            title={todaySport ? '✓ Erledigt' : 'Abhaken'}
            color={todaySport ? '#00D084' : '#95E1D3'}
            onPress={handleToggleSport}
            disabled={todaySport}
            style={styles.sportButton}
            textStyle={styles.sportButtonText}
          />
        </GlassCard>

        {/* Protein Card */}
        <GlassCard style={styles.trackingCard}>
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
              <GlassButton
                key={grams}
                title={`${grams}g`}
                color="#F9CA24"
                onPress={() => handleQuickAddProtein(grams)}
                style={styles.quickButton}
                textStyle={styles.quickButtonText}
              />
            ))}
          </View>
          {recentProtein.length > 0 && (
            <View style={styles.recentEntries}>
              {recentProtein.map(entry => (
                <View key={entry.id} style={[styles.entryRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.entryText, { color: colors.textSecondary }]}>
                    {new Date(entry.date).toLocaleDateString('de-DE')}
                  </Text>
                  {editingEntry?.id === entry.id ? (
                    <View style={styles.editContainer}>
                      <TextInput
                        style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                        value={editingEntry.value.toString()}
                        onChangeText={(text) => setEditingEntry({ ...editingEntry, value: parseInt(text) || 0 })}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity onPress={handleSaveEdit} style={styles.iconButton}>
                        <Text style={styles.saveIcon}>✓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancelEdit} style={styles.iconButton}>
                        <Text style={styles.cancelIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.entryActions}>
                      <Text style={[styles.entryValue, { color: colors.text }]}>{entry.grams}g</Text>
                      <TouchableOpacity onPress={() => handleEditEntry('protein', entry.id, entry.grams)} style={styles.iconButton}>
                        <Text style={styles.editIcon}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteEntry('protein', entry.id, 'proteinEntries')} style={styles.iconButton}>
                        <Text style={styles.deleteIcon}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Weight Tracker Graph */}
        <WeightGraph onPress={() => navigation.navigate('WeightTracker')} />
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
  },
  contentDesktop: {
    maxWidth: 800,
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
  },
  sportButtonText: {
    fontSize: 18,
  },
  recentEntries: {
    marginTop: 12,
    paddingTop: 12,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  entryText: {
    fontSize: 14,
  },
  entryValue: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  iconButton: {
    padding: 4,
  },
  editIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  deleteIcon: {
    fontSize: 16,
  },
  saveIcon: {
    fontSize: 18,
    color: '#00D084',
    fontWeight: 'bold',
  },
  cancelIcon: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
});
