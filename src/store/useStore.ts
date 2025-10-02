import { create } from 'zustand';
import { User, DailyTracking } from '../types';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;

  tracking: Record<string, DailyTracking>;
  setTracking: (tracking: Record<string, DailyTracking>) => void;
  updateDayTracking: (date: string, data: Partial<DailyTracking>) => void;

  darkMode: boolean;
  toggleDarkMode: () => void;

  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
}

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

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

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
}));
