import { renderWithProviders, screen, waitFor } from 'test/test-utils';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('../../components/dashboard/WeatherCard', () => ({
  default: ({ location, loading }: { location?: string; loading?: boolean }) => (
    <div data-testid="weather-card">{loading ? 'Loading' : location ?? 'Aachen'}</div>
  ),
}));

vi.mock('../../components/TrainingLoadTile', () => ({
  default: () => <div data-testid="training-load-tile" />,
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

const mockCombinedTracking: Record<string, { completed: boolean }> = {
  '2025-01-01': { completed: true },
  '2025-01-02': { completed: true },
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
});
