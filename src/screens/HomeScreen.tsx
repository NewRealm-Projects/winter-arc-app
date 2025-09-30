import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import WeeklyOverview from '../components/WeeklyOverview';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface QuickStatProps {
  title: string;
  value: string;
  color: string;
  icon: string;
}

const QuickStat: React.FC<QuickStatProps> = ({ title, value, color, icon }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
};

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { colors, isDark, setTheme, theme } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    loadNickname();
  }, []);

  const loadNickname = async () => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      setNickname(userDoc.data().nickname || '');
    }
  };


  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hallo, {nickname || user?.displayName || 'User'}!
            </Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <WeeklyOverview />

        <View style={[styles.statsContainer, isDesktop && styles.statsGrid]}>
          <QuickStat title="Push-ups heute" value="0" color="#FF6B6B" icon="💪" />
          <QuickStat title="Wasser (ml)" value="0" color="#4ECDC4" icon="💧" />
          <QuickStat title="Sport (min)" value="0" color="#95E1D3" icon="🏃" />
          <QuickStat title="Mahlzeiten" value="0" color="#FFD93D" icon="🥗" />
        </View>

        <View style={[styles.actionsContainer, isDesktop && styles.actionsGrid]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF6B6B' }]}
            onPress={() => navigation.navigate('PushUps')}
          >
            <Text style={styles.actionIcon}>💪</Text>
            <Text style={styles.actionButtonText}>Push-ups</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4ECDC4' }]}
            onPress={() => navigation.navigate('Water')}
          >
            <Text style={styles.actionIcon}>💧</Text>
            <Text style={styles.actionButtonText}>Wasser</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#95E1D3' }]}
            onPress={() => navigation.navigate('Sport')}
          >
            <Text style={styles.actionIcon}>🏃</Text>
            <Text style={styles.actionButtonText}>Sport</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FFD93D' }]}
            onPress={() => navigation.navigate('Nutrition')}
          >
            <Text style={styles.actionIcon}>🥗</Text>
            <Text style={styles.actionButtonText}>Ernährung</Text>
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
  },
  contentDesktop: {
    maxWidth: 1200,
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
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  settingsButton: {
    padding: 12,
    borderRadius: 12,
  },
  settingsIcon: {
    fontSize: 28,
  },
  statsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flex: 1,
    minWidth: 280,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    flex: 1,
    minWidth: 280,
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
