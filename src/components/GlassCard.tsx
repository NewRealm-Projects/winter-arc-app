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
    ? ['rgba(28, 28, 30, 0.72)', 'rgba(28, 28, 30, 0.65)']
    : ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.65)'];

  return (
    <BlurView
      intensity={blurIntensity}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.blurContainer,
        {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.5)',
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientContent,
          {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.4 : 0.12,
            shadowRadius: 24,
          },
        ]}
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
    borderWidth: 0.5,
  },
  gradientContent: {
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
