import { Suspense, type ReactNode, type ComponentType } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Skeleton } from './ui/Skeleton';

interface AsyncBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * React 19 Pattern: Combine Error Boundary with Suspense
 * Provides a consistent loading and error experience
 */
export function AsyncBoundary({
  children,
  fallback = <DefaultLoadingFallback />,
  errorFallback: ErrorFallback = DefaultErrorFallback,
  onError,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <ErrorFallback error={error} resetError={resetError} />
      )}
      onError={onError}
    >
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}

/**
 * Default loading fallback component
 */
function DefaultLoadingFallback() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-red-600 dark:text-red-400">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Something went wrong
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={resetError}
            className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

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

/**
 * Stream component for progressive rendering (React 19 pattern)
 */
export function StreamingList<T>({
  items,
  renderItem,
  fallback,
  chunkSize = 10,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  fallback?: ReactNode;
  chunkSize?: number;
}) {
  return (
    <>
      {items.slice(0, chunkSize).map(renderItem)}
      {items.length > chunkSize && (
        <Suspense fallback={fallback}>
          <DeferredItems
            items={items.slice(chunkSize)}
            renderItem={renderItem}
            chunkSize={chunkSize}
          />
        </Suspense>
      )}
    </>
  );
}

function DeferredItems<T>({
  items,
  renderItem,
  chunkSize,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  chunkSize: number;
}) {
  // Simulate deferred rendering
  return (
    <>
      {items.slice(0, chunkSize).map((item, index) =>
        renderItem(item, index + chunkSize)
      )}
      {items.length > chunkSize && (
        <Suspense fallback={null}>
          <DeferredItems
            items={items.slice(chunkSize)}
            renderItem={renderItem}
            chunkSize={chunkSize}
          />
        </Suspense>
      )}
    </>
  );
}