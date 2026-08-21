import { getShipBySymbol, type Ship } from '@elite-dangerous-almanac/core/ships/ships';

/**
 * The unit a hull fact is measured in, or `null` where the reference draws
 * none.
 *
 * Hardness, mass lock and crew are comparative numbers the game publishes with
 * no unit, and the reference labels them bare — `HARDNESS`, `MASS LOCK`,
 * `CREW`. Armour is the same: the plate reads `ARMOUR`, not "hull points"
 * (canvas 1a, "Metric grid").
 */
export type HullFactUnit = 'speed' | 'mass' | 'shield' | 'credits' | null;

/** The sections hull detail presents its facts in. */
export type HullFactGroup = 'performance' | 'defence' | 'mass' | 'prices';

/** One published hull fact, ready to be formatted and labelled. */
export interface HullFact {
  /** Stable id; also the suffix of its label message key. */
  readonly id: string;
  readonly group: HullFactGroup;
  /** `null` where the package reports no value. Never substituted with zero. */
  readonly value: number | null;
  readonly unit: HullFactUnit;
}

/**
 * Every hull figure the reference draws, in its order.
 *
 * The eight the metric grid carries — speed, boost, shield, armour, hull mass,
 * hardness, crew, mass lock — and the hull price under them. Heat, reserve
 * fuel, rotation rates and the slot layout are not on the drawing and are not
 * computed here; hardpoints are shown as the reference's mount chips rather
 * than as a slot ledger (canvas 1a rail, canvas 1b detail sheet).
 */
export function hullDetailFacts(symbolOrShip: string | Ship): readonly HullFact[] {
  const ship = typeof symbolOrShip === 'string' ? getShipBySymbol(symbolOrShip) : symbolOrShip;
  if (ship === null) {
    return [];
  }

  const fact = (
    id: string,
    group: HullFactGroup,
    value: number | undefined,
    unit: HullFactUnit,
  ): HullFact => ({
    id,
    group,
    value: typeof value === 'number' && Number.isFinite(value) ? value : null,
    unit,
  });

  return [
    fact('maximum-speed', 'performance', ship.maximumSpeed, 'speed'),
    fact('boost', 'performance', ship.boost, 'speed'),

    fact('base-shield', 'defence', ship.baseShieldStrength, 'shield'),
    fact('base-armour', 'defence', ship.baseArmour, null),

    fact('hull-mass', 'mass', ship.hullMass, 'mass'),
    fact('hardness', 'mass', ship.hardness, null),
    fact('crew', 'mass', ship.crew, null),
    fact('masslock', 'mass', ship.masslock, null),

    fact('hull-cost', 'prices', ship.hullCost, 'credits'),
    fact('retail-cost', 'prices', ship.retailCost, 'credits'),
  ];
}

/** The facts of one group, in order. */
export function factsInGroup(
  facts: readonly HullFact[],
  group: HullFactGroup,
): readonly HullFact[] {
  return facts.filter((fact) => fact.group === group);
}
