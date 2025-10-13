import { renderWithProviders, screen } from 'test/test-utils';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { todayKey } from '../../lib/date';
import type { TrackingListenerError } from '../../hooks/useTrackingEntries';

const today = todayKey();
const yesterdayDate = new Date(today);
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const yesterday = yesterdayDate.toISOString().split('T')[0];

const storeState = {
  user: {
    enabledActivities: ['pushups', 'sports', 'water', 'protein'] as Array<'pushups' | 'sports' | 'water' | 'protein'>,
  },
  tracking: {} as Record<string, unknown>,
  checkIns: {} as Record<string, unknown>,
  trainingLoad: {} as Record<string, unknown>,
  smartContributions: {} as Record<string, unknown>,
  setTracking: vi.fn(),
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

vi.mock('../../components/WaterTile', () => ({
  default: () => <div data-testid="water-tile" />,
}));

vi.mock('../../components/NutritionTile', () => ({
  default: () => <div data-testid="nutrition-tile" />,
}));

vi.mock('../../components/WeightTile', () => ({
  default: () => <div data-testid="weight-tile" />,
}));

vi.mock('../../components/dashboard/WeeklyTile', () => ({
  default: () => <div data-testid="weekly-tile" />,
}));

vi.mock('../../components/UnifiedTrainingCard', () => ({
  default: () => <div data-testid="training-load-tile" />,
}));


let DashboardPage: typeof import('../DashboardPage').default;

beforeAll(async () => {
  DashboardPage = (await import('../DashboardPage')).default;
}, 30000); // Increase timeout to 30s

vi.mock('../../hooks/useTracking', () => ({
  useTracking: vi.fn(),
}));

vi.mock('../../hooks/useWeeklyTop3', () => ({
  useWeeklyTop3: vi.fn(),
}));

const mockUseTrackingEntries = vi.fn().mockReturnValue({
  data: {},
  loading: false,
  error: null as TrackingListenerError | null,
  retry: vi.fn(),
});

vi.mock('../../hooks/useTrackingEntries', () => ({
  useTrackingEntries: () => mockUseTrackingEntries(),
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
    mockUseTrackingEntries.mockReturnValue({
      data: {},
      loading: false,
      error: null,
      retry: vi.fn(),
    });
  });

  it('renders key dashboard widgets and layout spacing', async () => {
    renderWithProviders(<DashboardPage />);

    const layout = await screen.findByTestId('dashboard-content-sections');
    expect(layout).toHaveClass('flex');
    expect(layout).toHaveClass('flex-col');
    expect(layout.className).toContain('gap-3');
    expect(layout.className).toContain('md:gap-4');

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-tile')).toBeInTheDocument();
    expect(screen.getByTestId('training-load-tile')).toBeInTheDocument();
  });

  it('displays error banner when tracking data fails to load', async () => {
    const retryMock = vi.fn();
    mockUseTrackingEntries.mockReturnValue({
      data: {},
      loading: false,
      error: 'unavailable' as TrackingListenerError,
      retry: retryMock,
    });

    renderWithProviders(<DashboardPage />);

    const errorBanner = await screen.findByText(/nicht erreichbar/i);
    expect(errorBanner).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /erneut/i });
    expect(retryButton).toBeInTheDocument();
    retryButton.click();
    expect(retryMock).toHaveBeenCalledOnce();
  });

  it('displays permission denied message for no-permission error', async () => {
    mockUseTrackingEntries.mockReturnValue({
      data: {},
      loading: false,
      error: 'no-permission' as TrackingListenerError,
      retry: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);

    const errorBanner = await screen.findByText(/keine berechtigung/i);
    expect(errorBanner).toBeInTheDocument();
  });

  it('renders tiles based on enabledActivities configuration', async () => {
    storeState.user.enabledActivities = ['pushups', 'water'];

    renderWithProviders(<DashboardPage />);

    expect(screen.getByTestId('pushup-tile')).toBeInTheDocument();
    expect(screen.getByTestId('water-tile')).toBeInTheDocument();
    expect(screen.queryByTestId('nutrition-tile')).not.toBeInTheDocument();
    // Note: UnifiedTrainingCard is always rendered regardless of enabledActivities
    expect(screen.getByTestId('training-load-tile')).toBeInTheDocument();
  });

  it('renders all tiles when all activities are enabled', async () => {
    storeState.user.enabledActivities = ['pushups', 'sports', 'water', 'protein'];

    renderWithProviders(<DashboardPage />);

    expect(screen.getByTestId('pushup-tile')).toBeInTheDocument();
    expect(screen.getByTestId('water-tile')).toBeInTheDocument();
    expect(screen.getByTestId('nutrition-tile')).toBeInTheDocument();
    expect(screen.getByTestId('weight-tile')).toBeInTheDocument();
    // Note: SportTile was merged into UnifiedTrainingCard (training-load-tile)
    expect(screen.getByTestId('training-load-tile')).toBeInTheDocument();
  });

  it('does not display error banner when no tracking error occurs', async () => {
    mockUseTrackingEntries.mockReturnValue({
      data: {},
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);

    const errorBanner = screen.queryByText(/nicht erreichbar/i);
    expect(errorBanner).not.toBeInTheDocument();
  });
});
