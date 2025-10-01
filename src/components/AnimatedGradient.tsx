import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

export default function AnimatedGradient({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();

  // Glassmorphism needs a colored background to be visible
  // Light mode: subtle gradient from light blue-gray to white
  // Dark mode: deep gradient
  const gradientColors = isDark
    ? ['#1a1a2e', '#16213e', '#0f1729']
    : ['#e8f0f8', '#f0f4f8', '#f5f8fa'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
});
