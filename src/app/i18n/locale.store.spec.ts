import { TestBed } from '@angular/core/testing';
import { DocumentAdapter, type RootDocumentState } from '../platform/browser/document.adapter';
import { NavigatorAdapter } from '../platform/browser/navigator.adapter';
import { CatalogueLoader } from './catalogue-loader';
import { BUNDLED_ENGLISH, type LocaleCandidate, type ShippedLocale } from './locale-registry';
import { LINK_CARD, SITE_ORIGIN, absoluteAsset } from '../platform/browser/site-address';
import { LocaleStore } from './locale.store';

/** Records every root-document commit so atomicity can be asserted. */
class RecordingDocumentAdapter {
  readonly commits: RootDocumentState[] = [];

  commitRootState(state: RootDocumentState): void {
    this.commits.push(state);
  }
}

/** A browser whose declared language list the test controls. */
class StubNavigatorAdapter {
  constructor(private readonly tags: readonly string[] = []) {}

  languages(): readonly string[] {
    return this.tags;
  }
}

/** Storage the test controls, including a browser that refuses to write. */

/** A loader whose answer the test controls, counting the requests it received. */
class StubCatalogueLoader {
  readonly requested: string[] = [];

  constructor(private readonly answer: (locale: ShippedLocale) => LocaleCandidate) {}

  async load(locale: ShippedLocale): Promise<LocaleCandidate> {
    this.requested.push(locale.tag);
    return this.answer(locale);
  }
}

interface Harness {
  store: LocaleStore;
  document: RecordingDocumentAdapter;
  loader: StubCatalogueLoader;
}

function setup(options?: {
  browserLanguages?: readonly string[];
  stored?: string | null;
  answer?: (locale: ShippedLocale) => LocaleCandidate;
}): Harness {
  const document = new RecordingDocumentAdapter();
  const loader = new StubCatalogueLoader(
    options?.answer ??
      ((locale) => ({
        requested: locale.tag,
        catalogue: germanCatalogue,
        source: 'asset',
        failure: null,
      })),
  );

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: DocumentAdapter, useValue: document },
      { provide: NavigatorAdapter, useValue: new StubNavigatorAdapter(options?.browserLanguages) },
      { provide: CatalogueLoader, useValue: loader },
    ],
  });
  return { store: TestBed.inject(LocaleStore), document, loader };
}

/**
 * A complete German catalogue, differing from English wherever a test looks.
 *
 * The keys a route contributes are among them deliberately: a fixture that
 * carried the English sentence for `catalogue.title` would let a store that
 * never retranslates pass the retranslation test.
 */
const germanCatalogue = {
  ...BUNDLED_ENGLISH,
  'locale.self-name': 'Deutsch',
  'catalogue.title': 'Schiffsbaukasten',
  'workspace.description': 'Rüste einen Rumpf Slot für Slot aus.',
};

