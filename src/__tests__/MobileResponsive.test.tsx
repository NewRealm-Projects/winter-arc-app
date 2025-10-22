import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import InputPage from '../pages/InputPage';

// Mock all dependencies
vi.mock('../components/PushupTile', () => ({
  default: () => <div data-testid="pushup-tile" />,
}));

vi.mock('../components/HydrationTile', () => ({
  default: () => <div data-testid="water-tile" />,
}));

vi.mock('../components/NutritionTile', () => ({
  default: () => <div data-testid="nutrition-tile" />,
}));

vi.mock('../components/WeightTile', () => ({
  default: () => <div data-testid="weight-tile" />,
}));

vi.mock('../components/dashboard/WeeklyTile', () => ({
  default: () => <div data-testid="weekly-tile" />,
}));

vi.mock('../components/dashboard/WeeklyTileCompact', () => ({
  default: () => <div data-testid="weekly-tile-compact" />,
}));

vi.mock('../components/UnifiedTrainingCard', () => ({
  default: () => <div data-testid="training-load-tile" />,
}));

vi.mock('../components/dashboard/TrainingCardCompact', () => ({
  default: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} data-testid="training-card-compact">
      Training Compact
    </button>
  ),
}));

vi.mock('../components/dashboard/TrainingCardModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="training-card-modal">Training Modal</div> : null,
}));

vi.mock('../components/notes/QuickLogPanel', () => ({
  default: () => <div data-testid="quick-log-panel" />,
}));

vi.mock('../components/input/QuickActionButtons', () => ({
  default: () => <div data-testid="quick-action-buttons" />,
}));

vi.mock('../components/input/ActivityFeed', () => ({
  default: () => <div data-testid="activity-feed" />,
}));

vi.mock('../components/notes/CustomNoteModal', () => ({
  default: () => <div data-testid="custom-note-modal" />,
}));

vi.mock('../hooks/useTracking', () => ({
  useTracking: vi.fn(),
}));

vi.mock('../hooks/useWeeklyTop3', () => ({
  useWeeklyTop3: vi.fn(),
}));

vi.mock('../hooks/useTrackingEntries', () => ({
  useTrackingEntries: () => ({
    data: {},
    loading: false,
    error: null,
    retry: vi.fn(),
  }),
}));

vi.mock('../hooks/useCombinedTracking', () => ({
  useCombinedTracking: () => ({}),
  useCombinedDailyTracking: () => undefined,
}));

interface MockStoreState {
  user: {
    id: string;
    enabledActivities: Array<'pushups' | 'sports' | 'water' | 'protein'>;
  };
  tracking: Record<string, unknown>;
  checkIns: Record<string, unknown>;
  trainingLoad: Record<string, unknown>;
  selectedDate: string;
  setSelectedDate: () => void;
}

vi.mock('../store/useStore', () => ({
  useStore: <T,>(selector: (state: MockStoreState) => T): T =>
    selector({
      user: {
        id: 'test-user',
        enabledActivities: ['pushups', 'sports', 'water', 'protein'],
      },
      tracking: {},
      checkIns: {},
      trainingLoad: {},
      selectedDate: '2025-01-06',
      setSelectedDate: vi.fn(),
    }),
}));

vi.mock('../store/noteStore', () => ({
  noteStore: {
    list: vi.fn().mockResolvedValue({ notes: [], hasMore: false }),
    subscribe: vi.fn(() => vi.fn()),
    syncFromRemote: vi.fn(),
  },
}));

