import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import TrainingLoadTile from '../components/TrainingLoadTile';
import { useStore } from '../store/useStore';
import type { SportTracking } from '../types';

const originalSelectedDate = useStore.getState().selectedDate;

const baseSports: SportTracking = {
  hiit: { active: false },
  cardio: { active: false },
  gym: { active: false },
  schwimmen: { active: false },
  soccer: { active: false },
  rest: { active: false },
};

describe('TrainingLoadTile', () => {
beforeEach(async () => {
  await act(async () => {
    useStore.setState({
      user: {
        id: 'training-load-user',
        language: 'en',
        nickname: 'Loady',
        gender: 'male',
        height: 180,
        weight: 80,
        hydrationGoalLiters: 2,
        proteinGoalGrams: 120,
        maxPushups: 30,
        groupCode: 'grp',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        pushupState: { baseReps: 10, sets: 3, restTime: 60 },
        enabledActivities: ['pushups', 'sports'],
      },
      selectedDate: '2024-01-12',
      tracking: {
        '2024-01-12': {
          date: '2024-01-12',
          sports: {
            ...baseSports,
            cardio: { active: true, duration: 60, intensity: 6 },
          },
          pushups: {
            total: 50,
          },
          water: 0,
          protein: 0,
          completed: false,
          recovery: {
            sleepQuality: 8,
            recovery: 7,
            illness: false,
          },
        },
      },
      smartContributions: {},
    });
  });
});

afterEach(async () => {
  await act(async () => {
    useStore.setState({
      user: null,
      tracking: {},
      smartContributions: {},
      selectedDate: originalSelectedDate,
    });
  });
});

  it('renders computed training load and metrics', async () => {
    await act(async () => {
      render(<TrainingLoadTile />);
    });

    expect(screen.getByTestId('training-load-tile')).toBeInTheDocument();
    expect(screen.getByText('Training Load')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByTestId('training-load-sleep-value').textContent).toContain('8');
    expect(screen.queryByTestId('training-load-pushups-value')).toBeNull();
  });

  it('shows fallback state when no data is present', async () => {
    await act(async () => {
      useStore.setState({ tracking: {} });
    });

    await act(async () => {
      render(<TrainingLoadTile />);
    });

    expect(screen.getByText('Training Load')).toBeInTheDocument();
    expect(screen.getByText('No data yet')).toBeInTheDocument();
  });
});
