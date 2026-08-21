import type { FittedModule, ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import {
  BUILD_SNAPSHOT_FORMAT,
  BUILD_SNAPSHOT_VERSION,
  type BuildSnapshotV1,
  type EngineeringSnapshotV1,
  type PreEngineeredIdentityV1,
  type SnapshotModuleV1,
} from './build-snapshot';

/**
 * Captures a live build's modelled state.
 *
 * Read from the `ShipLoadout` getters rather than from `toLoadoutEvent()`,
 * which is a capture format: it lower-cases identities and adds recomputed
 * derived fields, and both would make a stored build disagree with the one the
 * Commander is editing (research, "Lossless build snapshot").
 *
 * Slot order is the package's own, taken from `slots()`, so a stored build and
 * a live one enumerate their modules the same way and a diff between two
 * snapshots is a diff of decisions rather than of ordering.
 */
export function toBuildSnapshotV1(loadout: ShipLoadout): BuildSnapshotV1 {
  const modules: SnapshotModuleV1[] = [];

  for (const slot of loadout.slots()) {
    const module = slot.module;
    if (module !== null) {
      modules.push(snapshotModule(slot.key, module));
    }
  }

  return {
    format: BUILD_SNAPSHOT_FORMAT,
    version: BUILD_SNAPSHOT_VERSION,
    shipSymbol: loadout.shipSymbol,
    shipName: loadout.shipName,
    shipIdent: loadout.shipIdent,
    modules,
  };
}

function snapshotModule(slotKey: string, module: FittedModule): SnapshotModuleV1 {
  const preEngineered = snapshotPreEngineered(module);

  return {
    slot: slotKey,
    symbol: module.symbol,
    // `undefined` is "the field was absent"; `false` is a decision. Collapsing
    // them would silently repower a module the Commander switched off.
    enabled: module.on ?? null,
    priority: module.priority ?? null,
    preEngineered,
    engineering: snapshotEngineering(module, preEngineered),
  };
}

function snapshotPreEngineered(module: FittedModule): PreEngineeredIdentityV1 | null {
  const variant = module.preEngineeredVariant;
  if (variant === null) {
    return null;
  }

  return {
    symbol: variant.symbol,
    blueprint: variant.blueprint,
    grade: variant.grade,
    acquisition: variant.acquisition,
    experimental: variant.experimental ?? null,
  };
}

/**
 * The ordinary engineering a module carries beyond its pre-engineered identity.
 *
 * A pre-engineered article already implies a blueprint, a grade and an
 * experimental effect, and the package republishes all three from the identity
 * tuple. Recording them a second time would be a second copy of the same fact —
 * and the two could disagree after a package update. So an engineering block
 * that says exactly what the variant already says is recorded as absent, and
 * anything further (a Mercenary article crafted up a grade, an effect applied
 * afterwards) is recorded as ordinary engineering on top.
 */
function snapshotEngineering(
  module: FittedModule,
  preEngineered: PreEngineeredIdentityV1 | null,
): EngineeringSnapshotV1 | null {
  const engineering = module.engineering;
  if (engineering === undefined) {
    return null;
  }

  const experimental = engineering.ExperimentalEffect ?? null;

  if (preEngineered !== null && describesVariant(engineering, preEngineered, experimental)) {
    return null;
  }

  return {
    blueprint: engineering.BlueprintName ?? null,
    grade: engineering.Level,
    quality: engineering.Quality,
    experimental,
  };
}

function describesVariant(
  engineering: { BlueprintName?: string; Level: number },
  variant: PreEngineeredIdentityV1,
  experimental: string | null,
): boolean {
  return (
    sameIdentity(engineering.BlueprintName ?? null, variant.blueprint) &&
    engineering.Level === variant.grade &&
    sameIdentity(experimental, variant.experimental)
  );
}

/** Package identities are compared case-insensitively, the way the package matches them. */
function sameIdentity(left: string | null, right: string | null): boolean {
  if (left === null || right === null) {
    return left === right;
  }
  return left.toLowerCase() === right.toLowerCase();
}
