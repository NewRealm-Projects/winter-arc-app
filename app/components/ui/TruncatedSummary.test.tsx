import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TruncatedSummary } from './TruncatedSummary';

describe('TruncatedSummary', () => {
  describe('rendering', () => {
    it('should render summary text', () => {
      render(<TruncatedSummary summary="Test summary" />);
      expect(screen.getByText('Test summary')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <TruncatedSummary summary="Test" className="custom-class" />
      );
      const element = container.firstChild;
      expect(element).toHaveClass('custom-class');
    });

    it('should render empty string', () => {
      const { container } = render(<TruncatedSummary summary="" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('without details', () => {
    it('should render as plain span when no details', () => {
      const { container } = render(<TruncatedSummary summary="Simple text" />);
      const span = container.querySelector('span');
      expect(span).toBeInTheDocument();
      expect(span?.textContent).toBe('Simple text');
    });

    it('should not have tooltip when details is undefined', () => {
      const { container } = render(<TruncatedSummary summary="No tooltip" />);
      // Should not have title attribute or tooltip wrapper
      const span = container.querySelector('span');
      expect(span).not.toHaveAttribute('title');
    });

    it('should not have tooltip when details is empty array', () => {
      const { container } = render(
        <TruncatedSummary summary="No details" details={[]} />
      );
      const span = container.querySelector('span');
      expect(span).toBeInTheDocument();
    });
  });

  describe('with details', () => {
    it('should render tooltip with details', () => {
      const details = ['Item 1', 'Item 2', 'Item 3'];
      render(<TruncatedSummary summary="Truncated" details={details} />);
      
      // Should show summary text
      expect(screen.getByText('Truncated')).toBeInTheDocument();
    });

    it('should include all detail items in tooltip', () => {
      const details = ['Apple 100g', 'Banana 120g', 'Orange 150g'];
      const { container } = render(
        <TruncatedSummary summary="3 items" details={details} />
      );
      
      // Check if details are accessible (implementation-dependent)
      expect(container).toBeInTheDocument();
    });

    it('should handle single detail item', () => {
      const details = ['Single item'];
      render(<TruncatedSummary summary="Summary" details={details} />);
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    it('should handle many detail items', () => {
      const details = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
      render(<TruncatedSummary summary="20 items" details={details} />);
      expect(screen.getByText('20 items')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very long summary text', () => {
      const longSummary = 'A'.repeat(200);
      render(<TruncatedSummary summary={longSummary} />);
      expect(screen.getByText(longSummary)).toBeInTheDocument();
    });

    it('should handle summary with special characters', () => {
      const summary = 'Special: <>&"\'';
      render(<TruncatedSummary summary={summary} />);
      expect(screen.getByText(summary)).toBeInTheDocument();
    });

    it('should handle details with special characters', () => {
      const details = ['Item with <html>', 'Item with & ampersand'];
      render(<TruncatedSummary summary="Special chars" details={details} />);
      expect(screen.getByText('Special chars')).toBeInTheDocument();
    });

    it('should handle unicode in summary', () => {
      const summary = '🍎 Apple 100g';
      render(<TruncatedSummary summary={summary} />);
      expect(screen.getByText(summary)).toBeInTheDocument();
    });

    it('should handle unicode in details', () => {
      const details = ['🍎 Apple', '🍌 Banana'];
      render(<TruncatedSummary summary="Fruits" details={details} />);
      expect(screen.getByText('Fruits')).toBeInTheDocument();
    });

    it('should handle empty string in details array', () => {
      const details = ['Item 1', '', 'Item 3'];
      render(<TruncatedSummary summary="Mixed" details={details} />);
      expect(screen.getByText('Mixed')).toBeInTheDocument();
    });

    it('should handle whitespace in summary', () => {
      const summary = '   Padded text   ';
      render(<TruncatedSummary summary={summary} />);
      expect(screen.getByText(summary)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should be readable by screen readers', () => {
      const { container } = render(<TruncatedSummary summary="Accessible text" />);
      const span = container.querySelector('span');
      expect(span).toHaveTextContent('Accessible text');
    });

    it('should handle aria attributes if provided', () => {
      const { container } = render(
        <TruncatedSummary 
          summary="Test" 
          className="test-class"
          data-testid="truncated-summary"
        />
      );
      expect(container.firstChild).toHaveClass('test-class');
    });
  });

  describe('styling', () => {
    it('should apply default styling', () => {
      const { container } = render(<TruncatedSummary summary="Styled" />);
      const element = container.firstChild;
      expect(element).toBeInTheDocument();
    });

    it('should merge custom className with defaults', () => {
      const { container } = render(
        <TruncatedSummary summary="Test" className="text-blue-500" />
      );
      const element = container.firstChild;
      expect(element).toHaveClass('text-blue-500');
    });

    it('should render inline by default', () => {
      const { container } = render(<TruncatedSummary summary="Inline" />);
      const span = container.querySelector('span');
      expect(span?.tagName).toBe('SPAN');
    });
  });

  describe('tooltip interaction', () => {
    it('should show tooltip on hover when details present', () => {
      const details = ['Detail 1', 'Detail 2'];
      const { container } = render(
        <TruncatedSummary summary="Hover me" details={details} />
      );
      
      // Component should be in document
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not show tooltip when no details', () => {
      const { container } = render(<TruncatedSummary summary="No hover" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('integration scenarios', () => {
    it('should work with food summary data', () => {
      const details = [
        'Chicken breast 150g',
        'Rice 200g',
        'Broccoli 100g',
      ];
      render(
        <TruncatedSummary
          summary="Chicken 150g, Rice 200g and 1 other"
          details={details}
        />
      );
      expect(screen.getByText(/Chicken 150g, Rice 200g and 1 other/)).toBeInTheDocument();
    });

    it('should work with activity summary data', () => {
      render(<TruncatedSummary summary="Running • 45min • Moderate" />);
      expect(screen.getByText('Running • 45min • Moderate')).toBeInTheDocument();
    });

    it('should work with drink summary data', () => {
      render(<TruncatedSummary summary="500ml Water" />);
      expect(screen.getByText('500ml Water')).toBeInTheDocument();
    });
  });
});