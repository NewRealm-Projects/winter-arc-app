import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

interface MissingFirebaseConfigProps {
  missingKeys: string[];
}

const DOCS_URL = 'https://firebase.google.com/docs/web/setup';

const MissingFirebaseConfig: React.FC<MissingFirebaseConfigProps> = ({ missingKeys }) => {
  const handleOpenDocs = () => {
    Linking.openURL(DOCS_URL).catch((error) => {
      console.warn('Unable to open docs link', error);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>??</Text>
        <Text style={styles.title}>Firebase-Konfiguration erforderlich</Text>
        <Text style={styles.description}>
          Winter Arc benötigt gültige Firebase-Umgebungsvariablen. Ohne diese Konfiguration funktionieren Anmeldung und
          Datenspeicherung nicht.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fehlende Variablen</Text>
          {missingKeys.length > 0 ? (
            missingKeys.map((key) => (
              <Text key={key} style={styles.listItem}>
                - {key}
              </Text>
            ))
          ) : (
            <Text style={styles.listItem}>Alle Pflichtvariablen vorhanden – prüfe ihre Werte.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schnellstart</Text>
          <Text style={styles.listItem}>1. Kopiere <Text style={styles.code}>.env.example</Text> nach <Text style={styles.code}>.env</Text></Text>
          <Text style={styles.listItem}>2. Trage die Daten deines Firebase-Projekts ein</Text>
          <Text style={styles.listItem}>3. Starte den Dev-Server erneut (<Text style={styles.code}>npm start</Text>)</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleOpenDocs}>
          <Text style={styles.buttonText}>Firebase-Anleitung öffnen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
  },
  emoji: {
    fontSize: 52,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: 'rgba(226, 232, 240, 0.85)',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#cbd5f5',
    marginBottom: 6,
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    color: '#f8fafc',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MissingFirebaseConfig;

