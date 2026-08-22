import { getPreEngineeredVariants } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import {
  FIXTURE_SLOTS,
  ROUTE_DISTINCT_SYMBOL,
  defaultBuild,
  packageText,
  routeDistinctVariants,
} from '../../domain/outfitting/outfitting.fixtures';
import { candidateMembership, resolveChoice } from './candidate-membership';

/**
 * Membership is an expansion of what the package said, and nothing else.
 *
 * The count is the whole proof. If anything were added, filtered, deduplicated
 * or reconstructed, the number of choices would stop being "stock records plus
 * their variants" — so that is what is asserted, per mount kind, against the
 * package itself rather than against a number written down here.
 */

function expectedCount(loadout = defaultBuild(), slotKey: string): number {
  return loadout
    .modulesForSlot(slotKey)
    .reduce((total, module) => total + 1 + getPreEngineeredVariants(module.symbol).length, 0);
}

describe('candidate membership', () => {
  const kinds = [
    ['core', FIXTURE_SLOTS.core],
    ['optional', FIXTURE_SLOTS.optional],
    ['hardpoint', FIXTURE_SLOTS.hardpoint],
    ['utility', FIXTURE_SLOTS.utility],
    ['armour', FIXTURE_SLOTS.armour],
    ['cargo hatch', FIXTURE_SLOTS.cargoHatch],
  ] as const;

  for (const [kind, slotKey] of kinds) {
    it(`offers exactly the package's stock records plus every variant for a ${kind} mount`, () => {
      const loadout = defaultBuild();

      const membership = candidateMembership(loadout, slotKey, 1, packageText());

      expect(membership.choices.length).toBe(expectedCount(loadout, slotKey));
      expect(membership.slotKey).toBe(slotKey);
    });
  }

  it('emits each variant immediately after the stock record it belongs to', () => {
    const loadout = defaultBuild();
    const membership = candidateMembership(loadout, FIXTURE_SLOTS.hardpoint, 1, packageText());

    for (const [index, choice] of membership.choices.entries()) {
      if (choice.kind !== 'variant') {
        continue;
      }
      const previous = membership.choices
        .slice(0, index)
        .reverse()
        .find((candidate) => candidate.kind === 'stock');
      expect(previous?.module.symbol).toBe(choice.module.symbol);
    }
  });

  it('keeps route-distinct variants of one module as separate choices', () => {
    const loadout = defaultBuild();
    const slotKey = loadout
      .slots('hardpoint')
      .map((slot) => slot.key)
      .find((key) =>
        loadout
          .modulesForSlot(key)
          .some((module) => module.symbol.toLowerCase() === ROUTE_DISTINCT_SYMBOL.toLowerCase()),
      );
    expect(slotKey).toBeDefined();

    const membership = candidateMembership(loadout, slotKey!, 1, packageText());
    const forSymbol = membership.choices.filter(
      (choice) =>
        choice.kind === 'variant' &&
        choice.module.symbol.toLowerCase() === ROUTE_DISTINCT_SYMBOL.toLowerCase(),
    );

    expect(forSymbol.length).toBe(routeDistinctVariants().length);
    // Distinct rows, not one row with two labels: the key is what a rendering
    // loop tracks by, so equal keys would silently drop one of them.
    expect(new Set(forSymbol.map((choice) => choice.key)).size).toBe(forSymbol.length);
  });

  it('reports the cargo hatch as a successful empty answer', () => {
    const membership = candidateMembership(
      defaultBuild(),
      FIXTURE_SLOTS.cargoHatch,
      1,
      packageText(),
    );

    expect(membership.choices).toEqual([]);
  });

  it('discards a choice resolved against a stale revision', () => {
    const membership = candidateMembership(defaultBuild(), FIXTURE_SLOTS.core, 4, packageText());
    const key = membership.choices[0]!.key;

    expect(resolveChoice(membership, key, 4)).not.toBeNull();
    // The build moved on. Offering a record that was fittable a moment ago is
    // an offer the package would refuse anyway — after the Commander took it.
    expect(resolveChoice(membership, key, 5)).toBeNull();
  });

  it('resolves a key back to the exact package object it was built from', () => {
    const loadout = defaultBuild();
    const membership = candidateMembership(loadout, FIXTURE_SLOTS.core, 1, packageText());
    const first = membership.choices[0]!;

    const resolved = resolveChoice(membership, first.key, 1);

    // Identity, not equality: the package's own record, so `setModule` receives
    // what the package produced rather than a rebuild of it.
    expect(resolved?.module).toBe(first.module);
  });

  it('rebuilds membership after a fit so new limits are reflected', () => {
    const loadout = defaultBuild();
    // The hull's default already carries a shield generator, and they are one
    // per ship — so it is removed first and the exclusion is watched appearing.
    loadout.removeModule(FIXTURE_SLOTS.fittedOptional);
    const before = candidateMembership(loadout, FIXTURE_SLOTS.optional, 1, packageText());
    const shield = before.choices.find((choice) =>
      choice.module.symbol.toLowerCase().includes('shieldgenerator'),
    );
    expect(shield).toBeDefined();

    loadout.setModule(FIXTURE_SLOTS.optional, shield!.module);
    const after = candidateMembership(loadout, 'Slot02_Size6', 2, packageText());

    // Shield generators are one per ship, so the package stops offering another
    // one. Nothing here knows that rule; the count simply follows the package.
    expect(after.choices.length).toBe(expectedCount(loadout, 'Slot02_Size6'));
    expect(after.choices.some((choice) => choice.module.symbol === shield!.module.symbol)).toBe(
      false,
    );
  });
});
