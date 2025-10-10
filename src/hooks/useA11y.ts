/**
 * Accessibility Hook Collection
 *
 * Provides various accessibility utilities for the app
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Trap focus within a container (for modals, dropdowns, etc.)
 */
export function useFocusTrap(isActive = true) {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Announce messages to screen readers
 */
export function useAnnounce() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcer element
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    document.body.appendChild(announcer);
    announcerRef.current = announcer;

    return () => {
      document.body.removeChild(announcer);
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcerRef.current) return;

    announcerRef.current.setAttribute('aria-live', priority);
    announcerRef.current.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  return announce;
}

/**
 * Skip to main content link
 */
export function useSkipLinks() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('skip-link')) {
        setIsVisible(true);
      }
    };

    const handleBlur = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('skip-link')) {
        setIsVisible(false);
      }
    };

    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  return { isVisible };
}

/**
 * Keyboard navigation hook
 */
export function useKeyboardNavigation(
  items: any[],
  options: {
    onSelect?: (item: any, index: number) => void;
    onEscape?: () => void;
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
  } = {}
) {
  const {
    onSelect,
    onEscape,
    orientation = 'vertical',
    loop = true,
  } = options;

  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            setFocusedIndex((prev) => {
              const next = prev + 1;
              if (next >= items.length) {
                return loop ? 0 : prev;
              }
              return next;
            });
          }
          break;

        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            setFocusedIndex((prev) => {
              const next = prev - 1;
              if (next < 0) {
                return loop ? items.length - 1 : prev;
              }
              return next;
            });
          }
          break;

        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            setFocusedIndex((prev) => {
              const next = prev + 1;
              if (next >= items.length) {
                return loop ? 0 : prev;
              }
              return next;
            });
          }
          break;

        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            setFocusedIndex((prev) => {
              const next = prev - 1;
              if (next < 0) {
                return loop ? items.length - 1 : prev;
              }
              return next;
            });
          }
          break;

        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          break;

        case 'End':
          event.preventDefault();
          setFocusedIndex(items.length - 1);
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (onSelect && items[focusedIndex]) {
            onSelect(items[focusedIndex], focusedIndex);
          }
          break;

        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
      }
    },
    [items, focusedIndex, onSelect, onEscape, orientation, loop]
  );

  return {
    focusedIndex,
    handleKeyDown,
    setFocusedIndex,
  };
}

/**
 * Reduced motion preference
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * High contrast mode detection
 */
export function usePrefersHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersHighContrast;
}

/**
 * ARIA live region for dynamic content updates
 * Returns a ref to attach to your own live region element
 */
export function useLiveRegion(priority: 'polite' | 'assertive' = 'polite') {
  const regionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string) => {
    if (!regionRef.current || !message) return;

    // Set the priority
    regionRef.current.setAttribute('aria-live', priority);
    regionRef.current.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (regionRef.current) {
        regionRef.current.textContent = '';
      }
    }, 1000);
  }, [priority]);

  return { regionRef, announce };
}