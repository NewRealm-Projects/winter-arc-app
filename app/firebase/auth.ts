import {
  signInWithPopup,
  signInWithRedirect,
  browserPopupRedirectResolver,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from './index';
import { addBreadcrumb } from '../services/sentryService';

/**
 * Start login flow with automatic popup/redirect selection based on environment
 *
 * - localhost/127.0.0.1: Uses popup (better DX, instant feedback)
 * - production: Uses redirect (avoids COOP issues with window.close())
 *
 * @returns Promise that resolves when login completes (popup) or redirects (production)
 */
export async function startLogin(): Promise<void> {
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  addBreadcrumb('Auth: Login started', { isLocal, hostname: window.location.hostname });

  try {
    if (isLocal) {
      // Development: Use popup with explicit resolver
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      addBreadcrumb('Auth: Popup login successful');
    } else {
      // Production: Use redirect to avoid COOP issues
      await signInWithRedirect(auth, googleProvider);
      // Page will reload after redirect, no need to log success here
      addBreadcrumb('Auth: Redirect initiated');
    }
  } catch (error) {
    addBreadcrumb('Auth: Login failed', { error: String(error) }, 'error');
    throw error;
  }
}

/**
 * Wait for Firebase Auth to initialize and return the current user
 *
 * This ensures auth state is ready before accessing Firestore with user-specific paths.
 * Resolves immediately if auth is already initialized.
 *
 * @returns Promise<User | null> - Resolves with current user or null if not authenticated
 */
export function waitForAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

