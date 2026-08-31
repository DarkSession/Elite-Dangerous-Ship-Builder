import { TestBed } from '@angular/core/testing';
import { SHIPS, getShipBySymbol, getShipSlots } from '@elite-dangerous-almanac/core/ships/ships';
import { enumerateSlots } from '@elite-dangerous-almanac/core/ships/slots';
import { provideLocalization } from '../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../i18n/testing/localization-harness';
import { ConnectivityAdapter } from '../../platform/browser/connectivity.adapter';
import { HullDetailFacade } from './hull-detail.facade';

class SilentConnectivity {
  onOnline(): () => void {
    return () => {};
  }
}

function facade(): HullDetailFacade {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideLocalization(),
      ...provideIsolatedLocaleEnvironment(),
      { provide: ConnectivityAdapter, useValue: new SilentConnectivity() },
    ],
  });
  return TestBed.inject(HullDetailFacade);
}

describe('HullDetailFacade', () => {
  it('has nothing to show until a hull is named', () => {
    expect(facade().view()).toBeNull();
  });

  it('presents every published fact with its unit', () => {
    const detail = facade();
    detail.setSymbol('Anaconda');
    const view = detail.view();

    expect(view?.kind).toBe('populated');
    if (view?.kind !== 'populated') {
      return;
    }

    const facts = view.factGroups.flatMap((group) => group.facts);
    expect(facts).toHaveLength(10);
    for (const fact of facts) {
      expect(fact.label.length).toBeGreaterThan(0);
      expect(fact.value).not.toBeNull();
    }
  });

  it('names the unit of a measured value and leaves a bare figure bare', () => {
    const detail = facade();
    detail.setSymbol('Anaconda');
    const view = detail.view();
    if (view?.kind !== 'populated') {
      throw new Error('expected a populated view');
    }
    const byId = new Map(
      view.factGroups.flatMap((group) => group.facts).map((fact) => [fact.id, fact]),
    );

    expect(byId.get('maximum-speed')?.unit).toBe('m/s');
    expect(byId.get('hull-mass')?.unit).toBe('t');
    expect(byId.get('base-shield')?.unit).toBe('MJ');
    // The reference draws these bare rather than inventing a unit for them.
    expect(byId.get('hardness')?.unit).toBe('');
    expect(byId.get('base-armour')?.unit).toBe('');
    // The credits pattern already carries its own currency.
    expect(byId.get('retail-cost')?.unit).toBe('');
    expect(byId.get('retail-cost')?.value).toContain('CR');
  });

  it('offers creation only when the package carries a default loadout', () => {
    const detail = facade();
    detail.setSymbol('Anaconda');

    expect(detail.view()).toMatchObject({ canCreate: true });
  });

  it('reports an address no hull answers to as its own state, with no facts', () => {
    const detail = facade();
    detail.setSymbol('Nonexistent_Hull');

    expect(detail.view()).toEqual({ kind: 'unknown', address: 'Nonexistent_Hull' });
  });

  it('resolves a symbol the way the package does', () => {
    const detail = facade();
    detail.setSymbol('empire_trader');

    expect(detail.view()).toMatchObject({ kind: 'populated' });
    expect(getShipBySymbol('empire_trader')?.symbol).toBe('Empire_Trader');
  });

  it('names the illustration after the hull it shows', () => {
    const detail = facade();
    detail.setSymbol('Anaconda');
    const view = detail.view();
    if (view?.kind !== 'populated') {
      throw new Error('expected a populated view');
    }

    expect(view.artworkLabel).toContain('Anaconda');
    expect(view.artworkPath).toBe('assets/ships/Anaconda/illustration.png');
  });

  it('tracks the illustration’s state without disturbing the facts', () => {
    const detail = facade();
    detail.setSymbol('Anaconda');

    expect(detail.artworkState()).toBe('loading');

    detail.markArtworkUnavailable();
    expect(detail.artworkState()).toBe('temporarily-unavailable');

    detail.retryArtwork();
    expect(detail.artworkState()).toBe('loading');

    detail.markArtworkAvailable();
    expect(detail.artworkState()).toBe('available');
    expect(detail.view()).toMatchObject({ canCreate: true });
  });

  it('states what the hull carries as three open groups and the restricted ones', () => {
    const detail = facade();
    detail.setSymbol('Anaconda');
    const view = detail.view();

    expect(view?.kind).toBe('populated');
    if (view?.kind !== 'populated' || view.capacity === null) {
      throw new Error('the package publishes a layout for this hull');
    }

    const capacity = view.capacity;
    expect(capacity.groups.map((group) => group.id)).toEqual(['utility', 'core', 'optional']);
    for (const group of capacity.groups) {
      expect(group.heading.length).toBeGreaterThan(0);
      expect(group.total).toMatch(/\d/u);
    }

    // Utility mounts are all one size, so the group is a total and no chips.
    const [utility, core, optional] = capacity.groups;
    expect(utility?.chips).toEqual([]);
    expect(utility?.named).toEqual([]);

    // Core mounts are named by the package rather than by a table here
    // (constitution II), and each carries its own size.
    expect(core?.chips).toEqual([]);
    expect(core?.named.length).toBeGreaterThan(0);
    for (const mount of core?.named ?? []) {
      expect(mount.name.text?.length ?? 0).toBeGreaterThan(0);
      expect(mount.size).toMatch(/\d/u);
      expect(mount.description.length).toBeGreaterThan(mount.size.length);
    }

    // The optional group is chips of runs, largest first, with no size twice.
    expect(optional?.named).toEqual([]);
    const sizes = (optional?.chips ?? []).map((chip) => Number(chip.size));
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes).toEqual([...sizes].sort((left, right) => right - left));
    expect(new Set(sizes).size).toBe(sizes.length);

    // And the restricted mounts are their own list, one entry per rule, each
    // under the restriction's own name.
    expect(capacity.restrictedTotal).toMatch(/\d/u);
    expect(capacity.restricted.length).toBeGreaterThan(0);
    expect(new Set(capacity.restricted.map((group) => group.id)).size).toBe(
      capacity.restricted.length,
    );
    for (const group of capacity.restricted) {
      expect(group.name.length).toBeGreaterThan(0);
      expect(group.chips.length).toBeGreaterThan(0);
    }

    // The planetary-approach mount is stated nowhere: not as a restriction of
    // its own, and not among the mounts that take anything (001/FR-022).
    expect(capacity.restricted.map((group) => group.id)).not.toContain('planetaryApproachSuite');
  });

  it('names every restriction it states, and states every one but the approach mount', () => {
    // Read off the package rather than written down here, so a release that
    // adds a restriction fails this rather than reaching a Commander as an
    // unnamed group — and one that stops restricting something fails it too.
    const detail = facade();

    for (const ship of SHIPS) {
      const layout = getShipSlots(ship.symbol);
      if (layout === null) {
        continue;
      }

      const published = new Set(
        enumerateSlots(layout)
          .filter((slot) => slot.kind === 'optional' && slot.restriction !== undefined)
          .map((slot) => (slot.kind === 'optional' ? slot.restriction : undefined)),
      );
      published.delete('planetaryApproachSuite');

      detail.setSymbol(ship.symbol);
      const view = detail.view();
      if (view?.kind !== 'populated' || view.capacity === null) {
        throw new Error(`the package publishes a layout for ${ship.symbol}`);
      }

      const stated = view.capacity.restricted;
      expect(new Set(stated.map((group) => group.id)), ship.symbol).toEqual(published);

      // The group's total is the mounts it states and no others, so an approach
      // mount counted in it would fail here rather than pass as a bigger number
      // on both sides of the screen.
      const mounts = enumerateSlots(layout).filter(
        (slot) =>
          slot.kind === 'optional' &&
          slot.restriction !== undefined &&
          slot.restriction !== 'planetaryApproachSuite',
      ).length;
      expect(view.capacity.restrictedTotal, ship.symbol).toBe(String(mounts));
      for (const group of stated) {
        expect(group.name.length, ship.symbol).toBeGreaterThan(0);
        expect(group.chips.length, ship.symbol).toBeGreaterThan(0);
      }
    }
  });

  it('writes a run of one as a bare size and a run of several with its count', () => {
    const detail = facade();
    detail.setSymbol('Anaconda');
    const view = detail.view();
    if (view?.kind !== 'populated' || view.capacity === null) {
      throw new Error('the package publishes a layout for this hull');
    }

    const chips = view.capacity.groups.flatMap((group) => group.chips);
    const lone = chips.filter((chip) => chip.multiplier === null);
    const runs = chips.filter((chip) => chip.multiplier !== null);

    // The Anaconda's optional column has both, which is why it is the hull the
    // two branches are read off.
    expect(lone.length).toBeGreaterThan(0);
    expect(runs.length).toBeGreaterThan(0);

    // A lone mount carries no multiplier — `1 × 7` beside a figure says nothing
    // the figure did not — and the sentence behind it is singular either way.
    for (const chip of lone) {
      expect(chip.description).not.toMatch(/×/u);
      expect(chip.description).toContain(chip.size);
    }

    // A run carries its count and its sign in front of the size, as two fields
    // rather than one string, so the two halves can be drawn at two weights.
    for (const chip of runs) {
      expect(chip.multiplier).toMatch(/\d+\s*×/u);
      expect(chip.size).toMatch(/^\d+$/u);
      expect(chip.description).toMatch(/\d/u);
    }

    // Every chip is identified apart from every other, so a list of them can be
    // tracked without two of them collapsing into one.
    const ids = chips.map((chip) => chip.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no capacity to state where the package publishes no layout', () => {
    // Read off the package rather than stubbed: if every catalogued hull has a
    // layout, the branch is stated as the absence it is and nothing is faked to
    // reach it.
    const detail = facade();
    for (const symbol of ['Anaconda', 'Sidewinder']) {
      detail.setSymbol(symbol);
      const view = detail.view();
      if (view?.kind !== 'populated') {
        continue;
      }
      expect(view.capacity === null).toBe(view.entry.slots === null);
    }
  });

  it('ignores an artwork outcome when no hull is named', () => {
    const detail = facade();

    detail.markArtworkAvailable();
    detail.markArtworkUnavailable();

    expect(detail.artworkState()).toBe('loading');
  });
});
