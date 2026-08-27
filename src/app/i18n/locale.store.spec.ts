import { TestBed } from '@angular/core/testing';
import { DocumentAdapter } from '../platform/browser/document.adapter';
import { NavigatorAdapter } from '../platform/browser/navigator.adapter';
import { CatalogueLoader } from './catalogue-loader';
import { BUNDLED_ENGLISH, type LocaleCandidate, type ShippedLocale } from './locale-registry';
import { LocaleStore } from './locale.store';

/** Records every root-document commit so atomicity can be asserted. */
class RecordingDocumentAdapter {
  readonly commits: { language: string; direction: string; title: string | null }[] = [];

  commitRootState(language: string, direction: 'ltr' | 'rtl', title: string | null): void {
    this.commits.push({ language, direction, title });
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

const germanCatalogue = { ...BUNDLED_ENGLISH, 'locale.self-name': 'Deutsch' };

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

  it('publishes language, direction and title together in one document commit', () => {
    const { store, document } = setup();

    store.commitCandidate(
      { requested: 'de', catalogue: germanCatalogue, source: 'asset', failure: null },
      'browser',
    );

    expect(document.commits).toEqual([
      { language: 'de', direction: 'ltr', title: BUNDLED_ENGLISH['app.document-title.default'] },
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
    const { store, document } = setup();
    store.commitBundledEnglish();

    store.setPage('Ship Builder');

    expect(document.commits.at(-1)?.title).toContain('Ship Builder');
    expect(document.commits.at(-1)?.title).toContain(BUNDLED_ENGLISH['app.name']);
  });

  it('treats a blank page name as no page rather than as an empty title', () => {
    const { store, document } = setup();
    store.commitBundledEnglish();

    store.setPage('   ');

    expect(document.commits.at(-1)?.title).toBe(BUNDLED_ENGLISH['app.document-title.default']);
  });

  it('re-publishes the title in the language that commits with it', async () => {
    const { store, document } = setup({ browserLanguages: ['de'] });
    store.setPage('Ship Builder');

    await store.start();

    const last = document.commits.at(-1);
    expect(last?.language).toBe('de');
    expect(last?.title).toContain('Ship Builder');
  });
});
