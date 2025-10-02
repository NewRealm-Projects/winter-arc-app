import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useStore } from '../store/useStore';
import type { User, DailyTracking } from '../types';

export function useAuth() {
  const setUser = useStore((state) => state.setUser);
  const setIsOnboarded = useStore((state) => state.setIsOnboarded);
  const setTracking = useStore((state) => state.setTracking);

  useEffect(() => {
    console.log('👤 Setting up auth state listener...');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        console.log('✅ User authenticated:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });

        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          console.log('📄 Fetching user data from Firestore...');
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            // User exists in Firestore
            console.log('✅ User data found in Firestore');
            const userData = userDoc.data() as Omit<User, 'id'>;
            const photoURL = userData.photoURL ?? firebaseUser.photoURL ?? undefined;
            setUser({
              id: firebaseUser.uid,
              ...userData,
              photoURL,
              shareProfilePicture: userData.shareProfilePicture ?? true,
              createdAt: userData.createdAt || new Date(),
            });

            // Check if birthday is missing - if so, show birthday onboarding
            if (!userData.birthday) {
              console.log('⚠️ Birthday missing, showing birthday onboarding');
              setIsOnboarded(false); // Will trigger birthday-only onboarding
            } else {
              console.log('✅ User profile complete');
              setIsOnboarded(true);
            }

            // Load tracking data
            console.log('📊 Loading tracking data...');
            const trackingRef = collection(db, 'tracking', firebaseUser.uid, 'days');
            const trackingSnapshot = await getDocs(trackingRef);

            const trackingData: Record<string, DailyTracking> = {};
            trackingSnapshot.forEach((doc) => {
              trackingData[doc.id] = doc.data() as DailyTracking;
            });

            console.log(`✅ Loaded ${Object.keys(trackingData).length} tracking entries`);
            setTracking(trackingData);
          } else {
            // New user - needs onboarding
            console.log('🆕 New user detected, starting onboarding...');
            setUser({
              id: firebaseUser.uid,
              language: 'de',
              nickname: '',
              gender: 'male',
              height: 0,
              weight: 0,
              maxPushups: 0,
              groupCode: '',
              photoURL: firebaseUser.photoURL ?? undefined,
              shareProfilePicture: true,
              createdAt: new Date(),
              pushupState: {
                baseReps: 0,
                sets: 5,
                restTime: 90,
              },
            });
            setIsOnboarded(false);
          }
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
          setUser(null);
          setIsOnboarded(false);
        }
      } else {
        // User is signed out
        console.log('🚪 User signed out');
        setUser(null);
        setIsOnboarded(false);
        setTracking({});
        // Session/Cookies/LocalStorage aufräumen
        try {
          // Alle Cookies löschen
          document.cookie.split(';').forEach((c) => {
            document.cookie = c
              .replace(/^ +/, '')
              .replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
          });
          // LocalStorage und SessionStorage leeren
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.warn('Fehler beim Aufräumen der Session:', e);
        }
      }
    });

    return () => unsubscribe();
  }, [setUser, setIsOnboarded, setTracking]);
}
