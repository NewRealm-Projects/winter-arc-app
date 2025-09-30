import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { addWaterEntry, getWaterEntries } from '../services/database';
import { WaterEntry } from '../types';

const QUICK_AMOUNTS = [250, 500, 750, 1000];

export default function WaterScreen() {
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (user) {
      const data = await getWaterEntries(user.uid);
      setEntries(data);

      const today = new Date().setHours(0, 0, 0, 0);
      const todayEntries = data.filter(
        entry => new Date(entry.date).setHours(0, 0, 0, 0) === today
      );
      const total = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
      setTodayTotal(total);
    }
  };

  const handleAddWater = async (amount: number) => {
    try {
      await addWaterEntry(user!.uid, {
        amount,
        date: new Date(),
      });
      Alert.alert('Success', `${amount}ml logged!`);
      loadEntries();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Today's Total</Text>
        <Text style={styles.totalValue}>{todayTotal} ml</Text>
        <Text style={styles.totalGoal}>Goal: 2000 ml</Text>
      </View>

      <View style={styles.quickButtons}>
        <Text style={styles.sectionTitle}>Quick Add</Text>
        <View style={styles.buttonRow}>
          {QUICK_AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickButton}
              onPress={() => handleAddWater(amount)}
            >
              <Text style={styles.quickButtonText}>{amount}ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.historyTitle}>Recent Entries</Text>
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.entryCard}>
              <Text style={styles.entryAmount}>{item.amount} ml</Text>
              <Text style={styles.entryDate}>
                {new Date(item.date).toLocaleString()}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No entries yet. Start hydrating!</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  totalCard: {
    backgroundColor: '#4ECDC4',
    padding: 30,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  totalValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  totalGoal: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  quickButtons: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  quickButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    padding: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  entryCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  entryDate: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 20,
  },
});
