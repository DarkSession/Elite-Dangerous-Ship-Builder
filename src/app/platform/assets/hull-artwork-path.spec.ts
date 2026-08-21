import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';
import { hullArtworkPath, hullArtworkUrl } from './hull-artwork-path';

describe('hull artwork path', () => {
  it('names the same-origin asset for a hull symbol', () => {
    expect(hullArtworkPath('Anaconda')).toBe('assets/ships/Anaconda/illustration.png');
  });

  it('keeps the package’s exact casing rather than normalising it', () => {
    expect(hullArtworkPath('Empire_Trader')).toBe('assets/ships/Empire_Trader/illustration.png');
    expect(hullArtworkPath('TypeX_3')).toBe('assets/ships/TypeX_3/illustration.png');
    expect(hullArtworkPath('anaconda')).not.toBe(hullArtworkPath('Anaconda'));
  });

  it('is relative, so a deployment sub-path resolves correctly', () => {
    expect(hullArtworkPath('Adder').startsWith('/')).toBe(false);
    expect(hullArtworkUrl('Adder', '/ship-builder/')).toBe(
      '/ship-builder/assets/ships/Adder/illustration.png',
    );
  });

  it('treats a base without a trailing slash as a directory', () => {
    expect(hullArtworkUrl('Adder', '/ship-builder')).toBe(
      '/ship-builder/assets/ships/Adder/illustration.png',
    );
  });

  it('resolves under the root base', () => {
    expect(hullArtworkUrl('Adder', '/')).toBe('/assets/ships/Adder/illustration.png');
  });

  it('names a distinct path for every installed hull', () => {
    const paths = new Set(SHIPS.map((ship) => hullArtworkPath(ship.symbol)));

    expect(paths.size).toBe(SHIPS.length);
  });
});
