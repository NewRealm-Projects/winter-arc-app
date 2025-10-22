import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import HydrationTile from '../components/HydrationTile';
import ProteinTile from '../components/ProteinTile';
import { useStore } from '../store/useStore';
import type { SportTracking } from '../types';

const originalSelectedDate = useStore.getState().selectedDate;

describe('Hydration and Protein tiles', () => {
  beforeEach(() => {
    useStore.setState({
      user: {
        id: 'user-tiles',
        language: 'en',
        nickname: 'Tiles',
        gender: 'male',
        height: 180,
        weight: 0,
        hydrationGoalLiters: 0,
        proteinGoalGrams: 0,
        maxPushups: 10,
        groupCode: 'grp',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        pushupState: { baseReps: 5, sets: 3, restTime: 60 },
        enabledActivities: ['water', 'protein'],
      },
      selectedDate: '2024-01-10',
      tracking: {
        '2024-01-10': {
          date: '2024-01-10',
          sports: {} as SportTracking,
          water: Number.NaN,
          protein: Number.NaN,
          completed: false,
        },
      },
      smartContributions: {},
    });
  });

  afterEach(() => {
    useStore.setState({
      user: null,
      tracking: {},
      smartContributions: {},
      selectedDate: originalSelectedDate,
    });
  });

  it('renders graceful fallbacks without NaN output', async () => {
    let water: ReturnType<typeof render> | undefined;
    let protein: ReturnType<typeof render> | undefined;

    await act(async () => {
      water = render(<HydrationTile />);
      protein = render(<ProteinTile />);
    });

    await act(async () => {});

    expect(water?.container.textContent).not.toContain('NaN');
    expect(protein?.container.textContent).not.toContain('NaN');
    expect(protein?.container.textContent).toContain('Set your goal');
  });
});
