import { useCallback, useEffect, useRef, type ReactNode, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

export interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
  preventCloseOnBackdrop?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

const getFocusableSelectors = (): string =>
  [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

export function AppModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  children,
  footer,
  preventCloseOnBackdrop = false,
  initialFocusRef,
}: AppModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!open) {
      return;
    }

    const focusFirstElement = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(getFocusableSelectors());
      focusable?.[0]?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(getFocusableSelectors());
        if (!focusable || focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(focusFirstElement, 50);

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [open, onClose, initialFocusRef]);

  const handleOverlayClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (preventCloseOnBackdrop) {
        return;
      }

      if (event.target === overlayRef.current) {
        onClose();
      }
    },
    [preventCloseOnBackdrop, onClose]
  );

  if (!open) {
    return null;
  }

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in"
      style={{
        zIndex: 'var(--z-overlay)',
        backgroundColor: 'var(--wa-overlay)',
      }}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId.current : undefined}
        className={`w-full ${SIZE_CLASSES[size]} max-h-[90vh] rounded-2xl p-6 shadow-2xl animate-scale-fade-in focus:outline-none`}
        style={{
          zIndex: 'var(--z-modal)',
          backgroundColor: 'var(--wa-surface-elev)',
          borderRadius: 'var(--wa-radius-xl)',
          boxShadow: 'var(--wa-shadow-lg)',
          border: '1px solid var(--wa-border)',
          transition: 'var(--wa-transition)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || subtitle || icon) && (
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {icon && (
                <div className="flex-shrink-0 text-gray-700 dark:text-gray-300" aria-hidden="true">
                  {icon}
                </div>
              )}
              <div className="flex-1">
                {title && (
                  <h2
                    id={titleId.current}
                    className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 flex-shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-winter-500"
              aria-label="Close dialog"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-12rem)]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// Optional: Export convenience button components for consistent styling
export function ModalPrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl bg-winter-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-winter-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-winter-400 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export function ModalSecondaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-winter-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      {children}
    </button>
  );
}
