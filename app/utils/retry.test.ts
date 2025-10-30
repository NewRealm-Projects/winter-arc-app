import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/react';
import { retryWithBackoff } from './retry';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  addBreadcrumb: vi.fn(),
}));

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should succeed on first attempt without retry', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');

    const result = await retryWithBackoff(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
  });

  it('should retry after transient failure', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Transient failure'))
      .mockResolvedValueOnce('success');

    const promise = retryWithBackoff(mockFn);

    // Fast-forward through the 1s delay
    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'retry',
        message: 'Retry attempt 1/3',
        level: 'info',
      })
    );
  });

  it('should throw error after max retries exceeded', async () => {
    const error = new Error('Persistent failure');
    const mockFn = vi.fn().mockRejectedValue(error);

    const promise = retryWithBackoff(mockFn, { maxRetries: 3 });
    // Prevent unhandled rejection warning
    promise.catch(() => {});

    // Fast-forward through delays: 1s, 2s
    await vi.advanceTimersByTimeAsync(1000); // First retry
    await vi.advanceTimersByTimeAsync(2000); // Second retry

    await expect(promise).rejects.toThrow('Persistent failure');
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'retry',
        message: 'Max retries exceeded',
        level: 'error',
      })
    );
  });

  it('should use exponential backoff timing', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Fail'));

    const promise = retryWithBackoff(mockFn, {
      maxRetries: 3,
      baseDelay: 1000,
    });
    // Prevent unhandled rejection warning
    promise.catch(() => {});

    // First attempt: immediate
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Second attempt: after 1s (2^0 * 1000ms)
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Third attempt: after 2s (2^1 * 1000ms)
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockFn).toHaveBeenCalledTimes(3);

    // Should throw now
    await expect(promise).rejects.toThrow('Fail');
  });

  it('should log Sentry breadcrumb for each retry attempt', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('success');

    const promise = retryWithBackoff(mockFn);

    // Advance through retries
    await vi.advanceTimersByTimeAsync(1000); // First retry
    await vi.advanceTimersByTimeAsync(2000); // Second retry

    await promise;

    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(2);
    expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        category: 'retry',
        message: 'Retry attempt 1/3',
        data: expect.objectContaining({
          attempt: 1,
          error: 'Fail 1',
        }),
      })
    );
    expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        category: 'retry',
        message: 'Retry attempt 2/3',
        data: expect.objectContaining({
          attempt: 2,
          error: 'Fail 2',
        }),
      })
    );
  });

  it('should call onRetry callback on each retry', async () => {
    const onRetry = vi.fn();
    const error1 = new Error('Fail 1');
    const error2 = new Error('Fail 2');
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error1)
      .mockRejectedValueOnce(error2)
      .mockResolvedValueOnce('success');

    const promise = retryWithBackoff(mockFn, { onRetry });

    // Advance through retries
    await vi.advanceTimersByTimeAsync(1000); // First retry
    await vi.advanceTimersByTimeAsync(2000); // Second retry

    await promise;

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, error1);
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, error2);
  });

  it('should respect custom maxRetries option', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Fail'));

    const promise = retryWithBackoff(mockFn, { maxRetries: 2 });
    // Prevent unhandled rejection warning
    promise.catch(() => {});

    // Fast-forward through delays
    await vi.advanceTimersByTimeAsync(1000); // First retry

    await expect(promise).rejects.toThrow('Fail');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should respect custom baseDelay option', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValueOnce('success');

    const promise = retryWithBackoff(mockFn, { baseDelay: 500 });

    // Should retry after 500ms (not 1000ms)
    await vi.advanceTimersByTimeAsync(500);

    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should handle non-Error thrown values', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce('string error')
      .mockResolvedValueOnce('success');

    const promise = retryWithBackoff(mockFn);

    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;

    expect(result).toBe('success');
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          error: 'string error',
        }),
      })
    );
  });
});

