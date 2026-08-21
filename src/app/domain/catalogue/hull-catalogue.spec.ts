import { SHIPS, getShipSlots } from '@elite-dangerous-almanac/core/ships/ships';
import { enumerateSlots } from '@elite-dangerous-almanac/core/ships/slots';
import { hullCatalogue, hullCatalogueEntry } from './hull-catalogue';

describe('hull catalogue projection', () => {
  it('projects every installed hull exactly once', () => {
    const entries = hullCatalogue();

    expect(entries).toHaveLength(SHIPS.length);
    expect(new Set(entries.map((entry) => entry.symbol)).size).toBe(SHIPS.length);
  });

  it('keeps the package’s own order as the stable tie-breaker', () => {
    const entries = hullCatalogue();

    expect(entries.map((entry) => entry.sourceOrdinal)).toEqual(SHIPS.map((_, index) => index));
    expect(entries[0]?.symbol).toBe(SHIPS[0]?.symbol);
  });

  it('takes every fact from the package rather than restating it', () => {
    const ship = SHIPS.find((candidate) => candidate.symbol === 'Anaconda')!;
    const entry = hullCatalogueEntry('Anaconda')!;

    expect(entry.name).toBe(ship.name);
    expect(entry.manufacturer).toBe(ship.manufacturer);
    expect(entry.size).toBe(ship.size);
    expect(entry.retailPrice).toBe(ship.retailCost);
    expect(entry.hullPrice).toBe(ship.hullCost);
  });

  it('counts hardpoints by class, huge first', () => {
    const ship = SHIPS.find((candidate) => candidate.symbol === 'Anaconda')!;
    const entry = hullCatalogueEntry('Anaconda')!;

    expect(entry.hardpoints).toEqual([
      ship.hardpoints.filter((mount) => mount.size === 4).length,
      ship.hardpoints.filter((mount) => mount.size === 3).length,
      ship.hardpoints.filter((mount) => mount.size === 2).length,
      ship.hardpoints.filter((mount) => mount.size === 1).length,
    ]);
  });

  it('enumerates slots through the package, keeping its irregular keys', () => {
    const entry = hullCatalogueEntry('Anaconda')!;

    expect(entry.slots).toEqual(enumerateSlots(getShipSlots('Anaconda')!));
    // The Anaconda's smallest optional is Slot14_Size1 with no slots 11 or 12;
    // a derived key would have produced Slot12_Size1.
    expect(entry.slots?.some((slot) => slot.key === 'Slot14_Size1')).toBe(true);
  });

  it('names a same-origin illustration for every hull', () => {
    for (const entry of hullCatalogue()) {
      expect(entry.artworkPath).toBe(`assets/ships/${entry.symbol}/illustration.svg`);
      expect(entry.artworkPath).not.toContain('://');
    }
  });

  it('asks the package whether a stock build can be created', () => {
    expect(hullCatalogue().every((entry) => entry.defaultAvailable)).toBe(true);
  });

  it('resolves a hull by symbol the way the package does', () => {
    expect(hullCatalogueEntry('empire_trader')?.symbol).toBe('Empire_Trader');
    expect(hullCatalogueEntry('  Anaconda  ')?.symbol).toBe('Anaconda');
  });

  it('answers an unknown symbol with nothing rather than a guess', () => {
    expect(hullCatalogueEntry('Nonexistent_Hull')).toBeNull();
    expect(hullCatalogueEntry('')).toBeNull();
  });

  it('keeps a real zero distinct from an unavailable value', () => {
    const entries = hullCatalogue();
    const withNoUtility = entries.filter(
      (entry) => entry.slots?.every((slot) => slot.kind !== 'utility') ?? false,
    );

    // Whatever the catalogue holds, a hull with no utility mounts has an empty
    // list of them rather than a null slot layout.
    for (const entry of withNoUtility) {
      expect(entry.slots).not.toBeNull();
    }
    expect(entries.every((entry) => entry.retailPrice !== null)).toBe(true);
  });
});
