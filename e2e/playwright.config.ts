import { defineConfig, devices } from '@playwright/test';
import { AddressInfo, createServer } from 'node:net';

const previewHost = process.env.E2E_HOST ?? '127.0.0.1';

async function findAvailablePort(preferredPort: number, host: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const tester = createServer();
    tester.unref();

    const resolveWithPort = (port: number) => {
      if (tester.listening) {
        tester.close(() => resolve(port));
        return;
      }
      resolve(port);
    };

    tester.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code !== 'EADDRINUSE') {
        reject(error);
        return;
      }

      const fallbackServer = createServer();
      fallbackServer.unref();
      fallbackServer.once('error', reject);
      fallbackServer.listen(0, host, () => {
        const address = fallbackServer.address() as AddressInfo;
        fallbackServer.close(() => resolve(address.port));
      });
    });

    tester.listen(preferredPort, host, () => {
      const address = tester.address() as AddressInfo;
      resolveWithPort(address.port);
    });
  });
}

const preferredPort = Number.parseInt(process.env.E2E_PORT ?? '', 10) || 4173;
const resolvedPort = await findAvailablePort(preferredPort, previewHost);
const baseURL = process.env.E2E_BASE_URL || `http://${previewHost}:${resolvedPort}`;

const isCI = Boolean(process.env.CI);
const workers = isCI ? 2 : undefined;
const reuseExistingServer = !isCI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  ...(typeof workers === 'number' ? { workers } : {}),
  webServer: {
    command: `npm run build && npm run preview -- --host ${previewHost} --port ${resolvedPort}`,
    url: baseURL,
    reuseExistingServer,
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
