import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

function normalizeStorageBucket(rawBucket?: string): string | undefined {
  if (!rawBucket) {
    return rawBucket;
  }

  // Remove protocol prefixes and query params that may be pasted from URLs
  const trimmed = rawBucket.trim();
  const withoutScheme = trimmed
    .replace(/^https?:\/\/(?:storage\.)?googleapis\.com\/v0\/b\//i, '')
    .replace(/^gs:\/\//i, '');
  const bucketOnly = withoutScheme.split(/[/?#]/)[0];

  if (bucketOnly.endsWith('.firebasestorage.app')) {
    return bucketOnly.replace(/\.firebasestorage\.app$/i, '.appspot.com');
  }

  return bucketOnly;
}

// Firebase configuration
// Diese Werte sollten über Umgebungsvariablen gesetzt werden
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: normalizeStorageBucket(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
console.warn('🔥 Firebase Configuration:');
console.warn('  API Key:', firebaseConfig.apiKey ? '✓ Set' : '✗ Missing');
console.warn('  Auth Domain:', firebaseConfig.authDomain || '✗ Missing');
console.warn('  Project ID:', firebaseConfig.projectId || '✗ Missing');
console.warn('  Storage Bucket:', firebaseConfig.storageBucket || '✗ Missing');
console.warn('  Messaging Sender ID:', firebaseConfig.messagingSenderId || '✗ Missing');
console.warn('  App ID:', firebaseConfig.appId ? '✓ Set' : '✗ Missing');

const isTestEnv = typeof process !== 'undefined' && process.env?.VITEST === 'true';
const shouldUsePlaceholderConfig =
  isTestEnv && (!firebaseConfig.apiKey || !firebaseConfig.projectId);

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration incomplete!');
  console.error('   Please ensure all VITE_FIREBASE_* variables are set in .env');
  if (!shouldUsePlaceholderConfig) {
    throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
  }
}

// Initialize Firebase
const app = initializeApp(
  shouldUsePlaceholderConfig
    ? {
        apiKey: 'test-api-key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.appspot.com',
        messagingSenderId: '0',
        appId: '1:0:web:test',
      }
    : firebaseConfig
);

// Initialize App Check with reCAPTCHA v3 (optional)
// Only on localhost/development - not on production
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (!isTestEnv && isLocalhost && recaptchaSiteKey && recaptchaSiteKey.length > 10) {
  try {
    // Enable App Check debug token for localhost
    console.warn('🔓 App Check Debug Mode enabled for localhost');
    // @ts-expect-error - self.FIREBASE_APPCHECK_DEBUG_TOKEN is a global variable
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.warn('✓ Firebase App Check initialized with reCAPTCHA v3 (localhost only)');
  } catch (error) {
    console.warn('⚠ App Check initialization failed - continuing without App Check:', error);
  }
} else if (!isTestEnv) {
  console.warn(
    'ℹ App Check disabled on production. ' +
    'To enable: Register your production domain in Firebase App Check settings.'
  );
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account', // Always show account selection
});

console.warn('🔐 Google OAuth Provider configured');

export default app;
