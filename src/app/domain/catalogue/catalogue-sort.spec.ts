import type { HullCatalogueEntry } from './hull-catalogue';
import { DEFAULT_SORT, sortCatalogue, type CatalogueSort } from './catalogue-sort';

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

function entry(overrides: Partial<HullCatalogueEntry>): HullCatalogueEntry {
  return {
    symbol: 'Hull',
    sourceOrdinal: 0,
    name: 'Hull',
    manufacturer: 'Maker',
    size: 'medium',
    hardpoints: [0, 0, 0, 0],
    retailPrice: 0,
    hullPrice: 0,
    slots: [],
    artworkPath: 'assets/ships/Hull/illustration.png',
    defaultAvailable: true,
    ...overrides,
  };
}

const text = (candidate: HullCatalogueEntry) => ({
  name: candidate.name,
  manufacturer: candidate.manufacturer,
});

function order(entries: readonly HullCatalogueEntry[], sort: CatalogueSort): readonly string[] {
  return sortCatalogue(entries, sort, collator, text).map((candidate) => candidate.symbol);
}

describe('catalogue ordering', () => {
  it('orders names with the locale’s own collator', () => {
    const entries = [
      entry({ symbol: 'Z', name: 'Zorgon', sourceOrdinal: 0 }),
      entry({ symbol: 'A', name: 'Ähnlich', sourceOrdinal: 1 }),
      entry({ symbol: 'B', name: 'Beluga', sourceOrdinal: 2 }),
    ];

    // Not code-point order, which would put Ä after Z.
    expect(order(entries, { field: 'name', direction: 'ascending' })).toEqual(['A', 'B', 'Z']);
  });

  it('reverses on request', () => {
    const entries = [
      entry({ symbol: 'A', name: 'Adder', sourceOrdinal: 0 }),
      entry({ symbol: 'B', name: 'Beluga', sourceOrdinal: 1 }),
    ];

    expect(order(entries, { field: 'name', direction: 'descending' })).toEqual(['B', 'A']);
  });

  it('orders size by the game’s own progression, not the alphabet', () => {
    const entries = [
      entry({ symbol: 'M', size: 'medium', sourceOrdinal: 0 }),
      entry({ symbol: 'L', size: 'large', sourceOrdinal: 1 }),
      entry({ symbol: 'S', size: 'small', sourceOrdinal: 2 }),
    ];

    expect(order(entries, { field: 'size', direction: 'ascending' })).toEqual(['S', 'M', 'L']);
    expect(order(entries, { field: 'size', direction: 'descending' })).toEqual(['L', 'M', 'S']);
  });

  it('orders hardpoints by class, largest first', () => {
    const entries = [
      entry({ symbol: 'ThreeLarge', hardpoints: [0, 3, 0, 0], sourceOrdinal: 0 }),
      entry({ symbol: 'OneHuge', hardpoints: [1, 0, 0, 0], sourceOrdinal: 1 }),
      entry({ symbol: 'FourSmall', hardpoints: [0, 0, 0, 4], sourceOrdinal: 2 }),
    ];

    expect(order(entries, { field: 'hardpoints', direction: 'descending' })).toEqual([
      'OneHuge',
      'ThreeLarge',
      'FourSmall',
    ]);
  });

  it('orders price numerically, keeping zero as a price', () => {
    const entries = [
      entry({ symbol: 'Dear', retailPrice: 1_000, sourceOrdinal: 0 }),
      entry({ symbol: 'Free', retailPrice: 0, sourceOrdinal: 1 }),
      entry({ symbol: 'Cheap', retailPrice: 10, sourceOrdinal: 2 }),
    ];

    expect(order(entries, { field: 'price', direction: 'ascending' })).toEqual([
      'Free',
      'Cheap',
      'Dear',
    ]);
  });

  it('sorts an unavailable value last in both directions', () => {
    const entries = [
      entry({ symbol: 'Known', retailPrice: 10, sourceOrdinal: 0 }),
      entry({ symbol: 'Unknown', retailPrice: null, sourceOrdinal: 1 }),
      entry({ symbol: 'Zero', retailPrice: 0, sourceOrdinal: 2 }),
    ];

    // Absence is not the cheapest hull and not the dearest one either.
    expect(order(entries, { field: 'price', direction: 'ascending' }).at(-1)).toBe('Unknown');
    expect(order(entries, { field: 'price', direction: 'descending' }).at(-1)).toBe('Unknown');
  });

  it('sorts an unavailable name last in both directions', () => {
    const entries = [
      entry({ symbol: 'Named', name: 'Adder', sourceOrdinal: 0 }),
      entry({ symbol: 'Nameless', name: null, sourceOrdinal: 1 }),
    ];

    expect(order(entries, { field: 'name', direction: 'ascending' }).at(-1)).toBe('Nameless');
    expect(order(entries, { field: 'name', direction: 'descending' }).at(-1)).toBe('Nameless');
  });

  it('breaks every tie by the package’s own order, in both directions', () => {
    const entries = [
      entry({ symbol: 'C', manufacturer: 'Same', sourceOrdinal: 2 }),
      entry({ symbol: 'A', manufacturer: 'Same', sourceOrdinal: 0 }),
      entry({ symbol: 'B', manufacturer: 'Same', sourceOrdinal: 1 }),
    ];

    expect(order(entries, { field: 'manufacturer', direction: 'ascending' })).toEqual([
      'A',
      'B',
      'C',
    ]);
    // The tie-breaker is stability, so it does not flip with the direction.
    expect(order(entries, { field: 'manufacturer', direction: 'descending' })).toEqual([
      'A',
      'B',
      'C',
    ]);
  });

  it('leaves the given list untouched', () => {
    const entries = [
      entry({ symbol: 'B', name: 'Beluga', sourceOrdinal: 0 }),
      entry({ symbol: 'A', name: 'Adder', sourceOrdinal: 1 }),
    ];

    sortCatalogue(entries, DEFAULT_SORT, collator, text);

    expect(entries.map((candidate) => candidate.symbol)).toEqual(['B', 'A']);
  });
});
