import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for previewing built app
 * Use this to take screenshots of the production build
 */
export default defineConfig({
  testDir: './tests/preview',

  timeout: 15 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:8080/winter-arc-app',
    trace: 'on-first-retry',
    screenshot: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Automatically start preview server
  webServer: {
    command: 'npx http-server preview -p 8080',
    url: 'http://localhost:8080/winter-arc-app',
    reuseExistingServer: true,
    timeout: 10 * 1000,
  },
});
