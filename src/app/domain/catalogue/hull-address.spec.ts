import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';
import {
  hullAddressSegment as publishedSegment,
  publishedAddresses,
} from '../../../../scripts/search/published-addresses.mjs';
import { hullAddressForSymbol, hullAddressSegment, hullForAddressSegment } from './hull-address';

/**
 * The address a hull answers to.
 *
 * Every expectation is read from the package rather than written out, so a pin
 * move that renames a hull renames this test's expectation with it rather than
 * leaving a stale literal behind (constitution II).
 */
describe('hullAddressSegment', () => {
  it('spells a name with a space as one segment', () => {
    expect(hullAddressSegment('Type-11 Prospector')).toBe('Type-11_Prospector');
  });

  it('leaves a one-word name exactly as the package spells it', () => {
    expect(hullAddressSegment('Anaconda')).toBe('Anaconda');
  });

  it('keeps the hyphens a name already carries', () => {
    expect(hullAddressSegment('Fer-de-Lance')).toBe('Fer-de-Lance');
  });

  it('spells every hull the package carries without escaping anything', () => {
    // Names of letters, digits, spaces and hyphens are what make this rule
    // enough on its own: a name needing an escape would address one hull as
    // another's neighbour, or as nothing at all.
    //
    // The underscore is asserted absent from the *name* rather than allowed in
    // the segment. It is the one character the substitution spends, so a name
    // carrying one would leave `Type-11_Prospector` naming either that hull or
    // a literal `Type-11_Prospector`, and the address would stop being
    // reversible.
    for (const { name } of SHIPS) {
      expect(name).toMatch(/^[A-Za-z0-9 -]+$/);
      expect(name).not.toContain('_');
      expect(encodeURIComponent(hullAddressSegment(name))).toBe(hullAddressSegment(name));
    }
  });

  it('gives every hull an address of its own', () => {
    const addresses = SHIPS.map(({ name }) => hullAddressSegment(name).toLowerCase());

    expect(new Set(addresses).size).toBe(SHIPS.length);
  });

  it('never spells one hull the way another hull’s symbol is spelled', () => {
    // The address form and the symbol form are both accepted, so a collision
    // between them would be one address opening two ships.
    const symbols = new Map(SHIPS.map((ship) => [ship.symbol.toLowerCase(), ship.symbol]));

    for (const ship of SHIPS) {
      const collision = symbols.get(hullAddressSegment(ship.name).toLowerCase());
      expect(collision === undefined || collision === ship.symbol).toBe(true);
    }
  });
});

describe('hullForAddressSegment', () => {
  it('answers for every hull’s own address', () => {
    for (const ship of SHIPS) {
      expect(hullForAddressSegment(hullAddressSegment(ship.name))?.symbol).toBe(ship.symbol);
    }
  });

  it('answers for an address published before the name form existed', () => {
    for (const ship of SHIPS) {
      expect(hullForAddressSegment(ship.symbol)?.symbol).toBe(ship.symbol);
    }
  });

  it('matches without regard to case, in both forms', () => {
    expect(hullForAddressSegment('type-11_prospector')?.symbol).toBe('LakonMiner');
    expect(hullForAddressSegment('TYPE-11_PROSPECTOR')?.symbol).toBe('LakonMiner');
    expect(hullForAddressSegment('lakonminer')?.symbol).toBe('LakonMiner');
  });

  it('answers for nothing no hull is named or symbolled', () => {
    expect(hullForAddressSegment('Not_A_Ship')).toBeNull();
    expect(hullForAddressSegment('')).toBeNull();
  });
});

describe('hullAddressForSymbol', () => {
  it('gives the address the map lists for every hull', () => {
    for (const ship of SHIPS) {
      expect(hullAddressForSymbol(ship.symbol)).toBe(hullAddressSegment(ship.name));
    }
  });

  it('gives nothing for a symbol the package does not carry', () => {
    expect(hullAddressForSymbol('Not_A_Ship')).toBeNull();
  });
});

/**
 * The deployment and the running application spell one address the same way.
 *
 * `scripts/search/published-addresses.mjs` states the rule a second time
 * because it is `.mjs` and cannot import this module. An address the map
 * advertises that the router does not serve is a published 404, and one the
 * router serves that the map omits is a screen no crawler reaches — so the two
 * copies are compared here for every hull the package carries.
 */
describe('hullAddressParity', () => {
  it('spells every hull the way the published map spells it', () => {
    for (const { name } of SHIPS) {
      expect(publishedSegment(name)).toBe(hullAddressSegment(name));
    }
  });

  it('resolves every address the map advertises back to one hull', () => {
    const published = publishedAddresses({ origin: 'https://ships.example' })
      .map(({ path }) => path)
      .filter((path) => path.startsWith('ships/'))
      .map((path) => path.slice('ships/'.length));

    expect(published).toHaveLength(SHIPS.length);
    for (const segment of published) {
      expect(hullForAddressSegment(segment)).not.toBeNull();
    }
  });
});
