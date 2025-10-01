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
  getGroupMembers,
} from '../services/database';

interface GroupMemberSummary {
  id: string;
  label: string;
  pushUps: number;
  water: number;
  protein: number;
  sport: boolean;
  score: number;
}

interface GroupSummary {
  members: GroupMemberSummary[];
  totals: {
    pushUps: number;
    water: number;
    protein: number;
    sport: number;
  };
}

export default function HomeScreen({ navigation }: any) {
  const { user, userData } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [todayPushUps, setTodayPushUps] = useState(0);
  const [todayWater, setTodayWater] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todaySport, setTodaySport] = useState(false);
  const [groupSummary, setGroupSummary] = useState<GroupSummary | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);

  useEffect(() => {
    loadPersonalStats();
  }, [user]);

  useEffect(() => {
    if (user && userData?.groupCode) {
      loadGroupSummary();
    } else {
      setGroupSummary(null);
    }
  }, [user, userData?.groupCode]);

  const loadPersonalStats = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = (value: Date | string) => {
      const date = new Date(value);
      return date >= today && date < tomorrow;
    };

    const [pushUps, water, sport, protein] = await Promise.all([
      getPushUpEntries(user.uid),
      getWaterEntries(user.uid),
      getSportEntries(user.uid),
      getProteinEntries(user.uid),
    ]);

    setTodayPushUps(pushUps.filter(entry => isToday(entry.date)).reduce((sum, entry) => sum + entry.count, 0));
    setTodayWater(water.filter(entry => isToday(entry.date)).reduce((sum, entry) => sum + entry.amount, 0));
    setTodayProtein(protein.filter(entry => isToday(entry.date)).reduce((sum, entry) => sum + entry.grams, 0));
    setTodaySport(!!sport.find(entry => isToday(entry.date)));
  };

  const loadGroupSummary = async () => {
    if (!user || !userData?.groupCode) return;

    setGroupLoading(true);
    try {
      const members = await getGroupMembers(userData.groupCode);
      if (!members.length) {
        setGroupSummary(null);
        return;
      }

      const memberIds = members.map(member => member.id);

      const [pushData, waterData, proteinData, sportData] = await Promise.all([
        Promise.all(memberIds.map(id => getPushUpEntries(id))),
        Promise.all(memberIds.map(id => getWaterEntries(id))),
        Promise.all(memberIds.map(id => getProteinEntries(id))),
        Promise.all(memberIds.map(id => getSportEntries(id))),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isToday = (value: Date | string) => {
        const date = new Date(value);
        return date >= today && date < tomorrow;
      };

      const memberSummaries: GroupMemberSummary[] = members.map((member, index) => {
        const pushTotal = pushData[index].filter(entry => isToday(entry.date)).reduce((sum, entry) => sum + entry.count, 0);
        const waterTotal = waterData[index].filter(entry => isToday(entry.date)).reduce((sum, entry) => sum + entry.amount, 0);
        const proteinTotal = proteinData[index].filter(entry => isToday(entry.date)).reduce((sum, entry) => sum + entry.grams, 0);
        const sportDone = sportData[index].some(entry => isToday(entry.date));

        const score = pushTotal + Math.floor(waterTotal / 1000) + Math.floor(proteinTotal / 10) + (sportDone ? 10 : 0);

        return {
          id: member.id,
          label: member.nickname || member.name || 'Mitglied',
          pushUps: pushTotal,
          water: waterTotal,
          protein: proteinTotal,
          sport: sportDone,
          score,
        };
      });

      const totals = memberSummaries.reduce(
        (acc, item) => ({
          pushUps: acc.pushUps + item.pushUps,
          water: acc.water + item.water,
          protein: acc.protein + item.protein,
          sport: acc.sport + (item.sport ? 1 : 0),
        }),
        { pushUps: 0, water: 0, protein: 0, sport: 0 }
      );

      const leaderboard = [...memberSummaries].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.pushUps !== a.pushUps) return b.pushUps - a.pushUps;
        return b.water - a.water;
      });

      setGroupSummary({ members: leaderboard, totals });
    } catch (error) {
      console.error('Error loading group summary:', error);
      setGroupSummary(null);
    } finally {
      setGroupLoading(false);
    }
  };

  const handleQuickAddPushUps = async (count: number) => {
    try {
      await addPushUpEntry(user!.uid, { count, date: new Date() });
      Alert.alert('✅', `${count} Push-ups geloggt!`, [{ text: 'OK' }], { cancelable: false });
      loadPersonalStats();
      loadGroupSummary();
    } catch (error) {
      console.error('Error adding push-ups:', error);
      Alert.alert('Fehler', 'Konnte nicht speichern');
    }
  };

  const handleQuickAddWater = async (amount: number) => {
    try {
      await addWaterEntry(user!.uid, { amount, date: new Date() });
      Alert.alert('✅', `${amount}ml Wasser geloggt!`, [{ text: 'OK' }], { cancelable: false });
      loadPersonalStats();
      loadGroupSummary();
    } catch (error) {
      console.error('Error adding water:', error);
      Alert.alert('Fehler', 'Konnte nicht speichern');
    }
  };

  const handleQuickAddProtein = async (grams: number) => {
    try {
      await addProteinEntry(user!.uid, { grams, date: new Date() });
      Alert.alert('✅', `${grams}g Protein geloggt!`, [{ text: 'OK' }], { cancelable: false });
      loadPersonalStats();
      loadGroupSummary();
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
      loadPersonalStats();
      loadGroupSummary();
    } catch (error) {
      console.error('Error adding sport:', error);
      Alert.alert('Fehler', 'Konnte nicht speichern');
    }
  };

  const proteinGoal = userData?.weight ? Math.round(userData.weight * 2) : 150;

  const handleOpenHistory = (type: 'pushups' | 'water' | 'protein' | 'sport') => {
    navigation.navigate('History', { type });
  };

  const renderGroupCard = () => {
    if (!userData?.groupCode) {
      return null;
    }

    if (groupLoading) {
      return (
        <GlassCard style={styles.groupCard}>
          <Text style={[styles.groupTitle, { color: colors.text }]}>Team heute</Text>
          <Text style={{ color: colors.textSecondary }}>Laden...</Text>
        </GlassCard>
      );
    }

    if (!groupSummary) {
      return (
        <GlassCard style={styles.groupCard}>
          <Text style={[styles.groupTitle, { color: colors.text }]}>Team heute</Text>
          <Text style={{ color: colors.textSecondary }}>Noch keine Gruppendaten.</Text>
        </GlassCard>
      );
    }

    const { totals, members } = groupSummary;
    return (
      <GlassCard style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <Text style={[styles.groupTitle, { color: colors.text }]}>Team heute</Text>
          <Text style={[styles.groupSubtitle, { color: colors.textSecondary }]}>Mitglieder: {members.length}</Text>
        </View>
        <View style={styles.groupTotalsRow}>
          <View style={styles.groupTotalBox}>
            <Text style={[styles.groupTotalLabel, { color: colors.textSecondary }]}>Push-ups</Text>
            <Text style={[styles.groupTotalValue, { color: '#FF6B6B' }]}>{totals.pushUps}</Text>
          </View>
          <View style={styles.groupTotalBox}>
            <Text style={[styles.groupTotalLabel, { color: colors.textSecondary }]}>Wasser</Text>
            <Text style={[styles.groupTotalValue, { color: '#45AAF2' }]}>{Math.round(totals.water / 1000)}L</Text>
          </View>
          <View style={styles.groupTotalBox}>
            <Text style={[styles.groupTotalLabel, { color: colors.textSecondary }]}>Protein</Text>
            <Text style={[styles.groupTotalValue, { color: '#FFB347' }]}>{totals.protein}g</Text>
          </View>
          <View style={styles.groupTotalBox}>
            <Text style={[styles.groupTotalLabel, { color: colors.textSecondary }]}>Sport</Text>
            <Text style={[styles.groupTotalValue, { color: '#00D084' }]}>{totals.sport}/{members.length}</Text>
          </View>
        </View>
        <View style={styles.groupLeaderboard}>
          {members.slice(0, 3).map((member, index) => (
            <View
              key={member.id}
              style={[styles.groupLeaderboardRow, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.groupLeaderboardRank, { color: colors.text }]}>{index + 1}.</Text>
              <View style={styles.groupLeaderboardInfo}>
                <Text style={[styles.groupLeaderboardName, { color: colors.text }]}>{member.label}</Text>
                <Text style={[styles.groupLeaderboardStats, { color: colors.textSecondary }]}>S: {member.score} · PU {member.pushUps} · W {Math.round(member.water / 1000)}L · P {member.protein}g</Text>
              </View>
            </View>
          ))}
        </View>
      </GlassCard>
    );
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
                <Text style={styles.headerIcon}>🏅</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerButton}>
                <Text style={styles.headerIcon}>⚙️</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {renderGroupCard()}

          <WeeklyOverview />
          <WeightGraph onPress={() => navigation.navigate('WeightTracker')} />

          <GlassCard style={styles.trackingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>💪</Text>
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
              <Text style={styles.cardEmoji}>💧</Text>
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
              <Text style={styles.cardEmoji}>🍗</Text>
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
              <Text style={styles.cardEmoji}>🏃‍♂️</Text>
              <View style={styles.cardTitleContainer}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Sport</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Heute: {todaySport ? 'Erledigt ✓' : 'Noch offen'}
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
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerIcon: {
    fontSize: 28,
  },
  groupCard: {
    marginTop: 12,
    gap: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  groupSubtitle: {
    fontSize: 12,
  },
  groupTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  groupTotalBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  groupTotalLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  groupTotalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  groupLeaderboard: {
    gap: 8,
  },
  groupLeaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  groupLeaderboardRank: {
    fontSize: 16,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  groupLeaderboardInfo: {
    flex: 1,
  },
  groupLeaderboardName: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupLeaderboardStats: {
    fontSize: 12,
    marginTop: 2,
  },
  trackingCard: {
    marginBottom: 12,
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
    fontWeight: '600',
  },
});
