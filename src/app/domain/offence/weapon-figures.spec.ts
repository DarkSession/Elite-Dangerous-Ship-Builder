import { getModuleBySymbol } from '@elite-dangerous-almanac/core/ships/modules';
import { WEAPON_FIGURES, weaponFigures } from './weapon-figures';

/**
 * One article's calculated figures, against the installed package.
 *
 * The engineering editor reads these beside the article's catalogue rows, so
 * what is pinned here is the pair the panel depends on: a weapon answers with
 * every figure, and anything else answers with nothing at all.
 */
describe('weapon figures', () => {
  const laser = getModuleBySymbol('Hpt_PulseLaser_Fixed_Small');
  const drive = getModuleBySymbol('Int_Hyperdrive_Size5_Class5');

  it('reports every figure for a weapon', () => {
    const figures = weaponFigures(laser);

    expect(figures).not.toBeNull();
    for (const figure of WEAPON_FIGURES) {
      expect(Number.isFinite(figures?.[figure])).toBe(true);
    }
    expect(figures?.damagePerSecond).toBeGreaterThan(0);
  });

  it('reports nothing for a module that is not a weapon', () => {
    // A drive has no damage figure, so it has no firing figures either. The
    // package would answer with zeroes, and a zero nobody measured is the one
    // thing this application never shows (constitution IV).
    expect(weaponFigures(drive)).toBeNull();
    expect(weaponFigures(null)).toBeNull();
  });
});
