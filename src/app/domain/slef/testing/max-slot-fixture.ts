import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';

/**
 * The biggest build the installed package can describe, assembled for real.
 *
 * SC-004 measures the worst case, and the worst case is a package fact that
 * moves with every release: a new hull, or a new optional internal on an
 * existing one, changes which build is largest. So the hull is *discovered*
 * here rather than written down, and every slot is filled by asking the package
 * what fits — no hull symbol, slot key or module symbol is copied into this
 * repository (constitution II).
 *
 * "Every supported modelled field" is the point: an export that only exercises
 * hull and modules measures a payload half the size of the real one. This fits
 * every slot, engineers what can be engineered, disables and re-prioritizes a
 * module, and names the ship — so the artifact under measurement carries every
 * shape the round trip has to preserve.
 */

/** The hull with the most slots the installed package carries. */
export function maxSlotHullSymbol(): string {
  let best: { symbol: string; slots: number } | null = null;

  for (const ship of SHIPS) {
    const count = ShipLoadout.default(ship.symbol).slots().length;
    if (best === null || count > best.slots) {
      best = { symbol: ship.symbol, slots: count };
    }
  }

  if (best === null) {
    throw new Error('The installed Almanac carries no ships.');
  }
  return best.symbol;
}

/** A fully fitted build of that hull, carrying every supported modelled field. */
export function maxSlotBuild(hullSymbol: string = maxSlotHullSymbol()): ShipLoadout {
  const build = ShipLoadout.default(hullSymbol);

  for (const slot of build.slots()) {
    fitLargest(build, slot.key);
  }

  // Engineering, enabled state and priority, on whatever came back fitted.
  // Which slots those are is the package's answer, not a list kept here.
  let engineered = 0;
  for (const module of build.fittedModules()) {
    if (engineered < 8) {
      engineered += applyFirstBlueprint(build, module.slot) ? 1 : 0;
    }
  }

  const [first] = build.fittedModules();
  if (first !== undefined) {
    build.setModuleEnabled(first.slot, false);
    build.setModulePriority(first.slot, 0);
  }

  return withNameAndIdent(build);
}

/**
 * The same build, named.
 *
 * `ShipName` and `ShipIdent` enter a build only through construction, so a
 * named build is a round trip through the package's own loadout event rather
 * than a setter that does not exist.
 */
export function withNameAndIdent(
  build: ShipLoadout,
  name = 'Reference Fixture',
  ident = 'RF-01',
): ShipLoadout {
  return ShipLoadout.fromLoadout({
    ...build.toLoadoutEvent({ moduleOrder: 'fitted' }),
    // The package's serializer writes the hull the way the game logs it, and
    // construction keeps whatever string it is handed — so a fixture that took
    // the event's own spelling would carry a hull identity no ingress path in
    // this application can produce. Carried over from the build being named,
    // where it is already the package's own symbol.
    Ship: build.shipSymbol,
    ShipName: name,
    ShipIdent: ident,
  });
}

/** Fits the largest-priced article the package offers for one slot. */
function fitLargest(build: ShipLoadout, slotKey: string): void {
  const candidates = build.modulesForSlot(slotKey);
  const best = candidates.at(-1);
  if (best === undefined) {
    return;
  }
  try {
    build.setModule(slotKey, best);
  } catch {
    // A slot the package will not fit that article into keeps whatever the
    // hull default put there. The fixture is "as full as the package allows",
    // which is the measurement's worst case either way.
  }
}

/** Applies the package's first offered blueprint at completed quality. */
function applyFirstBlueprint(build: ShipLoadout, slotKey: string): boolean {
  const [blueprint] = build.availableBlueprints(slotKey);
  if (blueprint === undefined) {
    return false;
  }
  try {
    const grade = blueprint.grades.at(-1);
    if (grade === undefined) {
      return false;
    }
    build.applyBlueprint(slotKey, blueprint.blueprintSymbol, { grade, quality: 1 });
    return true;
  } catch {
    return false;
  }
}
