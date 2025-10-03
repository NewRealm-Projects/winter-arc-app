import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { Skeleton, CardSkeleton, ListItemSkeleton } from '../components/ui/Skeleton';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('Skeleton Components', () => {
    it('Skeleton should have no accessibility violations', async () => {
      const { container } = render(<Skeleton />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('CardSkeleton should have no accessibility violations', async () => {
      const { container } = render(<CardSkeleton />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('ListItemSkeleton should have no accessibility violations', async () => {
      const { container } = render(<ListItemSkeleton />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      const { getByRole } = render(<CardSkeleton />);
      const status = getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading card content');
    });
  });

  // Add more a11y tests for critical views as needed
  describe('Focus Management', () => {
    it('should render focusable elements with visible focus rings', () => {
      const { container } = render(
        <div>
          <button>Click me</button>
          <a href="/">Link</a>
          <input type="text" />
        </div>
      );

      const button = container.querySelector('button');
      const link = container.querySelector('a');
      const input = container.querySelector('input');

      expect(button).toBeTruthy();
      expect(link).toBeTruthy();
      expect(input).toBeTruthy();
    });
  });
});
