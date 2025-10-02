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

  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

  isOnboarded: false,
  setIsOnboarded: (value) => set({ isOnboarded: value }),
}));
