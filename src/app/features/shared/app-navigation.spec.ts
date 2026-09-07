import { TestBed } from '@angular/core/testing';
import { provideLocalization } from '../../i18n/i18n.providers';
import { routes } from '../../app.routes';
import { AppNavigation, EQUIPMENT_REENTRY_ACTION, NAVIGATION_ROUTES } from './app-navigation';

describe('AppNavigation tools', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
  });

  const navigation = (): AppNavigation => TestBed.inject(AppNavigation);

  it('offers only the tools this application serves an address for', () => {
    // The canvas names eight and the migration names two. What answers an
    // address is the ship builder and the equipment builder, and a tab that
    // opens nothing is a control for a thing that does not exist (011/FR-028).
    const tools = navigation().tools(NAVIGATION_ROUTES.catalogue);

    expect(tools.map((tool) => tool.href)).toEqual([
      NAVIGATION_ROUTES.catalogue,
      NAVIGATION_ROUTES.equipment,
    ]);
    // Each tool's full name, as canvas 4c draws it in the tab. The product's
    // tools are Ship Builder and Equipment Builder; `Ship` names something else.
    expect(tools.map((tool) => tool.label)).toEqual(['Ship Builder', 'Equipment Builder']);
  });

  it('names the same tool on every route that tool owns', () => {
    // Outfitting a hull is still the ship tool. A bar that stopped naming it
    // at `/outfitting` would say a Commander had left the tool they are working in.
    for (const path of [
      NAVIGATION_ROUTES.catalogue,
      `${NAVIGATION_ROUTES.catalogue}/Anaconda`,
      NAVIGATION_ROUTES.outfitting,
    ]) {
      expect(navigation().tools(path)[0].current).toBe(true);
    }
  });

  it('names the equipment builder on the bench, and the ship tool on neither', () => {
    const tools = navigation().tools(NAVIGATION_ROUTES.equipment);

    expect(tools.map((tool) => tool.current)).toEqual([false, true]);
  });

  it('marks no tool current on a route no tool owns', () => {
    expect(
      navigation()
        .tools('/somewhere-else')
        .some((tool) => tool.current),
    ).toBe(false);
  });

  it('does not treat a route that merely starts with the same letters as owned', () => {
    // `/shipsomething` is not under `/ships`. A plain prefix test would claim
    // it, and the bar would name a tool that does not serve the address.
    expect(
      navigation()
        .tools('/shipsomething')
        .some((tool) => tool.current),
    ).toBe(false);
    expect(
      navigation()
        .tools('/equipmentsomething')
        .some((tool) => tool.current),
    ).toBe(false);
  });

  it('marks the tool a shared link opens, fragment and query and all', () => {
    // How a link is opened: `/outfitting#b.…` is a shared build and `/equipment#e.…`
    // a shared loadout, and the router reports `urlAfterRedirects`, which
    // carries both. Matched whole, they named no tool at all on the one screen
    // a Commander most often arrives at from outside (Commander request
    // 2026-09-04).
    expect(navigation().tools(`${NAVIGATION_ROUTES.equipment}#e.abc`)[1].current).toBe(true);
    expect(navigation().tools(`${NAVIGATION_ROUTES.outfitting}#b.abc`)[0].current).toBe(true);
    expect(navigation().tools(`${NAVIGATION_ROUTES.catalogue}?q=viper`)[0].current).toBe(true);
  });

  it('leads to the entry point from every screen, the entry point included', () => {
    // One answer everywhere. The mark is the only way to the screen that offers
    // the tools, so a screen it went missing from would be a screen with no way
    // there at all (017/FR-001).
    for (const path of [
      NAVIGATION_ROUTES.start,
      NAVIGATION_ROUTES.catalogue,
      `${NAVIGATION_ROUTES.catalogue}/Anaconda`,
      NAVIGATION_ROUTES.outfitting,
      NAVIGATION_ROUTES.equipment,
    ]) {
      const home = navigation().home();

      expect(home.href).toBe(NAVIGATION_ROUTES.start);
      expect(home.label).toBe('Nav Beacon');
      expect(
        navigation()
          .tools(path)
          .some((tool) => tool.href === home.href),
      ).toBe(false);
    }
  });

  it('reads an entry as leading nowhere only where its own address is open', () => {
    // What the shell answers a plain click with nothing on. A shared build and
    // a shared loadout arrive as a fragment on the tool's own address, and a
    // Commander reading one of those is on that screen (017/FR-002, FR-005).
    const registry = navigation();

    expect(registry.alreadyOpen(NAVIGATION_ROUTES.start, NAVIGATION_ROUTES.start)).toBe(true);
    expect(
      registry.alreadyOpen(NAVIGATION_ROUTES.equipment, `${NAVIGATION_ROUTES.equipment}#e.abc`),
    ).toBe(true);
    expect(
      registry.alreadyOpen(NAVIGATION_ROUTES.catalogue, `${NAVIGATION_ROUTES.catalogue}?q=viper`),
    ).toBe(true);

    // And everywhere else it leads somewhere: a hull is not the ship list, the
    // workspace is not the ship list, and no tool's address is the entry point.
    expect(
      registry.alreadyOpen(NAVIGATION_ROUTES.catalogue, `${NAVIGATION_ROUTES.catalogue}/Anaconda`),
    ).toBe(false);
    expect(registry.alreadyOpen(NAVIGATION_ROUTES.catalogue, NAVIGATION_ROUTES.outfitting)).toBe(
      false,
    );
    expect(registry.alreadyOpen(NAVIGATION_ROUTES.start, NAVIGATION_ROUTES.equipment)).toBe(false);
  });

  it('names what a tool does when its own tab is pressed on its own screen', () => {
    // The ship tool's tab leads to the ship list, which is an address and needs
    // nothing else said about it. The equipment tool's leads to the bench it is
    // already on, so what it does there is an action, and the registry is where
    // the shell reads it — the bar imports no bench component to find out
    // (017/FR-004, FR-005).
    const tools = navigation().tools(NAVIGATION_ROUTES.equipment);

    expect(tools[0].reentry).toBeUndefined();
    expect(tools[1].reentry).toBe(EQUIPMENT_REENTRY_ACTION);
  });
});

