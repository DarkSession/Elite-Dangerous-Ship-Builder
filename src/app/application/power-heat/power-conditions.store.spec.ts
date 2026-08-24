import { TestBed } from '@angular/core/testing';
import {
  MAX_PIPS,
  MIN_PIPS,
  PIP_STEP,
  PowerConditionsStore,
  TOTAL_PIPS,
} from './power-conditions.store';

/**
 * What the two conditions do, and what they refuse to do.
 *
 * The refusals matter as much as the settings. This store is the whole of "what
 * if" for the power dashboard: a draft, an apply, an error or anything reaching
 * the build would be visible on screen if it crept in. The one rule it does
 * keep is the ship's own — six pips between the three banks, four at most in
 * any of them, moving half a pip at a time.
 */
describe('PowerConditionsStore', () => {
  let store: PowerConditionsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(PowerConditionsStore);
  });

  it('opens with the hardpoints deployed', () => {
    expect(store.hardpoints()).toBe('deployed');
  });

  it('opens with the pips even across the three banks', () => {
    expect(store.pips()).toEqual({ systems: 2, engines: 2, weapons: 2 });
  });

  it('publishes the pair the projection takes', () => {
    store.showHardpoints('retracted');
    store.setPips('weapons', 4);

    expect(store.conditions()).toEqual({
      hardpoints: 'retracted',
      pips: { systems: 1, engines: 1, weapons: 4 },
    });
  });

  it('moves between the two hardpoint states and back', () => {
    store.showHardpoints('retracted');
    expect(store.hardpoints()).toBe('retracted');

    store.showHardpoints('deployed');
    expect(store.hardpoints()).toBe('deployed');
  });

  it('takes the pips it gives out of the other two banks', () => {
    // The allocation a Commander described: a third pip in systems leaves half
    // of each of the other two behind.
    store.setPips('systems', 3);

    expect(store.pips()).toEqual({ systems: 3, engines: 1.5, weapons: 1.5 });
  });

  it('splits what is left evenly between the other two, as the rule states', () => {
    store.setPips('weapons', 4);
    expect(store.pips()).toEqual({ systems: 1, engines: 1, weapons: 4 });

    // Evenly, not in whatever proportion the two happened to stand in: the rule
    // as stated takes the pips out of the other two evenly, and half of the four
    // left over is two each.
    store.setPips('systems', 2);
    expect(store.pips()).toEqual({ systems: 2, engines: 2, weapons: 2 });
  });

  it('accepts every step the control draws, including none at all', () => {
    for (let pips = MIN_PIPS; pips <= MAX_PIPS; pips += PIP_STEP) {
      store.setPips('systems', pips);
      expect(store.pips().systems).toBe(pips);
    }
  });

  it('keeps the three at six however they are set', () => {
    for (const bank of ['systems', 'engines', 'weapons'] as const) {
      for (let pips = MIN_PIPS; pips <= MAX_PIPS; pips += PIP_STEP) {
        store.setPips(bank, pips);
        const { systems, engines, weapons } = store.pips();
        expect(systems + engines + weapons).toBeCloseTo(TOTAL_PIPS, 10);
        expect(Math.max(systems, engines, weapons)).toBeLessThanOrEqual(MAX_PIPS);
        expect(Math.min(systems, engines, weapons)).toBeGreaterThanOrEqual(MIN_PIPS);
      }
    }
  });

  it('clamps a bank to the four steps rather than asking about a ship that cannot exist', () => {
    store.setPips('systems', 9);
    expect(store.pips().systems).toBe(MAX_PIPS);

    store.setPips('systems', -3);
    expect(store.pips().systems).toBe(MIN_PIPS);
  });

  it('rounds to the half pip the ship moves in', () => {
    store.setPips('weapons', 2.4);
    expect(store.pips().weapons).toBe(2.5);

    store.setPips('weapons', 2.6);
    expect(store.pips().weapons).toBe(2.5);
  });

  it('starts over on a fresh session rather than remembering anything', () => {
    store.showHardpoints('retracted');
    store.setPips('systems', 0);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    expect(TestBed.inject(PowerConditionsStore).conditions()).toEqual({
      hardpoints: 'deployed',
      pips: { systems: 2, engines: 2, weapons: 2 },
    });
  });
});
