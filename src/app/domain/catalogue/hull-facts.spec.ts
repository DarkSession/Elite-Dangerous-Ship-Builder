import { SHIPS, getShipBySymbol } from '@elite-dangerous-almanac/core/ships/ships';
import { factsInGroup, hullDetailFacts } from './hull-facts';

describe('hull detail facts', () => {
  it('publishes every fact the specification names', () => {
    const ids = hullDetailFacts('Anaconda').map((fact) => fact.id);

    expect(ids).toEqual([
      'minimum-speed',
      'maximum-speed',
      'boost',
      'base-shield',
      'base-armour',
      'hardness',
      'hull-mass',
      'masslock',
      'crew',
      'heat-capacity',
      'heat-dissipation',
      'reserve-fuel',
      'min-pitch',
      'pitch',
      'min-roll',
      'roll',
      'min-yaw',
      'yaw',
      'hull-cost',
      'retail-cost',
    ]);
  });

  it('reads every value from the package record', () => {
    const ship = getShipBySymbol('Anaconda')!;
    const byId = new Map(hullDetailFacts(ship).map((fact) => [fact.id, fact.value]));

    expect(byId.get('minimum-speed')).toBe(ship.minimumSpeed);
    expect(byId.get('maximum-speed')).toBe(ship.maximumSpeed);
    expect(byId.get('boost')).toBe(ship.boost);
    expect(byId.get('base-shield')).toBe(ship.baseShieldStrength);
    expect(byId.get('base-armour')).toBe(ship.baseArmour);
    expect(byId.get('hull-mass')).toBe(ship.hullMass);
    expect(byId.get('hardness')).toBe(ship.hardness);
    expect(byId.get('masslock')).toBe(ship.masslock);
    expect(byId.get('crew')).toBe(ship.crew);
    expect(byId.get('heat-capacity')).toBe(ship.heatCapacity);
    expect(byId.get('heat-dissipation')).toBe(ship.heatDissipation);
    expect(byId.get('reserve-fuel')).toBe(ship.reserveFuelCapacity);
    expect(byId.get('pitch')).toBe(ship.pitch);
    expect(byId.get('roll')).toBe(ship.roll);
    expect(byId.get('yaw')).toBe(ship.yaw);
    expect(byId.get('hull-cost')).toBe(ship.hullCost);
    expect(byId.get('retail-cost')).toBe(ship.retailCost);
  });

  it('gives every measured value a documented unit', () => {
    const measured = hullDetailFacts('Anaconda').filter((fact) => fact.unit !== 'rating');

    expect(measured.length).toBeGreaterThan(0);
    for (const fact of measured) {
      expect([
        'speed',
        'rotation',
        'mass',
        'shield',
        'armour',
        'heat-dissipation',
        'seats',
        'credits',
      ]).toContain(fact.unit);
    }
  });

  it('marks the two unitless comparative figures as ratings, not invented units', () => {
    const byId = new Map(hullDetailFacts('Anaconda').map((fact) => [fact.id, fact]));

    expect(byId.get('hardness')?.unit).toBe('rating');
    expect(byId.get('masslock')?.unit).toBe('rating');
  });

  it('names the viewing condition for every endpoint pair', () => {
    const byId = new Map(hullDetailFacts('Anaconda').map((fact) => [fact.id, fact]));

    expect(byId.get('minimum-speed')?.condition).toBe('zero-pips');
    expect(byId.get('maximum-speed')?.condition).toBe('four-pips');
    expect(byId.get('min-pitch')?.condition).toBe('zero-pips');
    expect(byId.get('pitch')?.condition).toBe('four-pips');
    expect(byId.get('boost')?.condition).toBeNull();
  });

  it('groups facts for the screen without losing any of them', () => {
    const facts = hullDetailFacts('Anaconda');
    const grouped = (
      ['performance', 'defence', 'mass-and-heat', 'handling', 'prices'] as const
    ).flatMap((group) => factsInGroup(facts, group));

    expect(grouped).toHaveLength(facts.length);
  });

  it('publishes a complete fact set for every installed hull', () => {
    for (const ship of SHIPS) {
      const facts = hullDetailFacts(ship.symbol);

      expect(facts).toHaveLength(20);
      expect(facts.every((fact) => fact.value !== null)).toBe(true);
    }
  });

  it('answers an unknown hull with no facts rather than blanks', () => {
    expect(hullDetailFacts('Nonexistent_Hull')).toEqual([]);
  });
});
