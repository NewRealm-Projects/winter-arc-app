import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useStore } from '../store/useStore';
import type { User, DailyTracking, Activity } from '../types';

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
          // Tracking laden
          const trackingRef = collection(db, 'tracking', firebaseUser.uid, 'days');
          const trackingSnapshot = await getDocs(trackingRef);
          const trackingData: Record<string, DailyTracking> = {};
          trackingSnapshot.forEach((doc) => {
            trackingData[doc.id] = doc.data() as DailyTracking;
          });
          setTracking(trackingData);
        } catch {
          setUser(null);
          setIsOnboarded(false);
        } finally {
          setAuthLoading(false);
        }
      } else {
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
