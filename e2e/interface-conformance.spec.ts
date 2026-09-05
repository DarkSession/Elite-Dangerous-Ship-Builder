import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  clippedText,
  expectLandmarks,
  expectNameMatchesVisibleText,
  expectNoDocumentOverflow,
  expectNoRawMessages,
  expectOrderedHeadings,
  expectRootLanguage,
  expectSingleVisibleH1,
  expectTargetSizes,
} from './accessibility/assertions';
import { DOUBLED_TEXT, withRootTextScale } from './accessibility/text-scale';
import { PRODUCT_URL } from './servers';
import englishMessages from '../src/app/i18n/locales/en.json';
import germanMessages from '../src/app/i18n/locales/de.json';
import { buildStockHull, openFirstHullFromManifest, openLibrary, reachShellLink } from './shell';

/**
 * Every screen this feature adds, held to the same interface contract.
 *
 * Feature 011 proves the contract on the shell and on the component catalogue.
 * This proves it on the four product routes a Commander actually uses, in all
 * ten layout and engine projects, and under the conditions that break layouts
 * rather than only the one the copy was written in.
 *
 * Nothing here is a substitute for the manual protocols. An automated scan can
 * tell whether a name exists; it cannot tell whether the name means anything.
 */

type ScreenId = 'catalogue' | 'hull-detail' | 'workspace' | 'library';

const SCREENS: readonly ScreenId[] = ['catalogue', 'hull-detail', 'workspace', 'library'];

/**
 * Opens one screen the way a Commander reaches it.
 *
 * The workspace and the library need a build to be about something: an empty
 * workspace is a real state, but it is not the state most of these assertions
 * are for.
 */
async function openScreen(
  page: Page,
  screen: ScreenId,
  messages: Record<string, string> = englishMessages,
): Promise<void> {
  if (screen === 'catalogue') {
    await page.goto('/ships');
  } else if (screen === 'hull-detail') {
    await page.goto('/ships/Anaconda');
  } else {
    await page.goto('/ships/Anaconda');
    await buildStockHull(page, messages['hullDetail.create']);
    await expect(page).toHaveURL(/\/outfitting(#|$)/);
    if (screen === 'library') {
      await openLibrary(page);
    }
  }
  // The route owns the h1 and the shell owns none, so a visible top-level
  // heading is the signal that the lazy route has actually rendered — `main`
  // exists before it does.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

test.describe('cross-route semantics', () => {
  for (const screen of SCREENS) {
    test(`is structurally sound: ${screen}`, async ({ page }, testInfo) => {
      await openScreen(page, screen);

      await expectLandmarks(page);
      await expectSingleVisibleH1(page);
      await expectOrderedHeadings(page);
      await expectRootLanguage(page, { lang: 'en', dir: 'ltr' });
      await expectNoRawMessages(page);
      await expectNoDocumentOverflow(page);
      await expectTargetSizes(page);
      await expectNoAccessibilityViolations(page, testInfo, { label: `conformance-${screen}` });
    });

    test(`names every control with the words on screen: ${screen}`, async ({ page }) => {
      await openScreen(page, screen);

      const controls = page.getByRole('button');
      const count = await controls.count();
      expect(count).toBeGreaterThan(0);

      for (let index = 0; index < count; index += 1) {
        await expectNameMatchesVisibleText(controls.nth(index));
      }
    });
  }

  test('exposes selection, expansion and invalidity programmatically', async ({ page }) => {
    await openScreen(page, 'catalogue');

    // Sorting is a state of the column, exposed where a reader looks for it.
    const sorted = page.locator('th[aria-sort]:not([aria-sort="none"])');
    await expect(sorted.or(page.locator('[aria-sort]')).first()).toBeAttached();

    // Opening a hull marks it as the current one rather than only colouring it.
    await openFirstHullFromManifest(page);
    await expect(page.locator('ednb-hull-detail-page')).toBeVisible();
    await expect(page.locator('[aria-current="true"]').first()).toBeAttached();
  });

  test('keeps exactly one polite and one assertive outlet on every screen', async ({ page }) => {
    test.slow();

    for (const screen of SCREENS) {
      await openScreen(page, screen);

      await expect(page.locator('[data-announcement-outlet="polite"]')).toHaveCount(1);
      await expect(page.locator('[data-announcement-outlet="assertive"]')).toHaveCount(1);
      // Nothing else is live. A region marked live re-announces every unaffected
      // value inside it whenever one of them changes.
      await expect(page.locator('[aria-live]')).toHaveCount(2);
    }
  });

  test('raises no prompt where nothing is at stake', async ({ page }) => {
    // Feature 001 withdrew its replacement question on 2026-08-25: a build being
    // replaced has a record of its own, so there is nothing to warn about and no
    // question to ask. The blocking condition this asserted no longer exists,
    // and asserting that it does not is what is left to check.
    await openScreen(page, 'workspace');

    await reachShellLink(page, 'Ship Builder');
    await page.getByRole('searchbox', { name: 'Search ships or manufacturers' }).fill('Sidewinder');
    await openFirstHullFromManifest(page);
    await buildStockHull(page, 'Build');

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();
  });
});

test.describe('cross-route resilience', () => {
  for (const screen of SCREENS) {
    test(`survives doubled text: ${screen}`, async ({ page }) => {
      await withRootTextScale(page, DOUBLED_TEXT);
      await openScreen(page, screen);

      await expectNoDocumentOverflow(page);
      expect(await clippedText(page), 'content is cut off at 200% text').toEqual([]);
      await expectTargetSizes(page);
    });

    test(`loses nothing with motion removed: ${screen}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openScreen(page, screen);

      // The requirement is not less animation: it is that nothing was ever
      // carried by the animation. Every landmark, heading and control is still
      // here, and still says what it said.
      await expectLandmarks(page);
      await expectSingleVisibleH1(page);
      await expectNoRawMessages(page);
      await expectTargetSizes(page);
    });

    test(`survives a mirrored direction: ${screen}`, async ({ page }) => {
      await openScreen(page, screen);
      await page.evaluate(() => {
        document.documentElement.setAttribute('dir', 'rtl');
      });

      await expectNoDocumentOverflow(page);
      expect(await clippedText(page), 'content is cut off in right-to-left').toEqual([]);
    });
  }

  test('survives expanded copy on every screen', async ({ browser }) => {
    // Four screens, each reached the way a Commander reaches it, in one context.
    test.slow();

    // German rather than a pseudo-locale: it is a shipped language, it is
    // reliably longer than English, and it is reached the only way a Commander
    // can reach a language — by asking for it with their browser.
    const context = await browser.newContext({ baseURL: PRODUCT_URL, locale: 'de-DE' });
    const page = await context.newPage();

    for (const screen of SCREENS) {
      await openScreen(page, screen, germanMessages as Record<string, string>);

      await expectRootLanguage(page, { lang: 'de', dir: 'ltr' });
      await expectNoDocumentOverflow(page);
      expect(await clippedText(page), `content is cut off in German on ${screen}`).toEqual([]);
    }

    await context.close();
  });
});

test.describe('400% browser zoom on every screen', () => {
  // The reflow condition WCAG 1.4.10 states, as a viewport rather than a zoom
  // level: 1280 CSS pixels at 400% is 320 by 256.
  test.use({ viewport: { width: 320, height: 256 } });

  for (const screen of SCREENS) {
    test(`reflows rather than scrolling sideways: ${screen}`, async ({ page }) => {
      await openScreen(page, screen);

      await expectNoDocumentOverflow(page);
      expect(await clippedText(page), 'content is cut off at 400% zoom').toEqual([]);
      await expectLandmarks(page);
    });
  }
});
