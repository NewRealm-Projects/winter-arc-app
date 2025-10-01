import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { addProteinEntry, getProteinEntries } from '../services/database';
import { ProteinEntry } from '../types';

const QUICK_AMOUNTS = [20, 30, 40, 50];

export default function ProteinScreen({ navigation }: any) {
  const [grams, setGrams] = useState('');
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<ProteinEntry[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const { user } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (user) {
      const data = await getProteinEntries(user.uid);
      setEntries(data);

      const today = new Date().setHours(0, 0, 0, 0);
      const todayEntries = data.filter(
        entry => new Date(entry.date).setHours(0, 0, 0, 0) === today
      );
      const total = todayEntries.reduce((sum, entry) => sum + entry.grams, 0);
      setTodayTotal(total);
    }
  };

  const handleSubmit = async (amount?: number) => {
    const gramsToAdd = amount || Number(grams);

    if (!gramsToAdd || isNaN(gramsToAdd)) {
      Alert.alert('Fehler', 'Bitte gib eine gültige Zahl ein');
      return;
    }

    try {
      await addProteinEntry(user!.uid, {
        grams: gramsToAdd,
        date: new Date(),
        notes: notes || undefined,
      });
      setGrams('');
      setNotes('');
      Alert.alert('Erfolg', `${gramsToAdd}g Protein gespeichert!`);
      loadEntries();
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error: any) {
      Alert.alert('Fehler', error.message);
      console.error('Error saving protein:', error);
    }
  };

  const proteinGoal = user ? Math.round((user as any).weight * 2 || 150) : 150;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.totalCard, { backgroundColor: '#F9CA24' }]}>
        <Text style={styles.totalLabel}>Heute gegessen</Text>
        <Text style={styles.totalValue}>{todayTotal}g</Text>
        <Text style={styles.totalGoal}>Ziel: {proteinGoal}g Protein</Text>
      </View>

      <View style={[styles.quickButtons, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Schnell hinzufügen</Text>
        <View style={styles.buttonRow}>
          {QUICK_AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickButton}
              onPress={() => handleSubmit(amount)}
            >
              <Text style={styles.quickButtonText}>{amount}g</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.form, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>Protein in Gramm</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder="z.B. 35"
          placeholderTextColor={colors.textSecondary}
          value={grams}
          onChangeText={setGrams}
          keyboardType="number-pad"
        />

        <Text style={[styles.label, { color: colors.text }]}>Notizen (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder="Was hast du gegessen?"
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={() => handleSubmit()}>
          <Text style={styles.buttonText}>Speichern</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={[styles.historyTitle, { color: colors.text }]}>Letzte Einträge</Text>
        <FlatList
          data={entries}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.entryCard, { backgroundColor: colors.card }]}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryAmount}>{item.grams}g</Text>
                <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
                  {new Date(item.date).toLocaleString('de-DE')}
                </Text>
              </View>
              {item.notes && <Text style={[styles.entryNotes, { color: colors.textSecondary }]}>{item.notes}</Text>}
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Noch keine Einträge. Track dein Protein!
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
    backgroundColor: '#F9CA24',
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
  form: {
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#F9CA24',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9CA24',
  },
  entryDate: {
    fontSize: 14,
  },
  entryNotes: {
    fontSize: 14,
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
});
