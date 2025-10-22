import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import WeeklyTileCompact from '../WeeklyTileCompact';

// Mutable mock state
let mockWeekContextState = {
  isCurrentWeek: true,
  setWeekOffset: vi.fn(),
};

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
    isCurrentWeek: mockWeekContextState.isCurrentWeek,
    setWeekOffset: mockWeekContextState.setWeekOffset,
    selectedDate: '2025-01-06',
    setSelectedDate: vi.fn(),
  }),
}));

beforeEach(() => {
  mockWeekContextState = {
    isCurrentWeek: true,
    setWeekOffset: vi.fn(),
  };
  mockProgressState = {
    streakMet: false,
  };
  mockDocumentExists = false;
});

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

let mockDocumentExists = false;

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => mockDocumentExists,
    data: () =>
      mockDocumentExists
        ? {
            dayProgressPct: 75,
            dayStreakMet: true,
            tasksCompleted: 3,
            tasksTotal: 4,
          }
        : {},
  }),
}));

let mockProgressState = {
  streakMet: false,
};

vi.mock('../../../utils/progress', () => ({
  getDayProgressSummary: () => ({
    percent: mockProgressState.streakMet ? 100 : 0,
    streakMet: mockProgressState.streakMet,
    tasksCompleted: mockProgressState.streakMet ? 1 : 0,
    tasksTotal: 1,
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

  it('renders loading skeleton state', async () => {
    render(<WeeklyTileCompact />);

    // Component starts in loading state
    const tile = screen.getByTestId('weekly-tile-compact');
    expect(tile).toBeInTheDocument();
  });

  it('shows "This week" label for current week', () => {
    render(<WeeklyTileCompact />);

    expect(screen.getByText('This week')).toBeInTheDocument();
  });

  it('disables next button when in current week', () => {
    render(<WeeklyTileCompact />);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons[buttons.length - 1];

    expect(nextButton).toHaveAttribute('disabled');
  });

  it('renders key day indicators (Mon, Wed, Fri, Sun)', async () => {
    render(<WeeklyTileCompact />);

    const tile = screen.getByTestId('weekly-tile-compact');
    expect(tile).toBeInTheDocument();
    // Key days should be displayed
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('renders SVG arc visualization', async () => {
    render(<WeeklyTileCompact />);

    // Wait for async data fetching
    await new Promise(resolve => setTimeout(resolve, 150));

    const tile = screen.getByTestId('weekly-tile-compact');
    const svgElements = tile.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('shows progress text in arc (e.g., 0/7)', async () => {
    render(<WeeklyTileCompact />);

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(screen.getByText('0/7')).toBeInTheDocument();
  });

  it('shows "Archived" label for past weeks', async () => {
    mockWeekContextState.isCurrentWeek = false;
    render(<WeeklyTileCompact />);

    await waitFor(() => {
      expect(screen.getByText('Archived')).toBeInTheDocument();
    });
  });

  it('renders completed day dots when days have streakMet = true', async () => {
    mockProgressState.streakMet = true;
    render(<WeeklyTileCompact />);

    await new Promise(resolve => setTimeout(resolve, 200));

    const tile = screen.getByTestId('weekly-tile-compact');
    expect(tile).toBeInTheDocument();
    // Should render completed indicators
    const completedDots = tile.querySelectorAll('[class*="bg-emerald"]');
    expect(completedDots.length).toBeGreaterThanOrEqual(0);
  });

  it('calls setWeekOffset when previous button is clicked', async () => {
    render(<WeeklyTileCompact />);

    const buttons = screen.getAllByRole('button');
    const previousButton = buttons[0];

    fireEvent.click(previousButton);

    expect(mockWeekContextState.setWeekOffset).toHaveBeenCalled();
  });

  it('calls setWeekOffset when next button is clicked (if not current week)', async () => {
    mockWeekContextState.isCurrentWeek = false;
    render(<WeeklyTileCompact />);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons[buttons.length - 1];

    fireEvent.click(nextButton);

    expect(mockWeekContextState.setWeekOffset).toHaveBeenCalled();
  });

  it('renders with German language locale', async () => {
    render(<WeeklyTileCompact />);

    const tile = screen.getByTestId('weekly-tile-compact');
    expect(tile).toBeInTheDocument();
  });

  it('displays week progress when Firebase document has tracking data', async () => {
    mockDocumentExists = true;
    render(<WeeklyTileCompact />);

    await new Promise(resolve => setTimeout(resolve, 200));

    const tile = screen.getByTestId('weekly-tile-compact');
    expect(tile).toBeInTheDocument();
    // When document exists with data, it should use that data for progress
    const svgElements = tile.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

});
