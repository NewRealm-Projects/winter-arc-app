'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '../store/useStore';
import type { User } from '../types';
import { clearDemoModeMarker, isDemoModeActive } from '../constants/demo';
import { addBreadcrumb, captureException } from '../services/sentryService';

export function useAuth() {
  const { data: session, status } = useSession();
  const setUser = useStore((state) => state.setUser);
  const setIsOnboarded = useStore((state) => state.setIsOnboarded);
  const setTracking = useStore((state) => state.setTracking);
  const setAuthLoading = useStore((state) => state.setAuthLoading);

  useEffect(() => {
    console.warn('👤 Setting up auth state listener...');

    const loadUserData = async () => {
      if (status === 'loading') {
        setAuthLoading(true);
        return;
      }

      if (status === 'authenticated' && session?.user) {
        const uid = (session as any)?.user?.id || session.user.email;
        console.warn('✅ User authenticated:', {
          id: uid,
          email: session.user.email,
        });

    addBreadcrumb('Auth: User authenticated', { id: uid });
        clearDemoModeMarker();

        try {
          // Fetch user data from API
          const response = await fetch(`/api/users/${uid}`);

          if (response.ok) {
            const userData = await response.json();

            setUser({
              id: userData.id,
              language: userData.language || 'de',
              nickname: userData.nickname || '',
              gender: userData.gender || 'male',
              height: userData.height || 0,
              weight: userData.weight || 0,
              maxPushups: userData.maxPushups || 0,
              groupCode: userData.groupCode || '',
              photoURL: session.user.image || undefined,
              shareProfilePicture: true,
              createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
              pushupState: userData.pushupState || { baseReps: 0, sets: 5, restTime: 90 },
              enabledActivities: userData.enabledActivities || ['pushups', 'sports', 'water', 'protein'],
              birthday: userData.birthday,
            });

            setIsOnboarded(!!userData.birthday);
          } else if (response.status === 404) {
            // New user - set defaults
            setUser({
              id: uid!,
              language: 'de',
              nickname: session.user.name || session.user.email?.split('@')[0] || '',
              gender: 'male',
              height: 0,
              weight: 0,
              maxPushups: 0,
              groupCode: '',
              photoURL: session.user.image || undefined,
              shareProfilePicture: true,
              createdAt: new Date(),
              pushupState: { baseReps: 0, sets: 5, restTime: 90 },
              enabledActivities: ['pushups', 'sports', 'water', 'protein'],
            });
            setIsOnboarded(false);
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          addBreadcrumb('Auth: Failed to load user data', { error: String(error) }, 'error');
          captureException(error, { context: 'useAuth', userId: uid });
          setUser(null);
          setIsOnboarded(false);
        } finally {
          setAuthLoading(false);
        }
      } else {
        // Not authenticated
        if (isDemoModeActive()) {
          setAuthLoading(false);
          return;
        }

        setUser(null);
        setIsOnboarded(false);
        setTracking({});
        setAuthLoading(false);

        // Selective storage cleanup to avoid nuking unrelated app/browser data
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            if (k.startsWith('winterarc_') || k.startsWith('wa_') || k.startsWith('tracking_') || k.startsWith('nextauth.') || k.includes('session')) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
          const sessionKeysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (!k) continue;
            if (k.startsWith('winterarc_') || k.startsWith('wa_') || k.includes('session')) {
              sessionKeysToRemove.push(k);
            }
          }
          sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));
        } catch (e) {
          console.warn('Fehler beim selektiven Aufräumen der Session:', e);
        }
      }
    };

    loadUserData();
  }, [session, status, setUser, setIsOnboarded, setTracking, setAuthLoading]);
}

