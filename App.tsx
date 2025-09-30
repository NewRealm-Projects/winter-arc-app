import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
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

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Winter Arc' }}
          />
          <Stack.Screen
            name="PushUps"
            component={PushUpsScreen}
            options={{ title: 'Push-ups Tracker' }}
          />
          <Stack.Screen
            name="Water"
            component={WaterScreen}
            options={{ title: 'Water Tracker' }}
          />
          <Stack.Screen
            name="Sport"
            component={SportScreen}
            options={{ title: 'Sport Tracker' }}
          />
          <Stack.Screen
            name="Nutrition"
            component={NutritionScreen}
            options={{ title: 'Nutrition Tracker' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Einstellungen' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <Navigation />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
