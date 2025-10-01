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
  const [isHovered, setIsHovered] = useState(false);

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

  // Use liquid-glass-react on web
  if (Platform.OS === 'web' && LiquidGlass) {
    // Convert ViewStyle to web CSS
    const webStyle = {
      ...style,
      marginBottom: style?.marginBottom !== undefined ? style.marginBottom : 12,
      width: style?.flex === 1 ? '100%' : style?.width || 'auto',
    };

    return (
      <button
        onClick={disabled ? undefined : onPress}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transform: isHovered && !disabled ? 'scale(0.98)' : 'scale(1)',
          transition: 'transform 0.2s ease',
          ...webStyle,
        }}
      >
        <LiquidGlass
          displacementScale={isHovered ? 80 : 64}
          blurAmount={0.06}
          saturation={150}
          aberrationIntensity={2.5}
          elasticity={0.35}
          cornerRadius={16}
          overLight={!isDark}
          padding="16px 24px"
          style={{
            background: isDark ? hexToRgba(color, 0.4) : hexToRgba(color, 0.85),
            border: `1.5px solid ${isDark ? hexToRgba(color, 0.5) : hexToRgba(color, 0.6)}`,
            boxShadow: `0 4px 16px ${isDark ? 'rgba(0, 0, 0, 0.5)' : hexToRgba(color, 0.3)}`,
            textAlign: 'center',
            width: '100%',
          }}
        >
          <span
            style={{
              color: isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              fontSize: textStyle?.fontSize || '17px',
              fontWeight: '700',
              letterSpacing: '-0.4px',
              textShadow: `0 1px 3px ${isDark ? 'rgba(0, 0, 0, 0.3)' : hexToRgba(color, 0.4)}`,
            }}
          >
            {title}
          </span>
        </LiquidGlass>
      </button>
    );
  }

  // Native fallback: BlurView with glassmorphism
  const gradientColors: [string, string] = isDark
    ? [hexToRgba(color, 0.4), hexToRgba(color, 0.3)]
    : [hexToRgba(color, 0.85), hexToRgba(color, 0.75)];

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
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.blurContainer,
            {
              borderColor: isDark ? hexToRgba(color, 0.5) : hexToRgba(color, 0.6),
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