describe('Mobile Responsive Behavior', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
  });

  const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  describe('DashboardPage - Mobile vs Desktop', () => {
    it('renders mobile layout at 375px viewport', async () => {
      setViewportWidth(375);
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      // Wait for components to render
      await vi.waitUntil(() => screen.queryByTestId('weekly-tile-compact'), {
        timeout: 5000,
      }).catch(() => {});

      // Should render compact components
      expect(screen.queryByTestId('weekly-tile-compact')).toBeInTheDocument();
      expect(screen.queryByTestId('training-card-compact')).toBeInTheDocument();
    });

    it('renders desktop layout at 481px viewport', async () => {
      setViewportWidth(481);
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      // Wait for components to render
      await vi.waitUntil(() => screen.queryByTestId('weekly-tile'), {
        timeout: 5000,
      }).catch(() => {});

      // Should render desktop components
      expect(screen.queryByTestId('weekly-tile')).toBeInTheDocument();
      expect(screen.queryByTestId('training-load-tile')).toBeInTheDocument();
    });

    it('renders desktop layout at 768px viewport', async () => {
      setViewportWidth(768);
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      // Wait for components to render
      await vi.waitUntil(() => screen.queryByTestId('weekly-tile'), {
        timeout: 5000,
      }).catch(() => {});

      // Should render desktop components
      expect(screen.queryByTestId('weekly-tile')).toBeInTheDocument();
    });

    it('renders desktop layout at 1920px viewport', async () => {
      setViewportWidth(1920);
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      // Wait for components to render
      await vi.waitUntil(() => screen.queryByTestId('weekly-tile'), {
        timeout: 5000,
      }).catch(() => {});

      // Should render desktop components
      expect(screen.queryByTestId('weekly-tile')).toBeInTheDocument();
    });
  });

  describe('InputPage - Mobile vs Desktop', () => {
    it('renders mobile layout at 375px viewport', async () => {
      setViewportWidth(375);
      render(<InputPage />);

      // Wait for components to render
      await vi.waitUntil(() => screen.queryByTestId('quick-action-buttons'), {
        timeout: 5000,
      }).catch(() => {});

      // Should render mobile components
      expect(screen.queryByTestId('quick-action-buttons')).toBeInTheDocument();
      expect(screen.queryByTestId('activity-feed')).toBeInTheDocument();
    });

    it('does not render QuickLogPanel on mobile', async () => {
      setViewportWidth(375);
      render(<InputPage />);

      // Wait for components to render
      await vi.waitUntil(() => screen.queryByTestId('quick-action-buttons'), {
        timeout: 5000,
      }).catch(() => {});

      // Should NOT render QuickLogPanel (desktop only)
      expect(screen.queryByTestId('quick-log-panel')).not.toBeInTheDocument();
    });

    it('renders desktop layout at 481px viewport', async () => {
      setViewportWidth(481);
      render(<InputPage />);

      // Wait for components to render
      await vi.waitUntil(() => screen.queryByTestId('quick-log-panel'), {
        timeout: 5000,
      }).catch(() => {});

      // Should render desktop components
      expect(screen.queryByTestId('quick-log-panel')).toBeInTheDocument();
    });

    it('renders desktop layout at 768px viewport', async () => {
      setViewportWidth(768);
      render(<InputPage />);

      // Wait for components to render
      await vi.waitUntil(() => screen.queryByTestId('quick-log-panel'), {
        timeout: 5000,
      }).catch(() => {});

      // Should render desktop components
      expect(screen.queryByTestId('quick-log-panel')).toBeInTheDocument();
    });
  });

  describe('Viewport Breakpoint Threshold', () => {
    it('switches to mobile at exactly 480px', async () => {
      setViewportWidth(480);
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      // At 480px, should still be mobile (< 481px)
      await vi.waitUntil(() => screen.queryByTestId('weekly-tile-compact'), {
        timeout: 5000,
      }).catch(() => {});

      expect(screen.queryByTestId('weekly-tile-compact')).toBeInTheDocument();
    });

    it('switches to desktop at exactly 481px', async () => {
      setViewportWidth(481);
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      // At 481px, should be desktop
      await vi.waitUntil(() => screen.queryByTestId('weekly-tile'), {
        timeout: 5000,
      }).catch(() => {});

      expect(screen.queryByTestId('weekly-tile')).toBeInTheDocument();
    });
  });
});
