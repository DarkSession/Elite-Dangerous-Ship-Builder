import { TestBed } from '@angular/core/testing';
import { DocumentAdapter, type RootDocumentState } from './document.adapter';
import { LINK_CARD, SITE_ORIGIN, absoluteAsset } from './site-address';

/** A complete commit, so a test can vary the one field it is about. */
function state(overrides: Partial<RootDocumentState> = {}): RootDocumentState {
  return {
    language: 'en',
    direction: 'ltr',
    title: 'Saved builds · Elite Dangerous Ship Builder',
    description: 'Plan Elite Dangerous loadouts.',
    canonical: `${SITE_ORIGIN}/ships`,
    image: absoluteAsset(LINK_CARD),
    imageAlt: 'Saved builds · Elite Dangerous Ship Builder',
    ...overrides,
  };
}

function head(selector: string): Element | null {
  return document.head.querySelector(selector);
}

function content(selector: string): string | null {
  return head(selector)?.getAttribute('content') ?? null;
}

describe('DocumentAdapter', () => {
  let adapter: DocumentAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(DocumentAdapter);
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    document.title = 'initial';
    for (const element of document.head.querySelectorAll(
      'meta[name^="description"], meta[name^="twitter:"], meta[property^="og:"], link[rel="canonical"]',
    )) {
      element.remove();
    }
  });

  it('publishes language, direction and title in one commit', () => {
    adapter.commitRootState(state({ language: 'de', title: 'Schiffsbaukasten' }));

    expect(adapter.language).toBe('de');
    expect(adapter.direction).toBe('ltr');
    expect(adapter.title).toBe('Schiffsbaukasten');
  });

  it('publishes a right-to-left direction with its language', () => {
    adapter.commitRootState(state({ language: 'ar', direction: 'rtl' }));

    expect(adapter.language).toBe('ar');
    expect(adapter.direction).toBe('rtl');
  });

  it('leaves the existing title in place when the caller has none', () => {
    adapter.commitRootState(state({ language: 'de', title: null }));

    expect(adapter.language).toBe('de');
    expect(adapter.title).toBe('initial');
  });

  it('never writes a blank title', () => {
    adapter.commitRootState(state({ language: 'de', title: '' }));

    expect(adapter.title).toBe('initial');
  });

  it('creates the head tags a document does not already carry', () => {
    adapter.commitRootState(state({ description: 'What this page is.' }));

    expect(content('meta[name="description"]')).toBe('What this page is.');
    expect(content('meta[property="og:description"]')).toBe('What this page is.');
    expect(content('meta[name="twitter:description"]')).toBe('What this page is.');
    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_ORIGIN}/ships`);
  });

  it('rewrites the tags it already wrote rather than adding a second set', () => {
    adapter.commitRootState(state({ canonical: `${SITE_ORIGIN}/ships` }));
    adapter.commitRootState(state({ canonical: `${SITE_ORIGIN}/builds` }));

    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('meta[property="og:url"]')).toHaveLength(1);
    expect(content('meta[property="og:url"]')).toBe(`${SITE_ORIGIN}/builds`);
  });

  it('carries the title into both card blocks so a pasted link names the page', () => {
    adapter.commitRootState(state({ title: 'Saved builds · Elite Dangerous Ship Builder' }));

    expect(content('meta[property="og:title"]')).toBe(
      'Saved builds · Elite Dangerous Ship Builder',
    );
    expect(content('meta[name="twitter:title"]')).toBe(
      'Saved builds · Elite Dangerous Ship Builder',
    );
  });

  it('carries the standing title into both card blocks when the caller supplies none', () => {
    adapter.commitRootState(state({ title: null }));

    expect(content('meta[property="og:title"]')).toBe('initial');
  });

  it('reports the language the document was actually rendered in', () => {
    adapter.commitRootState(state({ language: 'de' }));

    expect(content('meta[property="og:locale"]')).toBe('de');
  });

  it('leaves a description standing rather than publishing a blank one', () => {
    adapter.commitRootState(state({ description: 'What this page is.' }));
    adapter.commitRootState(state({ description: '' }));

    expect(content('meta[name="description"]')).toBe('What this page is.');
  });
});
