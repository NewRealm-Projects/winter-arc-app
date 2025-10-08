import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StreakMiniCard from '../StreakMiniCard';

vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('StreakMiniCard', () => {
  it('highlights the card when there is an active streak', () => {
    const { container } = render(<StreakMiniCard days={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('dashboard.streakDays')).toBeInTheDocument();
    expect(container.querySelector('[class*="bg-gradient-to-br"]')).not.toBeNull();
  });

  it('renders a muted style with no glow when there is no streak', () => {
    const { container } = render(<StreakMiniCard days={0} />);

    expect(screen.getByText('0').className).toContain('text-white/60');
    expect(container.querySelector('[class*="bg-gradient-to-br"]')).toBeNull();
  });
});
