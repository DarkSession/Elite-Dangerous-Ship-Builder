import { TestBed } from '@angular/core/testing';
import { provideLocalization } from '../../i18n/i18n.providers';
import { AppNavigation, NAVIGATION_ROUTES } from './app-navigation';

describe('AppNavigation tools', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
  });

  const navigation = (): AppNavigation => TestBed.inject(AppNavigation);

  it('offers only the tools this application serves an address for', () => {
    // The canvas names eight and the migration names two. What answers an
    // address is the ship builder, and a tab that opens nothing is a control
    // for a thing that does not exist (011/FR-028).
    const tools = navigation().tools(NAVIGATION_ROUTES.catalogue);

    expect(tools.map((tool) => tool.href)).toEqual([NAVIGATION_ROUTES.catalogue]);
    // The tool's full name, as canvas 4c draws it in the tab. The product's tool
    // is Ship Builder; `Ship` names something else.
    expect(tools[0].label).toBe('Ship Builder');
  });

  it('names the same tool on every route that tool owns', () => {
    // Outfitting a hull is still the ship tool. A bar that stopped naming it
    // at `/build` would say a Commander had left the tool they are working in.
    for (const path of [
      NAVIGATION_ROUTES.catalogue,
      `${NAVIGATION_ROUTES.catalogue}/Anaconda`,
      NAVIGATION_ROUTES.build,
      NAVIGATION_ROUTES.library,
    ]) {
      expect(navigation().tools(path)[0].current).toBe(true);
    }
  });

  it('marks no tool current on a route no tool owns', () => {
    expect(navigation().tools('/somewhere-else')[0].current).toBe(false);
  });

  it('does not treat a route that merely starts with the same letters as owned', () => {
    // `/shipsomething` is not under `/ships`. A plain prefix test would claim
    // it, and the bar would name a tool that does not serve the address.
    expect(navigation().tools('/shipsomething')[0].current).toBe(false);
  });

  it('carries the same address the insignia does, so one registry answers both', () => {
    expect(navigation().tools(NAVIGATION_ROUTES.build)[0].href).toBe(
      navigation().home(NAVIGATION_ROUTES.build)?.href,
    );
  });
});
