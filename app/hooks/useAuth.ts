'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useStore } from '../store/useStore';
import type { User, Activity } from '../types';
import { clearDemoModeMarker, isDemoModeActive } from '../constants/demo';
import { addBreadcrumb, captureException } from '../services/sentryService';

export function useAuth() {
  const setUser = useStore((state) => state.setUser);
  const setIsOnboarded = useStore((state) => state.setIsOnboarded);
  const setTracking = useStore((state) => state.setTracking);
  const setAuthLoading = useStore((state) => state.setAuthLoading);

  useEffect(() => {
    console.warn('👤 Setting up auth state listener...');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        console.warn('✅ User authenticated:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });

        addBreadcrumb('Auth: User authenticated', { uid: firebaseUser.uid });
        clearDemoModeMarker();

        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            let userData = userDoc.data() as Omit<User, 'id'>;

            const shouldUploadGooglePhoto =
              !userData.photoURL && !!firebaseUser.photoURL;

            if (shouldUploadGooglePhoto) {
              const { uploadProfilePictureFromUrl } = await import('../services/storageService');
              const uploadResult = await uploadProfilePictureFromUrl(firebaseUser.photoURL, firebaseUser.uid);

              if (uploadResult.success && uploadResult.url) {
                const updates: Partial<Omit<User, 'id'>> = {
                  photoURL: uploadResult.url,
                  shareProfilePicture: userData.shareProfilePicture ?? true,
                };

                await setDoc(userDocRef, updates, { merge: true });
                userData = { ...userData, ...updates };
              }
            }

            if (userData.shareProfilePicture === undefined) {
              await setDoc(userDocRef, { shareProfilePicture: true }, { merge: true });
              userData = { ...userData, shareProfilePicture: true };
            }

            // Backward compatibility: Migrate existing users without enabledActivities
            if (!userData.enabledActivities) {
              const defaultActivities: Activity[] = ['pushups', 'sports', 'water', 'protein'];
              console.warn('🔄 Migrating existing user to have default enabledActivities');

              // Update Firestore with default activities
              await setDoc(userDocRef, { enabledActivities: defaultActivities }, { merge: true });

              // Update local state with migrated data
              setUser({
                id: firebaseUser.uid,
                ...userData,
                enabledActivities: defaultActivities,
              });
            } else {
              setUser({
                id: firebaseUser.uid,
                ...userData,
              });
            }
            setIsOnboarded(!!userData.birthday);

            // MIGRATION: days → entries (one-time, automatic)
            try {
              const { migrateDaysToEntries } = await import('../services/migration');
              const migrationResult = await migrateDaysToEntries(firebaseUser.uid);

              if (migrationResult.success && migrationResult.count && migrationResult.count > 0) {
                addBreadcrumb('Auth: Migration completed', {
                  count: migrationResult.count,
                  uid: firebaseUser.uid,
                });
              }
            } catch (migrationError) {
              // Non-critical error - log but don't block login
              console.error('Migration error (non-critical):', migrationError);
              addBreadcrumb('Auth: Migration failed', { error: String(migrationError) }, 'error');
            }
          } else {
            let uploadedPhotoUrl: string | undefined;

            if (firebaseUser.photoURL) {
              const { uploadProfilePictureFromUrl } = await import('../services/storageService');
              const uploadResult = await uploadProfilePictureFromUrl(firebaseUser.photoURL, firebaseUser.uid);
              if (uploadResult.success && uploadResult.url) {
                uploadedPhotoUrl = uploadResult.url;
              }
            }

            setUser({
              id: firebaseUser.uid,
              language: 'de',
              nickname: '',
              gender: 'male',
              height: 0,
              weight: 0,
              maxPushups: 0,
              groupCode: '',
              photoURL: uploadedPhotoUrl,
              shareProfilePicture: true,
              createdAt: new Date(),
              pushupState: { baseReps: 0, sets: 5, restTime: 90 },
            });
            setIsOnboarded(false);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          addBreadcrumb('Auth: Failed to load user data', { error: String(error) }, 'error');
          captureException(error, { context: 'useAuth', uid: firebaseUser.uid });
          setUser(null);
          setIsOnboarded(false);
        } finally {
          setAuthLoading(false);
        }
      } else {
        if (isDemoModeActive()) {
          setAuthLoading(false);
          return;
        }

        setUser(null);
        setIsOnboarded(false);
        setTracking({});
        setAuthLoading(false);
        try {
          document.cookie.split(';').forEach((c) => {
            document.cookie = c
              .replace(/^ +/, '')
              .replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
          });
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // Nur im Fehlerfall loggen
          console.warn('Fehler beim Aufräumen der Session:', e);
        }
      }
    });
    return () => unsubscribe();
  }, [setUser, setIsOnboarded, setTracking, setAuthLoading]);
}

