import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastContextValue } from './toast-context';

type ToastType = 'success' | 'warning' | 'error';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
}

const DEFAULT_DURATION = 4000;

const toastBaseClass =
  'pointer-events-auto flex min-w-[240px] max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ring-1 ring-black/5 transition-all duration-200';

const toastTypeClasses: Record<ToastType, string> = {
  success: 'bg-emerald-500 text-white',
  warning: 'bg-amber-400 text-black',
  error: 'bg-rose-500 text-white',
};

const iconForType: Record<ToastType, string> = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

function generateToastId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({ message, type = 'success', duration = DEFAULT_DURATION }: ToastOptions) => {
      const id = generateToastId();
      setToasts((current) => [...current, { id, message, type }]);

      const timer = setTimeout(() => {
        dismissToast(id);
      }, duration);

      timers.current.set(id, timer);
      return id;
    },
    [dismissToast]
  );

  useEffect(() => {
    const timersMap = timers.current;
    return () => {
      timersMap.forEach((timer) => clearTimeout(timer));
      timersMap.clear();
    };
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[var(--z-toast,60)] flex w-full flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <ToastItemView key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItemView({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const { type, message } = toast;
  const icon = iconForType[type];

  return (
    <div className={`${toastBaseClass} ${toastTypeClasses[type]}`} role="status">
      <span aria-hidden className="text-lg">
        {icon}
      </span>
      <p className="flex-1 text-left">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="pointer-events-auto rounded-md bg-black/10 px-2 py-1 text-xs font-medium text-white/90 transition hover:bg-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label="Close toast"
      >
        ×
      </button>
    </div>
  );
}
