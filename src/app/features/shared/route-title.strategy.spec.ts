import { TestBed } from '@angular/core/testing';
import {
  TitleStrategy,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { LocaleStore } from '../../i18n/locale.store';
import { provideLocalization } from '../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../i18n/testing/localization-harness';
import { BUNDLED_ENGLISH, type MessageCatalogue } from '../../i18n/locale-registry';
import { hullArtworkPath } from '../../platform/assets/hull-artwork-path';
import { LINK_CARD, SITE_ORIGIN } from '../../platform/browser/site-address';
import { RouteTitleStrategy } from './route-title.strategy';

/**
 * A route declares message keys; the document shows sentences.
 *
 * The four things this must never do are write a raw key into the tab, leave a
 * title or a description standing in a language the page is no longer in,
 * publish one screen's name under another screen's address, and publish a
 * sentence with an unfilled hole in it. They come from the same rule: only keys
 * this build carries and can fill reach the store, the store resolves them on
 * every commit rather than once on arrival, and the route's own path travels
 * with them in that same commit.
 */

/** One level of a route tree, as the strategy reads one. */
interface Level {
  readonly title?: string;
  readonly description?: string;
  readonly params?: Record<string, string>;
}

/**
 * A route tree carrying a title, a description and parameters per level.
 *
 * A stub rather than a router: the strategy walks `title`, `data.description`
 * and `params` itself, so what is under test is the walk and not Angular's
 * recognition of a URL.
 */
function tree(levels: readonly Level[]): ActivatedRouteSnapshot {
  const nodes = levels.map((level) => ({
    title: level.title,
    data: level.description === undefined ? {} : { description: level.description },
    params: level.params ?? {},
    firstChild: null as unknown,
  }));
  nodes.forEach((node, index) => {
    node.firstChild = nodes[index + 1] ?? null;
  });
  return nodes[0] as unknown as ActivatedRouteSnapshot;
}

function strategyWith(
  levels: readonly Level[],
  url = '/ships',
): { strategy: RouteTitleStrategy; locale: LocaleStore; snapshot: RouterStateSnapshot } {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideLocalization(),
      ...provideIsolatedLocaleEnvironment(),
      { provide: TitleStrategy, useClass: RouteTitleStrategy },
    ],
  });

  const strategy = TestBed.inject(TitleStrategy) as RouteTitleStrategy;
  const snapshot = { url, root: tree(levels) } as unknown as RouterStateSnapshot;

  return { strategy, locale: TestBed.inject(LocaleStore), snapshot };
}

