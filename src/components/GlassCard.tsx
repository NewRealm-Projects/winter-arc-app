import React from 'react';
import { StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurIntensity?: number;
}

export default function GlassCard({ children, style, blurIntensity = 80 }: GlassCardProps) {
  const { isDark } = useTheme();

  const gradientColors: [string, string] = isDark
    ? ['rgba(28, 28, 30, 0.75)', 'rgba(28, 28, 30, 0.65)']
    : ['rgba(255, 255, 255, 0.9)', 'rgba(245, 247, 250, 0.85)'];

  return (
    <BlurView
      intensity={blurIntensity}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.blurContainer,
        {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          shadowColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.15)',
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContent}
      >
        {children}
      </LinearGradient>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  gradientContent: {
    padding: 20,
  },
});
