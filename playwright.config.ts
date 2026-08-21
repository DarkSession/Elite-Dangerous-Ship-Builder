import { defineConfig, devices } from '@playwright/test';
import {
  ENGINES,
  LAYOUT_PROFILES,
  TIMING_PROJECT,
  TIMING_SPEC,
  type Engine,
  type LayoutProfile,
} from './e2e/coverage-ledger';
import {
  IS_PRODUCTION_RUN,
  PREVIEW_PORT,
  PRODUCT_DEV_PORT,
  PRODUCT_URL,
  PRODUCTION_PORT,
} from './e2e/servers';

const isCI = !!process.env['CI'];

/**
 * Specs no run may load, whatever else it selects.
 *
 * A project that declares `testIgnore` replaces this list rather than adding to
 * it, so every project that needs its own exclusion composes it with these. The
 * offline journey needs a service worker, and a service worker only exists in a
 * production build. It runs under `pnpm run e2e:offline`, which serves the built
 * output; a development run would otherwise fail it for a reason that has
 * nothing to do with the behaviour under test.
 */
const NEVER_IN_A_DEVELOPMENT_RUN = IS_PRODUCTION_RUN
  ? []
  : ['**/offline.spec.ts', '**/offline-privacy.spec.ts'];

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
const matrixProjects = ENGINES.flatMap((engine) =>
  LAYOUT_PROFILES.map((profile) => {
    const { viewport, touch } = PROFILES[profile];
    const path = executablePath[engine];
    return {
      name: `${engine}-${profile}`,
      // The one measurement that needs Chromium's DevTools Protocol runs in its
      // own project below. Ignoring its file here is what keeps a Firefox
      // project from loading a test it cannot run — the alternative is a test
      // that skips itself at runtime, which is forbidden outright.
      testIgnore: [...NEVER_IN_A_DEVELOPMENT_RUN, TIMING_SPEC],
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

/**
 * The SC-002 measurement, at the mobile viewport, under Chromium alone.
 *
 * Its own project so it runs exactly once rather than ten times, and so the
 * declaration that this measurement is Chromium-only lives here in the matrix
 * rather than inside the test as a runtime condition.
 */
const timingProject = {
  name: TIMING_PROJECT,
  testMatch: [TIMING_SPEC],
  use: {
    ...ENGINE_DEFAULTS.chromium,
    browserName: 'chromium' as const,
    viewport: PROFILES['mobile-portrait'].viewport,
    hasTouch: PROFILES['mobile-portrait'].touch,
    ...(executablePath.chromium
      ? { launchOptions: { executablePath: executablePath.chromium } }
      : {}),
  },
};

const projects = [...matrixProjects, timingProject];

export default defineConfig({
  testDir: './e2e',
  outputDir: './dist/e2e-results',
  testIgnore: NEVER_IN_A_DEVELOPMENT_RUN,
  fullyParallel: true,
  forbidOnly: isCI,
  // Retries are diagnostic only: a test that passes on retry still fails the
  // run, so flakiness cannot be absorbed into a green build.
  retries: isCI ? 2 : 0,
  failOnFlakyTests: isCI,
  workers: isCI ? 2 : undefined,
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
