import * as Sentry from '@sentry/react';

/**
 * Logging utility with conditional output and Sentry integration
 * - In production: Only errors are logged and sent to Sentry
 * - In development: All logs are shown in console
 * - In test: Logging is suppressed
 */

type LogLevel = 'info' | 'warn' | 'error';

const isDev = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test' || typeof process !== 'undefined' && process.env?.VITEST === 'true';
const isProd = import.meta.env.PROD;

/**
 * Internal log function
 */
function log(level: LogLevel, message: string, ...args: unknown[]): void {
  // Suppress all logging in test environment
  if (isTest) {
    return;
  }

  // In development, log everything to console
  if (isDev) {
    const prefix = `[${level.toUpperCase()}]`;
    switch (level) {
      case 'info':
        // Use console.warn for info in dev (ESLint allows warn/error only)
        console.warn(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
    }
  }

  // In production, only send errors to Sentry
  if (isProd && level === 'error') {
    Sentry.captureException(new Error(message), {
      extra: { args },
    });
  }
}

/**
 * Logger object with info, warn, and error methods
 */
export const logger = {
  /**
   * Log informational messages (dev only)
   */
  info: (message: string, ...args: unknown[]): void => {
    log('info', message, ...args);
  },

  /**
   * Log warning messages (dev only)
   */
  warn: (message: string, ...args: unknown[]): void => {
    log('warn', message, ...args);
  },

  /**
   * Log error messages (dev + prod with Sentry)
   */
  error: (message: string, ...args: unknown[]): void => {
    log('error', message, ...args);
  },
};
