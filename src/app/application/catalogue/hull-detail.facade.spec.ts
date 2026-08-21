import { TestBed } from '@angular/core/testing';
import { getShipBySymbol } from '@elite-dangerous-almanac/core/ships/ships';
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
    expect(facts).toHaveLength(20);
    for (const fact of facts) {
      expect(fact.label.length).toBeGreaterThan(0);
      expect(fact.value).not.toBeNull();
    }
  });

  it('names the unit of a measured value and the rating marker of an unmeasured one', () => {
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
    expect(byId.get('pitch')?.unit).toBe('°/s');
    expect(byId.get('hardness')?.unit).toBe('rating, no unit');
    // The credits pattern already carries its own currency.
    expect(byId.get('retail-cost')?.unit).toBe('');
    expect(byId.get('retail-cost')?.value).toContain('CR');
  });

  it('names the viewing condition of an endpoint pair in words', () => {
    const detail = facade();
    detail.setSymbol('Anaconda');
    const view = detail.view();
    if (view?.kind !== 'populated') {
      throw new Error('expected a populated view');
    }
    const byId = new Map(
      view.factGroups.flatMap((group) => group.facts).map((fact) => [fact.id, fact]),
    );

    expect(byId.get('minimum-speed')?.condition).toContain('0');
    expect(byId.get('maximum-speed')?.condition).toContain('4');
    expect(byId.get('boost')?.condition).toBeNull();
  });

  it('groups the slot layout the way an outfitting panel does', () => {
    const detail = facade();
    detail.setSymbol('Anaconda');
    const view = detail.view();
    if (view?.kind !== 'populated') {
      throw new Error('expected a populated view');
    }

    expect(view.slotGroups.map((group) => group.kind)).toEqual([
      'armour',
      'core',
      'hardpoint',
      'utility',
      'optional',
      'cargoHatch',
    ]);
    // The game's own irregular key, not a derived one.
    expect(
      view.slotGroups.flatMap((group) => group.slots).some((slot) => slot.key === 'Slot14_Size1'),
    ).toBe(true);
  });

  it('says a mount has no size class rather than calling it size zero', () => {
    const detail = facade();
    detail.setSymbol('Anaconda');
    const view = detail.view();
    if (view?.kind !== 'populated') {
      throw new Error('expected a populated view');
    }

    const utility = view.slotGroups.find((group) => group.kind === 'utility')!;
    expect(utility.slots[0]?.size).toBe('No size class');
  });

  it('names a restricted mount’s restriction through the package', () => {
    const detail = facade();
    detail.setSymbol('Anaconda');
    const view = detail.view();
    if (view?.kind !== 'populated') {
      throw new Error('expected a populated view');
    }

    const restricted = view.slotGroups
      .flatMap((group) => group.slots)
      .filter((slot) => slot.restriction !== null);

    expect(restricted.length).toBeGreaterThan(0);
    expect(restricted[0]?.restriction).toContain('Takes');
  });

  it('offers creation only when the package carries a default loadout', () => {
    const detail = facade();
    detail.setSymbol('Anaconda');

    expect(detail.view()).toMatchObject({ canCreate: true });
  });

  it('reports an unknown symbol as its own state, with no facts', () => {
    const detail = facade();
    detail.setSymbol('Nonexistent_Hull');

    expect(detail.view()).toEqual({ kind: 'unknown', symbol: 'Nonexistent_Hull' });
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
    expect(view.artworkPath).toBe('assets/ships/Anaconda/illustration.svg');
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

  it('ignores an artwork outcome when no hull is named', () => {
    const detail = facade();

    detail.markArtworkAvailable();
    detail.markArtworkUnavailable();

    expect(detail.artworkState()).toBe('loading');
  });
});
