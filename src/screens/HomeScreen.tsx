import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface QuickStatProps {
  title: string;
  value: string;
  color: string;
}

const QuickStat: React.FC<QuickStatProps> = ({ title, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <QuickStat title="Today's Push-ups" value="0" color="#FF6B6B" />
        <QuickStat title="Water (ml)" value="0" color="#4ECDC4" />
        <QuickStat title="Sport (min)" value="0" color="#95E1D3" />
        <QuickStat title="Meals Logged" value="0" color="#F9CA24" />
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF6B6B' }]}
          onPress={() => navigation.navigate('PushUps')}
        >
          <Text style={styles.actionButtonText}>Log Push-ups</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4ECDC4' }]}
          onPress={() => navigation.navigate('Water')}
        >
          <Text style={styles.actionButtonText}>Log Water</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#95E1D3' }]}
          onPress={() => navigation.navigate('Sport')}
        >
          <Text style={styles.actionButtonText}>Log Sport</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F9CA24' }]}
          onPress={() => navigation.navigate('Nutrition')}
        >
          <Text style={styles.actionButtonText}>Log Nutrition</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    padding: 20,
    gap: 15,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  actionsContainer: {
    padding: 20,
    gap: 15,
  },
  actionButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  logoutText: {
    color: '#666',
    fontSize: 16,
  },
});
