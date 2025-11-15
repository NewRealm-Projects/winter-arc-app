import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCarouselStats } from './useCarouselStats';
import * as useStoreModule from '../store/useStore';
import * as useWeekContextModule from '../contexts/WeekContext';
import * as useTranslationModule from './useTranslation';

// Mock dependencies
vi.mock('../store/useStore');
vi.mock('../contexts/WeekContext');
vi.mock('./useTranslation');
vi.mock('../utils/progress');
vi.mock('../utils/nutrition');
vi.mock('../utils/sports');

describe('useCarouselStats', () => {
  const mockTracking = {
    '2024-01-15': {
      date: '2024-01-15',
      sports: { running: { durationMin: 30, intensity: 'moderate' } },
      water: 2000,
      protein: 150,
      calories: 2200,
      pushups: { total: 50 },
      weight: { value: 75, bodyFat: 15 },
      completed: true,
    },
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    weight: 75,
    height: 180,
    bodyFat: 15,
    activityLevel: 'moderate' as const,
    waterGoal: 3000,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useStore
    vi.mocked(useStoreModule.useStore).mockImplementation((selector: any) => {
      const state = {
        tracking: mockTracking,
        user: mockUser,
      };
      return selector(state);
    });

    // Mock useWeekContext
    vi.mocked(useWeekContextModule.useWeekContext).mockReturnValue({
      selectedDate: '2024-01-15T00:00:00.000Z',
      setSelectedDate: vi.fn(),
      weekStart: new Date('2024-01-14'),
      weekEnd: new Date('2024-01-20'),
      goToPreviousWeek: vi.fn(),
      goToNextWeek: vi.fn(),
      goToToday: vi.fn(),
    });

    // Mock useTranslation
    vi.mocked(useTranslationModule.useTranslation).mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'common.completed': 'Completed',
          'common.notCompleted': 'Not completed',
          'tracking.total': 'total',
        };
        return translations[key] || key;
      },
      language: 'en',
    });
  });

  it('should return carousel stats array', () => {
    const { result } = renderHook(() => useCarouselStats());

    expect(result.current).toBeInstanceOf(Array);
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('should include sports stat', () => {
    const { result } = renderHook(() => useCarouselStats());

    const sportsStat = result.current.find((stat) => stat.id === 'sports');
    expect(sportsStat).toBeDefined();
    expect(sportsStat?.icon).toBe('🏃');
    expect(sportsStat?.value).toBe('Completed');
  });

  it('should include pushup stat', () => {
    const { result } = renderHook(() => useCarouselStats());

    const pushupStat = result.current.find((stat) => stat.id === 'pushup');
    expect(pushupStat).toBeDefined();
    expect(pushupStat?.icon).toBe('💪');
    expect(pushupStat?.value).toContain('50');
  });

  it('should include hydration stat', () => {
    const { result } = renderHook(() => useCarouselStats());

    const hydrationStat = result.current.find((stat) => stat.id === 'hydration');
    expect(hydrationStat).toBeDefined();
    expect(hydrationStat?.icon).toBe('💧');
  });

  it('should include nutrition stat', () => {
    const { result } = renderHook(() => useCarouselStats());

    const nutritionStat = result.current.find((stat) => stat.id === 'nutrition');
    expect(nutritionStat).toBeDefined();
    expect(nutritionStat?.icon).toBe('🥩');
  });

  it('should include weight stat', () => {
    const { result } = renderHook(() => useCarouselStats());

    const weightStat = result.current.find((stat) => stat.id === 'weight');
    expect(weightStat).toBeDefined();
    expect(weightStat?.icon).toBe('⚖️');
  });

  it('should handle missing tracking data', () => {
    vi.mocked(useStoreModule.useStore).mockImplementation((selector: any) => {
      const state = {
        tracking: {},
        user: mockUser,
      };
      return selector(state);
    });

    const { result } = renderHook(() => useCarouselStats());

    expect(result.current).toBeInstanceOf(Array);
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('should handle missing user data', () => {
    vi.mocked(useStoreModule.useStore).mockImplementation((selector: any) => {
      const state = {
        tracking: mockTracking,
        user: null,
      };
      return selector(state);
    });

    const { result } = renderHook(() => useCarouselStats());

    expect(result.current).toBeInstanceOf(Array);
  });

  it('should use correct colors for stats', () => {
    const { result } = renderHook(() => useCarouselStats());

    const sportsStat = result.current.find((stat) => stat.id === 'sports');
    expect(sportsStat?.color).toBe('#10B981');

    const pushupStat = result.current.find((stat) => stat.id === 'pushup');
    expect(pushupStat?.color).toBe('#3B82F6');

    const hydrationStat = result.current.find((stat) => stat.id === 'hydration');
    expect(hydrationStat?.color).toBe('#06B6D4');

    const nutritionStat = result.current.find((stat) => stat.id === 'nutrition');
    expect(nutritionStat?.color).toBe('#F59E0B');

    const weightStat = result.current.find((stat) => stat.id === 'weight');
    expect(weightStat?.color).toBe('#8B5CF6');
  });

  it('should show not completed for sports when no activity', () => {
    vi.mocked(useStoreModule.useStore).mockImplementation((selector: any) => {
      const state = {
        tracking: {
          '2024-01-15': {
            date: '2024-01-15',
            sports: {},
            water: 0,
            protein: 0,
            completed: false,
          },
        },
        user: mockUser,
      };
      return selector(state);
    });

    const { result } = renderHook(() => useCarouselStats());

    const sportsStat = result.current.find((stat) => stat.id === 'sports');
    expect(sportsStat?.value).toBe('Not completed');
  });

  it('should show 0 for pushups when none recorded', () => {
    vi.mocked(useStoreModule.useStore).mockImplementation((selector: any) => {
      const state = {
        tracking: {
          '2024-01-15': {
            date: '2024-01-15',
            sports: {},
            water: 0,
            protein: 0,
            completed: false,
          },
        },
        user: mockUser,
      };
      return selector(state);
    });

    const { result } = renderHook(() => useCarouselStats());

    const pushupStat = result.current.find((stat) => stat.id === 'pushup');
    expect(pushupStat?.value).toContain('0');
  });

  it('should recalculate when selectedDate changes', () => {
    const { rerender } = renderHook(() => useCarouselStats());

    // Change selected date
    vi.mocked(useWeekContextModule.useWeekContext).mockReturnValue({
      selectedDate: '2024-01-16T00:00:00.000Z',
      setSelectedDate: vi.fn(),
      weekStart: new Date('2024-01-14'),
      weekEnd: new Date('2024-01-20'),
      goToPreviousWeek: vi.fn(),
      goToNextWeek: vi.fn(),
      goToToday: vi.fn(),
    });

    rerender();

    // Should still return stats array
    const { result } = renderHook(() => useCarouselStats());
    expect(result.current).toBeInstanceOf(Array);
  });

  it('should handle different date formats in selectedDate', () => {
    vi.mocked(useWeekContextModule.useWeekContext).mockReturnValue({
      selectedDate: '2024-01-15',
      setSelectedDate: vi.fn(),
      weekStart: new Date('2024-01-14'),
      weekEnd: new Date('2024-01-20'),
      goToPreviousWeek: vi.fn(),
      goToNextWeek: vi.fn(),
      goToToday: vi.fn(),
    });

    const { result } = renderHook(() => useCarouselStats());

    expect(result.current).toBeInstanceOf(Array);
    expect(result.current.length).toBeGreaterThan(0);
  });
});