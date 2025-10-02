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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check with reCAPTCHA v3
// In development, use debug token if available, otherwise use reCAPTCHA
if (import.meta.env.DEV) {
  // Development mode: enable debug token
  // @ts-ignore - self.FIREBASE_APPCHECK_DEBUG_TOKEN is a global variable
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    console.log('Firebase App Check initialized successfully');
  } catch (error) {
    console.error('Error initializing App Check:', error);
  }
} else {
  console.warn(
    'App Check not initialized: VITE_RECAPTCHA_SITE_KEY missing. ' +
    'Add your reCAPTCHA v3 site key to .env for production.'
  );
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
