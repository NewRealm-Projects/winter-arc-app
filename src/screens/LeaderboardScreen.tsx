import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  getSportEntries,
  getPushUpEntries,
  getProteinEntries,
  getWaterEntries
} from '../services/database';

interface GroupMember {
  uid: string;
  nickname: string;
  score: number;
  pushUps: number;
  sport: number;
  protein: number;
  water: number;
}

export default function LeaderboardScreen() {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const { user, userData } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    if (!userData?.groupCode) {
      setLoading(false);
      return;
    }

    try {
      // Get all users with the same group code
      const usersQuery = query(
        collection(db, 'users'),
        where('groupCode', '==', userData.groupCode)
      );
      const usersSnapshot = await getDocs(usersQuery);

      const memberData: GroupMember[] = [];
      const daysBack = period === 'week' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      for (const userDoc of usersSnapshot.docs) {
        const uid = userDoc.id;
        const nickname = userDoc.data().nickname || 'Anonymous';

        // Fetch all entries for this user
        const [sportData, pushUpData, proteinData, waterData] = await Promise.all([
          getSportEntries(uid),
          getPushUpEntries(uid),
          getProteinEntries(uid),
          getWaterEntries(uid),
        ]);

        // Filter by time period
        const filterByDate = (entries: any[]) =>
          entries.filter(e => new Date(e.date) >= startDate);

        const recentSport = filterByDate(sportData);
        const recentPushUps = filterByDate(pushUpData);
        const recentProtein = filterByDate(proteinData);
        const recentWater = filterByDate(waterData);

        // Calculate stats
        const sportDays = new Set(
          recentSport.map(e => new Date(e.date).toDateString())
        ).size;
        const totalPushUps = recentPushUps.reduce((sum, e) => sum + e.count, 0);
        const totalProtein = recentProtein.reduce((sum, e) => sum + e.grams, 0);
        const totalWater = recentWater.reduce((sum, e) => sum + e.amount, 0);

        // Calculate score (you can adjust the formula)
        const score =
          sportDays * 10 +
          totalPushUps +
          Math.floor(totalProtein / 10) +
          Math.floor(totalWater / 1000);

        memberData.push({
          uid,
          nickname,
          score,
          pushUps: totalPushUps,
          sport: sportDays,
          protein: totalProtein,
          water: totalWater,
        });
      }

      // Sort by score
      memberData.sort((a, b) => b.score - a.score);
      setMembers(memberData);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
      Alert.alert('Fehler', 'Leaderboard konnte nicht geladen werden');
      setLoading(false);
    }
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  if (!userData?.groupCode) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyIcon, { color: colors.text }]}>👥</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Keine Gruppe
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Gib einen Gruppen-Code in den Einstellungen ein, um dich mit deinen Freunden zu vergleichen.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View>
          <Text style={[styles.groupTitle, { color: colors.text }]}>
            Gruppe: {userData.groupCode.toUpperCase()}
          </Text>
          <Text style={[styles.groupSubtitle, { color: colors.textSecondary }]}>
            {members.length} {members.length === 1 ? 'Mitglied' : 'Mitglieder'}
          </Text>
        </View>
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              { backgroundColor: period === 'week' ? colors.primary : colors.background },
            ]}
            onPress={() => setPeriod('week')}
          >
            <Text
              style={[
                styles.periodText,
                { color: period === 'week' ? 'white' : colors.text },
              ]}
            >
              Woche
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              { backgroundColor: period === 'month' ? colors.primary : colors.background },
            ]}
            onPress={() => setPeriod('month')}
          >
            <Text
              style={[
                styles.periodText,
                { color: period === 'month' ? 'white' : colors.text },
              ]}
            >
              Monat
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={members}
        contentContainerStyle={styles.list}
        keyExtractor={(item) => item.uid}
        renderItem={({ item, index }) => {
          const isCurrentUser = item.uid === user?.uid;
          return (
            <View
              style={[
                styles.memberCard,
                {
                  backgroundColor: isCurrentUser ? colors.primary + '20' : colors.card,
                  borderColor: isCurrentUser ? colors.primary : 'transparent',
                },
              ]}
            >
              <View style={styles.memberHeader}>
                <Text style={styles.rank}>{getRankEmoji(index)}</Text>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.text }]}>
                    {item.nickname} {isCurrentUser && '(Du)'}
                  </Text>
                  <Text style={[styles.memberScore, { color: colors.textSecondary }]}>
                    {item.score} Punkte
                  </Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statEmoji}>🏃</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{item.sport}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statEmoji}>💪</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{item.pushUps}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statEmoji}>🥩</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{item.protein}g</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statEmoji}>💧</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {(item.water / 1000).toFixed(1)}L
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Noch keine Mitglieder in deiner Gruppe
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  groupTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  groupSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  periodToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  memberCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rank: {
    fontSize: 32,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
  },
  memberScore: {
    fontSize: 14,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    margin: 20,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
