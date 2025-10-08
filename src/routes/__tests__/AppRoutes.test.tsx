import { renderWithProviders, screen } from 'test/test-utils';
import { describe, expect, it, vi } from 'vitest';
import AppRoutes from '..';

type StoreSlice = {
  user: unknown;
  isOnboarded: boolean;
};

const storeState: StoreSlice = {
  user: null,
  isOnboarded: false,
};

vi.mock('../../store/useStore', () => ({
  useStore: (selector: (state: StoreSlice) => unknown) => selector(storeState),
}));

vi.mock('../../components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

vi.mock('../../pages/LoginPage', () => ({
  default: () => <div data-testid="login-screen" />,
}));

vi.mock('../../pages/OnboardingPage', () => ({
  default: () => <div data-testid="onboarding-screen" />,
}));

vi.mock('../../pages/DashboardPage', () => ({
  default: () => <div data-testid="dashboard-screen" />,
}));

vi.mock('../../pages/LeaderboardPage', () => ({
  default: () => <div data-testid="leaderboard-screen" />,
}));

describe('AppRoutes', () => {
  it('redirects anonymous users to the login page', () => {
    storeState.user = null;
    storeState.isOnboarded = false;

    renderWithProviders(<AppRoutes />, { route: '/protected' });

    expect(screen.getByTestId('login-screen')).toBeInTheDocument();
  });

  it('forces onboarding flow for partially set up users', () => {
    storeState.user = { id: 'user-1' };
    storeState.isOnboarded = false;

    renderWithProviders(<AppRoutes />, { route: '/' });

    expect(screen.getByTestId('onboarding-screen')).toBeInTheDocument();
  });

  it('renders authenticated layout and nested dashboard routes', async () => {
    storeState.user = { id: 'user-1' };
    storeState.isOnboarded = true;

    renderWithProviders(<AppRoutes />, { route: '/' });

    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    expect(await screen.findByTestId('dashboard-screen')).toBeInTheDocument();
  });
});
