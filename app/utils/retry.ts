import * as Sentry from '@sentry/react';

/**
 * Options for retry with exponential backoff
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds before first retry (default: 1000ms) */
  baseDelay?: number;
  /** Optional callback for retry events */
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Executes an async function with exponential backoff retry logic.
 * Retries on failure with delays: 1s, 2s, 4s (default)
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to function result
 * @throws Error if all retry attempts fail
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => saveDailyCheckInAndRecalc(dateKey, data),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, onRetry } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;

      // Log retry attempt to Sentry (breadcrumb, not error)
      Sentry.addBreadcrumb({
        category: 'retry',
        message: `Retry attempt ${attempt + 1}/${maxRetries}`,
        level: 'info',
        data: {
          attempt: attempt + 1,
          maxRetries,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      // If last attempt, throw error
      if (isLastAttempt) {
        Sentry.addBreadcrumb({
          category: 'retry',
          message: 'Max retries exceeded',
          level: 'error',
          data: {
            maxRetries,
            error: error instanceof Error ? error.message : String(error),
          },
        });
        throw error;
      }

      // Call onRetry callback if provided
      if (onRetry && error instanceof Error) {
        onRetry(attempt + 1, error);
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached due to throw in last attempt
  throw new Error('Max retries exceeded');
}

