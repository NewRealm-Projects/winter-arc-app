'use client';

import { useEffect } from 'react';
import { useUser } from '@stackframe/stack';
import { useStore } from '../store/useStore';
import { clearDemoModeMarker, isDemoModeActive } from '../constants/demo';
import { addBreadcrumb, captureException } from '../services/sentryService';

export function useAuth() {
  const user = useUser();
  const setUser = useStore((state) => state.setUser);
  const setIsOnboarded = useStore((state) => state.setIsOnboarded);
  const setTracking = useStore((state) => state.setTracking);
  const setAuthLoading = useStore((state) => state.setAuthLoading);

  useEffect(() => {
    console.warn('Setting up auth state listener...');

    const loadUserData = async () => {
      // Stack Auth user object is null when not authenticated, undefined when loading
      if (user === undefined) {
        setAuthLoading(true);
        return;
      }

      if (user) {
        console.warn('User authenticated:', {
          id: user.id,
          email: user.primaryEmail,
        });

        addBreadcrumb('Auth: User authenticated', { id: user.id });
        clearDemoModeMarker();

        try {
          // Fetch user data from API
          const response = await fetch(`/api/users/${user.id}`);

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
              photoURL: user.profileImageUrl || undefined,
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
              id: user.id,
              language: 'de',
              nickname: user.displayName || user.primaryEmail?.split('@')[0] || '',
              gender: 'male',
              height: 0,
              weight: 0,
              maxPushups: 0,
              groupCode: '',
              photoURL: user.profileImageUrl || undefined,
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
          captureException(error, { context: 'useAuth', userId: user.id });
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

        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.warn('Fehler beim Aufräumen der Session:', e);
        }
      }
    };

    loadUserData();
  }, [user, setUser, setIsOnboarded, setTracking, setAuthLoading]);
}
