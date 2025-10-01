import React from 'react';
import { View, Text, StyleSheet, Platform, ImageBackground } from 'react-native';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      await signInWithGoogle(credentialResponse.credential);
    } catch (error: any) {
      console.error('Login failed:', error.message);
      alert('Login failed: ' + error.message);
    }
  };

  const handleGoogleError = () => {
    alert('Google Sign In failed');
  };

  return (
    <ImageBackground
      source={require('../../assets/splash.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Winter Arc</Text>
        <Text style={styles.subtitle}>Track your fitness journey</Text>

        {Platform.OS === 'web' ? (
          <View style={styles.googleButton}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="filled_blue"
              size="large"
              text="signin_with"
            />
          </View>
        ) : (
          <View style={styles.mobileMessage}>
            <Text style={styles.mobileText}>
              Google Sign-In is available on web.
              {'\n\n'}
              For mobile apps, additional setup is required.
            </Text>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 60,
    color: '#f1f1f1',
    textAlign: 'center',
  },
  googleButton: {
    marginTop: 20,
  },
  mobileMessage: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  mobileText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
});
