import {
  getPreEngineeredVariants,
  type PreEngineeredVariant,
} from '@elite-dangerous-almanac/core/ships/pre-engineered';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { defaultBuild } from '../outfitting/outfitting.fixtures';

/**
 * The fixture hull's cargo rack, which the package sells two ways.
 *
 * One mount, two articles, and between them every state this feature has to
 * tell apart: a Mercenary purchase carrying a Merc Coin price, and a community
 * goal reward whose recipe the package publishes no cost for. Both come out of
 * the same slot on the same default build, so a test never has to construct a
 * loadout the game could not produce.
 */
export const CARGO_RACK = {
  slot: 'Slot01_Size7',
  symbol: 'Int_CargoRack_Size6_Class1',
} as const;

/** The Merc-Coin priced article, from the package's own variant list. */
export function mercenaryCargoRack(): PreEngineeredVariant {
  return cargoRackVariant(
    (variant) => variant.acquisition === 'mercenary' && variant.mercCoinCost !== undefined,
    'a Merc-Coin priced Mercenary variant',
  );
}

/**
 * The reward article whose recipe the package cannot cost.
 *
 * `getBlueprintCost('CargoRack_IncreasedCapacity', 5)` returns `null`. That is
 * the package's business and this application must not paper over it — the
 * regression this fixture exists to keep honest.
 */
export function uncostableCargoRack(): PreEngineeredVariant {
  return cargoRackVariant(
    (variant) => variant.acquisition !== 'mercenary',
    'a non-Mercenary reward variant',
  );
}

/** The default build with one of the cargo rack's articles fitted. */
export function cargoRackBuild(variant: PreEngineeredVariant): ShipLoadout {
  const build = defaultBuild();
  build.setPreEngineeredVariant(CARGO_RACK.slot, variant);
  return build;
}

function cargoRackVariant(
  matches: (variant: PreEngineeredVariant) => boolean,
  wanted: string,
): PreEngineeredVariant {
  const variant = getPreEngineeredVariants(CARGO_RACK.symbol).find(matches);
  if (variant === undefined) {
    throw new Error(
      `The installed Almanac no longer carries ${wanted} of ${CARGO_RACK.symbol}. ` +
        'Pick a new fixture from the package rather than writing one here.',
    );
  }
  return variant;
}
