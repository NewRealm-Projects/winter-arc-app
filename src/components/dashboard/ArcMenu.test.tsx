import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArcMenu } from './ArcMenu';

// Mock useTranslation
vi.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'tracking.sports': 'Sports',
        'tracking.pushups': 'Pushups',
        'tracking.water': 'Water',
        'tracking.nutrition': 'Nutrition',
        'tracking.weight': 'Weight',
        'common.quickAdd': 'Quick add',
        'common.close': 'Close',
      };
      return translations[key] || key;
    },
    language: 'en',
  }),
}));

describe('ArcMenu', () => {
  const mockOnStatSelect = vi.fn();

  beforeEach(() => {
    mockOnStatSelect.mockClear();
  });

  // Rendering Tests
  it('should render plus button initially', () => {
    render(<ArcMenu onStatSelect={mockOnStatSelect} />);
    const button = screen.getByRole('button', { name: /quick add/i });
    expect(button).toBeInTheDocument();
  });

  it('should show plus icon in button', () => {
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);
    const svg = container.querySelector('button svg');
    expect(svg).toBeInTheDocument();
  });

  it('should not display arc menu initially', () => {
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);
    const menuSvg = container.querySelector('svg[role="menu"]');
    expect(menuSvg).toHaveClass('opacity-0');
  });

  it('should have proper button size and styling', () => {
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);
    const button = container.querySelector('button');
    expect(button).toHaveClass('w-14', 'h-14', 'rounded-full');
  });

  // Open/Close Tests
  it('should open menu when plus button is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    const button = screen.getByRole('button', { name: /quick add/i });
    await user.click(button);

    const menuSvg = container.querySelector('svg[role="menu"]');
    await waitFor(() => {
      expect(menuSvg).toHaveClass('opacity-100');
    });
  });

  it('should close menu when plus button is clicked again', async () => {
    const user = userEvent.setup();
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    const button = screen.getByRole('button', { name: /quick add/i });

    // Open menu
    await user.click(button);
    const menuSvg = container.querySelector('svg[role="menu"]');
    await waitFor(() => {
      expect(menuSvg).toHaveClass('opacity-100');
    });

    // Close menu
    await user.click(button);
    await waitFor(() => {
      expect(menuSvg).toHaveClass('opacity-0');
    });
  });

  it('should rotate plus icon when menu opens', async () => {
    const user = userEvent.setup();
    render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    const button = screen.getByRole('button', { name: /quick add/i });
    const plusIcon = button.querySelector('svg');

    // Initially rotated 0°
    expect(plusIcon).toHaveClass('rotate-0');

    // Open menu
    await user.click(button);
    await waitFor(() => {
      expect(plusIcon).toHaveClass('rotate-45');
    });

    // Close menu
    await user.click(button);
    await waitFor(() => {
      expect(plusIcon).toHaveClass('rotate-0');
    });
  });

  // SVG Structure Tests
  it('should render 5 menu slices with correct colors', () => {
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Open menu first
    const button = screen.getByRole('button', { name: /quick add/i });
    fireEvent.click(button);

    const slicePaths = container.querySelectorAll('svg[role="menu"] path[fill]');
    // Filter for colored slices (not the background arc)
    const coloredSlices = Array.from(slicePaths).filter(
      (path) =>
        path.getAttribute('fill') &&
        ['#10B981', '#3B82F6', '#06B6D4', '#F59E0B', '#8B5CF6'].includes(
          path.getAttribute('fill') || ''
        )
    );

    expect(coloredSlices.length).toBe(5);
  });

  it('should render 5 icons on the menu', () => {
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Open menu first
    const button = screen.getByRole('button', { name: /quick add/i });
    fireEvent.click(button);

    const icons = container.querySelectorAll('svg[role="menu"] g[role="img"]');
    expect(icons.length).toBe(5);
  });

  it('should display correct icon emojis', () => {
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Open menu first
    const button = screen.getByRole('button', { name: /quick add/i });
    fireEvent.click(button);

    const icons = container.querySelectorAll('svg[role="menu"] g[role="img"] text');
    // New order: nutrition (🥩), hydration (💧), weight (⚖️), pushup (💪), sports (🏃)
    const expectedEmojis = ['🥩', '💧', '⚖️', '💪', '🏃'];

    Array.from(icons).forEach((icon, index) => {
      expect(icon.textContent).toBe(expectedEmojis[index]);
    });
  });

  // Interaction Tests
  it('should call onStatSelect when nutrition slice is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Open menu
    const button = screen.getByRole('button', { name: /quick add/i });
    await user.click(button);

    // Find and click nutrition slice (first slice)
    const slices = container.querySelectorAll('svg[role="menu"] path[fill*="#"]');
    await user.click(slices[0]);

    expect(mockOnStatSelect).toHaveBeenCalledWith('nutrition');
  });

  it('should call onStatSelect for all 5 stat types', async () => {
    const user = userEvent.setup();
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    const statIds = ['nutrition', 'hydration', 'weight', 'pushup', 'sports'] as const;

    for (const statId of statIds) {
      mockOnStatSelect.mockClear();

      // Open menu
      const button = screen.getByRole('button', { name: /quick add/i });
      await user.click(button);

      // Click corresponding slice
      const slices = container.querySelectorAll('svg[role="menu"] path[fill*="#"]');
      const indexMap = { nutrition: 0, hydration: 1, weight: 2, pushup: 3, sports: 4 };
      const index = indexMap[statId];

      await user.click(slices[index]);

      expect(mockOnStatSelect).toHaveBeenCalledWith(statId);
    }
  });

  it('should close menu after selecting a stat', async () => {
    const user = userEvent.setup();
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Open menu
    const button = screen.getByRole('button', { name: /quick add/i });
    await user.click(button);

    const menuSvg = container.querySelector('svg[role="menu"]');
    await waitFor(() => {
      expect(menuSvg).toHaveClass('opacity-100');
    });

    // Click a slice
    const slices = container.querySelectorAll('svg[role="menu"] path[fill*="#"]');
    await user.click(slices[0]);

    // Menu should close
    await waitFor(() => {
      expect(menuSvg).toHaveClass('opacity-0');
    });
  });

  // Keyboard Tests
  it('should close menu on Escape key press', async () => {
    const user = userEvent.setup();
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Open menu
    const button = screen.getByRole('button', { name: /quick add/i });
    await user.click(button);

    const menuSvg = container.querySelector('svg[role="menu"]');
    await waitFor(() => {
      expect(menuSvg).toHaveClass('opacity-100');
    });

    // Press Escape
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(menuSvg).toHaveClass('opacity-0');
    });
  });

  it('should select stat on Enter key when slice is focused', async () => {
    const user = userEvent.setup();
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Open menu
    const button = screen.getByRole('button', { name: /quick add/i });
    await user.click(button);

    // Get first slice (nutrition)
    const slices = container.querySelectorAll('svg[role="menu"] path[fill*="#"]');
    const firstSlice = slices[0] as SVGPathElement;

    // Focus and press Enter
    firstSlice.focus();
    fireEvent.keyDown(firstSlice, { key: 'Enter' });

    expect(mockOnStatSelect).toHaveBeenCalledWith('nutrition');
  });

  it('should select stat on Space key when slice is focused', async () => {
    const user = userEvent.setup();
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Open menu
    const button = screen.getByRole('button', { name: /quick add/i });
    await user.click(button);

    // Get second slice (hydration)
    const slices = container.querySelectorAll('svg[role="menu"] path[fill*="#"]');
    const secondSlice = slices[1] as SVGPathElement;

    // Focus and press Space
    secondSlice.focus();
    fireEvent.keyDown(secondSlice, { key: ' ' });

    expect(mockOnStatSelect).toHaveBeenCalledWith('hydration');
  });

  // Backdrop Tests
  it('should display backdrop when menu is open', () => {
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Initially no backdrop
    let backdrop = container.querySelector('[role="button"][aria-hidden="true"]');
    expect(backdrop).not.toBeInTheDocument();

    // Open menu
    const button = screen.getByRole('button', { name: /quick add/i });
    fireEvent.click(button);

    // Backdrop should exist
    backdrop = container.querySelector('[role="button"][aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
  });

  it('should close menu when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Open menu
    const button = screen.getByRole('button', { name: /quick add/i });
    await user.click(button);

    // Get backdrop
    const backdrop = container.querySelector(
      '[role="button"][aria-hidden="true"]'
    ) as HTMLElement;
    expect(backdrop).toBeInTheDocument();

    // Click backdrop
    await user.click(backdrop);

    // Menu should close
    const menuSvg = container.querySelector('svg[role="menu"]');
    await waitFor(() => {
      expect(menuSvg).toHaveClass('opacity-0');
    });
  });

  // Accessibility Tests
  it('should have proper button accessibility attributes', () => {
    render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    const button = screen.getByRole('button', { name: /quick add/i });
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should update aria-expanded when menu opens', async () => {
    const user = userEvent.setup();
    render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    const button = screen.getByRole('button', { name: /quick add/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('should have menu role on SVG', () => {
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Open menu first
    const button = screen.getByRole('button', { name: /quick add/i });
    fireEvent.click(button);

    const menuSvg = container.querySelector('svg[role="menu"]');
    expect(menuSvg).toBeInTheDocument();
    expect(menuSvg).toHaveAttribute('aria-label');
  });

  it('should have menuitem role on slices', () => {
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Open menu first
    const button = screen.getByRole('button', { name: /quick add/i });
    fireEvent.click(button);

    const menuItems = container.querySelectorAll('svg[role="menu"] path[role="menuitem"]');
    expect(menuItems.length).toBe(5);
  });

  // Animation Tests
  it('should have smooth transition on menu open/close', async () => {
    const user = userEvent.setup();
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    const button = screen.getByRole('button', { name: /quick add/i });
    const menuSvg = container.querySelector('svg[role="menu"]');

    expect(menuSvg).toHaveClass('duration-300', 'transition-opacity');

    await user.click(button);
    expect(menuSvg).toHaveClass('opacity-100');

    await user.click(button);
    await waitFor(() => {
      expect(menuSvg).toHaveClass('opacity-0');
    });
  });

  it('should have dark mode support', () => {
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    // Open menu
    const button = screen.getByRole('button', { name: /quick add/i });
    fireEvent.click(button);

    const menuSvg = container.querySelector('svg[role="menu"]');
    const backgroundPath = menuSvg?.querySelector('path[fill="white"]');

    expect(backgroundPath).toHaveClass('dark:fill-gray-900', 'dark:stroke-white/10');
  });

  // Z-index Tests
  it('should have proper z-index layering', () => {
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    const button = screen.getByRole('button', { name: /quick add/i });
    fireEvent.click(button);

    const backdropDiv = container.querySelector('[role="button"][aria-hidden="true"]');
    const menuContainer = button.parentElement;

    expect(backdropDiv).toHaveClass('z-30');
    expect(menuContainer).toHaveClass('z-40');
  });

  // Touch Target Size Tests
  it('should have 56px touch target for plus button', () => {
    const { container } = render(<ArcMenu onStatSelect={mockOnStatSelect} />);

    const button = container.querySelector('button');
    expect(button).toHaveClass('w-14', 'h-14'); // 14 * 4px = 56px
  });
});
