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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            // User exists in Firestore
            const userData = userDoc.data() as Omit<User, 'id'>;
            setUser({
              id: firebaseUser.uid,
              ...userData,
              createdAt: userData.createdAt || new Date(),
            });
            setIsOnboarded(true);

            // Load tracking data
            const trackingRef = collection(db, 'tracking', firebaseUser.uid, 'days');
            const trackingSnapshot = await getDocs(trackingRef);

            const trackingData: Record<string, DailyTracking> = {};
            trackingSnapshot.forEach((doc) => {
              trackingData[doc.id] = doc.data() as DailyTracking;
            });

            setTracking(trackingData);
          } else {
            // New user - needs onboarding
            setUser({
              id: firebaseUser.uid,
              nickname: '',
              gender: 'male',
              height: 0,
              weight: 0,
              maxPushups: 0,
              groupCode: '',
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
          console.error('Error fetching user data:', error);
          setUser(null);
          setIsOnboarded(false);
        }
      } else {
        // User is signed out
        setUser(null);
        setIsOnboarded(false);
        setTracking({});
      }
    });

    return () => unsubscribe();
  }, [setUser, setIsOnboarded, setTracking]);
}
