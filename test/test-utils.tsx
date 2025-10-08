import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';

interface ProvidersProps {
  children: ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  routerProps?: Omit<MemoryRouterProps, 'children'>;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', routerProps, ...options }: CustomRenderOptions = {}
) {
  const initialEntries = routerProps?.initialEntries ?? [route];

  return render(ui, {
    wrapper: function ProvidersWrapper({ children }: ProvidersProps) {
      return (
        <MemoryRouter {...routerProps} initialEntries={initialEntries}>
          <ThemeProvider>{children}</ThemeProvider>
        </MemoryRouter>
      );
    },
    ...options,
  });
}

export { fireEvent, screen, waitFor } from '@testing-library/react';