describe('AppNavigation catalogue', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
  });

  const navigation = (): AppNavigation => TestBed.inject(AppNavigation);

  it('offers every tool the bar names, from the one registry', () => {
    // The canvas draws its tabs and its tool grid off a single registry, so a
    // tool the application gains appears in both at once. The two readings are
    // held to the same set here, which is the only place that can notice a
    // second list being introduced.
    const offered = navigation().catalogue();
    const named = navigation().tools(NAVIGATION_ROUTES.catalogue);

    expect(offered.map((tool) => tool.id)).toEqual(named.map((tool) => tool.id));
    expect(offered.map((tool) => tool.href)).toEqual(named.map((tool) => tool.href));
    expect(offered.map((tool) => tool.name)).toEqual(named.map((tool) => tool.label));
  });

  it('marks no tool as the one being read', () => {
    // A Commander at the entry point is in none of the tools, so the shape
    // carries no way to say one is current (FR-010).
    for (const tool of navigation().catalogue()) {
      expect(Object.hasOwn(tool, 'current')).toBe(false);
    }
  });

  it('carries both descriptions and a subject list for every tool', () => {
    // Both forms travel together because the stylesheet chooses between them,
    // not this reading. A tool with one description would leave one artboard
    // with nothing to draw (FR-017).
    for (const tool of navigation().catalogue()) {
      expect(tool.summary.length).toBeGreaterThan(0);
      expect(tool.short.length).toBeGreaterThan(0);
      expect(tool.subjects.length).toBeGreaterThan(0);
      expect(tool.short).not.toBe(tool.summary);
    }
  });

  it('opens an address the route table declares', () => {
    // A tool offered at the entry point that answered no address would be a
    // control for a thing that does not exist (011/FR-028).
    const declared = new Set(routes.map((route) => `/${route.path ?? ''}`));

    for (const tool of navigation().catalogue()) {
      expect(declared.has(tool.href)).toBe(true);
    }
  });
});
