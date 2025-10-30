/**
 * Simple logger utility
 * Can be replaced with a more sophisticated logging solution if needed
 */

/* eslint-disable no-console */
export const logger = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  debug: (...args: unknown[]) => console.debug('[DEBUG]', ...args),
};
/* eslint-enable no-console */

