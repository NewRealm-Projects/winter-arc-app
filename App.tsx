import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import MissingFirebaseConfig from './src/components/MissingFirebaseConfig';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import WeightTrackerScreen from './src/screens/WeightTrackerScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { isFirebaseConfigured, missingFirebaseEnvVars } from './src/services/firebase';

const Stack = createStackNavigator();

// Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

function Navigation() {
  const { user, userData, loading } = useAuth();
  const { isDark, colors } = useTheme();

  if (loading) {
    return null;
  }

  const needsOnboarding = user && !userData?.onboardingCompleted;

  const navigationTheme = {
    ...isDark ? DarkTheme : DefaultTheme,
    colors: {
      ...isDark ? DarkTheme.colors : DefaultTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {!user ? (
        <Stack.Navigator>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : needsOnboarding ? (
        <Stack.Navigator>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.card,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
              fontWeight: '600',
            },
            presentation: 'modal',
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WeightTracker"
            component={WeightTrackerScreen}
            options={{
              title: 'Gewicht Tracker',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{
              title: 'Rangliste',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{
              title: 'Historie',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Einstellungen',
              presentation: 'modal',
            }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

function ThemedNavigation() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function App() {
  if (!isFirebaseConfigured) {
    return (
      <ErrorBoundary>
        <MissingFirebaseConfig missingKeys={missingFirebaseEnvVars} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemedNavigation />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}









