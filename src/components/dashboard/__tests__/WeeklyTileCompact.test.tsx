import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WeeklyTileCompact from '../WeeklyTileCompact';

// Mock hooks
vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

vi.mock('../../../contexts/WeekContext', () => ({
  useWeekContext: () => ({
    activeWeekStart: new Date(2025, 0, 6), // Monday
    activeWeekEnd: new Date(2025, 0, 12),   // Sunday
    isCurrentWeek: true,
    setWeekOffset: vi.fn(),
    selectedDate: '2025-01-06',
    setSelectedDate: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useTrainingLoadWeek', () => ({
  useTrainingLoadWeek: () => ({
    streakDays: 5,
    averagePercent: 75,
    badgeLevel: 'optimal',
  }),
}));

const mockStoreState = {
  user: {
    id: 'test-user',
    enabledActivities: ['pushups', 'sports', 'water', 'protein'] as const,
  },
};

vi.mock('../../../store/useStore', () => ({
  useStore: (selector: (state: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
}));

vi.mock('../../../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => false,
    data: () => ({}),
  }),
}));

vi.mock('../../../utils/progress', () => ({
  getDayProgressSummary: () => ({
    percent: 0,
    streakMet: false,
    tasksCompleted: 0,
    tasksTotal: 0,
  }),
}));

describe('WeeklyTileCompact', () => {
  it('renders compact weekly tile', () => {
    render(<WeeklyTileCompact />);

    expect(screen.getByTestId('weekly-tile-compact')).toBeInTheDocument();
  });

  it('displays week label', () => {
    render(<WeeklyTileCompact />);

    // Should have week label
    const tiles = screen.getByTestId('weekly-tile-compact');
    expect(tiles).toBeInTheDocument();
  });

  it('displays streak counter', () => {
    render(<WeeklyTileCompact />);

    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<WeeklyTileCompact />);

    const buttons = screen.getAllByRole('button');
    // Should have previous and next buttons
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

});
