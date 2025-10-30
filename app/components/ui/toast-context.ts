import { createContext } from 'react';

export interface ToastContextValue {
  showToast: (options: { message: string; type?: 'success' | 'warning' | 'error'; duration?: number }) => string;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

