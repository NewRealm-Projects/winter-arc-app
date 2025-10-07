﻿import { create } from 'zustand';
import { User, DailyTracking, BeforeInstallPromptEvent, SmartTrackingContribution } from '../types';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;

  authLoading: boolean;
  setAuthLoading: (loading: boolean) => void;

  tracking: Record<string, DailyTracking>;
  setTracking: (tracking: Record<string, DailyTracking>) => void;
  updateDayTracking: (date: string, data: Partial<DailyTracking>) => void;

  selectedDate: string;
  setSelectedDate: (date: string) => void;

  pwaInstallPrompt: BeforeInstallPromptEvent | null;
  setPwaInstallPrompt: (event: BeforeInstallPromptEvent | null) => void;

  groupCache: Record<string, { timestamp: number; data: unknown }>;
  setGroupCache: (key: string, payload: { data: unknown; timestamp?: number }) => void;
  clearGroupCache: () => void;

  darkMode: boolean;
  toggleDarkMode: () => void;

  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;

  smartContributions: Record<string, SmartTrackingContribution>;
  setSmartContributions: (value: Record<string, SmartTrackingContribution>) => void;
  leaderboardFilter: 'week' | 'month' | 'all';
  setLeaderboardFilter: (filter: 'week' | 'month' | 'all') => void;
}

const getTodayDate = (): string => new Date().toISOString().split('T')[0];

// Load dark mode preference from localStorage
const getInitialDarkMode = (): boolean => {
  try {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return JSON.parse(stored);
    }
    // Default to system preference if no stored value
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

// Load leaderboard filter preference from localStorage
const getInitialLeaderboardFilter = (): 'week' | 'month' | 'all' => {
  try {
    const stored = localStorage.getItem('leaderboardFilter');
    if (stored && (stored === 'week' || stored === 'month' || stored === 'all')) {
      return stored;
    }
    return 'month'; // Default to month view
  } catch {
    return 'month';
  }
};

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  authLoading: true,
  setAuthLoading: (loading) => set({ authLoading: loading }),

  tracking: {},
  setTracking: (tracking) => set({ tracking }),
  updateDayTracking: (date, data) =>
    set((state) => ({
      tracking: {
        ...state.tracking,
        [date]: {
          ...state.tracking[date],
          ...data,
        },
      },
    })),

  selectedDate: getTodayDate(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  pwaInstallPrompt: null,
  setPwaInstallPrompt: (event) => set({ pwaInstallPrompt: event }),

  groupCache: {},
  setGroupCache: (key, payload) =>
    set((state) => ({
      groupCache: {
        ...state.groupCache,
        [key]: {
          data: payload.data,
          timestamp: payload.timestamp ?? Date.now(),
        },
      },
    })),
  clearGroupCache: () => set({ groupCache: {} }),

  darkMode: getInitialDarkMode(),
  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.darkMode;
      try {
        localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      } catch (error) {
        console.error('Failed to save dark mode preference:', error);
      }
      return { darkMode: newDarkMode };
    }),

  isOnboarded: false,
  setIsOnboarded: (value) => set({ isOnboarded: value }),

  smartContributions: {},
  setSmartContributions: (value) => set({ smartContributions: value }),
  leaderboardFilter: getInitialLeaderboardFilter(),
  setLeaderboardFilter: (filter) => {
    try {
      localStorage.setItem('leaderboardFilter', filter);
    } catch (error) {
      console.error('Failed to save leaderboard filter preference:', error);
    }
    set({ leaderboardFilter: filter });
  },
}));
