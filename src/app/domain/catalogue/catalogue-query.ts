import type { HullCatalogueEntry, HullSize } from './hull-catalogue';

/** An inclusive credits interval. `null` is an open bound, not zero. */
export interface PriceRange {
  readonly min: number | null;
  readonly max: number | null;
}

/** Everything currently narrowing the catalogue. */
export interface CatalogueFilters {
  readonly query: string;
  readonly manufacturers: readonly string[];
  readonly sizes: readonly HullSize[];
  readonly hardpointClasses: readonly number[];
  readonly price: PriceRange;
}

/** The state of a catalogue with nothing narrowed. */
export const NO_FILTERS: CatalogueFilters = {
  query: '',
  manufacturers: [],
  sizes: [],
  hardpointClasses: [],
  price: { min: null, max: null },
};

/**
 * The text one hull actually shows, in the active locale.
 *
 * Search matches what a Commander can see, so the strings come from the
 * presentation layer — package-localized hull and manufacturer names, the
 * translated size word, the formatted price — rather than being re-derived
 * here from raw package fields in English (research, "Catalogue interaction
 * model").
 */
export type CatalogueDisplayText = (entry: HullCatalogueEntry) => readonly (string | null)[];

/** Whether any constraint is currently narrowing the catalogue. */
export function hasFilters(filters: CatalogueFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.manufacturers.length > 0 ||
    filters.sizes.length > 0 ||
    filters.hardpointClasses.length > 0 ||
    filters.price.min !== null ||
    filters.price.max !== null
  );
}

/**
 * Narrows the catalogue to the hulls matching every active constraint.
 *
 * Constraints are combined with `and` across kinds and `or` within one kind:
 * choosing two manufacturers widens the manufacturer constraint, while adding a
 * size narrows the result. That is what the controls look like they do.
 *
 * A hull whose value for a constraint is unavailable is excluded by that
 * constraint rather than included on a guess — an unknown price is not "within
 * range", and treating it as zero would put it at the cheap end of every
 * search.
 */
export function filterCatalogue(
  entries: readonly HullCatalogueEntry[],
  filters: CatalogueFilters,
  displayText: CatalogueDisplayText,
): readonly HullCatalogueEntry[] {
  const query = normalize(filters.query);

  return entries.filter((entry) => {
    if (query.length > 0 && !matchesQuery(entry, query, displayText)) {
      return false;
    }
    if (filters.sizes.length > 0 && (entry.size === null || !filters.sizes.includes(entry.size))) {
      return false;
    }
    if (
      filters.manufacturers.length > 0 &&
      (entry.manufacturer === null || !filters.manufacturers.includes(entry.manufacturer))
    ) {
      return false;
    }
    if (
      filters.hardpointClasses.length > 0 &&
      !hasHardpointClasses(entry, filters.hardpointClasses)
    ) {
      return false;
    }
    return withinPrice(entry.retailPrice, filters.price);
  });
}

/** Every manufacturer present in the catalogue, for the facet control. */
export function manufacturersIn(entries: readonly HullCatalogueEntry[]): readonly string[] {
  const found = new Set<string>();
  for (const entry of entries) {
    if (entry.manufacturer !== null) {
      found.add(entry.manufacturer);
    }
  }
  return [...found];
}

function matchesQuery(
  entry: HullCatalogueEntry,
  query: string,
  displayText: CatalogueDisplayText,
): boolean {
  return displayText(entry).some((value) => value !== null && normalize(value).includes(query));
}

/** A hull matches when it carries at least one mount of every chosen class. */
function hasHardpointClasses(entry: HullCatalogueEntry, classes: readonly number[]): boolean {
  const profile = entry.hardpoints;
  if (profile === null) {
    return false;
  }
  // The profile is huge-first; a class number is the mount size.
  return classes.every((size) => (profile[4 - size] ?? 0) > 0);
}

function withinPrice(price: number | null, range: PriceRange): boolean {
  if (range.min === null && range.max === null) {
    return true;
  }
  if (price === null) {
    return false;
  }
  return (range.min === null || price >= range.min) && (range.max === null || price <= range.max);
}

/**
 * Folds case and accents so a search behaves the way a reader expects.
 *
 * `NFD` plus stripping combining marks means "cutter" finds a hull spelled with
 * a diacritic, which matters as soon as the catalogue is read in a language
 * whose keyboard does not make one convenient.
 */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
