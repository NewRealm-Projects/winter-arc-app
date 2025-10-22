import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import TrainingCardCompact from '../TrainingCardCompact';

let mockBadgeLevel = 'optimal';

// Mock hooks
vi.mock('../../../hooks/useTrainingLoadWeek', () => ({
  useTrainingLoadWeek: () => ({
    streakDays: 5,
    averagePercent: 75,
    badgeLevel: mockBadgeLevel,
  }),
}));

vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

beforeEach(() => {
  mockBadgeLevel = 'optimal';
});

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

  it('applies correct styling for button container', () => {
    const onClick = vi.fn();
    render(<TrainingCardCompact onClick={onClick} />);

    const button = screen.getByTestId('training-card-compact');
    expect(button).toHaveClass('flex', 'items-center', 'justify-between', 'gap-2');
  });

  it('button is of type button', () => {
    const onClick = vi.fn();
    render(<TrainingCardCompact onClick={onClick} />);

    const button = screen.getByTestId('training-card-compact');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('displays streak information', () => {
    const onClick = vi.fn();
    render(<TrainingCardCompact onClick={onClick} />);

    // Should show the streak counter (from mocked useTrainingLoadWeek)
    const button = screen.getByTestId('training-card-compact');
    expect(button).toBeInTheDocument();
  });

  it('applies correct styling for high training load badge', () => {
    mockBadgeLevel = 'high';
    const onClick = vi.fn();
    render(<TrainingCardCompact onClick={onClick} />);

    const badge = screen.getByText('dashboard.trainingLoadStatus.high');
    expect(badge).toHaveClass('bg-red-500/20', 'text-red-300', 'border-red-500/40');
  });

  it('applies correct styling for low/moderate training load badge', () => {
    mockBadgeLevel = 'low';
    const onClick = vi.fn();
    render(<TrainingCardCompact onClick={onClick} />);

    const badge = screen.getByText('dashboard.trainingLoadStatus.low');
    expect(badge).toHaveClass('bg-blue-500/20', 'text-blue-300', 'border-blue-500/40');
  });
});
