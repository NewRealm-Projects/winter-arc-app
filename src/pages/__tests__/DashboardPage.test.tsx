import { renderWithProviders, screen, fireEvent } from 'test/test-utils';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { todayKey } from '../../lib/date';

const today = todayKey();
const yesterdayDate = new Date(today);
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const yesterday = yesterdayDate.toISOString().split('T')[0];

const storeState = {
  user: {
    enabledActivities: ['pushups', 'sports', 'water', 'protein'] as const,
  },
  tracking: {} as Record<string, unknown>,
  checkIns: {} as Record<string, unknown>,
  trainingLoad: {} as Record<string, unknown>,
  smartContributions: {} as Record<string, unknown>,
  setCheckInForDate: vi.fn(),
  setTrainingLoadForDate: vi.fn(),
  selectedDate: today,
  setSelectedDate: vi.fn((date: string) => {
    storeState.selectedDate = date;
  }),
};

vi.mock('../../components/PushupTile', () => ({
  default: () => <div data-testid="pushup-tile" />,
}));

vi.mock('../../components/SportTile', () => ({
  default: () => <div data-testid="sport-tile" />,
}));

vi.mock('../../components/WaterTile', () => ({
  default: () => <div data-testid="water-tile" />,
}));

vi.mock('../../components/ProteinTile', () => ({
  default: () => <div data-testid="protein-tile" />,
}));

vi.mock('../../components/WeightTile', () => ({
  default: () => <div data-testid="weight-tile" />,
}));

vi.mock('../../components/dashboard/WeekCompactCard', () => ({
  default: () => <div data-testid="week-compact-card" />,
}));

vi.mock('../../components/TrainingLoadTile', () => ({
  default: () => <div data-testid="training-load-tile" />,
}));

vi.mock('../../components/checkin/CheckInModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="check-in-modal">open</div> : null,
}));

let DashboardPage: typeof import('../DashboardPage').default;

beforeAll(async () => {
  DashboardPage = (await import('../DashboardPage')).default;
});

vi.mock('../../hooks/useTracking', () => ({
  useTracking: vi.fn(),
}));

vi.mock('../../hooks/useWeeklyTop3', () => ({
  useWeeklyTop3: vi.fn(),
}));

const mockCombinedTracking: Record<string, Record<string, unknown>> = {
  [today]: {
    pushups: { total: 50 },
    sports: { hiit: { active: true } },
    water: 2500,
    protein: 120,
    weight: { value: 80 },
  },
  [yesterday]: {
    pushups: { total: 30 },
    sports: { hiit: { active: true } },
    water: 2000,
    protein: 110,
    weight: { value: 80 },
  },
};

vi.mock('../../hooks/useCombinedTracking', () => ({
  useCombinedTracking: vi.fn(() => mockCombinedTracking),
  useCombinedDailyTracking: vi.fn((dateKey?: string) =>
    dateKey ? mockCombinedTracking[dateKey] : undefined
  ),
}));

vi.mock('../../store/useStore', () => ({
  useStore: (selector: (state: typeof storeState) => unknown) => selector(storeState),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.selectedDate = today;
  });

  it('renders key dashboard widgets and layout spacing', async () => {
    renderWithProviders(<DashboardPage />);

    const layout = await screen.findByTestId('dashboard-content-sections');
    expect(layout).toHaveClass('flex');
    expect(layout).toHaveClass('flex-col');
    expect(layout.className).toContain('gap-3');
    expect(layout.className).toContain('md:gap-4');

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('week-compact-card')).toBeInTheDocument();
    expect(screen.getByTestId('training-load-tile')).toBeInTheDocument();
    expect(screen.getByTestId('header-summary-card')).toBeInTheDocument();
    expect(screen.getByTestId('header-streak-value')).toHaveTextContent('2');
  });

  it('opens check-in modal from header button', async () => {
    renderWithProviders(<DashboardPage />);

    const button = await screen.findByRole('button', { name: /check-in/i });
    fireEvent.click(button);

    expect(screen.getByTestId('check-in-modal')).toBeInTheDocument();
  });
});
