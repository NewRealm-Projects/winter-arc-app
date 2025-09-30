import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { addSportEntry, getSportEntries } from '../services/database';
import { SportEntry } from '../types';

const SPORT_TYPES = ['Running', 'Cycling', 'Gym', 'Swimming', 'Walking', 'Other'];

export default function SportScreen() {
  const [selectedType, setSelectedType] = useState('Running');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<SportEntry[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (user) {
      const data = await getSportEntries(user.uid);
      setEntries(data);
    }
  };

  const handleSubmit = async () => {
    if (!duration || isNaN(Number(duration))) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }

    try {
      await addSportEntry(user!.uid, {
        type: selectedType,
        duration: Number(duration),
        date: new Date(),
        notes: notes || undefined,
      });
      setDuration('');
      setNotes('');
      Alert.alert('Success', 'Sport activity logged!');
      loadEntries();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Sport Type</Text>
        <View style={styles.typeGrid}>
          {SPORT_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                selectedType === type && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === type && styles.typeButtonTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 30"
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="How was your workout?"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Log Activity</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.historyTitle}>Recent Activities</Text>
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryType}>{item.type}</Text>
                <Text style={styles.entryDuration}>{item.duration} min</Text>
              </View>
              <Text style={styles.entryDate}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
              {item.notes && <Text style={styles.entryNotes}>{item.notes}</Text>}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No activities yet. Get moving!</Text>
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
    marginTop: 15,
    color: '#333',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeButtonActive: {
    backgroundColor: '#95E1D3',
    borderColor: '#95E1D3',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextActive: {
    color: 'white',
    fontWeight: '600',
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
    backgroundColor: '#95E1D3',
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
    marginBottom: 5,
  },
  entryType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#95E1D3',
  },
  entryDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
