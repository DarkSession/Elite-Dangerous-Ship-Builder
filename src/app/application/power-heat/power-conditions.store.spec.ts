import { TestBed } from '@angular/core/testing';
import {
  MAX_PIPS,
  MIN_PIPS,
  PIP_STEP,
  PowerConditionsStore,
  TOTAL_PIPS,
} from './power-conditions.store';

/** Every whole pip the four blocks can ask for, including none at all. */
const WHOLE_PIPS = [0, 1, 2, 3, 4] as const;

/**
 * What the two conditions do, and what they refuse to do.
 *
 * The refusals matter as much as the settings. This store is the whole of "what
 * if" for the power dashboard: a draft, an apply, an error or anything reaching
 * the build would be visible on screen if it crept in. The one rule it does
 * keep is the ship's own — six pips between the three banks, four at most in
 * any of them, assigned a whole pip at a time and paid for by the other two at
 * half a pip each.
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

  it('charges the other two half a pip each for every whole pip assigned', () => {
    // The ship's own rule: a third pip in systems costs engines and weapons
    // half a pip apiece.
    store.setPips('systems', 3);

    expect(store.pips()).toEqual({ systems: 3, engines: 1.5, weapons: 1.5 });
  });

  it('charges the whole pip to one bank when the other has none left to give', () => {
    store.setPips('weapons', 4);
    store.setPips('systems', 0);
    expect(store.pips()).toEqual({ systems: 0, engines: 2, weapons: 4 });

    // Systems is empty, so it pays nothing and engines pays the lot — rather
    // than systems going negative to keep the split even.
    store.setPips('weapons', 3);
    expect(store.pips()).toEqual({ systems: 0.5, engines: 2.5, weapons: 3 });
  });

  it('gives the whole pip back to one bank when the other is already full', () => {
    store.setPips('engines', 4);
    expect(store.pips()).toEqual({ systems: 1, engines: 4, weapons: 1 });

    // Engines is full, so it takes nothing back and weapons takes the lot —
    // rather than engines going past the four a bank holds.
    store.setPips('systems', 0);
    expect(store.pips()).toEqual({ systems: 0, engines: 4, weapons: 2 });

    store.setPips('weapons', 0);
    expect(store.pips()).toEqual({ systems: 2, engines: 4, weapons: 0 });
  });

  it('takes an odd half pip from whichever of the two can better afford it', () => {
    store.setPips('systems', 3);
    expect(store.pips()).toEqual({ systems: 3, engines: 1.5, weapons: 1.5 });

    // Engines is standing on a half, so the half pip it is short of two cannot
    // be split in two again on the step the ship moves in. One bank carries the
    // whole of it: the fuller one, which here is systems at three.
    store.setPips('engines', 2);
    expect(store.pips()).toEqual({ systems: 2.5, engines: 2, weapons: 1.5 });
  });

  it('assigns whole pips only, rounding what it is handed to one', () => {
    store.setPips('weapons', 2.4);
    expect(store.pips().weapons).toBe(2);

    store.setPips('weapons', 2.6);
    expect(store.pips().weapons).toBe(3);
  });

  it('accepts every block the control draws, including none at all', () => {
    for (const pips of WHOLE_PIPS) {
      store.setPips('systems', pips);
      expect(store.pips().systems).toBe(pips);
    }
  });

  it('keeps the three at six, on the step, and inside a bank, however they are set', () => {
    // Every bank against every block, over and over, so each move starts from
    // whatever the last one left rather than from an even allocation.
    for (let round = 0; round < 4; round += 1) {
      for (const bank of ['systems', 'engines', 'weapons'] as const) {
        for (const pips of WHOLE_PIPS) {
          store.setPips(bank, pips);
          const allocation = store.pips();
          const { systems, engines, weapons } = allocation;

          expect(allocation[bank]).toBe(pips);
          expect(systems + engines + weapons).toBeCloseTo(TOTAL_PIPS, 10);
          expect(Math.max(systems, engines, weapons)).toBeLessThanOrEqual(MAX_PIPS);
          expect(Math.min(systems, engines, weapons)).toBeGreaterThanOrEqual(MIN_PIPS);

          for (const held of [systems, engines, weapons]) {
            expect(held / PIP_STEP).toBeCloseTo(Math.round(held / PIP_STEP), 10);
          }
        }
      }
    }
  });

  it('clamps a bank to the four blocks rather than asking about a ship that cannot exist', () => {
    store.setPips('systems', 9);
    expect(store.pips().systems).toBe(MAX_PIPS);

    store.setPips('systems', -3);
    expect(store.pips().systems).toBe(MIN_PIPS);
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
