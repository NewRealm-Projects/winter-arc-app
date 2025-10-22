import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TrainingCardModal from '../TrainingCardModal';

interface MockModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

interface MockButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

// Mock AppModal
vi.mock('../../ui/AppModal', () => ({
  AppModal: ({ open, onClose, children, footer }: MockModalProps) =>
    open ? (
      <div data-testid="app-modal" onClick={onClose}>
        {children}
        {footer}
      </div>
    ) : null,
  ModalSecondaryButton: ({ onClick, children }: MockButtonProps) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

// Mock UnifiedTrainingCard
vi.mock('../../UnifiedTrainingCard', () => ({
  default: () => <div data-testid="unified-training-card">Training Card Content</div>,
}));

describe('TrainingCardModal', () => {
  it('renders modal with training card content when open', () => {
    const onClose = vi.fn();
    render(<TrainingCardModal open={true} onClose={onClose} />);

    expect(screen.getByTestId('app-modal')).toBeInTheDocument();
    expect(screen.getByTestId('unified-training-card')).toBeInTheDocument();
  });

  it('renders close button in footer', () => {
    const onClose = vi.fn();
    render(<TrainingCardModal open={true} onClose={onClose} />);

    const closeButton = screen.getByText('Close');
    expect(closeButton).toBeInTheDocument();
  });
});
