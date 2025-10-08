import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import * as Sentry from '@sentry/react';
import type { MockInstance } from 'vitest';

import { SentryErrorButton } from '../components/SentryErrorButton';

describe('SentryErrorButton', () => {
  const label = 'Trigger test error';
  const message = 'Sentry button test error';

  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    const captureException = Sentry.captureException as unknown as MockInstance;
    captureException.mockClear();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('captures the error with Sentry and throws it to the nearest error boundary', () => {
    const captureException = Sentry.captureException as unknown as MockInstance;

    render(<SentryErrorButton label={label} errorMessage={message} />);

    const button = screen.getByRole('button', { name: label });

    expect(() => {
      fireEvent.click(button);
    }).toThrow(message);

    expect(captureException).toHaveBeenCalled();
    const calls = captureException.mock.calls as unknown[];
    const lastCall = calls[calls.length - 1] as unknown[] | undefined;
    const capturedError = lastCall?.[0];
    expect(capturedError).toBeInstanceOf(Error);
    expect((capturedError as Error).message).toBe(message);
  });
});
