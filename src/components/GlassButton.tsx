import React, { useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface GlassButtonProps {
  onPress: () => void;
  title: string;
  color: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function GlassButton({
  onPress,
  title,
  color,
  style,
  textStyle,
  disabled = false,
}: GlassButtonProps) {
  const { isDark } = useTheme();
  const [scaleAnim] = useState(new Animated.Value(1));

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 5,
      tension: 40,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const gradientColors: [string, string] = isDark
    ? [hexToRgba(color, 0.3), hexToRgba(color, 0.25)]
    : [hexToRgba(color, 0.7), hexToRgba(color, 0.6)];

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={disabled && styles.disabled}
      >
        <BlurView
          intensity={60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.blurContainer,
            {
              borderColor: isDark ? hexToRgba(color, 0.4) : hexToRgba(color, 0.5),
              shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : hexToRgba(color, 0.3),
            },
          ]}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                  textShadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : hexToRgba(color, 0.4),
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </LinearGradient>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
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
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  disabled: {
    opacity: 0.4,
  },
});
