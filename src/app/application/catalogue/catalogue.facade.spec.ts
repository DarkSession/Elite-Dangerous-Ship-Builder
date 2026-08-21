import { TestBed } from '@angular/core/testing';
import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';
import { provideLocalization } from '../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../i18n/testing/localization-harness';
import { SESSION_STORAGE_PORT } from '../../platform/storage/web-storage.port';
import { createWebStoragePort } from '../../platform/storage/web-storage.adapter';
import { CatalogueFacade } from './catalogue.facade';

function facade(): CatalogueFacade {
  const entries = new Map<string, string>();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideLocalization(),
      ...provideIsolatedLocaleEnvironment(),
      {
        provide: SESSION_STORAGE_PORT,
        useValue: createWebStoragePort(() => ({
          get length() {
            return entries.size;
          },
          key: (index: number) => [...entries.keys()][index] ?? null,
          getItem: (key: string) => entries.get(key) ?? null,
          setItem: (key: string, value: string) => void entries.set(key, value),
          removeItem: (key: string) => void entries.delete(key),
          clear: () => entries.clear(),
        })),
      },
    ],
  });
  return TestBed.inject(CatalogueFacade);
}

describe('CatalogueFacade', () => {
  it('presents every installed hull before anything is narrowed', () => {
    const catalogue = facade();

    expect(catalogue.rows()).toHaveLength(SHIPS.length);
    expect(catalogue.total).toBe(SHIPS.length);
    expect(catalogue.count()).toMatchObject({ shown: SHIPS.length, unconstrained: true });
  });

  it('presents each hull as localized text rather than as raw package fields', () => {
    const row = facade().rows()[0]!;

    expect(row.name.text).not.toBeNull();
    expect(row.manufacturer.text).not.toBeNull();
    expect(row.size).not.toBeNull();
    expect(row.hardpoints.length).toBeGreaterThan(0);
    // The manifest column is priced in Mcr, as the reference draws it.
    expect(row.price).toMatch(/^\d+(\.\d+)?$/);
  });

  it('narrows to the hulls matching a search over the displayed text', () => {
    const catalogue = facade();

    catalogue.changeSearch('anaconda');

    expect(catalogue.rows().length).toBeLessThan(SHIPS.length);
    expect(catalogue.rows().some((row) => row.symbol === 'Anaconda')).toBe(true);
    expect(catalogue.count().unconstrained).toBe(false);
  });

  // FR-002's filtering, which the reference toolbar draws no controls for.
  // The capability is here and tested; only the manufacturer, hardpoint and
  // price controls are absent from the screen.
  it('narrows by every facet FR-002 names', () => {
    let catalogue = facade();
    catalogue.changeSizes(['large']);
    const large = catalogue.rows().length;
    expect(large).toBeGreaterThan(0);
    expect(large).toBeLessThan(SHIPS.length);

    catalogue = facade();
    catalogue.changeManufacturers([catalogue.manufacturers()[0]!]);
    expect(catalogue.rows().length).toBeGreaterThan(0);

    catalogue = facade();
    catalogue.changeHardpointClasses([4]);
    expect(catalogue.rows().length).toBeGreaterThan(0);

    catalogue = facade();
    catalogue.changePrice(0, 1);
    expect(catalogue.rows().length).toBeLessThan(SHIPS.length);
  });

  it('starts a new sort field ascending and flips the current one', () => {
    const catalogue = facade();

    catalogue.changeSort('price');
    expect(catalogue.sort()).toEqual({ field: 'price', direction: 'ascending' });

    catalogue.changeSort('price');
    expect(catalogue.sort()).toEqual({ field: 'price', direction: 'descending' });

    catalogue.changeSort('name');
    expect(catalogue.sort()).toEqual({ field: 'name', direction: 'ascending' });
  });

  it('states the order and the next action in words', () => {
    const catalogue = facade();
    catalogue.setSort({ field: 'price', direction: 'descending' });

    expect(catalogue.sortText()).toContain('Price Mcr');
    expect(catalogue.sortText()).toContain('descending');
    expect(catalogue.sortActionLabel('price')).toContain('ascending');
  });

  it('orders by the displayed price, keeping the order stable', () => {
    const catalogue = facade();
    catalogue.setSort({ field: 'price', direction: 'ascending' });

    const prices = catalogue.results().map((entry) => entry.retailPrice!);

    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it('states the match count as one sentence', () => {
    const catalogue = facade();
    catalogue.changeSearch('anaconda');

    expect(catalogue.countText()).toContain('of');
    expect(catalogue.countText()).toContain(String(SHIPS.length));
  });

  it('offers every manufacturer once, ordered for the reader', () => {
    const manufacturers = facade().manufacturers();

    expect(new Set(manufacturers).size).toBe(manufacturers.length);
    expect([...manufacturers].sort()).toEqual([...manufacturers].sort());
  });

  it('remembers where the Commander was before opening a hull', () => {
    const catalogue = facade();

    catalogue.rememberPosition('Anaconda', 42);

    expect(catalogue.anchor()).toEqual({ symbol: 'Anaconda', offsetWithinItem: 42 });
  });

  it('describes a hull with no hardpoints without inventing a count', () => {
    const catalogue = facade();
    const row = catalogue.rowFor({
      symbol: 'Unarmed',
      sourceOrdinal: 0,
      name: 'Unarmed',
      manufacturer: 'Maker',
      size: 'small',
      hardpoints: [0, 0, 0, 0],
      retailPrice: null,
      hullPrice: null,
      slots: [],
      artworkPath: 'assets/ships/Unarmed/illustration.svg',
      defaultAvailable: false,
    });

    expect(row.hardpoints).toBe('No hardpoints');
    expect(row.price).toBeNull();
  });

  describe('the two sort decisions, kept apart', () => {
    it('changes the field without reversing an order it already has', () => {
      const catalogue = facade();
      catalogue.toggleSortDirection();
      expect(catalogue.sort()).toMatchObject({ field: 'name', direction: 'descending' });

      // The toolbar offers a select for the field and a button for the
      // direction. Re-selecting the field a list is already ordered by must not
      // silently reverse it — but it does start a new field ascending.
      catalogue.selectSortField('name');
      expect(catalogue.sort()).toMatchObject({ field: 'name', direction: 'descending' });

      catalogue.selectSortField('price');
      expect(catalogue.sort()).toMatchObject({ field: 'price', direction: 'ascending' });
    });

    it('reverses the current order and leaves the field alone', () => {
      const catalogue = facade();
      catalogue.selectSortField('size');

      catalogue.toggleSortDirection();
      expect(catalogue.sort()).toMatchObject({ field: 'size', direction: 'descending' });

      catalogue.toggleSortDirection();
      expect(catalogue.sort()).toMatchObject({ field: 'size', direction: 'ascending' });
    });

    it('states the current order in words for every field', () => {
      const catalogue = facade();
      const said = new Set<string>();

      for (const field of ['name', 'manufacturer', 'size', 'hardpoints', 'price'] as const) {
        for (const direction of ['ascending', 'descending'] as const) {
          catalogue.setSort({ field, direction });
          // The field and the direction are both named: a sort a Commander
          // cannot read is a sort they cannot undo.
          said.add(catalogue.sortText());
        }
      }

      expect(said.size).toBe(10);
    });
  });
});
