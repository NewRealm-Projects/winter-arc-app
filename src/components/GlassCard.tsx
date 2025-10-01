import React from 'react';
import { StyleSheet, ViewStyle, Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurIntensity?: number;
}

// Web-only import with conditional loading
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let LiquidGlass: any = null;
if (Platform.OS === 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    LiquidGlass = require('liquid-glass-react').default;
  } catch {
    console.warn('liquid-glass-react not available, falling back to BlurView');
  }
}

export default function GlassCard({ children, style, blurIntensity = 100 }: GlassCardProps) {
  const { isDark } = useTheme();

  // Use liquid-glass-react on web for true liquid glass effect
  if (Platform.OS === 'web' && LiquidGlass) {
    return (
      <View style={[styles.webContainer, style]}>
        <LiquidGlass
          displacementScale={70}
          blurAmount={0.08}
          saturation={isDark ? 120 : 140}
          aberrationIntensity={2}
          elasticity={0.2}
          cornerRadius={24}
          overLight={!isDark}
          style={{
            padding: '20px',
            background: isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(245, 247, 250, 0.9)',
            border: isDark
              ? '1.5px solid rgba(255, 255, 255, 0.18)'
              : '1.5px solid rgba(150, 170, 190, 0.25)',
            boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.15)',
          }}
        >
          {children}
        </LiquidGlass>
      </View>
    );
  }

  // Native fallback: BlurView with glassmorphism
  const gradientColors: [string, string] = isDark
    ? ['rgba(28, 28, 30, 0.85)', 'rgba(28, 28, 30, 0.75)']
    : ['rgba(245, 247, 250, 0.9)', 'rgba(235, 240, 245, 0.85)'];

  return (
    <BlurView
      intensity={blurIntensity}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.blurContainer,
        {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(150, 170, 190, 0.25)',
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
  webContainer: {
    marginBottom: 12,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  gradientContent: {
    padding: 20,
  },
});
