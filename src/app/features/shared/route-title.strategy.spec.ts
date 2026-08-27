import { TestBed } from '@angular/core/testing';
import {
  TitleStrategy,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { LocaleStore } from '../../i18n/locale.store';
import { provideLocalization } from '../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../i18n/testing/localization-harness';
import { BUNDLED_ENGLISH } from '../../i18n/locale-registry';
import { SITE_ORIGIN } from '../../platform/browser/site-address';
import { RouteTitleStrategy } from './route-title.strategy';

/**
 * A route declares message keys; the document shows sentences.
 *
 * The three things this must never do are write a raw key into the tab, leave a
 * title standing in a language the page is no longer in, and publish one
 * screen's name under another screen's address. All three come from the same
 * rule: only keys this build actually carries become text, they are resolved
 * through the same catalogue as everything else, and the route's own path
 * travels with them in the same commit.
 */

/** A route tree with `data` at whichever depths the test names. */
function tree(...levels: readonly Record<string, unknown>[]): ActivatedRouteSnapshot {
  const nodes = levels.map(
    (data) => ({ data, firstChild: null }) as unknown as { data: unknown; firstChild: unknown },
  );
  nodes.forEach((node, index) => {
    node.firstChild = nodes[index + 1] ?? null;
  });
  return nodes[0] as unknown as ActivatedRouteSnapshot;
}

function strategyWith(
  title: string | undefined,
  options: { url?: string; routes?: readonly Record<string, unknown>[] } = {},
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
  // The strategy reads the title through `buildTitle`, which walks the
  // snapshot. A stub route tree is enough, and it keeps the test about the rule
  // rather than about the router.
  strategy.buildTitle = () => title;

  const snapshot = {
    url: options.url ?? '/ships',
    root: tree(...(options.routes ?? [{}])),
  } as unknown as RouterStateSnapshot;

  return { strategy, locale: TestBed.inject(LocaleStore), snapshot };
}

describe('RouteTitleStrategy', () => {
  it('publishes a declared key as text in the active locale', () => {
    const { strategy, locale, snapshot } = strategyWith('workspace.title');

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBe(BUNDLED_ENGLISH['workspace.title']);
  });

  it('leaves the product name standing for a route with no title', () => {
    const { strategy, locale, snapshot } = strategyWith(undefined);

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBeNull();
  });

  it('never writes a key this build does not carry into the tab', () => {
    const { strategy, locale, snapshot } = strategyWith('some.key.that.does.not.exist');

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBeNull();
  });

  it('publishes the route description a search result quotes', () => {
    const { strategy, locale, snapshot } = strategyWith('library.title', {
      routes: [{}, { description: 'library.description' }],
    });

    strategy.updateTitle(snapshot);

    expect(locale.description()).toBe(BUNDLED_ENGLISH['library.description']);
  });

  it('falls back to the application description rather than publishing none', () => {
    const { strategy, locale, snapshot } = strategyWith('workspace.title');

    strategy.updateTitle(snapshot);

    expect(locale.description()).toBe(BUNDLED_ENGLISH['app.description']);
  });

  it('never writes a description key this build does not carry', () => {
    const { strategy, locale, snapshot } = strategyWith('workspace.title', {
      routes: [{ description: 'some.key.that.does.not.exist' }],
    });

    strategy.updateTitle(snapshot);

    expect(locale.description()).toBe(BUNDLED_ENGLISH['app.description']);
  });

  it('lets a child inherit the description of the screen it sits inside', () => {
    const { strategy, locale, snapshot } = strategyWith(undefined, {
      url: '/ships/Anaconda',
      routes: [{}, { description: 'catalogue.description' }, {}],
    });

    strategy.updateTitle(snapshot);

    expect(locale.description()).toBe(BUNDLED_ENGLISH['catalogue.description']);
  });

  it('lets a child that states its own description keep it', () => {
    const { strategy, locale, snapshot } = strategyWith(undefined, {
      url: '/ships/Anaconda',
      routes: [{ description: 'catalogue.description' }, { description: 'library.description' }],
    });

    strategy.updateTitle(snapshot);

    expect(locale.description()).toBe(BUNDLED_ENGLISH['library.description']);
  });

  it('publishes the production address of the route, not of wherever it is served', () => {
    const { strategy, locale, snapshot } = strategyWith('library.title', { url: '/builds' });

    strategy.updateTitle(snapshot);

    expect(locale.canonical()).toBe(`${SITE_ORIGIN}/builds`);
  });

  it('keeps the build out of the canonical address, because it lives in the fragment', () => {
    const { strategy, locale, snapshot } = strategyWith('workspace.title', {
      url: '/build#AQIDBAUGBwgJCg',
    });

    strategy.updateTitle(snapshot);

    expect(locale.canonical()).toBe(`${SITE_ORIGIN}/build`);
  });
});
