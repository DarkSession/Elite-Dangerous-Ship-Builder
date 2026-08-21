import type { HullCatalogueEntry, HullSize } from './hull-catalogue';

/**
 * Everything currently narrowing the catalogue.
 *
 * The reference toolbar draws two controls and no more: one search field and
 * one exclusive landing-pad strip (canvas 1a, canvas 1b). Manufacturer,
 * hardpoint class and price are not separate facets — they are words and
 * digits the search already matches, because it matches every string a hull
 * shows.
 */
export interface CatalogueFilters {
  readonly query: string;
  readonly sizes: readonly HullSize[];
}

/** The state of a catalogue with nothing narrowed. */
export const NO_FILTERS: CatalogueFilters = {
  query: '',
  sizes: [],
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

/**
 * Narrows the catalogue to the hulls matching every active constraint.
 *
 * A hull whose size is unavailable is excluded by the size constraint rather
 * than included on a guess.
 */
export function filterCatalogue(
  entries: readonly HullCatalogueEntry[],
  filters: CatalogueFilters,
  displayText: CatalogueDisplayText,
): readonly HullCatalogueEntry[] {
  const terms = normalize(filters.query).split(/\s+/).filter(Boolean);

  return entries.filter((entry) => {
    if (terms.length > 0 && !matchesQuery(entry, terms, displayText)) {
      return false;
    }
    return (
      filters.sizes.length === 0 || (entry.size !== null && filters.sizes.includes(entry.size))
    );
  });
}

/**
 * Whether a hull answers the whole search.
 *
 * Every word must land somewhere, but they need not land in the same place:
 * "lakon asp" is a manufacturer and a name, and a Commander who types both
 * means the hull that is both. Requiring one field to contain the whole phrase
 * would find nothing, which is the one answer that is certainly wrong.
 */
function matchesQuery(
  entry: HullCatalogueEntry,
  terms: readonly string[],
  displayText: CatalogueDisplayText,
): boolean {
  const shown = displayText(entry)
    .filter((value) => value !== null)
    .map(normalize);
  return terms.every((term) => shown.some((value) => value.includes(term)));
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
