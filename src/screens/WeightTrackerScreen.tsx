import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView, Dimensions } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { addWeightEntry, getWeightEntries } from '../services/database';
import { WeightEntry } from '../types';

export default function WeightTrackerScreen({ navigation }: any) {
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const { user, userData } = useAuth();
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (user) {
      const data = await getWeightEntries(user.uid);
      // Filter last 30 days for monthly graph
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentData = data.filter(e => new Date(e.date) >= thirtyDaysAgo);
      setEntries(recentData);
    }
  };

  const handleSubmit = async () => {
    if (!weight || isNaN(Number(weight))) {
      Alert.alert('Fehler', 'Bitte gib ein gültiges Gewicht ein');
      return;
    }

    if (bodyFat && (isNaN(Number(bodyFat)) || Number(bodyFat) < 3 || Number(bodyFat) > 50)) {
      Alert.alert('Fehler', 'Körperfett muss zwischen 3% und 50% sein');
      return;
    }

    const weightNum = Number(weight);
    const bodyFatNum = bodyFat ? Number(bodyFat) : undefined;

    if (weightNum < 30 || weightNum > 300) {
      Alert.alert('Fehler', 'Gewicht muss zwischen 30 und 300 kg sein');
      return;
    }

    try {
      await addWeightEntry(user!.uid, {
        weight: weightNum,
        bodyFat: bodyFatNum,
        date: new Date(),
      });
      setWeight('');
      setBodyFat('');
      Alert.alert('Erfolg', 'Gewicht gespeichert!');
      loadEntries();
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error: any) {
      Alert.alert('Fehler', error.message);
      console.error('Error saving weight:', error);
    }
  };

  const getBMI = (weight: number) => {
    if (!userData?.height) return null;
    return (weight / Math.pow(userData.height / 100, 2)).toFixed(1);
  };

  const latestEntry = entries[0];
  const latestBMI = latestEntry ? getBMI(latestEntry.weight) : null;

  // Simple line graph data
  const graphWidth = screenWidth - 80;
  const graphHeight = 200;
  const maxWeight = Math.max(...entries.map(e => e.weight), 100);
  const minWeight = Math.min(...entries.map(e => e.weight), 50);
  const weightRange = maxWeight - minWeight || 10;

  const getGraphPoint = (entry: WeightEntry, index: number) => {
    const x = (index / Math.max(entries.length - 1, 1)) * graphWidth;
    const y = graphHeight - ((entry.weight - minWeight) / weightRange) * graphHeight;
    return { x, y };
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {latestEntry && (
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Aktuelles Gewicht</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{latestEntry.weight} kg</Text>
            </View>
            {latestBMI && (
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>BMI</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{latestBMI}</Text>
              </View>
            )}
          </View>
          {latestEntry.bodyFat && (
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Körperfett</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{latestEntry.bodyFat}%</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {entries.length >= 2 && (
        <View style={[styles.graphCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.graphTitle, { color: colors.text }]}>Gewichtsverlauf (30 Tage)</Text>
          <View style={styles.graphContainer}>
            <View style={[styles.graph, { width: graphWidth, height: graphHeight, borderColor: colors.border }]}>
              {/* Y-axis labels */}
              <Text style={[styles.yAxisLabel, styles.yAxisTop, { color: colors.textSecondary }]}>
                {maxWeight.toFixed(0)} kg
              </Text>
              <Text style={[styles.yAxisLabel, styles.yAxisBottom, { color: colors.textSecondary }]}>
                {minWeight.toFixed(0)} kg
              </Text>

              {/* Line graph */}
              <View style={styles.graphLine}>
                {entries.map((entry, index) => {
                  if (index === 0) return null;
                  const prevPoint = getGraphPoint(entries[index - 1], index - 1);
                  const currPoint = getGraphPoint(entry, index);
                  const lineWidth = Math.sqrt(
                    Math.pow(currPoint.x - prevPoint.x, 2) + Math.pow(currPoint.y - prevPoint.y, 2)
                  );
                  const angle = Math.atan2(currPoint.y - prevPoint.y, currPoint.x - prevPoint.x) * (180 / Math.PI);

                  return (
                    <View
                      key={entry.id}
                      style={[
                        styles.graphSegment,
                        {
                          left: prevPoint.x,
                          top: prevPoint.y,
                          width: lineWidth,
                          transform: [{ rotate: `${angle}deg` }],
                          backgroundColor: '#4ECDC4',
                        },
                      ]}
                    />
                  );
                })}
                {/* Data points */}
                {entries.map((entry, index) => {
                  const point = getGraphPoint(entry, index);
                  return (
                    <View
                      key={`point-${entry.id}`}
                      style={[
                        styles.graphPoint,
                        {
                          left: point.x - 4,
                          top: point.y - 4,
                          backgroundColor: '#4ECDC4',
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.form, { backgroundColor: colors.card }]}>
        <Text style={[styles.formTitle, { color: colors.text }]}>Neuer Eintrag</Text>

        <Text style={[styles.label, { color: colors.text }]}>Gewicht (kg)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder="z.B. 75.5"
          placeholderTextColor={colors.textSecondary}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.label, { color: colors.text }]}>Körperfett % (optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder="z.B. 15.5"
          placeholderTextColor={colors.textSecondary}
          value={bodyFat}
          onChangeText={setBodyFat}
          keyboardType="decimal-pad"
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Speichern</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={[styles.historyTitle, { color: colors.text }]}>Verlauf</Text>
        <FlatList
          data={entries}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const bmi = getBMI(item.weight);
            return (
              <View style={[styles.entryCard, { backgroundColor: colors.card }]}>
                <View style={styles.entryHeader}>
                  <View>
                    <Text style={[styles.entryWeight, { color: colors.text }]}>{item.weight} kg</Text>
                    {bmi && <Text style={[styles.entryBMI, { color: colors.textSecondary }]}>BMI: {bmi}</Text>}
                    {item.bodyFat && <Text style={[styles.entryBodyFat, { color: colors.textSecondary }]}>KF: {item.bodyFat}%</Text>}
                  </View>
                  <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
                    {new Date(item.date).toLocaleDateString('de-DE')}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Noch keine Einträge. Starte dein Tracking!
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
  statsCard: {
    padding: 20,
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  graphCard: {
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
  graphTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  graphContainer: {
    alignItems: 'center',
  },
  graph: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  yAxisLabel: {
    position: 'absolute',
    fontSize: 12,
    right: -40,
  },
  yAxisTop: {
    top: 10,
  },
  yAxisBottom: {
    bottom: 10,
  },
  graphLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  graphSegment: {
    position: 'absolute',
    height: 3,
  },
  graphPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
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
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
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
  button: {
    backgroundColor: '#4ECDC4',
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
  entryWeight: {
    fontSize: 20,
    fontWeight: '700',
  },
  entryBMI: {
    fontSize: 14,
    marginTop: 4,
  },
  entryBodyFat: {
    fontSize: 14,
    marginTop: 2,
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
