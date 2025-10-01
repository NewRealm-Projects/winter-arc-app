import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { addWaterEntry, getWaterEntries } from '../services/database';
import { WaterEntry } from '../types';

const QUICK_AMOUNTS = [250, 500, 750, 1000];

export default function WaterScreen({ navigation }: any) {
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const { user } = useAuth();
  const { colors } = useTheme();

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
      Alert.alert('Erfolg', `${amount}ml gespeichert!`);
      loadEntries();
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error: any) {
      Alert.alert('Fehler', error.message);
      console.error('Error saving water:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.totalCard, { backgroundColor: '#4ECDC4' }]}>
        <Text style={styles.totalLabel}>Heute getrunken</Text>
        <Text style={styles.totalValue}>{todayTotal} ml</Text>
        <Text style={styles.totalGoal}>Ziel: 2000 ml</Text>
      </View>

      <View style={[styles.quickButtons, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Schnell hinzufügen</Text>
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
        <Text style={[styles.historyTitle, { color: colors.text }]}>Letzte Einträge</Text>
        <FlatList
          data={entries}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.entryCard, { backgroundColor: colors.card }]}>
              <Text style={styles.entryAmount}>{item.amount} ml</Text>
              <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
                {new Date(item.date).toLocaleString('de-DE')}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Noch keine Einträge. Bleib hydriert!
            </Text>
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  totalCard: {
    padding: 30,
    alignItems: 'center',
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    padding: 20,
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  quickButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  entryCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  entryDate: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
});
