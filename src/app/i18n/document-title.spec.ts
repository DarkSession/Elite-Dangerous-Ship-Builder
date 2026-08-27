import { resolveDocumentTitle } from './document-title';
import { BUNDLED_ENGLISH, type MessageCatalogue } from './locale-registry';

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

  it('reads the boundary in the language the catalogue is in', () => {
    // `\b` is defined on ASCII word characters, so it would find an edge inside
    // `Aufbau` and collapse a German page title that shares no word with the
    // application name at all.
    const german = catalogue({ 'app.name': 'Elite Dangerous Schiffsbaukasten' });

    expect(resolveDocumentTitle(german, 'Aufbau')).toBe(
      'Aufbau · Elite Dangerous Schiffsbaukasten',
    );
    expect(resolveDocumentTitle(german, 'Schiffsbaukasten')).toBe(
      BUNDLED_ENGLISH['app.document-title.default'],
    );
  });

  it('takes a page name with regular-expression punctuation as text', () => {
    // The name reaches a pattern, so a screen called `C++ (beta)` must be
    // matched rather than compiled.
    expect(resolveDocumentTitle(catalogue(), 'C++ (beta)')).toBe(
      `C++ (beta) · ${BUNDLED_ENGLISH['app.name']}`,
    );
  });
});
