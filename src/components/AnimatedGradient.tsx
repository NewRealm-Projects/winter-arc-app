import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function AnimatedGradient({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <View
        style={[
          styles.gradient,
          {
            backgroundColor: isDark ? '#1a1a2e' : '#FFFFFF',
          },
        ]}
      />
      {/* Content */}
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
