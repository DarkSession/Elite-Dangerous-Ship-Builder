import { defineConfig, devices } from '@playwright/test';

const PORT = 4200;
const BASE_URL = process.env['E2E_BASE_URL'] ?? `http://localhost:${PORT}`;
const isCI = !!process.env['CI'];

/**
 * Escape hatch for environments that ship a preinstalled Chromium whose build
 * does not match the one this Playwright version pins (some containers and
 * managed CI images). Leave unset to use Playwright's own browser.
 */
const chromiumPath = process.env['E2E_CHROMIUM_PATH'];
const launch = chromiumPath
  ? { channel: undefined, launchOptions: { executablePath: chromiumPath } }
  : {};

/**
 * End-to-end tests run against the three form factors the application supports:
 * desktop, tablet and mobile. Every user-facing feature must pass on all three
 * — see the constitution's "Works on Desktop, Tablet and Mobile" principle.
 *
 * The projects pin explicit viewports rather than relying on device presets
 * alone, so a layout regression at a specific breakpoint fails loudly.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './dist/e2e-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ...launch },
    },
    {
      name: 'tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 834, height: 1112 },
        hasTouch: true,
        ...launch,
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        hasTouch: true,
        ...launch,
      },
    },
  ],

  webServer: {
    command: `pnpm exec ng serve --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
