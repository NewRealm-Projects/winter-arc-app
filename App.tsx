import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import PushUpsScreen from './src/screens/PushUpsScreen';
import WaterScreen from './src/screens/WaterScreen';
import SportScreen from './src/screens/SportScreen';
import NutritionScreen from './src/screens/NutritionScreen';

const Stack = createStackNavigator();

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
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
