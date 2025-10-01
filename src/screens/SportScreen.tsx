import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { addSportEntry, getSportEntries } from '../services/database';
import { SportEntry } from '../types';

export default function SportScreen({ navigation }: any) {
  const [entries, setEntries] = useState<SportEntry[]>([]);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const { user } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (user) {
      const data = await getSportEntries(user.uid);
      setEntries(data);

      const today = new Date().setHours(0, 0, 0, 0);
      const hasToday = data.some(
        entry => new Date(entry.date).setHours(0, 0, 0, 0) === today
      );
      setTodayCompleted(hasToday);
    }
  };

  const handleToggle = async () => {
    try {
      if (!todayCompleted) {
        await addSportEntry(user!.uid);
        Alert.alert('Erfolg', 'Sport abgehakt!');
        loadEntries();
        setTimeout(() => navigation.goBack(), 1000);
      } else {
        Alert.alert('Info', 'Du hast heute bereits Sport gemacht!');
      }
    } catch (error: any) {
      Alert.alert('Fehler', error.message);
      console.error('Error saving sport:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mainCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Sport gemacht?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Hake ab wenn du heute trainiert hast
        </Text>

        <TouchableOpacity
          style={[
            styles.checkButton,
            { backgroundColor: todayCompleted ? '#00D084' : '#95E1D3' }
          ]}
          onPress={handleToggle}
          disabled={todayCompleted}
        >
          <Text style={styles.checkIcon}>
            {todayCompleted ? '✓' : '○'}
          </Text>
          <Text style={styles.checkButtonText}>
            {todayCompleted ? 'Heute erledigt!' : 'Abhaken'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={[styles.historyTitle, { color: colors.text }]}>Verlauf</Text>
        <FlatList
          data={entries}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.entryCard, { backgroundColor: colors.card }]}>
              <Text style={styles.checkMark}>✓</Text>
              <Text style={[styles.entryDate, { color: colors.text }]}>
                {new Date(item.date).toLocaleDateString('de-DE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Noch keine Einträge. Leg los!
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
  mainCard: {
    padding: 30,
    margin: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 12,
    minWidth: 200,
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  checkButtonText: {
    color: 'white',
    fontSize: 20,
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
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkMark: {
    fontSize: 24,
    color: '#00D084',
    fontWeight: 'bold',
  },
  entryDate: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
});
