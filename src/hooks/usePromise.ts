/**
 * React 19 use() hook polyfill/wrapper
 *
 * Provides a consistent API for promise handling with Suspense
 */

import { useEffect, useRef, useState } from 'react';

type PromiseStatus<T> =
  | { status: 'pending' }
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: unknown };

// Cache for promises to enable Suspense
const promiseCache = new WeakMap<Promise<any>, PromiseStatus<any>>();

/**
 * React 19-style use() hook for promises
 * Throws promises for Suspense and errors for Error Boundaries
 */
export function use<T>(promise: Promise<T>): T {
  // Check if we have a cached result
  const cached = promiseCache.get(promise);

  if (cached) {
    switch (cached.status) {
      case 'fulfilled':
        return cached.value;
      case 'rejected':
        throw cached.reason;
      case 'pending':
        throw promise;
    }
  }

  // Initialize as pending
  promiseCache.set(promise, { status: 'pending' });

  // Attach handlers
  promise.then(
    (value) => {
      promiseCache.set(promise, { status: 'fulfilled', value });
    },
    (reason) => {
      promiseCache.set(promise, { status: 'rejected', reason });
    }
  );

  // Throw the promise to trigger Suspense
  throw promise;
}

/**
 * Create a resource for Suspense data fetching
 */
export function createResource<T>(
  fetcher: () => Promise<T>
): {
  read(): T;
  reload(): void;
  preload(): void;
} {
  let promise: Promise<T> | null = null;

  const load = () => {
    promise = fetcher();
    return promise;
  };

  return {
    read(): T {
      if (!promise) {
        promise = load();
      }
      return use(promise);
    },
    reload() {
      promise = null;
      load();
    },
    preload() {
      if (!promise) {
        load();
      }
    },
  };
}

/**
 * Hook for deferred values (React 19 pattern)
 */
export function useDeferredValue<T>(value: T, timeoutMs = 200): T {
  const [deferredValue, setDeferredValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDeferredValue(value);
    }, timeoutMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, timeoutMs]);

  return deferredValue;
}

/**
 * Hook for optimistic updates (React 19 pattern)
 */
export function useOptimistic<T, U>(
  passthrough: T,
  reducer: (state: T, action: U) => T
): [T, (action: U) => void] {
  const [optimisticValue, setOptimisticValue] = useState(passthrough);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setOptimisticValue(passthrough);
    }
  }, [passthrough, isPending]);

  const updateOptimistic = (action: U) => {
    setIsPending(true);
    setOptimisticValue(reducer(optimisticValue, action));

    // Reset after a short delay (simulating async operation)
    setTimeout(() => setIsPending(false), 0);
  };

  return [optimisticValue, updateOptimistic];
}

/**
 * Hook for transitions (React 19 pattern)
 */
export function useTransition(): [boolean, (callback: () => void) => void] {
  const [isPending, setIsPending] = useState(false);

  const startTransition = (callback: () => void) => {
    setIsPending(true);

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        callback();
        setIsPending(false);
      });
    } else {
      setTimeout(() => {
        callback();
        setIsPending(false);
      }, 0);
    }
  };

  return [isPending, startTransition];
}

/**
 * Preload data for faster navigation
 */
export function preload<T>(
  key: string,
  fetcher: () => Promise<T>
): void {
  const resource = resourceMap.get(key);
  if (!resource) {
    const newResource = createResource(fetcher);
    resourceMap.set(key, newResource);
    newResource.preload();
  }
}

// Global resource map for preloading
const resourceMap = new Map<string, ReturnType<typeof createResource>>();

export function useResource<T>(
  key: string,
  fetcher: () => Promise<T>
): T {
  let resource = resourceMap.get(key);

  if (!resource) {
    resource = createResource(fetcher);
    resourceMap.set(key, resource);
  }

  return resource.read();
}