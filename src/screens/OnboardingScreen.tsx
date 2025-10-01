import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function OnboardingScreen({ navigation }: any) {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [nickname, setNickname] = useState('');
  const { user, refreshUserData } = useAuth();
  const { colors } = useTheme();

  const handleSubmit = async () => {
    if (!weight || !height || isNaN(Number(weight)) || isNaN(Number(height))) {
      Alert.alert('Fehler', 'Bitte gib Gewicht und Größe ein');
      return;
    }

    if (bodyFat && (isNaN(Number(bodyFat)) || Number(bodyFat) < 3 || Number(bodyFat) > 50)) {
      Alert.alert('Fehler', 'Körperfett muss zwischen 3% und 50% sein');
      return;
    }

    const weightNum = Number(weight);
    const heightNum = Number(height);
    const bodyFatNum = bodyFat ? Number(bodyFat) : undefined;

    if (weightNum < 30 || weightNum > 300) {
      Alert.alert('Fehler', 'Gewicht muss zwischen 30 und 300 kg sein');
      return;
    }

    if (heightNum < 100 || heightNum > 250) {
      Alert.alert('Fehler', 'Größe muss zwischen 100 und 250 cm sein');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user!.uid), {
        weight: weightNum,
        height: heightNum,
        bodyFat: bodyFatNum,
        groupCode: groupCode.toLowerCase().trim() || undefined,
        nickname: nickname.trim() || user?.displayName || 'User',
        onboardingCompleted: true,
      });
      await refreshUserData();
      Alert.alert('Erfolg', 'Daten gespeichert!');
    } catch (error: any) {
      Alert.alert('Fehler', error.message);
      console.error('Error saving onboarding data:', error);
    }
  };

  const proteinGoal = weight ? Math.round(Number(weight) * 2) : 0;
  const bmi = weight && height ? (Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Willkommen! 👋</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Gib dein Gewicht und deine Größe an, um personalisierte Ziele zu erhalten
        </Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>Nickname</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="z.B. Max"
            placeholderTextColor={colors.textSecondary}
            value={nickname}
            onChangeText={setNickname}
          />

          <Text style={[styles.label, { color: colors.text }]}>Gruppen-Code (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="z.B. boys"
            placeholderTextColor={colors.textSecondary}
            value={groupCode}
            onChangeText={setGroupCode}
            autoCapitalize="none"
          />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Mit dem gleichen Code kannst du dich mit Freunden vergleichen
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>Gewicht (kg)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="z.B. 75"
            placeholderTextColor={colors.textSecondary}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.label, { color: colors.text }]}>Größe (cm)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="z.B. 180"
            placeholderTextColor={colors.textSecondary}
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.label, { color: colors.text }]}>Körperfett % (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="z.B. 15"
            placeholderTextColor={colors.textSecondary}
            value={bodyFat}
            onChangeText={setBodyFat}
            keyboardType="decimal-pad"
          />

          {weight && height && (
            <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Deine Ziele:</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • BMI: {bmi}
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • Protein-Ziel: {proteinGoal}g/Tag
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Los geht's! 🚀</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 30,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 12,
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
    fontSize: 18,
    borderWidth: 1,
  },
  infoBox: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#4ECDC4',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
