import { ReactElement, ReactNode } from 'react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';

interface ProvidersProps {
  children: ReactNode;
  route?: string;
  routerProps?: Omit<MemoryRouterProps, 'children'>;
}

function Providers({ children, route = '/', routerProps }: ProvidersProps) {
  const initialEntries = routerProps?.initialEntries ?? [route];
  return (
    <MemoryRouter {...routerProps} initialEntries={initialEntries}>
      <ThemeProvider>{children}</ThemeProvider>
    </MemoryRouter>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  routerProps?: Omit<MemoryRouterProps, 'children'>;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', routerProps, ...options }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <Providers route={route} routerProps={routerProps}>
        {children}
      </Providers>
    ),
    ...options,
  });
}

export * from '@testing-library/react';
