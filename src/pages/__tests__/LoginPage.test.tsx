import { fireEvent, renderWithProviders, screen, waitFor } from 'test/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signInWithPopup } from 'firebase/auth';
import LoginPage from '../LoginPage';

type StoreSlice = {
  user: unknown;
  setUser: ReturnType<typeof vi.fn>;
  setIsOnboarded: ReturnType<typeof vi.fn>;
};

const storeState: StoreSlice = {
  user: null,
  setUser: vi.fn(),
  setIsOnboarded: vi.fn(),
};

vi.mock('../../store/useStore', () => ({
  useStore: (selector: (state: StoreSlice) => unknown) => selector(storeState),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<unknown>();
  return {
    ...(actual as Record<string, unknown>),
    useNavigate: () => vi.fn(),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    storeState.user = null;
    storeState.setUser = vi.fn();
    storeState.setIsOnboarded = vi.fn();
    vi.mocked(signInWithPopup).mockClear();
  });

  it('logs in using demo mode for testing', async () => {
    renderWithProviders(<LoginPage />);

    fireEvent.click(screen.getByTestId('demo-login-button'));

    await waitFor(() => {
      expect(storeState.setUser).toHaveBeenCalled();
    });
    expect(storeState.setIsOnboarded).toHaveBeenCalledWith(true);
  });

  it('invokes Google popup login when clicking the main CTA', async () => {
    renderWithProviders(<LoginPage />);

    const googleButton = await screen.findByTestId('google-login-button');
    await waitFor(() => {
      expect(googleButton).not.toBeDisabled();
      expect(googleButton).toHaveTextContent('Sign in with Google');
    });

    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
    });
  });
});
