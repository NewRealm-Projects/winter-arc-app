import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../services/firebase';

interface UserData {
  nickname?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  weight?: number;
  height?: number;
  bodyFat?: number;
  onboardingCompleted?: boolean;
  groupCode?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (uid: string) => {
    if (!db) {
      return;
    }
    const userDoc = await getDoc(doc(db!, 'users', uid));
    if (userDoc.exists()) {
      setUserData(userDoc.data() as UserData);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await loadUserData(user.uid);
    }
  };

  useEffect(() => {
    if (!auth || !db) {
      // Running in a configuration without Firebase (e.g., missing env vars)
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userDoc = await getDoc(doc(db!, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db!, 'users', currentUser.uid), {
            name: currentUser.displayName || 'User',
            email: currentUser.email,
            createdAt: new Date(),
            apps: ['pushups', 'sport', 'nutrition', 'water'],
          });
        }
        await loadUserData(currentUser.uid);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async (credential: string) => {
    if (!auth) {
      throw new Error('Firebase authentication is not configured. Please provide Firebase environment variables.');
    }
    const googleCredential = GoogleAuthProvider.credential(credential);
    await signInWithCredential(auth, googleCredential);
  };

  const logout = async () => {
    if (!auth) {
      return;
    }
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};





