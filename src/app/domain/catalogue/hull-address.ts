import { SHIPS, getShipBySymbol, type Ship } from '@elite-dangerous-almanac/core/ships/ships';

/**
 * How a hull is spelled in an address, and which hull an address names.
 *
 * The address is the package `name` with each space replaced by an underscore
 * and nothing else changed: `Type-11 Prospector` is `Type-11_Prospector`
 * (001/FR-005). A hull `symbol` says nothing to the Commander reading the
 * address bar and nothing to a search result quoting it, and the package's names
 * carry only letters, digits, spaces and hyphens, so every one of them spells an
 * address without being escaped.
 *
 * The identity is untouched. FR-001 keeps `symbol` as the hull identity, and it
 * is still what stored builds, links, SLEF payloads and the artwork directories
 * are keyed by. This is the address alone.
 */

/** The one character an address is spelled differently from a name. */
const SPACE = / /g;

/** The address segment one hull answers to. */
export function hullAddressSegment(name: string): string {
  return name.replace(SPACE, '_');
}

/** The address segment for a hull symbol, or `null` for a symbol no hull has. */
export function hullAddressForSymbol(symbol: string): string | null {
  const ship = getShipBySymbol(symbol);
  return ship === null ? null : hullAddressSegment(ship.name);
}

/**
 * The hull an address segment names, or `null` for a segment no hull answers to.
 *
 * The name form is tried first because it is the canonical one, and the symbol
 * after it: an address published before the name form existed still opens the
 * hull it named, and the screen replaces it in history with the canonical
 * address rather than leaving one hull with two of them.
 *
 * Both forms are matched without regard to case, which is what an address has to
 * do — a Commander typing one, and a link that lower-cased it on the way, name
 * the same ship as the map does.
 */
export function hullForAddressSegment(segment: string): Ship | null {
  const wanted = segment.toLowerCase();
  const named = SHIPS.find((ship) => hullAddressSegment(ship.name).toLowerCase() === wanted);
  return named ?? getShipBySymbol(segment);
}
