import { renderWithProviders, screen, waitFor, fireEvent } from 'test/test-utils';
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

vi.mock('../../components/dashboard/WeekCirclesCard', () => ({
  default: () => <div data-testid="week-circles-card" />,
}));

vi.mock('../../components/dashboard/WeatherCard', () => ({
  default: ({ location, loading }: { location?: string; loading?: boolean }) => (
    <div data-testid="weather-card">{loading ? 'Loading' : location ?? 'Aachen'}</div>
  ),
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

const weatherResponse = {
  temperature: 11,
  weatherCode: 2,
  weatherEmoji: '⛅',
  weatherDescription: 'Partly cloudy',
};

vi.mock('../../services/weatherService', () => ({
  getWeatherForAachen: vi.fn(async () => weatherResponse),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.selectedDate = today;
  });

  it('renders key dashboard widgets and hydration tile', async () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();

    await waitFor(() => {
      const weatherCards = screen.getAllByTestId('weather-card');
      const renderedCard = weatherCards[weatherCards.length - 1];
      expect(renderedCard).toHaveTextContent('Aachen');
    });

    expect(screen.getByTestId('training-load-tile')).toBeInTheDocument();
    expect(screen.getByTestId('header-summary-card')).toBeInTheDocument();
    expect(screen.getByTestId('header-streak-value')).toHaveTextContent('2');
  });

  it('falls back to default weather state on failure', async () => {
    const { getWeatherForAachen } = await import('../../services/weatherService');
    vi.mocked(getWeatherForAachen).mockRejectedValueOnce(new Error('offline'));

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      const weatherCards = screen.getAllByTestId('weather-card');
      const renderedCard = weatherCards[weatherCards.length - 1];
      expect(renderedCard).toBeInTheDocument();
    });

    expect(getWeatherForAachen).toHaveBeenCalled();
  });

  it('opens check-in modal from header button', async () => {
    renderWithProviders(<DashboardPage />);

    const button = await screen.findByRole('button', { name: /check-in/i });
    fireEvent.click(button);

    expect(screen.getByTestId('check-in-modal')).toBeInTheDocument();
  });
});
