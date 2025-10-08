import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import WeekCirclesCard from '../WeekCirclesCard';
import { WeekProvider } from '../../../contexts/WeekContext';
import { useStore } from '../../../store/useStore';
import type { SportTracking } from '../../../types';

vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

const originalState = useStore.getState();

describe('WeekCirclesCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-10T08:00:00Z'));

    useStore.setState({
      ...originalState,
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
        '2024-01-03': {
          date: '2024-01-03',
          sports: {} as SportTracking,
          water: 2000,
          protein: 120,
          completed: false,
        },
        '2024-01-04': {
          date: '2024-01-04',
          sports: {} as SportTracking,
          water: 1000,
          protein: 80,
          completed: false,
        },
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
    useStore.setState(originalState, true);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <WeekProvider>
          <WeekCirclesCard />
        </WeekProvider>
      </MemoryRouter>
    );

  it('renders seven day circles with expected labels and selection state', async () => {
    const { container } = renderComponent();

    await act(async () => {});

    const dayButtons = container.querySelectorAll('button[aria-pressed]');
    expect(dayButtons).toHaveLength(7);

    const labelTexts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (const label of labelTexts) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    const selected = Array.from(dayButtons).find(
      (button) => button.getAttribute('aria-pressed') === 'true'
    );
    expect(selected?.getAttribute('aria-label')).toMatch(/Wednesday/i);
  });

  it('clamps navigation to avoid future weeks', async () => {
    const { container } = renderComponent();

    await act(async () => {});

    const initialLabel =
      container
        .querySelector('button[aria-pressed="true"]')
        ?.getAttribute('aria-label') ?? '';

    expect(initialLabel).not.toEqual('');

    const nextButton = screen.getByRole('button', {
      name: 'dashboard.nextWeek',
    });
    const previousButton = screen.getByRole('button', {
      name: 'dashboard.previousWeek',
    });

    expect(nextButton).toBeDisabled();

    await act(async () => {
      fireEvent.click(previousButton);
    });
    expect(nextButton).not.toBeDisabled();

    const previousWeekLabel = container
      .querySelector('button[aria-pressed="true"]')
      ?.getAttribute('aria-label');

    expect(previousWeekLabel).not.toBe(initialLabel);

    await act(async () => {
      fireEvent.click(nextButton);
    });
    expect(nextButton).toBeDisabled();

    const returnedLabel = container
      .querySelector('button[aria-pressed="true"]')
      ?.getAttribute('aria-label');

    expect(returnedLabel).toBe(initialLabel);

    await act(async () => {
      fireEvent.click(nextButton);
    });
    expect(
      container
        .querySelector('button[aria-pressed="true"]')
        ?.getAttribute('aria-label')
    ).toBe(initialLabel);
  });
});
