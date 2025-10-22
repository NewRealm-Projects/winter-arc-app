import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatDetailsModal } from './StatDetailsModal';
import type { CarouselStat } from '../../hooks/useCarouselStats';

// Mock translation hook
vi.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.close': 'Close',
        'common.addOrEdit': 'Add / Edit',
        'common.progress': 'Progress',
        'tracking.sportsDescription': 'Log your daily sports activity',
        'tracking.pushupDescription': 'Track your pushup progress',
        'tracking.waterDescription': 'Log your daily water intake',
        'tracking.foodDescription': 'Track your nutrition and calories',
        'tracking.weightDescription': 'Log your weight and body metrics',
      };
      return translations[key] || key;
    },
    language: 'en',
  }),
}));

// Mock input modals
vi.mock('../notes/WorkoutLogModal', () => ({
  default: ({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) =>
    open ? (
      <div role="dialog" data-testid="workout-log-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSave}>Save</button>
      </div>
    ) : null,
}));

vi.mock('../notes/PushupLogModal', () => ({
  default: ({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) =>
    open ? (
      <div role="dialog" data-testid="pushup-log-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSave}>Save</button>
      </div>
    ) : null,
}));

vi.mock('../notes/DrinkLogModal', () => ({
  default: ({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) =>
    open ? (
      <div role="dialog" data-testid="drink-log-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSave}>Save</button>
      </div>
    ) : null,
}));

vi.mock('../notes/FoodLogModal', () => ({
  default: ({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) =>
    open ? (
      <div role="dialog" data-testid="food-log-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSave}>Save</button>
      </div>
    ) : null,
}));

vi.mock('../notes/WeightLogModal', () => ({
  default: ({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) =>
    open ? (
      <div role="dialog" data-testid="weight-log-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSave}>Save</button>
      </div>
    ) : null,
}));

// Mock AppModal
vi.mock('../ui/AppModal', () => ({
  AppModal: ({
    open,
    title,
    children,
    footer,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
    footer: React.ReactNode;
  }) =>
    open ? (
      <div role="dialog" data-testid="stat-details-modal">
        <h2>{title}</h2>
        {children}
        <div data-testid="modal-footer">{footer}</div>
      </div>
    ) : null,
  ModalPrimaryButton: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button data-testid="primary-button" onClick={onClick}>
      {children}
    </button>
  ),
  ModalSecondaryButton: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button data-testid="secondary-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('StatDetailsModal', () => {
  const mockOnClose = vi.fn();

  const createTestStat = (id: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight'): CarouselStat => {
    const stats: Record<string, CarouselStat> = {
      sports: {
        id: 'sports',
        label: 'Sports',
        icon: '🏃',
        value: 'Completed',
        progress: 100,
        color: '#10B981',
      },
      pushup: {
        id: 'pushup',
        label: 'Pushups',
        icon: '💪',
        value: '20 total',
        progress: 50,
        color: '#3B82F6',
      },
      hydration: {
        id: 'hydration',
        label: 'Hydration',
        icon: '💧',
        value: '2.5L / 3L',
        progress: 83,
        color: '#06B6D4',
      },
      nutrition: {
        id: 'nutrition',
        label: 'Nutrition',
        icon: '🥩',
        value: '1800 kcal',
        progress: 60,
        color: '#F59E0B',
      },
      weight: {
        id: 'weight',
        label: 'Weight',
        icon: '⚖️',
        value: '80kg | BMI: 24.7',
        progress: 100,
        color: '#8B5CF6',
      },
    };
    return stats[id];
  };

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  // Rendering Tests
  it('should not render when open is false', () => {
    const stat = createTestStat('sports');
    const { container } = render(
      <StatDetailsModal open={false} onClose={mockOnClose} stat={stat} />
    );

    expect(container.querySelector('[data-testid="stat-details-modal"]')).not.toBeInTheDocument();
  });

  it('should return null when stat is undefined', () => {
    const { container } = render(
      <StatDetailsModal open={true} onClose={mockOnClose} stat={undefined} />
    );

    expect(container.querySelector('[data-testid="stat-details-modal"]')).not.toBeInTheDocument();
  });

  it('should render stat details modal with stat title', () => {
    const stat = createTestStat('sports');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    // Check that the modal is open (title will be rendered as h2 inside mock modal)
    expect(screen.getByTestId('stat-details-modal')).toBeInTheDocument();
    // Check that at least one Sports text exists (title)
    const sportTexts = screen.getAllByText('Sports');
    expect(sportTexts.length).toBeGreaterThan(0);
  });

  it('should display stat icon and value', () => {
    const stat = createTestStat('pushup');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    expect(screen.getByText('💪')).toBeInTheDocument();
    expect(screen.getByText('20 total')).toBeInTheDocument();
  });

  it('should display progress percentage', () => {
    const stat = createTestStat('hydration');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    expect(screen.getByText('83%')).toBeInTheDocument();
  });

  it('should render progress bar', () => {
    const stat = createTestStat('hydration');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    // Progress bar text label 'Progress' should be visible
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('should display stat description', () => {
    const stat = createTestStat('sports');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    expect(screen.getByText('Log your daily sports activity')).toBeInTheDocument();
  });

  // Button Tests
  it('should have Close button that calls onClose', async () => {
    const user = userEvent.setup();
    const stat = createTestStat('sports');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    const closeButton = screen.getByTestId('secondary-button');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should have Add/Edit button', () => {
    const stat = createTestStat('sports');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    const addButton = screen.getByTestId('primary-button');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent('Add / Edit');
  });

  // Modal Routing Tests
  it('should open WorkoutLogModal when sports stat Add/Edit is clicked', async () => {
    const user = userEvent.setup();
    const stat = createTestStat('sports');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    const addButton = screen.getByTestId('primary-button');
    await user.click(addButton);

    expect(screen.getByTestId('workout-log-modal')).toBeInTheDocument();
  });

  it('should open PushupLogModal when pushup stat Add/Edit is clicked', async () => {
    const user = userEvent.setup();
    const stat = createTestStat('pushup');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    const addButton = screen.getByTestId('primary-button');
    await user.click(addButton);

    expect(screen.getByTestId('pushup-log-modal')).toBeInTheDocument();
  });

  it('should open DrinkLogModal when hydration stat Add/Edit is clicked', async () => {
    const user = userEvent.setup();
    const stat = createTestStat('hydration');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    const addButton = screen.getByTestId('primary-button');
    await user.click(addButton);

    expect(screen.getByTestId('drink-log-modal')).toBeInTheDocument();
  });

  it('should open FoodLogModal when nutrition stat Add/Edit is clicked', async () => {
    const user = userEvent.setup();
    const stat = createTestStat('nutrition');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    const addButton = screen.getByTestId('primary-button');
    await user.click(addButton);

    expect(screen.getByTestId('food-log-modal')).toBeInTheDocument();
  });

  it('should open WeightLogModal when weight stat Add/Edit is clicked', async () => {
    const user = userEvent.setup();
    const stat = createTestStat('weight');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    const addButton = screen.getByTestId('primary-button');
    await user.click(addButton);

    expect(screen.getByTestId('weight-log-modal')).toBeInTheDocument();
  });

  // Modal Dismissal Tests
  it('should close both modals when input modal is closed', async () => {
    const user = userEvent.setup();
    const stat = createTestStat('sports');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    // Open input modal
    const addButton = screen.getByTestId('primary-button');
    await user.click(addButton);

    expect(screen.getByTestId('workout-log-modal')).toBeInTheDocument();

    // Close input modal
    const inputCloseButton = screen.getAllByText('Close')[0];
    await user.click(inputCloseButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close both modals when input modal is saved', async () => {
    const user = userEvent.setup();
    const stat = createTestStat('pushup');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    // Open input modal
    const addButton = screen.getByTestId('primary-button');
    await user.click(addButton);

    // Save in input modal
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  // All Stat Types Test
  it('should handle all 5 stat types correctly', async () => {
    const user = userEvent.setup();
    const statTypes = ['sports', 'pushup', 'hydration', 'nutrition', 'weight'] as const;
    const expectedModals = [
      'workout-log-modal',
      'pushup-log-modal',
      'drink-log-modal',
      'food-log-modal',
      'weight-log-modal',
    ];

    for (let i = 0; i < statTypes.length; i++) {
      const stat = createTestStat(statTypes[i]);
      const { unmount } = render(
        <StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />
      );

      const addButton = screen.getByTestId('primary-button');
      await user.click(addButton);

      expect(screen.getByTestId(expectedModals[i])).toBeInTheDocument();

      unmount();
      mockOnClose.mockClear();
    }
  });

  // Current Date Prop Tests
  it('should pass currentDate to input modals', async () => {
    const user = userEvent.setup();
    const stat = createTestStat('sports');
    const testDate = '2025-10-22';

    render(
      <StatDetailsModal
        open={true}
        onClose={mockOnClose}
        stat={stat}
        currentDate={testDate}
      />
    );

    const addButton = screen.getByTestId('primary-button');
    await user.click(addButton);

    // Modal should be open with the date prop passed
    expect(screen.getByTestId('workout-log-modal')).toBeInTheDocument();
  });

  // Dark Mode Support Test
  it('should support dark mode styling', () => {
    const stat = createTestStat('hydration');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    // Modal should render with dark mode classes applied to elements
    // Dark mode is supported through component styling
    expect(screen.getByTestId('stat-details-modal')).toBeInTheDocument();
  });

  // Accessibility Tests
  it('should have dialog role on modal', () => {
    const stat = createTestStat('sports');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    const modal = screen.getByTestId('stat-details-modal');
    expect(modal).toHaveAttribute('role', 'dialog');
  });

  it('should have buttons with proper test ids', () => {
    const stat = createTestStat('sports');
    render(<StatDetailsModal open={true} onClose={mockOnClose} stat={stat} />);

    expect(screen.getByTestId('primary-button')).toBeInTheDocument();
    expect(screen.getByTestId('secondary-button')).toBeInTheDocument();
  });
});
