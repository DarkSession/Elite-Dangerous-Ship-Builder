import { SHIPS, getShipBySymbol } from '@elite-dangerous-almanac/core/ships/ships';
import { factsInGroup, hullDetailFacts } from './hull-facts';

describe('hull detail facts', () => {
  it('publishes every figure the reference draws, in its order', () => {
    const ids = hullDetailFacts('Anaconda').map((fact) => fact.id);

    expect(ids).toEqual([
      'maximum-speed',
      'boost',
      'base-shield',
      'base-armour',
      'hull-mass',
      'hardness',
      'crew',
      'masslock',
      'hull-cost',
      'retail-cost',
    ]);
  });

  it('reads every value from the package record', () => {
    const ship = getShipBySymbol('Anaconda')!;
    const byId = new Map(hullDetailFacts(ship).map((fact) => [fact.id, fact.value]));

    expect(byId.get('maximum-speed')).toBe(ship.maximumSpeed);
    expect(byId.get('boost')).toBe(ship.boost);
    expect(byId.get('base-shield')).toBe(ship.baseShieldStrength);
    expect(byId.get('base-armour')).toBe(ship.baseArmour);
    expect(byId.get('hull-mass')).toBe(ship.hullMass);
    expect(byId.get('hardness')).toBe(ship.hardness);
    expect(byId.get('crew')).toBe(ship.crew);
    expect(byId.get('masslock')).toBe(ship.masslock);
    expect(byId.get('hull-cost')).toBe(ship.hullCost);
    expect(byId.get('retail-cost')).toBe(ship.retailCost);
  });

  it('gives every measured value a documented unit', () => {
    const measured = hullDetailFacts('Anaconda').filter((fact) => fact.unit !== null);

    expect(measured.length).toBeGreaterThan(0);
    for (const fact of measured) {
      expect(['speed', 'mass', 'shield', 'credits']).toContain(fact.unit);
    }
  });

  // The reference labels these bare — `ARMOUR`, `HARDNESS`, `CREW`,
  // `MASS LOCK` — rather than inventing a unit for a comparative number.
  it('leaves the figures the reference draws bare without a unit', () => {
    const byId = new Map(hullDetailFacts('Anaconda').map((fact) => [fact.id, fact]));

    expect(byId.get('base-armour')?.unit).toBeNull();
    expect(byId.get('hardness')?.unit).toBeNull();
    expect(byId.get('crew')?.unit).toBeNull();
    expect(byId.get('masslock')?.unit).toBeNull();
  });

  it('groups facts for the screen without losing any of them', () => {
    const facts = hullDetailFacts('Anaconda');
    const grouped = (['performance', 'defence', 'mass', 'prices'] as const).flatMap((group) =>
      factsInGroup(facts, group),
    );

    expect(grouped).toHaveLength(facts.length);
  });

  it('publishes a complete fact set for every installed hull', () => {
    for (const ship of SHIPS) {
      const facts = hullDetailFacts(ship.symbol);

      expect(facts).toHaveLength(10);
      expect(facts.every((fact) => fact.value !== null)).toBe(true);
    }
  });

  it('answers an unknown hull with no facts rather than blanks', () => {
    expect(hullDetailFacts('Nonexistent_Hull')).toEqual([]);
  });
});
