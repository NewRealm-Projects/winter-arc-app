import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import * as sentryService from '../services/sentryService';

import { SentryErrorButton } from '../components/SentryErrorButton';

vi.mock('../services/sentryService', () => ({
  captureException: vi.fn(),
}));

describe('SentryErrorButton', () => {
  const label = 'Trigger test error';
  const message = 'Sentry button test error';

  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('captures the error with Sentry and throws it to the nearest error boundary', () => {
    render(<SentryErrorButton label={label} errorMessage={message} />);

    const button = screen.getByRole('button', { name: label });

    expect(() => {
      fireEvent.click(button);
    }).toThrow(message);

    expect(sentryService.captureException).toHaveBeenCalled();
    const calls = (sentryService.captureException as unknown as MockInstance).mock.calls as unknown[];
    const lastCall = calls[calls.length - 1] as unknown[] | undefined;
    const capturedError = lastCall?.[0];
    expect(capturedError).toBeInstanceOf(Error);
    expect((capturedError as Error).message).toBe(message);
  });
});
