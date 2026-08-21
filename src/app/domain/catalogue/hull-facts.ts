import { getShipBySymbol, type Ship } from '@elite-dangerous-almanac/core/ships/ships';

/**
 * The unit a hull fact is measured in.
 *
 * `rating` is deliberately its own value rather than an empty unit. Hull
 * hardness and mass lock are comparative numbers the game publishes with no
 * unit at all, and inventing one — or leaving the number bare beside facts that
 * have units — would both mislead. The screen says "rating, no unit" in words
 * (hull-detail design, "Responsive and accessibility notes").
 */
export type HullFactUnit =
  | 'speed'
  | 'rotation'
  | 'mass'
  | 'shield'
  | 'armour'
  | 'heat-dissipation'
  | 'seats'
  | 'credits'
  | 'rating';

/** Which viewing condition a value was measured under, when that changes it. */
export type HullFactCondition = 'zero-pips' | 'four-pips' | null;

/** The sections hull detail presents its facts in. */
export type HullFactGroup =
  'identity' | 'performance' | 'defence' | 'mass-and-heat' | 'handling' | 'prices';

/** One published hull fact, ready to be formatted and labelled. */
export interface HullFact {
  /** Stable id; also the suffix of its label message key. */
  readonly id: string;
  readonly group: HullFactGroup;
  /** `null` where the package reports no value. Never substituted with zero. */
  readonly value: number | null;
  readonly unit: HullFactUnit;
  readonly condition: HullFactCondition;
  /** How many fraction digits the value is meaningful to. */
  readonly fractionDigits: number;
}

/**
 * Every measured fact FR-004 names, in reading order.
 *
 * The list is the requirement, written out once. Two facts sharing a label —
 * speed at zero and at four pips — are distinguished by their condition rather
 * than by their position, so a reader who meets them out of order still knows
 * which is which.
 *
 * Manufacturer and size are absent: they are text, not measurements, and the
 * screen renders them through the package's own localization rather than as
 * numbers.
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
    condition: HullFactCondition = null,
    fractionDigits = 0,
  ): HullFact => ({
    id,
    group,
    value: typeof value === 'number' && Number.isFinite(value) ? value : null,
    unit,
    condition,
    fractionDigits,
  });

  return [
    fact('minimum-speed', 'performance', ship.minimumSpeed, 'speed', 'zero-pips'),
    fact('maximum-speed', 'performance', ship.maximumSpeed, 'speed', 'four-pips'),
    fact('boost', 'performance', ship.boost, 'speed'),

    fact('base-shield', 'defence', ship.baseShieldStrength, 'shield'),
    fact('base-armour', 'defence', ship.baseArmour, 'armour'),
    fact('hardness', 'defence', ship.hardness, 'rating'),

    fact('hull-mass', 'mass-and-heat', ship.hullMass, 'mass', null, 1),
    fact('masslock', 'mass-and-heat', ship.masslock, 'rating'),
    fact('crew', 'mass-and-heat', ship.crew, 'seats'),
    fact('heat-capacity', 'mass-and-heat', ship.heatCapacity, 'rating', null, 1),
    fact('heat-dissipation', 'mass-and-heat', ship.heatDissipation, 'heat-dissipation', null, 2),
    fact('reserve-fuel', 'mass-and-heat', ship.reserveFuelCapacity, 'mass', null, 2),

    fact('min-pitch', 'handling', ship.minPitch, 'rotation', 'zero-pips', 1),
    fact('pitch', 'handling', ship.pitch, 'rotation', 'four-pips', 1),
    fact('min-roll', 'handling', ship.minRoll, 'rotation', 'zero-pips', 1),
    fact('roll', 'handling', ship.roll, 'rotation', 'four-pips', 1),
    fact('min-yaw', 'handling', ship.minYaw, 'rotation', 'zero-pips', 1),
    fact('yaw', 'handling', ship.yaw, 'rotation', 'four-pips', 1),

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