describe('LocaleStore', () => {
  it('starts on a complete bundled English catalogue before anything commits', () => {
    const { store, document } = setup();

    expect(store.revision()).toBe(0);
    expect(store.catalogue()).toBe(BUNDLED_ENGLISH);
    expect(store.effectiveLocale()).toBe('en');
    expect(store.status()).toBe('ready');
    // Nothing has been published, so the document has not been touched.
    expect(document.commits).toEqual([]);
  });

  it('never exposes an absent catalogue, so no raw key can be rendered', () => {
    const { store } = setup();

    expect(Object.keys(store.catalogue()).length).toBeGreaterThan(0);
    expect(store.catalogue()['app.name']).toBeTruthy();
  });

  it('commits exactly one ready bundled-English snapshot per revision', () => {
    const { store, document } = setup();

    const first = store.commitBundledEnglish();

    expect(first.revision).toBe(1);
    expect(first.status).toBe('ready');
    expect(first.effectiveLocale).toBe('en');
    expect(first.catalogue).toBe(BUNDLED_ENGLISH);
    expect(document.commits.length).toBe(1);

    const second = store.commitBundledEnglish();

    expect(second.revision).toBe(2);
    expect(document.commits.length).toBe(2);
  });

  it('records how the locale was resolved', () => {
    const { store } = setup();

    expect(store.commitBundledEnglish('browser').selectionSource).toBe('browser');
    expect(store.commitBundledEnglish('browser').selectionSource).toBe('browser');
  });

  it('publishes language, direction, title, description, address and card in one commit', () => {
    const { store, document } = setup();

    store.commitCandidate(
      { requested: 'de', catalogue: germanCatalogue, source: 'asset', failure: null },
      'browser',
    );

    expect(document.commits).toEqual([
      {
        language: 'de',
        direction: 'ltr',
        title: BUNDLED_ENGLISH['app.document-title.default'],
        description: germanCatalogue['app.description'],
        canonical: `${SITE_ORIGIN}/`,
        // The application's own card, because no route has said otherwise, and
        // described by the title, so the picture is named in whatever language
        // the document is in rather than in one of its own.
        image: absoluteAsset(LINK_CARD),
        imageAlt: BUNDLED_ENGLISH['app.document-title.default'],
      },
    ]);
  });

  it('commits a validated candidate as a ready snapshot', () => {
    const { store } = setup();

    const snapshot = store.commitCandidate(
      { requested: 'de', catalogue: germanCatalogue, source: 'asset', failure: null },
      'browser',
    );

    expect(snapshot.status).toBe('ready');
    expect(snapshot.effectiveLocale).toBe('de');
    expect(snapshot.requestedLocale).toBe('de');
    expect(snapshot.fallbackReason).toBeNull();
    expect(store.catalogue()['locale.self-name']).toBe('Deutsch');
  });

  it('falls back atomically when a candidate carries no catalogue', () => {
    const { store } = setup();
    const candidate: LocaleCandidate = {
      requested: 'de',
      catalogue: null,
      source: 'asset',
      failure: 'load-failed',
    };

    const snapshot = store.commitCandidate(candidate, 'browser');

    expect(snapshot.status).toBe('fallback');
    expect(snapshot.requestedLocale).toBe('de');
    expect(snapshot.effectiveLocale).toBe('en');
    expect(snapshot.fallbackReason).toBe('load-failed');
    expect(snapshot.catalogue).toBe(BUNDLED_ENGLISH);
  });

  it('falls back when a candidate names a locale this build does not ship', () => {
    const { store } = setup();

    const snapshot = store.commitCandidate(
      { requested: 'fr', catalogue: germanCatalogue, source: 'asset', failure: null },
      'browser',
    );

    expect(snapshot.status).toBe('fallback');
    expect(snapshot.fallbackReason).toBe('unknown-locale');
    expect(snapshot.catalogue).toBe(BUNDLED_ENGLISH);
  });

  it('reports an invalid catalogue when a shipped locale supplies none', () => {
    const { store } = setup();

    const snapshot = store.commitCandidate(
      { requested: 'de', catalogue: null, source: 'asset', failure: null },
      'browser',
    );

    expect(snapshot.fallbackReason).toBe('invalid-catalogue');
  });

  it('commits an explicit fallback with its reason and the requested locale', () => {
    const { store } = setup();

    const snapshot = store.commitFallbackToEnglish('de', 'invalid-catalogue', 'browser');

    expect(snapshot.status).toBe('fallback');
    expect(snapshot.requestedLocale).toBe('de');
    expect(snapshot.effectiveLocale).toBe('en');
    expect(snapshot.selectionSource).toBe('browser');
    expect(store.fallbackReason()).toBe('invalid-catalogue');
  });

  it('keeps the current snapshot visible while a candidate loads', () => {
    const { store, document } = setup();
    store.commitBundledEnglish();

    store.setLoading(true);

    expect(store.loading()).toBe(true);
    expect(store.effectiveLocale()).toBe('en');
    expect(store.revision()).toBe(1);
    expect(document.commits.length).toBe(1);
  });

  it('clears the loading flag when a snapshot commits', () => {
    const { store } = setup();
    store.setLoading(true);

    store.commitBundledEnglish();

    expect(store.loading()).toBe(false);
  });

  it('increments the revision once per commit regardless of outcome', () => {
    const { store } = setup();

    store.commitBundledEnglish();
    store.commitFallbackToEnglish('de', 'load-failed', 'browser');
    store.commitCandidate(
      { requested: 'de', catalogue: germanCatalogue, source: 'cache', failure: null },
      'browser',
    );

    expect(store.revision()).toBe(3);
  });
});

