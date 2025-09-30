import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { addPushUpEntry, getPushUpEntries } from '../services/database';
import { PushUpEntry } from '../types';

export default function PushUpsScreen({ navigation }: any) {
  const [count, setCount] = useState('');
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<PushUpEntry[]>([]);
  const { user } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (user) {
      const data = await getPushUpEntries(user.uid);
      setEntries(data);
    }
  };

  const handleSubmit = async () => {
    if (!count || isNaN(Number(count))) {
      Alert.alert('Fehler', 'Bitte gib eine gültige Zahl ein');
      return;
    }

    try {
      await addPushUpEntry(user!.uid, {
        count: Number(count),
        date: new Date(),
        notes: notes || undefined,
      });
      setCount('');
      setNotes('');
      Alert.alert('Erfolg', 'Push-ups gespeichert!');
      loadEntries();
      // Close modal after success
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error: any) {
      Alert.alert('Fehler', error.message);
      console.error('Error saving push-ups:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.form, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>Anzahl Push-ups</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder="z.B. 20"
          placeholderTextColor={colors.textSecondary}
          value={count}
          onChangeText={setCount}
          keyboardType="number-pad"
        />

        <Text style={[styles.label, { color: colors.text }]}>Notizen (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder="Wie war es?"
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
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
                <Text style={styles.entryCount}>{item.count} push-ups</Text>
                <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
                  {new Date(item.date).toLocaleDateString('de-DE')}
                </Text>
              </View>
              {item.notes && <Text style={[styles.entryNotes, { color: colors.textSecondary }]}>{item.notes}</Text>}
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
  form: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 16,
    margin: 20,
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
    backgroundColor: '#FF6B6B',
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
  entryCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
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
