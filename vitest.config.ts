import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    css: true,
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/components/dashboard/**/*.{ts,tsx}',
        'src/components/TrainingLoadTile.tsx',
        'src/pages/DashboardPage.tsx',
        'src/routes/**/*.{ts,tsx}',
        'src/store/useStore.ts',
        'src/logic/**/*.ts',
        'src/utils/progress.ts',
        'src/utils/sports.ts',
        'src/utils/tracking.ts',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        branches: 78,
        functions: 80,
      },
    },
    reporters: 'default',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      'e2e/**',
      'tests/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      test: path.resolve(__dirname, './test'),
    },
  },
});