describe('LocaleStore startup precedence', () => {
  it('matches an exact browser tag', async () => {
    const { store } = setup({ browserLanguages: ['de'] });

    const snapshot = await store.start();

    expect(snapshot.selectionSource).toBe('browser');
    expect(snapshot.effectiveLocale).toBe('de');
  });

  it('matches a regional browser tag by its base language', async () => {
    const { store } = setup({ browserLanguages: ['de-AT'] });

    expect((await store.start()).effectiveLocale).toBe('de');
  });

  it('respects the order the browser states, not the precision of each tag', async () => {
    // `de-AT` is a base-language match and `en` an exact one. The Commander put
    // German first, so German wins: reordering by match precision would quietly
    // override a stated preference.
    const { store } = setup({ browserLanguages: ['de-AT', 'en'] });

    expect((await store.start()).effectiveLocale).toBe('de');
  });

  it('falls back to bundled English and requests nothing when no tag matches', async () => {
    const { store, loader } = setup({ browserLanguages: ['fr-FR', 'ja'] });

    const snapshot = await store.start();

    expect(snapshot.selectionSource).toBe('default');
    expect(snapshot.effectiveLocale).toBe('en');
    expect(snapshot.status).toBe('ready');
    expect(loader.requested).toEqual([]);
  });

  it('requests nothing when English itself is the match', async () => {
    const { store, loader } = setup({ browserLanguages: ['en-US'] });

    expect((await store.start()).effectiveLocale).toBe('en');
    expect(loader.requested).toEqual([]);
  });

  it('keeps complete English visible while a candidate loads', async () => {
    const { store } = setup({ browserLanguages: ['de'] });

    const pending = store.start();

    expect(store.loading()).toBe(true);
    expect(store.catalogue()).toBe(BUNDLED_ENGLISH);
    expect(store.revision()).toBe(0);

    await pending;

    expect(store.loading()).toBe(false);
    expect(store.revision()).toBe(1);
  });

  it('commits complete English once when the candidate fails', async () => {
    const { store, document } = setup({
      browserLanguages: ['de'],
      answer: (locale) => ({
        requested: locale.tag,
        catalogue: null,
        source: 'asset',
        failure: 'load-failed',
      }),
    });

    const snapshot = await store.start();

    expect(snapshot.status).toBe('fallback');
    expect(snapshot.fallbackReason).toBe('load-failed');
    expect(snapshot.catalogue).toBe(BUNDLED_ENGLISH);
    expect(document.commits.length).toBe(1);
  });
});

describe('LocaleStore document title', () => {
  it('publishes the application title when no page is named', () => {
    const { store, document } = setup();

    store.commitBundledEnglish();

    expect(document.commits.at(-1)?.title).toBe(BUNDLED_ENGLISH['app.document-title.default']);
  });

  it('names the page and the application together once a page is set', () => {
    // The library rather than the catalogue: `catalogue.title` is a phrase the
    // application name already contains, so a `toContain` pair would pass on
    // the product name alone and prove nothing about composing anything.
    const { store, document } = setup();
    store.commitBundledEnglish();

    store.setRoute({ titleKey: 'library.title', descriptionKey: null, path: '/builds' });

    expect(document.commits.at(-1)?.title).toBe(
      `${BUNDLED_ENGLISH['library.title']} · ${BUNDLED_ENGLISH['app.name']}`,
    );
  });

  it('names the tool beside the product on the screen the root redirects to', () => {
    const { store, document } = setup();
    store.commitBundledEnglish();

    store.setRoute({ titleKey: 'catalogue.title', descriptionKey: null, path: '/ships' });

    // `/` redirects here and the sitemap ranks it highest, so this is the
    // title in the search result that matters most.
    expect(document.commits.at(-1)?.title).toBe(
      `${BUNDLED_ENGLISH['catalogue.title']} · ${BUNDLED_ENGLISH['app.name']}`,
    );
  });

  it('leaves the product name standing for a route that names no page', () => {
    const { store, document } = setup();
    store.commitBundledEnglish();

    store.setRoute({ titleKey: null, descriptionKey: null, path: '/ships' });

    expect(document.commits.at(-1)?.title).toBe(BUNDLED_ENGLISH['app.document-title.default']);
  });

  it('retranslates the page a route entered before the language arrived', async () => {
    // The ordinary order, not a corner case: selecting a non-English catalogue
    // takes a request and the first navigation does not, so the route is
    // entered under bundled English and the language lands behind it. Holding
    // the key rather than the sentence is what lets that commit retranslate.
    const { store, document } = setup({ browserLanguages: ['de'] });
    store.setRoute({
      titleKey: 'catalogue.title',
      descriptionKey: 'workspace.description',
      path: '/ships',
    });
    expect(document.commits.at(-1)?.description).toBe(BUNDLED_ENGLISH['workspace.description']);

    await store.start();

    const last = document.commits.at(-1);
    expect(last?.language).toBe('de');
    expect(last?.title).toContain(germanCatalogue['catalogue.title']);
    expect(last?.description).toBe(germanCatalogue['workspace.description']);
    expect(store.page()).toBe(germanCatalogue['catalogue.title']);
  });

  it('publishes the application description where the route declares none', () => {
    const { store, document } = setup();

    store.setRoute({ titleKey: 'catalogue.title', descriptionKey: null, path: '/ships' });

    expect(document.commits.at(-1)?.description).toBe(BUNDLED_ENGLISH['app.description']);
  });
});
