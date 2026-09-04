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
import GERMAN from '../../i18n/locales/de.json';

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
      { description: 'workspace.description' },
    ]);

    strategy.updateTitle(snapshot);

    expect(locale.description()).toBe(BUNDLED_ENGLISH['workspace.description']);
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
      [{ description: 'catalogue.description' }, { description: 'workspace.description' }],
      '/ships/Anaconda',
    );

    strategy.updateTitle(snapshot);

    expect(locale.description()).toBe(BUNDLED_ENGLISH['workspace.description']);
  });

  it('publishes the production address of the route, not of wherever it is served', () => {
    const { strategy, locale, snapshot } = strategyWith([{ title: 'library.title' }], '/builds');

    strategy.updateTitle(snapshot);

    expect(locale.canonical()).toBe(`${SITE_ORIGIN}/builds`);
  });

  it('keeps the build out of the canonical address, because it lives in the fragment', () => {
    const { strategy, locale, snapshot } = strategyWith(
      [{ title: 'workspace.title' }],
      '/outfitting#AQIDBAUGBwgJCg',
    );

    strategy.updateTitle(snapshot);

    expect(locale.canonical()).toBe(`${SITE_ORIGIN}/outfitting`);
  });

  it('hands over keys rather than sentences, so a later catalogue retranslates both', () => {
    // The order a non-English session actually starts in: the route is entered
    // under bundled English, and the catalogue lands behind it.
    const { strategy, locale, snapshot } = strategyWith([
      { title: 'catalogue.title', description: 'workspace.description' },
    ]);
    strategy.updateTitle(snapshot);
    expect(locale.page()).toBe(BUNDLED_ENGLISH['catalogue.title']);

    const german: MessageCatalogue = {
      ...BUNDLED_ENGLISH,
      'catalogue.title': 'Schiffsbaukasten',
      'workspace.description': 'Rüste einen Rumpf aus.',
    };
    locale.commitCandidate(
      { requested: 'de', catalogue: german, source: 'asset', failure: null },
      'browser',
    );

    expect(locale.page()).toBe('Schiffsbaukasten');
    expect(locale.description()).toBe('Rüste einen Rumpf aus.');
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
  const hullRoute = (hull: string): readonly Level[] => [
    { title: 'catalogue.title', description: 'catalogue.description' },
    { title: 'hullDetail.title', description: 'hullDetail.description', params: { hull } },
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
    // An address matches case-insensitively and the artwork directories do not,
    // so a lower-cased address would otherwise name a picture that does not
    // exist.
    const { strategy, locale, snapshot } = strategyWith(hullRoute('anaconda'), '/ships/anaconda');

    strategy.updateTitle(snapshot);

    expect(locale.route().image).toBe(hullArtworkPath('Anaconda'));
  });

  it('names the hull an address published before the name form still opens', () => {
    // `LakonMiner` is the symbol the map advertised before it advertised
    // `Type-11_Prospector`, and it still names the hull it named (001/FR-005).
    const { strategy, locale, snapshot } = strategyWith(
      hullRoute('LakonMiner'),
      '/ships/LakonMiner',
    );

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBe('Type-11 Prospector');
    expect(locale.route().image).toBe(hullArtworkPath('LakonMiner'));
  });

  it('names the hull its own address is spelled with', () => {
    const { strategy, locale, snapshot } = strategyWith(
      hullRoute('Type-11_Prospector'),
      '/ships/Type-11_Prospector',
    );

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBe('Type-11 Prospector');
    expect(locale.route().image).toBe(hullArtworkPath('LakonMiner'));
  });

  it('publishes the catalogue’s identity where the address is no hull', () => {
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

  it('keeps the English name inside the German sentence, with nothing said about it', () => {
    // The one case the head exception exists for (011/FR-027, and
    // `contracts/localization-and-formatting.md`). Everywhere else, canonical
    // package text carries a `lang` boundary and a visible untranslated
    // disclosure; a title and a description are bare strings with no element
    // structure to hang either on, and a disclosure written into the sentence
    // would be read out as part of the page's name in every search result.
    // What stands in for it is the document's own `lang`, which the same commit
    // publishes.
    const { strategy, locale, snapshot } = strategyWith(hullRoute('Anaconda'), '/ships/Anaconda');
    strategy.updateTitle(snapshot);

    const german: MessageCatalogue = {
      ...BUNDLED_ENGLISH,
      'hullDetail.title': GERMAN['hullDetail.title'],
      'hullDetail.description': GERMAN['hullDetail.description'],
    };
    locale.commitCandidate(
      { requested: 'de', catalogue: german, source: 'asset', failure: null },
      'browser',
    );

    expect(locale.effectiveLocale()).toBe('de');
    expect(locale.page()).toBe('Anaconda');
    expect(locale.description()).toBe(
      GERMAN['hullDetail.description'].replace('{{hull}}', 'Anaconda'),
    );
    // The German sentence, the English proper noun, and no disclosure anywhere
    // in it — not the word the application uses for one, nor a parenthesis
    // holding one.
    expect(locale.description()).toContain('Anaconda');
    expect(locale.description()).not.toContain(GERMAN['game-text.untranslated.description']);
    expect(locale.description()).not.toMatch(/\{\{|\}\}/);
  });
});
