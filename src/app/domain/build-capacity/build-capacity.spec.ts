import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { projectCapacity } from './build-capacity';

/**
 * The two figures the rail states, straight off the build.
 *
 * The expectations are read from the package rather than written out, so a pin
 * move that changes a hull's hold changes this test's expectation with it
 * rather than leaving a stale literal behind (constitution II).
 */
describe('projectCapacity', () => {
  it('carries the package hold and the package berths', () => {
    const build = ShipLoadout.default('BelugaLiner');

    expect(projectCapacity(build)).toEqual({
      cargoTonnes: build.cargoCapacity,
      passengerBerths: build.passengerCapacity,
    });
  });

  it('states what a liner leaves the yard with, in both figures', () => {
    const liner = projectCapacity(ShipLoadout.default('BelugaLiner'));

    expect(liner.passengerBerths).toBeGreaterThan(0);
    expect(liner.cargoTonnes).toBeGreaterThanOrEqual(0);
  });

  it('reports a hull with no rack and no cabin as carrying nothing', () => {
    // Nought is the package's answer here, not a substitute for one: both
    // figures always answer, so neither is ever unavailable (003/FR-023).
    const empty = projectCapacity(ShipLoadout.empty('SideWinder'));

    expect(empty).toEqual({ cargoTonnes: 0, passengerBerths: 0 });
  });

  it('follows an edit that changes what the build carries', () => {
    const build = ShipLoadout.empty('SideWinder');
    const before = projectCapacity(build);
    const rack = build
      .modulesForSlot('Slot02_Size2')
      .find(({ symbol }) => /CargoRack/i.test(symbol));

    expect(rack).toBeDefined();
    build.setModule('Slot02_Size2', rack!);

    expect(projectCapacity(build).cargoTonnes).toBeGreaterThan(before.cargoTonnes);
  });
});
