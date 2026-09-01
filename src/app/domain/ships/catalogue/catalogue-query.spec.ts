import { hullCatalogue, type HullCatalogueEntry } from './hull-catalogue';
import { NO_FILTERS, filterCatalogue, type CatalogueFilters } from './catalogue-query';

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
    expect(symbolsOf({ query: '   ' })).toHaveLength(entries.length);
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

  // The toolbar draws one field, so a Commander who knows both halves of what
  // they want types both halves: "lakon asp" is a manufacturer and a name.
  it('lands each word of a search separately, across whichever facts carry it', () => {
    const mixed = symbolsOf({ query: 'lakon asp' });

    expect(mixed.length).toBeGreaterThan(0);
    for (const symbol of mixed) {
      const entry = entries.find((candidate) => candidate.symbol === symbol)!;
      expect(entry.manufacturer?.toLowerCase()).toContain('lakon');
      expect(entry.name?.toLowerCase()).toContain('asp');
    }
    // Word order is not part of the question being asked.
    expect(symbolsOf({ query: 'asp lakon' })).toEqual(mixed);
  });

  it('finds nothing when one word of a search matches nothing', () => {
    expect(symbolsOf({ query: 'lakon gutamaya' })).toHaveLength(0);
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

  it('excludes a hull whose size is unavailable rather than guessing one', () => {
    const sizeless: HullCatalogueEntry = { ...entries[0]!, size: null, symbol: 'Sizeless' };

    const found = filterCatalogue(
      [...entries, sizeless],
      withFilters({ sizes: ['large', 'medium', 'small'] }),
      displayed,
    );

    expect(found.map((entry) => entry.symbol)).not.toContain('Sizeless');
  });

  it('combines the search and the size strip with and', () => {
    const bySize = symbolsOf({ sizes: ['large'] });
    const both = symbolsOf({ sizes: ['large'], query: 'anaconda' });

    expect(both.length).toBeLessThanOrEqual(bySize.length);
    for (const symbol of both) {
      expect(bySize).toContain(symbol);
    }
  });
});
