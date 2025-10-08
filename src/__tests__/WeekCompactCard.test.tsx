import { act, render } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import WeekCompactCard from '../components/dashboard/WeekCompactCard';
import { WeekProvider } from '../contexts/WeekContext';
import { useStore } from '../store/useStore';
import type { SportTracking } from '../types';
import { MemoryRouter } from 'react-router-dom';

const originalSelectedDate = useStore.getState().selectedDate;

describe('WeekCompactCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-10T08:00:00Z'));

    useStore.setState({
      user: {
        id: 'user-1',
        language: 'en',
        nickname: 'Tester',
        gender: 'male',
        height: 180,
        weight: 80,
        hydrationGoalLiters: 2.5,
        proteinGoalGrams: 150,
        maxPushups: 20,
        groupCode: 'grp',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        pushupState: { baseReps: 10, sets: 3, restTime: 60 },
        enabledActivities: ['water', 'protein', 'sports', 'pushups'],
      },
      selectedDate: '2024-01-10',
      tracking: {
        '2024-01-08': {
          date: '2024-01-08',
          sports: {} as SportTracking,
          water: 2600,
          protein: 150,
          completed: false,
        },
        '2024-01-09': {
          date: '2024-01-09',
          sports: {} as SportTracking,
          water: 1800,
          protein: 120,
          completed: false,
        },
        '2024-01-10': {
          date: '2024-01-10',
          sports: {} as SportTracking,
          water: 2500,
          protein: 140,
          pushups: { total: 30 },
          completed: false,
        },
      },
      smartContributions: {},
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    useStore.setState({
      user: null,
      tracking: {},
      smartContributions: {},
      selectedDate: originalSelectedDate,
    });
  });

  it('renders the week overview without NaN values', async () => {
    let rendered: ReturnType<typeof render> | undefined;

    await act(async () => {
      rendered = render(
        <MemoryRouter>
          <WeekProvider>
            <WeekCompactCard />
          </WeekProvider>
        </MemoryRouter>
      );
    });

    await act(async () => {});

    const { container } = rendered!;
    const dayButtons = container.querySelectorAll('button[aria-pressed]');
    expect(dayButtons.length).toBe(7);
    expect(container).toMatchSnapshot();
    expect(container.textContent).not.toContain('NaN');
    expect(dayButtons[0]?.getAttribute('aria-label')).toContain('2.6/2.5');
  });
});
