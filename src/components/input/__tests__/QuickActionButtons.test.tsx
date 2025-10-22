import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import QuickActionButtons from '../QuickActionButtons';

vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

describe('QuickActionButtons', () => {
  it('renders all four action buttons', () => {
    const handlers = {
      onFoodClick: vi.fn(),
      onWaterClick: vi.fn(),
      onNotesClick: vi.fn(),
      onTrainingClick: vi.fn(),
    };

    render(<QuickActionButtons {...handlers} />);

    expect(screen.getByTestId('quick-action-food')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-water')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-notes')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-training')).toBeInTheDocument();
  });

  it('displays correct emojis for each button', () => {
    const handlers = {
      onFoodClick: vi.fn(),
      onWaterClick: vi.fn(),
      onNotesClick: vi.fn(),
      onTrainingClick: vi.fn(),
    };

    render(<QuickActionButtons {...handlers} />);

    expect(screen.getByText('🍗')).toBeInTheDocument();
    expect(screen.getByText('💧')).toBeInTheDocument();
    expect(screen.getByText('📝')).toBeInTheDocument();
    expect(screen.getByText('🏋️')).toBeInTheDocument();
  });

  it('calls appropriate handler when buttons are clicked', () => {
    const handlers = {
      onFoodClick: vi.fn(),
      onWaterClick: vi.fn(),
      onNotesClick: vi.fn(),
      onTrainingClick: vi.fn(),
    };

    render(<QuickActionButtons {...handlers} />);

    screen.getByTestId('quick-action-food').click();
    expect(handlers.onFoodClick).toHaveBeenCalledTimes(1);

    screen.getByTestId('quick-action-water').click();
    expect(handlers.onWaterClick).toHaveBeenCalledTimes(1);

    screen.getByTestId('quick-action-notes').click();
    expect(handlers.onNotesClick).toHaveBeenCalledTimes(1);

    screen.getByTestId('quick-action-training').click();
    expect(handlers.onTrainingClick).toHaveBeenCalledTimes(1);
  });

  it('renders as 2x2 grid layout', () => {
    const handlers = {
      onFoodClick: vi.fn(),
      onWaterClick: vi.fn(),
      onNotesClick: vi.fn(),
      onTrainingClick: vi.fn(),
    };

    render(<QuickActionButtons {...handlers} />);

    const grid = screen.getByTestId('quick-action-buttons');
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-2');
  });
});
