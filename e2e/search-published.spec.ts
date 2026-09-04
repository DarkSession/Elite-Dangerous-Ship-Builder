import { expect, test } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import { SITE_ORIGIN } from '../src/app/platform/browser/site-address';
import { PRODUCT_URL } from './servers';

/**
 * What a reader that runs no script is actually served, address by address.
 *
 * The other half of this feature's journey — `search-visibility.spec.ts` —
 * watches the application rewrite the head as a Commander moves. This half
 * never runs the application at all. It fetches the documents the build wrote
 * and reads them, because that is what a crawler and a chat client do, and
 * because the two halves fail differently: the head can be perfect in the
 * browser while every address serves a 404 with the site's own title on it.
 *
 * It needs the production output, so it runs under `pnpm run e2e:offline`
 * beside the other journeys that do (`playwright.config.ts`,
 * `NEVER_IN_A_DEVELOPMENT_RUN`). `scripts/serve-production.mjs` resolves
 * `<path>.html` before a directory, which is the order GitHub Pages resolves
 * in, so `/ships` here answers with the document the deployment publishes
 * rather than with the single-page fallback.
 */

/** One value out of a fetched document, or the empty string. */
function value(document: string, pattern: RegExp): string {
  return pattern.exec(document)?.[1] ?? '';
}

const title = (document: string) => value(document, /<title>([^<]*)<\/title>/);
const description = (document: string) =>
  value(document, /name="description"[^>]*content="([^"]*)"/s);
const canonical = (document: string) => value(document, /rel="canonical"[^>]*href="([^"]*)"/);

test.describe('the document each published address answers with', () => {
  test('answers from its own document, without a redirect', async ({ page }) => {
    // A crawler drops a 404 whatever the body says, canonical link and all, and
    // a redirect indexes the address it lands on rather than the one advertised.
    //
    // The status alone proves nothing here: this server, like the static host
    // it mirrors, answers an unpublished path with the application shell at
    // 200. What separates a published document from that fallback is the
    // canonical it carries — the shell's names the site root — so that is what
    // is read.
    for (const path of ['/ships', '/build', '/equipment', '/ships/Anaconda']) {
      const response = await page.request.get(`${PRODUCT_URL}${path}`, { maxRedirects: 0 });

      expect(response.status(), path).toBe(200);
      expect(canonical(await response.text()), path).toBe(`${SITE_ORIGIN}${path}`);
    }

    // The other half of that claim: an address nobody published does fall
    // through, so the assertion above is about publication and not about the
    // server answering everything.
    const fallback = await (await page.request.get(`${PRODUCT_URL}/nothing-here`)).text();
    expect(canonical(fallback)).toBe(`${SITE_ORIGIN}/`);
  });

  test('carries the screen its address is, not the application in general', async ({ page }) => {
    // All three top-level addresses, because a mapping exchanged between two of
    // them would leave every key declared somewhere and only the pairing wrong.
    // The saved builds were a fourth until 2026-09-04, when they stopped being
    // an address at all: they are a layer over the screen a Commander is on,
    // and there is no document for a crawler to read.
    const catalogue = await (await page.request.get(`${PRODUCT_URL}/ships`)).text();
    const workspace = await (await page.request.get(`${PRODUCT_URL}/build`)).text();
    const bench = await (await page.request.get(`${PRODUCT_URL}/equipment`)).text();

    expect(description(catalogue)).toBe(englishMessages['catalogue.description']);
    expect(canonical(catalogue)).toBe(`${SITE_ORIGIN}/ships`);

    expect(description(workspace)).toBe(englishMessages['workspace.description']);
    expect(title(workspace)).toBe(
      `${englishMessages['workspace.title']} · ${englishMessages['app.name']}`,
    );
    expect(canonical(workspace)).toBe(`${SITE_ORIGIN}/build`);

    expect(description(bench)).toBe(englishMessages['equipment.description']);
    expect(title(bench)).toBe(
      `${englishMessages['equipment.title']} · ${englishMessages['app.name']}`,
    );
    expect(canonical(bench)).toBe(`${SITE_ORIGIN}/equipment`);
  });

  test('names the hull, and shows the hull, on a hull address', async ({ page }) => {
    // One hull by name, deliberately. The address *set* belongs to the Almanac
    // and is counted rather than listed below; a single well-known member of it
    // is a fixture, and naming it is what lets this assert that the title, the
    // description and the card all say the same hull.
    const document = await (await page.request.get(`${PRODUCT_URL}/ships/Anaconda`)).text();

    expect(title(document)).toBe(`Anaconda · ${englishMessages['app.name']}`);
    expect(description(document)).toContain('Anaconda');
    expect(canonical(document)).toBe(`${SITE_ORIGIN}/ships/Anaconda`);
    expect(value(document, /property="og:image"[^>]*content="([^"]*)"/)).toBe(
      `${SITE_ORIGIN}/assets/ships/Anaconda/illustration.png`,
    );
    // The alt text is the title, so the picture is described in whatever
    // language the document is in rather than in one of its own.
    expect(value(document, /property="og:image:alt"[^>]*content="([^"]*)"/)).toBe(title(document));
  });

  test('publishes one document for every address the map advertises', async ({ page }) => {
    const sitemap = await (await page.request.get(`${PRODUCT_URL}/sitemap.xml`)).text();
    const advertised = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(
      (match) => match[1],
    );

    // More than the three top-level addresses, because every hull has one.
    // Counted rather than named: the set belongs to the Almanac.
    expect(advertised.length).toBeGreaterThan(40);

    for (const address of advertised) {
      const path = address.slice(SITE_ORIGIN.length);
      const response = await page.request.get(`${PRODUCT_URL}${path}`, { maxRedirects: 0 });

      expect(response.status(), address).toBe(200);
      expect(canonical(await response.text()), address).toBe(address);
    }
  });

  test('keeps the application’s own identity on the page that catches everything else', async ({
    page,
  }) => {
    // `404.html` answers an address nobody published, so it is the one document
    // that should not claim to be a screen.
    const document = await (await page.request.get(`${PRODUCT_URL}/404.html`)).text();

    expect(title(document)).toBe(englishMessages['app.document-title.default']);
    expect(description(document)).toBe(englishMessages['app.description']);
    expect(canonical(document)).toBe(`${SITE_ORIGIN}/`);
  });
});
