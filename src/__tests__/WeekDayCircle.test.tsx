import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WeekDayCircle from '../components/dashboard/WeekDayCircle';

const renderCircle = (props: Partial<ComponentProps<typeof WeekDayCircle>> = {}) => {
  const defaultProps = {
    percent: 0,
    isStreak: false,
    label: 'Mon',
    dayNumber: '01',
    onClick: () => {},
  } satisfies ComponentProps<typeof WeekDayCircle>;

  return render(<WeekDayCircle {...defaultProps} {...props} />);
};

describe('WeekDayCircle', () => {
  it('applies neutral stroke at 0%', () => {
    const { container } = renderCircle({ percent: 0 });
    const circles = container.querySelectorAll('circle');
    expect(circles[1]).toHaveClass('stroke-white/25');
  });

  it('uses attention color at 50%', () => {
    const { container } = renderCircle({ percent: 75 });
    const circles = container.querySelectorAll('circle');
    expect(circles[1]).toHaveClass('stroke-amber-400');
  });

  it('shows streak badge at 100%', () => {
    const { container } = renderCircle({ percent: 100, isStreak: true, tooltip: 'Wednesday · 100%' });
    expect(screen.getByText('🔥')).toBeInTheDocument();
    const circles = container.querySelectorAll('circle');
    expect(circles[1]).toHaveClass('stroke-emerald-400');
  });
});
