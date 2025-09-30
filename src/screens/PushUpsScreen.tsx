import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { addPushUpEntry, getPushUpEntries } from '../services/database';
import { PushUpEntry } from '../types';

export default function PushUpsScreen() {
  const [count, setCount] = useState('');
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<PushUpEntry[]>([]);
  const { user } = useAuth();

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
      Alert.alert('Error', 'Please enter a valid number');
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
      Alert.alert('Success', 'Push-ups logged!');
      loadEntries();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Number of Push-ups</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 20"
          value={count}
          onChangeText={setCount}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="How did it feel?"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Log Push-ups</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.historyTitle}>Recent Entries</Text>
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryCount}>{item.count} push-ups</Text>
                <Text style={styles.entryDate}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
              {item.notes && <Text style={styles.entryNotes}>{item.notes}</Text>}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No entries yet. Start logging!</Text>
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
  form: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
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
    color: '#666',
  },
  entryNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 20,
  },
});
