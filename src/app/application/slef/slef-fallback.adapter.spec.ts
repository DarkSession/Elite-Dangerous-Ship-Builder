import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { FIXTURE_HULL } from '../../domain/outfitting/outfitting.fixtures';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { SLEF_FALLBACK } from '../build-link/slef-fallback.port';
import { SLEF_FALLBACK_PROVIDER } from './slef-fallback.adapter';
import { SlefStore } from './slef.store';

describe('what feature 001 reaches for', () => {
  let active: ActiveBuildStore;
  let store: SlefStore;

  function fallback() {
    return TestBed.inject(SLEF_FALLBACK);
  }

  function commit(): void {
    active.commit({
      loadout: ShipLoadout.default(FIXTURE_HULL),
      hullName: 'Anaconda',
      provenance: 'working',
      qualityNotices: [],
      sourceNamed: null,
      baseline: null,
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SLEF_FALLBACK_PROVIDER] });
    active = TestBed.inject(ActiveBuildStore);
    store = TestBed.inject(SlefStore);
  });

  it('is unavailable, and opens nothing, with no build to pass on', () => {
    expect(fallback().available).toBe(false);
    expect(fallback().export()).toBe(false);
    expect(store.layer()).toBe('none');
  });

  it('opens the exchange layer on the drawn first format for an ordinary export', () => {
    commit();

    expect(fallback().export()).toBe(true);

    expect(store.layer()).toBe('export');
    expect(store.exportMode()).toBe('link');
  });

  it('opens on the payload when the link is the thing that just failed', () => {
    commit();
    active.setLink({ kind: 'refused', code: 'tooLong', slot: null });

    expect(fallback().export()).toBe(true);

    expect(store.exportMode()).toBe('slef');
  });

  it('keeps whatever format the Commander last chose', () => {
    commit();
    store.selectExportMode('slef');

    fallback().export();

    expect(store.exportMode()).toBe('slef');
  });
});
