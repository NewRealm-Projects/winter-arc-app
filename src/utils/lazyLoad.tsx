import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '../components/ui/Skeleton';

/**
 * Lazy-loaded component wrapper with loading fallback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withLazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <Skeleton className="h-32 w-full" />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}
