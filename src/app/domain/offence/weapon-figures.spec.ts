import { getModuleBySymbol } from '@elite-dangerous-almanac/core/ships/modules';
import { WEAPON_FIGURES, weaponFigures } from './weapon-figures';

/**
 * One article's calculated figures, against the installed package.
 *
 * The engineering editor reads these beside the article's catalogue rows, so
 * what is pinned here is what the panel depends on: which articles the package
 * measures at all, and which of its returned numbers are readings.
 */
describe('weapon figures', () => {
  const pulseLaser = getModuleBySymbol('Hpt_PulseLaser_Fixed_Small');
  const beamLaser = getModuleBySymbol('Hpt_BeamLaser_Fixed_Small');
  const pointDefence = getModuleBySymbol('Hpt_PlasmaPointDefence_Turret_Tiny');
  const drive = getModuleBySymbol('Int_Hyperdrive_Size5_Class5');

  it('reports every figure for a weapon that fires shots', () => {
    const figures = weaponFigures(pulseLaser);

    expect(figures).not.toBeNull();
    for (const figure of WEAPON_FIGURES) {
      expect(Number.isFinite(figures?.[figure])).toBe(true);
    }
    expect(figures?.damagePerSecond).toBeGreaterThan(0);
  });

  it('gives a continuous-fire weapon no cadence figures', () => {
    const figures = weaponFigures(beamLaser);

    // A beam laser's stats are already per second. The package carries it
    // through the same arithmetic by reporting its damage as one shot's and a
    // rate of fire of 1, and neither of those is a reading.
    expect(figures?.damagePerSecond).toBe(beamLaser?.damage);
    expect(figures?.damagePerShot).toBeUndefined();
    expect(figures?.sustainedRateOfFire).toBeUndefined();
    expect(Number.isFinite(figures?.heatPerSecond)).toBe(true);
  });

  it('reports nothing for an article the package does not measure as a weapon', () => {
    // A point defence turret is a utility module that carries a damage figure.
    // The package's calculation takes hardpoints, so it is not measured here
    // either — it publishes no capacitor draw, and the calculation's default
    // would report that absence as a draw of zero (constitution IV).
    expect(pointDefence?.damage).toBeGreaterThan(0);
    expect(weaponFigures(pointDefence)).toBeNull();
    expect(weaponFigures(drive)).toBeNull();
    expect(weaponFigures(null)).toBeNull();
  });
});
