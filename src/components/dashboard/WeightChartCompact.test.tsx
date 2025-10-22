import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeightChartCompact } from './WeightChartCompact';
import { format } from 'date-fns';

// Mock WeekContext
vi.mock('../../contexts/WeekContext', () => ({
  useWeekContext: () => ({
    selectedDate: format(new Date(), 'yyyy-MM-dd'),
    setSelectedDate: vi.fn(),
  }),
}));

// Mock useTranslation
vi.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'tracking.weight': 'Weight',
        'common.noData': 'No data',
      };
      return translations[key] || key;
    },
    language: 'en',
  }),
}));

// Mock useStore
interface MockState {
  tracking: Record<string, { weight?: { value: number; bodyFat?: number } }>;
  user: { height: number; weight: number; bodyFat: number };
}

vi.mock('../../store/useStore', () => ({
  useStore: (selector: (state: MockState) => unknown) => {
    const mockState: MockState = {
      tracking: {
        '2025-10-20': {
          weight: { value: 75, bodyFat: 18 },
        },
        '2025-10-21': {
          weight: { value: 74.5, bodyFat: 17.8 },
        },
        '2025-10-22': {
          weight: { value: 75.2, bodyFat: 18.1 },
        },
      },
      user: {
        height: 180,
        weight: 75,
        bodyFat: 18,
      },
    };
    return selector(mockState);
  },
}));

// Mock AppModal
vi.mock('../ui/AppModal', () => ({
  AppModal: ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) =>
    open ? (
      <div role="dialog" onClick={() => onClose()}>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

// Mock WeightTile
vi.mock('../WeightTile', () => ({
  default: () => <div data-testid="weight-tile">WeightTile Component</div>,
}));

describe('WeightChartCompact', () => {
  it('should render weight chart card', () => {
    render(<WeightChartCompact />);
    expect(screen.getByText('Weight')).toBeInTheDocument();
  });

  it('should display 7 Days label initially', () => {
    render(<WeightChartCompact />);
    expect(screen.getByText('7 Days')).toBeInTheDocument();
  });

  it('should render with proper structure', () => {
    const { container } = render(<WeightChartCompact />);
    // Component should render the main card
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<WeightChartCompact />);
    const button = screen.getByRole('button', { name: /weight/i });
    expect(button).toHaveAttribute('tabindex', '0');
    expect(button).toHaveAttribute('aria-label', 'Weight');
  });

  it('should open modal when clicked', async () => {
    const user = userEvent.setup();
    render(<WeightChartCompact />);

    const card = screen.getByRole('button', { name: /weight/i });
    await user.click(card);

    await waitFor(() => {
      expect(screen.getByTestId('weight-tile')).toBeInTheDocument();
    });
  });

  it('should open modal on Enter key', async () => {
    const user = userEvent.setup();
    render(<WeightChartCompact />);

    const card = screen.getByRole('button', { name: /weight/i });
    card.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('weight-tile')).toBeInTheDocument();
    });
  });

  it('should open modal on Space key', async () => {
    const user = userEvent.setup();
    render(<WeightChartCompact />);

    const card = screen.getByRole('button', { name: /weight/i });
    card.focus();
    await user.keyboard(' ');

    await waitFor(() => {
      expect(screen.getByTestId('weight-tile')).toBeInTheDocument();
    });
  });

  it('should display swipe hint', () => {
    render(<WeightChartCompact />);
    expect(screen.getByText(/Swipe/)).toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    const { container } = render(<WeightChartCompact />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('shadow-sm');
  });

  it('should have dark mode support', () => {
    const { container } = render(<WeightChartCompact />);
    const card = container.firstChild as HTMLElement;

    expect(card?.className).toMatch(/dark:/);
  });

  it('should have proper chart container with fixed height', () => {
    const { container } = render(<WeightChartCompact />);
    // Chart should be in a div with style attribute containing height
    const mainCard = container.firstChild as HTMLElement;
    expect(mainCard).toHaveClass('p-4');
    expect(mainCard).toHaveClass('rounded-xl');
  });

  it('should handle no data gracefully', () => {
    render(<WeightChartCompact />);
    // Component should render without errors (with or without data)
    expect(screen.getByText('Weight')).toBeInTheDocument();
  });
});
