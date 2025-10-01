import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import GlassCard from '../components/GlassCard';
import AnimatedGradient from '../components/AnimatedGradient';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getPushUpEntries,
  getWaterEntries,
  getProteinEntries,
  getSportEntries,
  deleteEntry,
  updatePushUpEntry,
  updateWaterEntry,
  updateProteinEntry,
} from '../services/database';
import { PushUpEntry, WaterEntry, ProteinEntry, SportEntry } from '../types';

type HistoryType = 'pushups' | 'water' | 'protein' | 'sport';

interface HistoryParams {
  type: HistoryType;
}

type HistoryRoute = RouteProp<{ History: HistoryParams }, 'History'>;

type GenericEntry = PushUpEntry | WaterEntry | ProteinEntry | SportEntry;

interface EditingState {
  id: string;
  value: string;
}

const CONFIG: Record<HistoryType, { title: string; unit: string; color: string }> = {
  pushups: { title: 'Push-ups Historie', unit: 'Wdh.', color: '#FF6B6B' },
  water: { title: 'Wasser Historie', unit: 'ml', color: '#45AAF2' },
  protein: { title: 'Protein Historie', unit: 'g', color: '#FFB347' },
  sport: { title: 'Sport Historie', unit: '', color: '#00D084' },
};

const collectionForType = (type: HistoryType) => {
  switch (type) {
    case 'pushups':
      return 'pushUpEntries';
    case 'water':
      return 'waterEntries';
    case 'protein':
      return 'proteinEntries';
    case 'sport':
      return 'sportEntries';
    default:
      return '';
  }
};

const formatValue = (entry: GenericEntry, type: HistoryType, unit: string) => {
  switch (type) {
    case 'pushups':
      return `${(entry as PushUpEntry).count} ${unit}`.trim();
    case 'water':
      return `${(entry as WaterEntry).amount} ${unit}`.trim();
    case 'protein':
      return `${(entry as ProteinEntry).grams} ${unit}`.trim();
    case 'sport':
      return (entry as SportEntry).completed ? 'Erledigt' : 'Nicht erledigt';
    default:
      return '';
  }
};

const initialValueForEdit = (entry: GenericEntry, type: HistoryType) => {
  switch (type) {
    case 'pushups':
      return String((entry as PushUpEntry).count);
    case 'water':
      return String((entry as WaterEntry).amount);
    case 'protein':
      return String((entry as ProteinEntry).grams);
    default:
      return '0';
  }
};

export default function HistoryScreen() {
  const route = useRoute<HistoryRoute>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();

  const type = route.params.type;
  const config = CONFIG[type];
  const editable = type !== 'sport';

  const [entries, setEntries] = useState<GenericEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: config.title });
  }, [config.title, navigation]);

  useEffect(() => {
    loadEntries();
  }, [user, type]);

  const loadEntries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let data: GenericEntry[] = [];
      switch (type) {
        case 'pushups':
          data = await getPushUpEntries(user.uid);
          break;
        case 'water':
          data = await getWaterEntries(user.uid);
          break;
        case 'protein':
          data = await getProteinEntries(user.uid);
          break;
        case 'sport':
          data = await getSportEntries(user.uid);
          break;
      }
      setEntries(data);
    } catch (error) {
      console.error('Error loading history:', error);
      Alert.alert('Fehler', 'Historie konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (entryId: string) => {
    Alert.alert(
      'Eintrag löschen',
      'Möchtest du diesen Eintrag wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(collectionForType(type), entryId);
              loadEntries();
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Fehler', 'Konnte nicht löschen');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!editing) return;
    const numericValue = Number(editing.value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      Alert.alert('Fehler', 'Bitte gib einen gültigen Wert ein');
      return;
    }

    try {
      if (type === 'pushups') {
        await updatePushUpEntry(editing.id, numericValue);
      } else if (type === 'water') {
        await updateWaterEntry(editing.id, numericValue);
      } else if (type === 'protein') {
        await updateProteinEntry(editing.id, numericValue);
      }
      setEditing(null);
      loadEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      Alert.alert('Fehler', 'Konnte nicht speichern');
    }
  };

  return (
    <AnimatedGradient>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <GlassCard>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Alle Einträge chronologisch</Text>
          </View>

          {loading ? (
            <Text style={{ color: colors.textSecondary }}>Lädt…</Text>
          ) : entries.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>Noch keine Einträge vorhanden.</Text>
          ) : (
            entries.map(entry => {
              const date = new Date(entry.date);
              const isEditing = editing?.id === entry.id;
              return (
                <View key={entry.id} style={[styles.row, { borderBottomColor: colors.border }]}>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowDate, { color: colors.text }]}>
                      {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </Text>
                    {isEditing && editable ? (
                      <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={editing.value}
                        onChangeText={(value) => setEditing({ id: entry.id, value })}
                        keyboardType={Platform.select({ ios: 'number-pad', default: 'numeric' })}
                        autoFocus
                      />
                    ) : (
                      <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                        {formatValue(entry, type, config.unit)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.actions}>
                    {isEditing && editable ? (
                      <>
                        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                          <Text style={[styles.actionText, { color: '#00D084' }]}>Speichern</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={() => setEditing(null)}>
                          <Text style={[styles.actionText, { color: '#FF6B6B' }]}>Abbrechen</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        {editable && (
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setEditing({ id: entry.id, value: initialValueForEdit(entry, type) })}
                          >
                            <Text style={[styles.actionText, { color: colors.text }]}>Bearbeiten</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(entry.id)}>
                          <Text style={[styles.actionText, { color: '#FF6B6B' }]}>Löschen</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </GlassCard>
      </ScrollView>
    </AnimatedGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
  rowDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minWidth: 80,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
