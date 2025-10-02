import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Firebase configuration
// Diese Werte sollten über Umgebungsvariablen gesetzt werden
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
console.log('🔥 Firebase Configuration:');
console.log('  API Key:', firebaseConfig.apiKey ? '✓ Set' : '✗ Missing');
console.log('  Auth Domain:', firebaseConfig.authDomain || '✗ Missing');
console.log('  Project ID:', firebaseConfig.projectId || '✗ Missing');
console.log('  Storage Bucket:', firebaseConfig.storageBucket || '✗ Missing');
console.log('  Messaging Sender ID:', firebaseConfig.messagingSenderId || '✗ Missing');
console.log('  App ID:', firebaseConfig.appId ? '✓ Set' : '✗ Missing');

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration incomplete!');
  console.error('   Please ensure all VITE_FIREBASE_* variables are set in .env');
  throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check with reCAPTCHA v3 (optional)
// Only initialize if VITE_RECAPTCHA_SITE_KEY is set and valid
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// Enable App Check debug token for localhost
if (import.meta.env.DEV || window.location.hostname === 'localhost') {
  console.log('🔓 App Check Debug Mode enabled for localhost');
  // @ts-ignore - self.FIREBASE_APPCHECK_DEBUG_TOKEN is a global variable
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

if (recaptchaSiteKey && recaptchaSiteKey.length > 10) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.log('✓ Firebase App Check initialized with reCAPTCHA v3');
  } catch (error) {
    console.warn('⚠ App Check initialization failed - continuing without App Check:', error);
  }
} else {
  console.info(
    'ℹ App Check not configured (optional). ' +
    'Add VITE_RECAPTCHA_SITE_KEY to enable protection against abuse.'
  );
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account', // Always show account selection
});

console.log('🔐 Google OAuth Provider configured');

export default app;
