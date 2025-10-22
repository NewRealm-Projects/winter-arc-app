import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TrainingCardCompact from '../TrainingCardCompact';

// Mock hooks
vi.mock('../../../hooks/useTrainingLoadWeek', () => ({
  useTrainingLoadWeek: () => ({
    streakDays: 5,
    averagePercent: 75,
    badgeLevel: 'optimal',
  }),
}));

vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

describe('TrainingCardCompact', () => {
  it('renders compact training button with badge', () => {
    const onClick = vi.fn();
    render(<TrainingCardCompact onClick={onClick} />);

    expect(screen.getByTestId('training-card-compact')).toBeInTheDocument();
    expect(screen.getByText('🏋️')).toBeInTheDocument();
    expect(screen.getByText('dashboard.training')).toBeInTheDocument();
  });

  it('displays training load badge', () => {
    const onClick = vi.fn();
    render(<TrainingCardCompact onClick={onClick} />);

    const badge = screen.getByText('dashboard.trainingLoadStatus.optimal');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-500/20');
  });

  it('calls onClick when button is clicked', () => {
    const onClick = vi.fn();
    render(<TrainingCardCompact onClick={onClick} />);

    const button = screen.getByTestId('training-card-compact');
    button.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows arrow icon indicating expandable content', () => {
    const onClick = vi.fn();
    render(<TrainingCardCompact onClick={onClick} />);

    expect(screen.getByText('→')).toBeInTheDocument();
  });
});
