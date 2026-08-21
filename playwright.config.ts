import { defineConfig, devices } from '@playwright/test';
import { ENGINES, LAYOUT_PROFILES, type Engine, type LayoutProfile } from './e2e/coverage-ledger';
import {
  IS_PRODUCTION_RUN,
  PREVIEW_PORT,
  PRODUCT_DEV_PORT,
  PRODUCT_URL,
  PRODUCTION_PORT,
} from './e2e/servers';

const isCI = !!process.env['CI'];

/**
 * Escape hatches for environments whose preinstalled browser build does not
 * match the one this Playwright version pins (some containers and managed CI
 * images). They point at a compatible executable — they never rename or remove
 * a project, because the matrix is a requirement, not a default
 * (verification contract, "Browser/profile matrix").
 */
const executablePath: Record<Engine, string | undefined> = {
  chromium: process.env['E2E_CHROMIUM_PATH'],
  firefox: process.env['E2E_FIREFOX_PATH'],
};

/** Viewport and primary input for each of the five layout profiles. */
const PROFILES: Record<
  LayoutProfile,
  { viewport: { width: number; height: number }; touch: boolean }
> = {
  desktop: { viewport: { width: 1440, height: 900 }, touch: false },
  'tablet-portrait': { viewport: { width: 834, height: 1112 }, touch: true },
  'tablet-landscape': { viewport: { width: 1112, height: 834 }, touch: true },
  'mobile-portrait': { viewport: { width: 390, height: 844 }, touch: true },
  'mobile-landscape': { viewport: { width: 844, height: 390 }, touch: true },
};

/**
 * Engine defaults are stated explicitly per engine.
 *
 * Firefox deliberately does not inherit `devices['Desktop Chrome']`: doing so
 * would hand it a Chrome user agent and Chrome device metrics, and the run
 * would then claim two-engine coverage it does not have.
 *
 * Firefox accepts `hasTouch` and `page.tap()` works, but it reports
 * `navigator.maxTouchPoints` as 0. Touch assertions therefore exercise tap
 * behaviour rather than reading that counter.
 */
const ENGINE_DEFAULTS: Record<Engine, Record<string, unknown>> = {
  chromium: { ...devices['Desktop Chrome'], viewport: null, deviceScaleFactor: undefined },
  firefox: { ...devices['Desktop Firefox'], viewport: null, deviceScaleFactor: undefined },
};

/**
 * Ten named projects: five layout profiles in each of two engines.
 *
 * Every primary journey runs in all ten. CI may shard this matrix; it may not
 * reduce it.
 */
const projects = ENGINES.flatMap((engine) =>
  LAYOUT_PROFILES.map((profile) => {
    const { viewport, touch } = PROFILES[profile];
    const path = executablePath[engine];
    return {
      name: `${engine}-${profile}`,
      use: {
        ...ENGINE_DEFAULTS[engine],
        browserName: engine,
        viewport,
        hasTouch: touch,
        ...(path ? { launchOptions: { executablePath: path } } : {}),
      },
    };
  }),
);

export default defineConfig({
  testDir: './e2e',
  outputDir: './dist/e2e-results',
  // The offline journey needs a service worker, and a service worker only
  // exists in a production build. It runs under `pnpm run e2e:offline`, which
  // serves the built output; a development run would otherwise fail it for a
  // reason that has nothing to do with the behaviour under test.
  testIgnore: IS_PRODUCTION_RUN ? [] : ['**/offline.spec.ts'],
  fullyParallel: true,
  forbidOnly: isCI,
  // Retries are diagnostic only: a test that passes on retry still fails the
  // run, so flakiness cannot be absorbed into a green build.
  retries: isCI ? 2 : 0,
  failOnFlakyTests: isCI,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: PRODUCT_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects,

  // A production run serves the built output so the service worker exists; a
  // development run serves the product and the preview catalogue.
  webServer: IS_PRODUCTION_RUN
    ? [
        {
          command: `pnpm exec ng build && node scripts/serve-production.mjs dist/elite-dangerous-ship-builder/browser ${PRODUCTION_PORT}`,
          url: `http://localhost:${PRODUCTION_PORT}`,
          reuseExistingServer: !isCI,
          timeout: 300_000,
        },
      ]
    : [
        {
          command: `pnpm exec ng serve --port ${PRODUCT_DEV_PORT}`,
          url: `http://localhost:${PRODUCT_DEV_PORT}`,
          reuseExistingServer: !isCI,
          timeout: 180_000,
        },
        {
          command: `pnpm exec ng serve ui-preview --port ${PREVIEW_PORT}`,
          url: `http://localhost:${PREVIEW_PORT}`,
          reuseExistingServer: !isCI,
          timeout: 180_000,
        },
      ],
});
