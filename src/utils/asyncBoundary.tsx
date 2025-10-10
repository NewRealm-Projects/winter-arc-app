import { ComponentType } from 'react';
import { AsyncBoundary } from '../components/AsyncBoundary';
import type { AsyncBoundaryProps } from '../components/AsyncBoundary';

/**
 * Higher-order component for async data fetching
 */
export function withAsyncBoundary<P extends object>(
  Component: ComponentType<P>,
  options?: Omit<AsyncBoundaryProps, 'children'>
) {
  return function AsyncBoundaryWrapper(props: P) {
    return (
      <AsyncBoundary {...options}>
        <Component {...props} />
      </AsyncBoundary>
    );
  };
}
