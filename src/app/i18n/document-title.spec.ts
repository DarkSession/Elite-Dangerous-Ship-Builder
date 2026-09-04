import { documentHead, publishedAddresses } from '../../../scripts/search/published-addresses.mjs';
import { hullForAddressSegment } from '../domain/ships/catalogue/hull-address';
import { hullArtworkPath } from '../platform/assets/hull-artwork-path';
import { LINK_CARD, SITE_ORIGIN } from '../platform/browser/site-address';
import { resolveDocumentTitle } from './document-title';
import {
  BUNDLED_ENGLISH,
  interpolate,
  type MessageCatalogue,
  type MessageKey,
} from './locale-registry';
import germanCatalogue from './locales/de.json';

/** The bundled catalogue, with only the keys a test is about varied. */
function catalogue(overrides: Partial<Record<string, string>> = {}): MessageCatalogue {
  return { ...BUNDLED_ENGLISH, ...overrides } as MessageCatalogue;
}

describe('resolveDocumentTitle', () => {
  it('publishes the application name where no page is named', () => {
    expect(resolveDocumentTitle(catalogue(), null)).toBe(
      BUNDLED_ENGLISH['app.document-title.default'],
    );
  });

  it('treats a blank page name as no page at all', () => {
    // A caller that has nothing to say must not be able to publish `· NavBeacon`
    // with an empty half.
    expect(resolveDocumentTitle(catalogue(), '   ')).toBe(
      BUNDLED_ENGLISH['app.document-title.default'],
    );
  });

  it('composes the page and the application for an ordinary screen', () => {
    expect(resolveDocumentTitle(catalogue(), 'Saved builds')).toBe(
      `Saved builds · ${BUNDLED_ENGLISH['app.name']}`,
    );
  });

  it('names the tool beside the product on a tool screen', () => {
    // The product is NavBeacon and the screen is the ship builder, so a tool
    // address says which tool it is rather than repeating the product name.
    expect(resolveDocumentTitle(catalogue(), BUNDLED_ENGLISH['catalogue.title'])).toBe(
      `${BUNDLED_ENGLISH['catalogue.title']} · ${BUNDLED_ENGLISH['app.name']}`,
    );
  });

  it('states the product once where the screen is the product', () => {
    // The start page's own name is the product's name, because the screen is
    // the product rather than one of its tools. `NavBeacon · NavBeacon` is not
    // a title anyone would write.
    expect(resolveDocumentTitle(catalogue(), BUNDLED_ENGLISH['app.name'])).toBe(
      BUNDLED_ENGLISH['app.document-title.default'],
    );
    expect(resolveDocumentTitle(catalogue(), ` ${BUNDLED_ENGLISH['app.name']} `)).toBe(
      BUNDLED_ENGLISH['app.document-title.default'],
    );
  });

  it('composes every screen of the other shipped locale on that catalogue as shipped', () => {
    // The real German catalogue rather than an override of the English one:
    // `app.name` is a product name and is not translated, so a screen that is
    // titled in German still stands beside the same product name.
    const german = germanCatalogue as unknown as MessageCatalogue;

    expect(resolveDocumentTitle(german, german['catalogue.title'])).toBe(
      `${german['catalogue.title']} · ${german['app.name']}`,
    );
    expect(resolveDocumentTitle(german, german['library.title'])).toBe(
      `${german['library.title']} · ${german['app.name']}`,
    );
    // And the two really are different screens, so the test above is not
    // comparing one sentence with itself.
    expect(german['catalogue.title']).not.toBe(german['library.title']);
  });

  it('takes a page name with regular-expression punctuation as text', () => {
    // The name reaches a pattern, so a screen called `C++ (beta)` must be
    // matched rather than compiled.
    expect(resolveDocumentTitle(catalogue(), 'C++ (beta)')).toBe(
      `C++ (beta) · ${BUNDLED_ENGLISH['app.name']}`,
    );
  });
});

/**
 * The two implementations of one rule, held to the same answer.
 *
 * A published document is written by a Node script before any bundle exists,
 * and rewritten by this application a moment after one does. The script cannot
 * import TypeScript, so it carries its own copy of the composition rule — and a
 * copy nobody compares is how a crawler and a Commander come to be told two
 * different names for one page. This is the comparison.
 */
describe('what a published document is titled', () => {
  it('is what the running application would title it, for every published address', () => {
    for (const entry of publishedAddresses({ origin: SITE_ORIGIN })) {
      const page = interpolate(BUNDLED_ENGLISH[entry.titleKey as MessageKey], entry.params);

      expect(documentHead(entry, BUNDLED_ENGLISH, SITE_ORIGIN).title).toBe(
        resolveDocumentTitle(BUNDLED_ENGLISH, page),
      );
    }
  });

  it('describes it with the same sentence the application publishes', () => {
    for (const entry of publishedAddresses({ origin: SITE_ORIGIN })) {
      expect(documentHead(entry, BUNDLED_ENGLISH, SITE_ORIGIN).description).toBe(
        interpolate(BUNDLED_ENGLISH[entry.descriptionKey as MessageKey], entry.params),
      );
    }
  });

  it('shows the same picture the application would show', () => {
    // The script spells the artwork path a second time, for the same reason it
    // spells the title rule a second time. The address names the hull and the
    // artwork directory is keyed by its symbol, so the address is resolved to
    // the package's record before the path is spelled (001/FR-005).
    for (const entry of publishedAddresses({ origin: SITE_ORIGIN })) {
      const segment = entry.path.startsWith('ships/') ? entry.path.slice('ships/'.length) : null;
      const hull = segment === null ? null : hullForAddressSegment(segment);

      expect(segment === null || hull !== null).toBe(true);
      expect(entry.image).toBe(hull === null ? LINK_CARD : hullArtworkPath(hull.symbol));
    }
  });
});
