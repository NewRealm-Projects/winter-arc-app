import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';

const isCI = Boolean(process.env.CI);
const workers = isCI ? 2 : undefined;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  ...(typeof workers === 'number' ? { workers } : {}),
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: baseURL,
    reuseExistingServer: !isCI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 180_000,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/playwright-report', open: 'never' }],
  ],
  outputDir: 'artifacts/test-results',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'], viewport: { width: 414, height: 896 } },
    },
  ],
});
