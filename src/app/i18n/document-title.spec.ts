import { resolveDocumentTitle } from './document-title';
import { BUNDLED_ENGLISH, type MessageCatalogue } from './locale-registry';
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
    // A caller that has nothing to say must not be able to publish `· Elite
    // Dangerous Ship Builder` with an empty half.
    expect(resolveDocumentTitle(catalogue(), '   ')).toBe(
      BUNDLED_ENGLISH['app.document-title.default'],
    );
  });

  it('composes the page and the application for an ordinary screen', () => {
    expect(resolveDocumentTitle(catalogue(), 'Saved builds')).toBe(
      `Saved builds · ${BUNDLED_ENGLISH['app.name']}`,
    );
  });

  it('says the product name once where the page is named after the product', () => {
    // `Ship Builder · Elite Dangerous Ship Builder` is the product name twice,
    // on the address `/` redirects to and the sitemap ranks highest.
    expect(resolveDocumentTitle(catalogue(), 'Ship Builder')).toBe(
      BUNDLED_ENGLISH['app.document-title.default'],
    );
  });

  it('keeps a page whose name only sits inside a word of the application name', () => {
    // `Build` is inside `Builder`. On substrings the workspace would lose the
    // one word that says which screen it is, which is the whole point of a
    // per-route title.
    expect(resolveDocumentTitle(catalogue(), 'Build')).toBe(
      `Build · ${BUNDLED_ENGLISH['app.name']}`,
    );
  });

  it('reads a word boundary the ASCII one gets wrong', () => {
    // The case that separates `[^\p{L}\p{N}]` from `\b`, which is defined on
    // the ASCII word characters: `\b` sees an edge between `u` and `ü`, so it
    // reads `übersicht` as a whole word of `Bauübersicht` and would publish the
    // application name alone for a page that shares no word with it.
    const german = catalogue({ 'app.name': 'Elite Dangerous Bauübersicht' });

    expect(resolveDocumentTitle(german, 'übersicht')).toBe(
      'übersicht · Elite Dangerous Bauübersicht',
    );

    // And the real word still collapses, in the same catalogue.
    expect(resolveDocumentTitle(german, 'Bauübersicht')).toBe(
      BUNDLED_ENGLISH['app.document-title.default'],
    );
  });

  it('collapses in the other shipped locale too, on that catalogue as shipped', () => {
    // The real German catalogue rather than an override of the English one:
    // `app.name` is a product name and is not translated, so the collapse has
    // to fire there as well — and it would be easy to ship a translated name
    // that quietly stopped it.
    const german = germanCatalogue as unknown as MessageCatalogue;

    expect(resolveDocumentTitle(german, german['catalogue.title'])).toBe(
      german['app.document-title.default'],
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
