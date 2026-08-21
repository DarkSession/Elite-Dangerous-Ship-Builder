import { hullCatalogue, type HullCatalogueEntry } from './hull-catalogue';
import {
  NO_FILTERS,
  filterCatalogue,
  hasFilters,
  manufacturersIn,
  type CatalogueFilters,
} from './catalogue-query';

const entries = hullCatalogue();

/** What a hull shows on screen: the names, the size word and the price. */
const displayed = (entry: HullCatalogueEntry): readonly (string | null)[] => [
  entry.name,
  entry.manufacturer,
  entry.size,
  entry.retailPrice === null ? null : String(entry.retailPrice),
];

function withFilters(overrides: Partial<CatalogueFilters>): CatalogueFilters {
  return { ...NO_FILTERS, ...overrides };
}

function symbolsOf(filters: Partial<CatalogueFilters>): readonly string[] {
  return filterCatalogue(entries, withFilters(filters), displayed).map((entry) => entry.symbol);
}

describe('catalogue filtering', () => {
  it('shows everything when nothing is narrowed', () => {
    expect(filterCatalogue(entries, NO_FILTERS, displayed)).toHaveLength(entries.length);
    expect(hasFilters(NO_FILTERS)).toBe(false);
  });

  it('matches the text a Commander can actually see', () => {
    const found = symbolsOf({ query: 'anaconda' });

    expect(found).toContain('Anaconda');
    expect(found.length).toBeLessThan(entries.length);
  });

  it('ignores case and surrounding space in a search', () => {
    expect(symbolsOf({ query: '  ANACONDA  ' })).toEqual(symbolsOf({ query: 'anaconda' }));
  });

  it('searches the manufacturer as well as the ship', () => {
    const found = symbolsOf({ query: 'faulcon' });

    expect(found.length).toBeGreaterThan(1);
    expect(found.every((symbol) => entries.find((e) => e.symbol === symbol)?.manufacturer)).toBe(
      true,
    );
  });

  it('narrows by size, keeping every chosen size', () => {
    const large = symbolsOf({ sizes: ['large'] });
    const both = symbolsOf({ sizes: ['large', 'small'] });

    expect(large.length).toBeGreaterThan(0);
    expect(both.length).toBeGreaterThan(large.length);
    for (const symbol of large) {
      expect(both).toContain(symbol);
    }
  });

  it('narrows by manufacturer', () => {
    const manufacturer = manufacturersIn(entries)[0]!;
    const found = filterCatalogue(
      entries,
      withFilters({ manufacturers: [manufacturer] }),
      displayed,
    );

    expect(found.length).toBeGreaterThan(0);
    expect(found.every((entry) => entry.manufacturer === manufacturer)).toBe(true);
  });

  it('requires every chosen hardpoint class to be present', () => {
    const huge = symbolsOf({ hardpointClasses: [4] });
    const hugeAndSmall = symbolsOf({ hardpointClasses: [4, 1] });

    expect(huge.length).toBeGreaterThan(0);
    expect(hugeAndSmall.length).toBeLessThanOrEqual(huge.length);
    for (const symbol of hugeAndSmall) {
      expect(huge).toContain(symbol);
    }
  });

  it('treats a price interval as inclusive at both ends', () => {
    const cheapest = [...entries].sort((a, b) => a.retailPrice! - b.retailPrice!)[0]!;
    const found = filterCatalogue(
      entries,
      withFilters({ price: { min: cheapest.retailPrice, max: cheapest.retailPrice } }),
      displayed,
    );

    expect(found.map((entry) => entry.symbol)).toContain(cheapest.symbol);
  });

  it('treats a null bound as no limit rather than as zero', () => {
    const openTop = symbolsOf({ price: { min: 1, max: null } });
    const openBottom = symbolsOf({ price: { min: null, max: Number.MAX_SAFE_INTEGER } });

    expect(openTop).toHaveLength(entries.length);
    expect(openBottom).toHaveLength(entries.length);
  });

  it('excludes a hull whose value for a constraint is unavailable', () => {
    const unpriced: HullCatalogueEntry = { ...entries[0]!, retailPrice: null, symbol: 'Unpriced' };
    const withUnpriced = [...entries, unpriced];

    const found = filterCatalogue(
      withUnpriced,
      withFilters({ price: { min: 0, max: Number.MAX_SAFE_INTEGER } }),
      displayed,
    );

    // Absence is not "cheap": an unknown price is not within any interval.
    expect(found.map((entry) => entry.symbol)).not.toContain('Unpriced');
  });

  it('combines constraints of different kinds with and', () => {
    const bySize = symbolsOf({ sizes: ['large'] });
    const both = symbolsOf({ sizes: ['large'], query: 'anaconda' });

    expect(both.length).toBeLessThanOrEqual(bySize.length);
    for (const symbol of both) {
      expect(bySize).toContain(symbol);
    }
  });

  it('reports whether anything is narrowing the catalogue', () => {
    expect(hasFilters(withFilters({ query: '  ' }))).toBe(false);
    expect(hasFilters(withFilters({ query: 'a' }))).toBe(true);
    expect(hasFilters(withFilters({ sizes: ['small'] }))).toBe(true);
    expect(hasFilters(withFilters({ manufacturers: ['x'] }))).toBe(true);
    expect(hasFilters(withFilters({ hardpointClasses: [1] }))).toBe(true);
    expect(hasFilters(withFilters({ price: { min: 1, max: null } }))).toBe(true);
    expect(hasFilters(withFilters({ price: { min: null, max: 1 } }))).toBe(true);
  });

  it('lists each manufacturer once, for the facet control', () => {
    const manufacturers = manufacturersIn(entries);

    expect(new Set(manufacturers).size).toBe(manufacturers.length);
    expect(manufacturers.length).toBeGreaterThan(1);
  });
});
