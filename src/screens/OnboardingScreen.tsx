import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function OnboardingScreen({ navigation }: any) {
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const { user, refreshUserData } = useAuth();
  const { colors } = useTheme();

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Spitznamen ein');
      return;
    }

    if (!age || isNaN(Number(age)) || Number(age) < 10 || Number(age) > 120) {
      Alert.alert('Fehler', 'Bitte gib ein gültiges Alter ein (10-120)');
      return;
    }

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
    const ageNum = Number(age);

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
        nickname: nickname.trim(),
        age: ageNum,
        gender: gender,
        weight: weightNum,
        height: heightNum,
        bodyFat: bodyFatNum,
        groupCode: groupCode.toLowerCase().trim() || undefined,
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
          <Text style={[styles.label, { color: colors.text }]}>Spitzname</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="z.B. Max"
            placeholderTextColor={colors.textSecondary}
            value={nickname}
            onChangeText={setNickname}
          />

          <Text style={[styles.label, { color: colors.text }]}>Alter</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="z.B. 25"
            placeholderTextColor={colors.textSecondary}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
          />

          <Text style={[styles.label, { color: colors.text }]}>Geschlecht</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                {
                  backgroundColor: gender === 'male' ? '#4ECDC4' : colors.background,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setGender('male')}
            >
              <Text style={[styles.genderText, { color: gender === 'male' ? 'white' : colors.text }]}>
                Männlich
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                {
                  backgroundColor: gender === 'female' ? '#4ECDC4' : colors.background,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setGender('female')}
            >
              <Text style={[styles.genderText, { color: gender === 'female' ? 'white' : colors.text }]}>
                Weiblich
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                {
                  backgroundColor: gender === 'other' ? '#4ECDC4' : colors.background,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setGender('other')}
            >
              <Text style={[styles.genderText, { color: gender === 'other' ? 'white' : colors.text }]}>
                Divers
              </Text>
            </TouchableOpacity>
          </View>

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
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  genderButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
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
