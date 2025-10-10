import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FieldValue } from 'firebase/firestore';
import UnifiedTrainingCard from '../components/UnifiedTrainingCard';
import { useStore } from '../store/useStore';
import type { SportTracking } from '../types';
import type { DailyTrainingLoad, DailyCheckIn } from '../types/tracking';
import { computeDailyTrainingLoadV1 } from '../services/trainingLoad';
import { ToastProvider } from '../components/ui/ToastProvider';

const originalSelectedDate = useStore.getState().selectedDate;

const baseSports: SportTracking = {
  hiit: { active: false },
  cardio: { active: false },
  gym: { active: false },
  schwimmen: { active: false },
  soccer: { active: false },
  rest: { active: false },
};

describe('UnifiedTrainingCard', () => {
beforeEach(async () => {
  await act(async () => {
    const expectedLoad = computeDailyTrainingLoadV1({
      workouts: [{ durationMinutes: 60, intensity: 6 }],
      pushupsReps: 50,
      sleepScore: 8,
      recoveryScore: 7,
      sick: false,
    }).load;

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
      trainingLoad: {
        '2024-01-12': {
          date: '2024-01-12',
          load: expectedLoad,
          components: {
            baseFromWorkouts: 0,
            modifierSleep: 0,
            modifierRecovery: 0,
            modifierSick: 0,
          },
          inputs: {
            sleepScore: 8,
            recoveryScore: 7,
            sick: false,
          },
          createdAt: new Date('2024-01-12T12:00:00Z') as unknown as FieldValue,
          updatedAt: new Date('2024-01-12T12:00:00Z') as unknown as FieldValue,
          calcVersion: 'v1',
        } as DailyTrainingLoad,
      },
      checkIns: {
        '2024-01-12': {
          date: '2024-01-12',
          sleepScore: 8,
          recoveryScore: 7,
          sick: false,
          createdAt: new Date('2024-01-12T12:00:00Z') as unknown as FieldValue,
          updatedAt: new Date('2024-01-12T12:00:00Z') as unknown as FieldValue,
          source: 'manual',
        } as DailyCheckIn,
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
      trainingLoad: {},
      checkIns: {},
      smartContributions: {},
      selectedDate: originalSelectedDate,
    });
  });
});

  it('renders computed training load and metrics', async () => {
    await act(async () => {
      render(
        <ToastProvider>
          <UnifiedTrainingCard />
        </ToastProvider>
      );
    });

    const expectedLoad = computeDailyTrainingLoadV1({
      workouts: [{ durationMinutes: 60, intensity: 6 }],
      pushupsReps: 50,
      sleepScore: 8,
      recoveryScore: 7,
      sick: false,
    }).load;

    expect(screen.getByTestId('unified-training-card')).toBeInTheDocument();
    expect(screen.getByText('Training')).toBeInTheDocument();
    expect(screen.getByText(String(expectedLoad))).toBeInTheDocument();
  });

  it('shows fallback state when no data is present', async () => {
    await act(async () => {
      useStore.setState({ tracking: {} });
    });

    await act(async () => {
      render(
        <ToastProvider>
          <UnifiedTrainingCard />
        </ToastProvider>
      );
    });

    expect(screen.getByText('Training')).toBeInTheDocument();
  });
});
