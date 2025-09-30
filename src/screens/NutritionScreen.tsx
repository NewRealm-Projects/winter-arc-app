import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { addNutritionEntry, getNutritionEntries } from '../services/database';
import { NutritionEntry } from '../types';

const MEAL_TYPES: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function NutritionScreen() {
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (user) {
      const data = await getNutritionEntries(user.uid);
      setEntries(data);
    }
  };

  const handleSubmit = async () => {
    if (!description) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    try {
      await addNutritionEntry(user!.uid, {
        mealType: selectedMealType,
        description,
        calories: calories ? Number(calories) : undefined,
        date: new Date(),
        notes: notes || undefined,
      });
      setDescription('');
      setCalories('');
      setNotes('');
      Alert.alert('Success', 'Meal logged!');
      loadEntries();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Meal Type</Text>
        <View style={styles.mealTypeGrid}>
          {MEAL_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.mealTypeButton,
                selectedMealType === type && styles.mealTypeButtonActive,
              ]}
              onPress={() => setSelectedMealType(type)}
            >
              <Text
                style={[
                  styles.mealTypeButtonText,
                  selectedMealType === type && styles.mealTypeButtonTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>What did you eat?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Grilled chicken salad"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Calories (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 450"
          value={calories}
          onChangeText={setCalories}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional notes..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Log Meal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.historyTitle}>Recent Meals</Text>
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.mealTypeBadge}>
                  {item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)}
                </Text>
                {item.calories && (
                  <Text style={styles.caloriesText}>{item.calories} cal</Text>
                )}
              </View>
              <Text style={styles.entryDescription}>{item.description}</Text>
              <Text style={styles.entryDate}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
              {item.notes && <Text style={styles.entryNotes}>{item.notes}</Text>}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No meals logged yet. Start tracking!</Text>
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
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  mealTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mealTypeButtonActive: {
    backgroundColor: '#F9CA24',
    borderColor: '#F9CA24',
  },
  mealTypeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  mealTypeButtonTextActive: {
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
    marginBottom: 8,
  },
  mealTypeBadge: {
    backgroundColor: '#F9CA24',
    color: 'white',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  caloriesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  entryDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
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
