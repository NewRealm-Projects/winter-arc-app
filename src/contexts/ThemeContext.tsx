import React, { createContext, useState, useContext } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeColors {
  // Legacy colors (for backward compatibility)
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;

  // iOS System Colors
  blue: string;
  purple: string;
  pink: string;
  green: string;
  orange: string;
  yellow: string;

  // Category Colors (iOS-inspired)
  pushups: string;
  water: string;
  sport: string;
  protein: string;
  weight: string;

  // Glass Materials
  glassLight: string;
  glassMedium: string;
  glassStrong: string;

  // Text Hierarchy
  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;

  // Gradient Backgrounds
  gradientStart: string;
  gradientEnd: string;
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('auto');

  const isDark = theme === 'auto' ? systemColorScheme === 'dark' : theme === 'dark';

  const colors: ThemeColors = isDark
    ? {
        // Legacy (dark)
        background: '#000000',
        card: '#1C1C1E',
        text: '#FFFFFF',
        textSecondary: '#8E8E93',
        primary: '#0A84FF',
        border: '#38383A',

        // iOS System Colors
        blue: '#0A84FF',
        purple: '#5E5CE6',
        pink: '#FF375F',
        green: '#32D74B',
        orange: '#FF9F0A',
        yellow: '#FFD60A',

        // Category Colors (iOS-inspired)
        pushups: '#FF375F', // Vibrant Red
        water: '#64D2FF', // Bright Cyan
        sport: '#30D158', // iOS Green
        protein: '#FFD60A', // Vivid Yellow
        weight: '#BF5AF2', // iOS Purple

        // Glass Materials (Dark)
        glassLight: 'rgba(28, 28, 30, 0.68)',
        glassMedium: 'rgba(28, 28, 30, 0.82)',
        glassStrong: 'rgba(28, 28, 30, 0.95)',

        // Text Hierarchy (Dark)
        label: 'rgba(255, 255, 255, 0.92)',
        secondaryLabel: 'rgba(255, 255, 255, 0.64)',
        tertiaryLabel: 'rgba(255, 255, 255, 0.40)',

        // Gradient Backgrounds (Dark)
        gradientStart: 'rgba(17, 24, 39, 0.95)',
        gradientEnd: 'rgba(31, 41, 55, 0.98)',
      }
    : {
        // Legacy (light)
        background: '#FFFFFF',
        card: '#FFFFFF',
        text: '#000000',
        textSecondary: '#666666',
        primary: '#007AFF',
        border: '#E5E5E5',

        // iOS System Colors
        blue: '#007AFF',
        purple: '#5856D6',
        pink: '#FF2D55',
        green: '#34C759',
        orange: '#FF9500',
        yellow: '#FFCC00',

        // Category Colors (iOS-inspired)
        pushups: '#FF375F', // Vibrant Red
        water: '#64D2FF', // Bright Cyan
        sport: '#30D158', // iOS Green
        protein: '#FFD60A', // Vivid Yellow
        weight: '#BF5AF2', // iOS Purple

        // Glass Materials (Light)
        glassLight: 'rgba(255, 255, 255, 0.18)',
        glassMedium: 'rgba(255, 255, 255, 0.25)',
        glassStrong: 'rgba(255, 255, 255, 0.72)',

        // Text Hierarchy (Light)
        label: 'rgba(0, 0, 0, 0.88)',
        secondaryLabel: 'rgba(0, 0, 0, 0.56)',
        tertiaryLabel: 'rgba(0, 0, 0, 0.32)',

        // Gradient Backgrounds (Light)
        gradientStart: 'rgba(245, 245, 245, 0.5)',
        gradientEnd: 'rgba(255, 255, 255, 0.3)',
      };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
