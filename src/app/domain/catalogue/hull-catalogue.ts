import {
  SHIPS,
  getShipBySymbol,
  getShipSlots,
  type Ship,
} from '@elite-dangerous-almanac/core/ships/ships';
import { getDefaultLoadout } from '@elite-dangerous-almanac/core/ships/default-loadouts';
import { enumerateSlots, type BuildSlot } from '@elite-dangerous-almanac/core/ships/slots';
import { hullArtworkPath } from '../../platform/assets/hull-artwork-path';

/** The three landing-pad classes a hull can require. */
export type HullSize = 'small' | 'medium' | 'large';

/**
 * How many hardpoints a hull carries at each class, huge first.
 *
 * A tuple rather than a total, because a hull with one huge mount and a hull
 * with four small ones are not comparable by counting: the tuple is what
 * "sorted by hardpoints" actually means to a Commander.
 */
export type HardpointProfile = readonly [
  huge: number,
  large: number,
  medium: number,
  small: number,
];

/**
 * How many hardpoints the hull carries altogether.
 *
 * The tuple above is what the manifest sorts by, and it is not a total: the
 * shipyard's own hardpoint rule states one, on its trailing edge, exactly as
 * the three slot groups under it state theirs (001/FR-004). Counted here rather
 * than at the screen, beside the tuple it counts.
 */
export function hardpointTotal(profile: HardpointProfile): number {
  return profile.reduce((total, count) => total + count, 0);
}

/**
 * One hull, as the catalogue presents it.
 *
 * Every field is a projection of the package's own `Ship` record. `null` means
 * the package reports no value — never zero, which is a value a Commander might
 * act on. The package currently populates all of these, and the distinction is
 * kept anyway: a future release that drops one must show an absence rather than
 * a confident nought (constitution IV).
 */
export interface HullCatalogueEntry {
  /** The package identity, and the detail route's own segment. */
  readonly symbol: string;
  /** Position in the package's own list. The final, stable sort tie-breaker. */
  readonly sourceOrdinal: number;
  readonly name: string | null;
  readonly manufacturer: string | null;
  readonly size: HullSize | null;
  readonly hardpoints: HardpointProfile | null;
  /** The ready-to-fly price in credits. Zero, if it ever occurred, is a price. */
  readonly retailPrice: number | null;
  /** The bare-hull price in credits. */
  readonly hullPrice: number | null;
  /** Every mount the hull offers, with the game's own keys. */
  readonly slots: readonly BuildSlot[] | null;
  /** Same-origin, base-relative path to the package illustration. */
  readonly artworkPath: string;
  /** Whether the package can build a stock loadout for this hull. */
  readonly defaultAvailable: boolean;
}

/** Hardpoint mount sizes, from huge down to small. */
const HARDPOINT_CLASSES = [4, 3, 2, 1] as const;

/** The whole installed catalogue, in the package's own order. */
export function hullCatalogue(): readonly HullCatalogueEntry[] {
  return SHIPS.map(toCatalogueEntry);
}

/** One hull by its package symbol, matched the way the package matches it. */
export function hullCatalogueEntry(symbol: string): HullCatalogueEntry | null {
  const ship = getShipBySymbol(symbol);
  if (ship === null) {
    return null;
  }
  const ordinal = SHIPS.findIndex((candidate) => candidate.symbol === ship.symbol);
  return toCatalogueEntry(ship, ordinal);
}

function toCatalogueEntry(ship: Ship, sourceOrdinal: number): HullCatalogueEntry {
  return {
    symbol: ship.symbol,
    sourceOrdinal,
    name: presentText(ship.name),
    manufacturer: presentText(ship.manufacturer),
    size: ship.size,
    hardpoints: hardpointProfile(ship),
    retailPrice: presentNumber(ship.retailCost),
    hullPrice: presentNumber(ship.hullCost),
    slots: hullSlots(ship.symbol),
    artworkPath: hullArtworkPath(ship.symbol),
    // Asked rather than assumed: the catalogue and the default-loadout
    // catalogues are separate in the package, and a hull in one is not
    // automatically in the other (FR-007).
    defaultAvailable: getDefaultLoadout(ship.symbol) !== null,
  };
}

function hardpointProfile(ship: Ship): HardpointProfile | null {
  const mounts = ship.hardpoints;
  if (!Array.isArray(mounts)) {
    return null;
  }
  const counts = HARDPOINT_CLASSES.map(
    (size) => mounts.filter((mount) => mount.size === size).length,
  );
  return [counts[0]!, counts[1]!, counts[2]!, counts[3]!];
}

function hullSlots(symbol: string): readonly BuildSlot[] | null {
  const layout = getShipSlots(symbol);
  return layout === null ? null : enumerateSlots(layout);
}

/** A package string is present only when it actually says something. */
function presentText(value: string | undefined): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** A package number is present when it is a finite number — including zero. */
function presentNumber(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
