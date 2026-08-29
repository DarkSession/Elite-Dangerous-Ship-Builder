import { SHIPS, getShipSlots } from '@elite-dangerous-almanac/core/ships/ships';
import { enumerateSlots } from '@elite-dangerous-almanac/core/ships/slots';
import { hullCapacity } from './hull-capacity';

/** The package's own layout for one hull. Every symbol asked for here has one. */
function slotsOf(symbol: string) {
  return enumerateSlots(getShipSlots(symbol)!);
}

function capacityOf(symbol: string) {
  return hullCapacity(slotsOf(symbol));
}

describe('hull capacity', () => {
  it('counts every mount the package publishes for the hull', () => {
    const slots = slotsOf('Anaconda');
    const capacity = hullCapacity(slots);

    expect(capacity.utility).toBe(slots.filter((slot) => slot.kind === 'utility').length);
    expect(capacity.core).toHaveLength(slots.filter((slot) => slot.kind === 'core').length);
    expect(capacity.optionalCount + capacity.restrictedCount).toBe(
      slots.filter((slot) => slot.kind === 'optional').length,
    );
  });

  it('partitions the optional column rather than counting a mount twice', () => {
    // The reference draws `12` for a hull whose optional column is fourteen
    // mounts, two of them restricted: the two groups add up to the column
    // (FR-022). A mount counted in both would make the totals overshoot it.
    const slots = slotsOf('Anaconda');
    const capacity = hullCapacity(slots);

    const restricted = slots.filter(
      (slot) => slot.kind === 'optional' && slot.restriction !== undefined,
    );
    expect(restricted.length).toBeGreaterThan(0);
    expect(capacity.optionalCount).toBe(
      slots.filter((slot) => slot.kind === 'optional').length - restricted.length,
    );
    expect(capacity.restrictedCount).toBe(restricted.length);
  });

  it('reads the core mounts by function, in the package’s own order', () => {
    const slots = slotsOf('Anaconda');
    const capacity = hullCapacity(slots);

    expect(capacity.core.map((mount) => mount.core)).toEqual(
      slots.filter((slot) => slot.kind === 'core').map((slot) => slot.core),
    );
    // The package's own descriptor travels with each mount, because the name is
    // game text and this file holds no table of names (constitution II).
    for (const mount of capacity.core) {
      expect(mount.slot.kind).toBe('core');
      expect(mount.size).toBeGreaterThan(0);
    }
  });

  it('groups equal sizes into one run, largest first', () => {
    const runs = hullCapacity([
      { kind: 'optional', key: 'Slot01_Size6', size: 6 },
      { kind: 'optional', key: 'Slot02_Size4', size: 4 },
      { kind: 'optional', key: 'Slot03_Size6', size: 6 },
      { kind: 'optional', key: 'Slot04_Size7', size: 7 },
      { kind: 'optional', key: 'Slot05_Size6', size: 6 },
    ] as never).optional;

    expect(runs).toEqual([
      { size: 7, count: 1 },
      { size: 6, count: 3 },
      { size: 4, count: 1 },
    ]);
  });

  it('keeps one entry per restriction, so a hull with three states three', () => {
    // The Type-11 Prospector restricts a limpet-controller mount, a vessel-hangar
    // mount and the planetary approach suite. A single note on one rule could not
    // say what any of them takes.
    const capacity = capacityOf('LakonMiner');

    expect(capacity.restricted.length).toBeGreaterThan(1);
    expect(new Set(capacity.restricted.map((group) => group.restriction)).size).toBe(
      capacity.restricted.length,
    );
    for (const group of capacity.restricted) {
      expect(group.count).toBe(group.sizes.reduce((total, run) => total + run.count, 0));
    }
  });

  it('holds for every catalogued hull', () => {
    for (const ship of SHIPS) {
      const slots = slotsOf(ship.symbol);
      const capacity = hullCapacity(slots);

      // Every group's total is the number of mounts in it, never the number of
      // runs drawn for them (FR-022).
      expect(capacity.optionalCount).toBe(
        capacity.optional.reduce((total, run) => total + run.count, 0),
      );
      expect(capacity.restrictedCount).toBe(
        capacity.restricted.reduce((total, group) => total + group.count, 0),
      );
      expect(capacity.optionalCount + capacity.restrictedCount).toBe(
        slots.filter((slot) => slot.kind === 'optional').length,
      );

      // Largest first, and no size drawn twice inside one group.
      const sizes = capacity.optional.map((run) => run.size);
      expect(sizes).toEqual([...sizes].sort((left, right) => right - left));
      expect(new Set(sizes).size).toBe(sizes.length);
    }
  });

  it('draws nothing at all where a hull restricts nothing', () => {
    // No hull in the installed package reaches this state — all of them carry a
    // planetary-approach mount — so it is asserted against a layout rather than
    // a hull. An empty group is an absence, and an absence is not drawn.
    const capacity = hullCapacity([
      { kind: 'optional', key: 'Slot01_Size5', size: 5 },
      { kind: 'utility', key: 'TinyHardpoint1' },
    ] as never);

    expect(capacity.restricted).toEqual([]);
    expect(capacity.restrictedCount).toBe(0);
  });
});
