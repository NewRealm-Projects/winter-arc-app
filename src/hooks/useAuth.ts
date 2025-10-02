import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useStore } from '../store/useStore';
import type { User } from '../types';

export function useAuth() {
  const setUser = useStore((state) => state.setUser);
  const setIsOnboarded = useStore((state) => state.setIsOnboarded);

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
      }
    });

    return () => unsubscribe();
  }, [setUser, setIsOnboarded]);
}
