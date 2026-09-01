import type { HardpointProfile, HullCatalogueEntry, HullSize } from './hull-catalogue';

/** The facts the catalogue can be ordered by — every fact it displays. */
export type CatalogueSortField = 'name' | 'manufacturer' | 'size' | 'hardpoints' | 'price';

export type SortDirection = 'ascending' | 'descending';

export interface CatalogueSort {
  readonly field: CatalogueSortField;
  readonly direction: SortDirection;
}

/** What the catalogue opens on. */
export const DEFAULT_SORT: CatalogueSort = { field: 'name', direction: 'ascending' };

/**
 * The displayed name and manufacturer, in the active locale.
 *
 * Ordering follows the text on screen, so it comes from the same presentation
 * layer that produced that text. A hull ordered by its English package symbol
 * while its localized name is shown would look randomly shuffled.
 */
export interface CatalogueSortText {
  readonly name: string | null;
  readonly manufacturer: string | null;
}

/** Small before medium before large — the game's own progression, not the alphabet. */
const SIZE_ORDER: Record<HullSize, number> = { small: 0, medium: 1, large: 2 };

/**
 * Orders the catalogue by one displayed fact, in either direction.
 *
 * Three rules make the result predictable rather than merely sorted:
 *
 *   * **text is compared with the locale's own collator**, so ä sorts where a
 *     reader of that language expects it rather than after z;
 *   * **an unavailable value sorts last in both directions**, because a hull
 *     with no price is not the cheapest hull and not the dearest one either.
 *     Absence is settled before the direction is applied, which is the whole
 *     reason it is settled separately;
 *   * **the package's own ordinal breaks every remaining tie**, so two hulls
 *     with the same manufacturer never swap places between renders.
 */
export function sortCatalogue(
  entries: readonly HullCatalogueEntry[],
  sort: CatalogueSort,
  collator: Intl.Collator,
  text: (entry: HullCatalogueEntry) => CatalogueSortText,
): readonly HullCatalogueEntry[] {
  const descending = sort.direction === 'descending';
  const value = (entry: HullCatalogueEntry) => sortValue(entry, sort.field, text);

  return [...entries].sort((left, right) => {
    const leftValue = value(left);
    const rightValue = value(right);

    const absence = compareAbsence(leftValue, rightValue);
    if (absence !== 0) {
      return absence;
    }

    if (leftValue !== null && rightValue !== null) {
      const compared = compare(leftValue, rightValue, collator);
      if (compared !== 0) {
        return descending ? -compared : compared;
      }
    }

    // Never reversed: the tie-breaker exists to make the order stable, and a
    // tie-breaker that flips with the direction is not stable.
    return left.sourceOrdinal - right.sourceOrdinal;
  });
}

/** The comparable a field contributes, or `null` when the package has none. */
type SortValue = string | number | HardpointProfile | null;

function sortValue(
  entry: HullCatalogueEntry,
  field: CatalogueSortField,
  text: (entry: HullCatalogueEntry) => CatalogueSortText,
): SortValue {
  switch (field) {
    case 'name':
      return text(entry).name;
    case 'manufacturer':
      return text(entry).manufacturer;
    case 'size':
      return entry.size === null ? null : SIZE_ORDER[entry.size];
    case 'hardpoints':
      return entry.hardpoints;
    case 'price':
      return entry.retailPrice;
  }
}

/** Present before absent, whatever the direction. */
function compareAbsence(left: SortValue, right: SortValue): number {
  if (left === null && right === null) {
    return 0;
  }
  if (left === null) {
    return 1;
  }
  if (right === null) {
    return -1;
  }
  return 0;
}

function compare(left: SortValue, right: SortValue, collator: Intl.Collator): number {
  if (typeof left === 'string' && typeof right === 'string') {
    return collator.compare(left, right);
  }
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    // Huge mounts first: a hull with one huge outranks a hull with three large,
    // which is how an outfitting screen reads a hardpoint row.
    for (let index = 0; index < left.length; index += 1) {
      const difference = (left[index] as number) - (right[index] as number);
      if (difference !== 0) {
        return difference;
      }
    }
  }
  return 0;
}
