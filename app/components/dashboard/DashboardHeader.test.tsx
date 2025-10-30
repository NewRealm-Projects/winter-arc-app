import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardHeader } from './DashboardHeader';
import { format } from 'date-fns';

// Mock WeekContext
vi.mock('../../contexts/WeekContext', () => ({
  useWeekContext: () => ({
    selectedDate: format(new Date(), 'yyyy-MM-dd'),
  }),
}));

// Mock useTranslation
vi.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'dashboard.weekNumberTitle': 'Week {{week}}',
        'nav.settings': 'Settings',
      };
      if (key === 'dashboard.weekNumberTitle' && values?.week) {
        return `Week ${values.week}`;
      }
      return translations[key] || key;
    },
    language: 'en',
  }),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Settings: () => <div data-testid="settings-icon">Settings Icon</div>,
}));

describe('DashboardHeader', () => {
  it('should render week information', () => {
    const mockOnSettingsClick = vi.fn();
    render(<DashboardHeader onSettingsClick={mockOnSettingsClick} />);

    expect(screen.getByText(/^Week \d+$/)).toBeInTheDocument();
  });

  it('should display week range', () => {
    const mockOnSettingsClick = vi.fn();
    render(<DashboardHeader onSettingsClick={mockOnSettingsClick} />);

    const range = screen.getByText(/\w+ \d+ - \w+ \d+/); // Oct 13 - Oct 19
    expect(range).toBeInTheDocument();
  });

  it('should render settings button', () => {
    const mockOnSettingsClick = vi.fn();
    render(<DashboardHeader onSettingsClick={mockOnSettingsClick} />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();
  });

  it('should display settings icon', () => {
    const mockOnSettingsClick = vi.fn();
    render(<DashboardHeader onSettingsClick={mockOnSettingsClick} />);

    expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
  });

  it('should call onSettingsClick when settings button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSettingsClick = vi.fn();
    render(<DashboardHeader onSettingsClick={mockOnSettingsClick} />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    expect(mockOnSettingsClick).toHaveBeenCalledOnce();
  });

  it('should have proper styling classes', () => {
    const mockOnSettingsClick = vi.fn();
    const { container } = render(<DashboardHeader onSettingsClick={mockOnSettingsClick} />);

    const header = container.firstChild;
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('items-center');
    expect(header).toHaveClass('justify-between');
    expect(header).toHaveClass('border-b');
  });

  it('should have dark mode classes', () => {
    const mockOnSettingsClick = vi.fn();
    const { container } = render(<DashboardHeader onSettingsClick={mockOnSettingsClick} />);

    const header = container.firstChild as HTMLElement;
    expect(header?.className).toMatch(/dark:/);
  });

  it('should have accessible button', () => {
    const mockOnSettingsClick = vi.fn();
    render(<DashboardHeader onSettingsClick={mockOnSettingsClick} />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toHaveAttribute('type', 'button');
    expect(settingsButton).toHaveAttribute('aria-label', 'Settings');
    expect(settingsButton).toHaveAttribute('title', 'Settings');
  });

  it('should have proper button size for touch targets', () => {
    const mockOnSettingsClick = vi.fn();
    render(<DashboardHeader onSettingsClick={mockOnSettingsClick} />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toHaveClass('w-10');
    expect(settingsButton).toHaveClass('h-10');
  });

  it('should display multiple elements in header', () => {
    const mockOnSettingsClick = vi.fn();
    const { container } = render(<DashboardHeader onSettingsClick={mockOnSettingsClick} />);

    const divs = container.querySelectorAll('div');
    // Should have header div, week info div, and possibly other divs
    expect(divs.length).toBeGreaterThan(0);
  });
});
