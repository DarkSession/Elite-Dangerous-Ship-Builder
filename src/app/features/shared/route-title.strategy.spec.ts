import { TestBed } from '@angular/core/testing';
import { TitleStrategy, type RouterStateSnapshot } from '@angular/router';
import { LocaleStore } from '../../i18n/locale.store';
import { provideLocalization } from '../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../i18n/testing/localization-harness';
import { BUNDLED_ENGLISH } from '../../i18n/locale-registry';
import { RouteTitleStrategy } from './route-title.strategy';

/**
 * A route declares a message key; the tab shows a sentence.
 *
 * The two things this must never do are write a raw key into the tab and leave
 * a title standing in a language the page is no longer in. Both come from the
 * same rule: only a key this build actually carries becomes a title, and it is
 * resolved through the same catalogue as everything else.
 */
function strategyWith(title: string | undefined): {
  strategy: RouteTitleStrategy;
  locale: LocaleStore;
} {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideLocalization(),
      ...provideIsolatedLocaleEnvironment(),
      { provide: TitleStrategy, useClass: RouteTitleStrategy },
    ],
  });

  const strategy = TestBed.inject(TitleStrategy) as RouteTitleStrategy;
  // The strategy reads the title through `buildTitle`, which walks the snapshot.
  // A stub route tree is enough, and it keeps the test about the rule rather
  // than about the router.
  strategy.buildTitle = () => title;
  return { strategy, locale: TestBed.inject(LocaleStore) };
}

describe('RouteTitleStrategy', () => {
  const snapshot = {} as RouterStateSnapshot;

  it('publishes a declared key as text in the active locale', () => {
    const { strategy, locale } = strategyWith('workspace.title');

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBe(BUNDLED_ENGLISH['workspace.title']);
  });

  it('leaves the product name standing for a route with no title', () => {
    const { strategy, locale } = strategyWith(undefined);

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBeNull();
  });

  it('never writes a key this build does not carry into the tab', () => {
    const { strategy, locale } = strategyWith('some.key.that.does.not.exist');

    strategy.updateTitle(snapshot);

    expect(locale.page()).toBeNull();
  });
});
