import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '../useStore';
import type { BeforeInstallPromptEvent, DailyTracking, SportTracking } from '../../types';
import { normalizeSports } from '../../utils/sports';

const initialState = useStore.getState();

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState(initialState, true);
    localStorage.clear();
  });

  it('toggles dark mode and persists preference', () => {
    useStore.setState({ darkMode: false });

    useStore.getState().toggleDarkMode();

    expect(useStore.getState().darkMode).toBe(true);
    expect(localStorage.getItem('darkMode')).toBe('true');
  });

  it('updates tracking data while preserving existing fields', () => {
    const date = '2025-01-10';
    const trackingDay: DailyTracking = {
      date,
      sports: normalizeSports() as SportTracking,
      water: 500,
      protein: 40,
      completed: false,
    };

    useStore.setState({ tracking: { [date]: trackingDay } });

    useStore.getState().updateDayTracking(date, { water: 1500, completed: true });

    const updated = useStore.getState().tracking[date];
    expect(updated.water).toBe(1500);
    expect(updated.completed).toBe(true);
    expect(updated.protein).toBe(40);
  });

  it('stores group cache entries with timestamp fallback', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-02T12:00:00Z'));

    useStore.getState().setGroupCache('leaderboard', { data: { members: 3 } });

    const cacheEntry = useStore.getState().groupCache.leaderboard;
    expect(cacheEntry?.data).toEqual({ members: 3 });
    expect(cacheEntry?.timestamp).toBe(Date.now());

    vi.useRealTimers();
  });

  it('persists leaderboard filter preference', () => {
    useStore.getState().setLeaderboardFilter('week');

    expect(useStore.getState().leaderboardFilter).toBe('week');
    expect(localStorage.getItem('leaderboardFilter')).toBe('week');
  });

  it('updates user session flags and selected date', () => {
    const demoUser = {
      id: 'u-1',
      language: 'en' as const,
      nickname: 'Demo',
      gender: 'female' as const,
      height: 170,
      weight: 60,
      bodyFat: 20,
      maxPushups: 25,
      groupCode: 'grp',
      birthday: '1995-01-01',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      pushupState: { baseReps: 10, sets: 3, restTime: 60 },
    };

    useStore.getState().setUser(demoUser);
    useStore.getState().setIsOnboarded(true);
    useStore.getState().setSelectedDate('2025-03-15');

    expect(useStore.getState().user).toEqual(demoUser);
    expect(useStore.getState().isOnboarded).toBe(true);
    expect(useStore.getState().selectedDate).toBe('2025-03-15');
  });

  it('manages auth loading, PWA prompt, tracking and cache state', () => {
    const promptEvent = { prompt: vi.fn() } as unknown as BeforeInstallPromptEvent;
    const tracking: Record<string, DailyTracking> = {
      '2025-05-01': {
        date: '2025-05-01',
        sports: normalizeSports() as SportTracking,
        water: 0,
        protein: 0,
        completed: false,
      },
    };

    useStore.getState().setAuthLoading(false);
    useStore.getState().setPwaInstallPrompt(promptEvent);
    useStore.getState().setTracking(tracking);
    useStore.getState().setSmartContributions({ foo: { water: 100, protein: 20 } });
    useStore.getState().setGroupCache('stats', { data: { total: 1 }, timestamp: 123 });
    useStore.getState().clearGroupCache();

    expect(useStore.getState().authLoading).toBe(false);
    expect(useStore.getState().pwaInstallPrompt).toBe(promptEvent);
    expect(useStore.getState().tracking).toEqual(tracking);
    expect(useStore.getState().smartContributions.foo?.water).toBe(100);
    expect(useStore.getState().groupCache).toEqual({});
  });
});