describe('RouteTitleStrategy', () => {
  it('publishes a declared key as text in the active locale', () => {
    const { strategy, locale, snapshot } = strategyWith([{ title: 'workspace.title' }]);

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBe(BUNDLED_ENGLISH['workspace.title']);
  });

  it('leaves the product name standing for a route with no title', () => {
    const { strategy, locale, snapshot } = strategyWith([{}]);

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBeNull();
  });

  it('never writes a key this build does not carry into the tab', () => {
    const { strategy, locale, snapshot } = strategyWith([
      { title: 'some.key.that.does.not.exist' },
    ]);

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBeNull();
  });

  it('publishes the route description a search result quotes', () => {
    const { strategy, locale, snapshot } = strategyWith([
      { title: 'library.title' },
      { description: 'library.description' },
    ]);

    strategy.updateTitle(snapshot);

    expect(locale.description()).toBe(BUNDLED_ENGLISH['library.description']);
  });

  it('falls back to the application description rather than publishing none', () => {
    const { strategy, locale, snapshot } = strategyWith([{ title: 'workspace.title' }]);

    strategy.updateTitle(snapshot);

    expect(locale.description()).toBe(BUNDLED_ENGLISH['app.description']);
  });

  it('never writes a description key this build does not carry', () => {
    const { strategy, locale, snapshot } = strategyWith([
      { title: 'workspace.title', description: 'some.key.that.does.not.exist' },
    ]);

    strategy.updateTitle(snapshot);

    expect(locale.description()).toBe(BUNDLED_ENGLISH['app.description']);
  });

  it('lets a child inherit the description of the screen it sits inside', () => {
    const { strategy, locale, snapshot } = strategyWith(
      [{}, { description: 'catalogue.description' }, {}],
      '/ships/Anaconda',
    );

    strategy.updateTitle(snapshot);

    expect(locale.description()).toBe(BUNDLED_ENGLISH['catalogue.description']);
  });

  it('lets a child that states its own description keep it', () => {
    const { strategy, locale, snapshot } = strategyWith(
      [{ description: 'catalogue.description' }, { description: 'library.description' }],
      '/ships/Anaconda',
    );

    strategy.updateTitle(snapshot);

    expect(locale.description()).toBe(BUNDLED_ENGLISH['library.description']);
  });

  it('publishes the production address of the route, not of wherever it is served', () => {
    const { strategy, locale, snapshot } = strategyWith([{ title: 'library.title' }], '/builds');

    strategy.updateTitle(snapshot);

    expect(locale.canonical()).toBe(`${SITE_ORIGIN}/builds`);
  });

  it('keeps the build out of the canonical address, because it lives in the fragment', () => {
    const { strategy, locale, snapshot } = strategyWith(
      [{ title: 'workspace.title' }],
      '/build#AQIDBAUGBwgJCg',
    );

    strategy.updateTitle(snapshot);

    expect(locale.canonical()).toBe(`${SITE_ORIGIN}/build`);
  });

  it('hands over keys rather than sentences, so a later catalogue retranslates both', () => {
    // The order a non-English session actually starts in: the route is entered
    // under bundled English, and the catalogue lands behind it.
    const { strategy, locale, snapshot } = strategyWith([
      { title: 'catalogue.title', description: 'library.description' },
    ]);
    strategy.updateTitle(snapshot);
    expect(locale.page()).toBe(BUNDLED_ENGLISH['catalogue.title']);

    const german: MessageCatalogue = {
      ...BUNDLED_ENGLISH,
      'catalogue.title': 'Schiffsbaukasten',
      'library.description': 'Verwalte die gespeicherten Builds.',
    };
    locale.commitCandidate(
      { requested: 'de', catalogue: german, source: 'asset', failure: null },
      'browser',
    );

    expect(locale.page()).toBe('Schiffsbaukasten');
    expect(locale.description()).toBe('Verwalte die gespeicherten Builds.');
  });
});

/**
 * The one route whose subject has a name.
 *
 * A hull address says which hull, in the title, in the description and in the
 * picture a link preview shows. The name is the package's, and it is the same
 * name in every language because the game does not translate one.
 */
describe('RouteTitleStrategy, on an address about one hull', () => {
  const hullRoute = (symbol: string): readonly Level[] => [
    { title: 'catalogue.title', description: 'catalogue.description' },
    { title: 'hullDetail.title', description: 'hullDetail.description', params: { symbol } },
  ];

  it('names the hull in the title and in the description', () => {
    const { strategy, locale, snapshot } = strategyWith(hullRoute('Anaconda'), '/ships/Anaconda');

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBe('Anaconda');
    expect(locale.description()).toContain('Anaconda');
    expect(locale.description()).not.toBe(BUNDLED_ENGLISH['catalogue.description']);
  });

  it('shows the hull rather than the application mark', () => {
    const { strategy, locale, snapshot } = strategyWith(hullRoute('Anaconda'), '/ships/Anaconda');

    strategy.updateTitle(snapshot);

    expect(locale.route().image).toBe(hullArtworkPath('Anaconda'));
  });

  it('takes the package spelling of the symbol, not the address bar’s', () => {
    // The package resolves a symbol case-insensitively and the artwork
    // directories do not, so a lower-cased address would otherwise name a
    // picture that does not exist.
    const { strategy, locale, snapshot } = strategyWith(hullRoute('anaconda'), '/ships/anaconda');

    strategy.updateTitle(snapshot);

    expect(locale.route().image).toBe(hullArtworkPath('Anaconda'));
  });

  it('publishes the catalogue’s identity where the symbol is no hull', () => {
    // Both keys interpolate the hull. Publishing them here would put a sentence
    // with a hole in it into a search result.
    const { strategy, locale, snapshot } = strategyWith(
      hullRoute('Not_A_Hull'),
      '/ships/Not_A_Hull',
    );

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBe(BUNDLED_ENGLISH['catalogue.title']);
    expect(locale.description()).toBe(BUNDLED_ENGLISH['catalogue.description']);
    expect(locale.route().image).toBe(LINK_CARD);
    expect(locale.canonical()).toBe(`${SITE_ORIGIN}/ships/Not_A_Hull`);
  });
});
