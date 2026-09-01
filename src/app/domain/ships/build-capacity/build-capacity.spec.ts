import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { projectCapacity } from './build-capacity';

/**
 * The two figures the rail states, straight off the build.
 *
 * The Orca is the fixture because its two figures differ — a hold of 24 tonnes
 * over 40 berths — so a projection that crossed them would be caught here. A
 * hull whose figures happen to match would let the pair be swapped in silence.
 *
 * Every expectation is read from the package rather than written out, so a pin
 * move that changes a hull's fit changes this test's expectation with it rather
 * than leaving a stale literal behind (constitution II).
 */
describe('projectCapacity', () => {
  it('takes the hold from the racks and the berths from the cabins, not the other way about', () => {
    const build = ShipLoadout.default('Orca');

    expect(build.cargoCapacity).not.toBe(build.passengerCapacity);
    expect(projectCapacity(build).cargoTonnes).toBe(build.cargoCapacity);
    expect(projectCapacity(build).passengerBerths).toBe(build.passengerCapacity);
  });

  it('states what a liner leaves the yard with, in both figures', () => {
    const liner = projectCapacity(ShipLoadout.default('BelugaLiner'));

    expect(liner.passengerBerths).toBeGreaterThan(0);
    expect(liner.cargoTonnes).toBeGreaterThan(0);
  });

  it('reports a hull with no rack and no cabin as carrying nothing', () => {
    // Nought is the package's answer here, not a substitute for one: both
    // figures always answer, so neither is ever unavailable (003/FR-023).
    const empty = projectCapacity(ShipLoadout.empty('SideWinder'));

    expect(empty).toEqual({ cargoTonnes: 0, passengerBerths: 0 });
  });

  it('follows a fitted rack in the hold alone', () => {
    const build = ShipLoadout.empty('SideWinder');
    const before = projectCapacity(build);
    const rack = build
      .modulesForSlot('Slot02_Size2')
      .find(({ symbol }) => /CargoRack/i.test(symbol));

    expect(rack).toBeDefined();
    build.setModule('Slot02_Size2', rack!);
    const after = projectCapacity(build);

    expect(after.cargoTonnes).toBeGreaterThan(before.cargoTonnes);
    expect(after.passengerBerths).toBe(before.passengerBerths);
  });

  it('follows a fitted cabin in the berths alone', () => {
    const build = ShipLoadout.empty('Orca');
    const berthed = build
      .slots()
      .map((slot) => ({
        slot,
        cabin: build.modulesForSlot(slot.key).find(({ symbol }) => /PassengerCabin/i.test(symbol)),
      }))
      .find(({ cabin }) => cabin !== undefined)!;

    expect(berthed).toBeDefined();
    const before = projectCapacity(build);
    build.setModule(berthed.slot.key, berthed.cabin!);
    const after = projectCapacity(build);

    expect(after.passengerBerths).toBeGreaterThan(before.passengerBerths);
    expect(after.cargoTonnes).toBe(before.cargoTonnes);
  });
});
