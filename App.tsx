import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import PushUpsScreen from './src/screens/PushUpsScreen';
import WaterScreen from './src/screens/WaterScreen';
import SportScreen from './src/screens/SportScreen';
import NutritionScreen from './src/screens/NutritionScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

// Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

function Navigation() {
  const { user, loading } = useAuth();
  const { isDark, colors } = useTheme();

  if (loading) {
    return null;
  }

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
            name="PushUps"
            component={PushUpsScreen}
            options={{
              title: 'Push-ups',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Water"
            component={WaterScreen}
            options={{
              title: 'Wasser',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Sport"
            component={SportScreen}
            options={{
              title: 'Sport',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Nutrition"
            component={NutritionScreen}
            options={{
              title: 'Ernährung',
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
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemedNavigation />
    </GoogleOAuthProvider>
  );
}
