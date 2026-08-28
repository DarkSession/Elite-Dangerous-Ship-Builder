import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { weaponMetrics } from '@elite-dangerous-almanac/core/ships/weapons';
const F = [
  'damagePerSecond',
  'sustainedDamagePerSecond',
  'sustainedRateOfFire',
  'energyPerSecond',
  'sustainedEnergyPerSecond',
  'heatPerSecond',
  'sustainedHeatPerSecond',
];
const R = {
  damagePerSecond: 'damage',
  energyPerSecond: 'distributorDraw',
  heatPerSecond: 'thermalLoad',
  sustainedDamagePerSecond: 'damagePerSecond',
  sustainedEnergyPerSecond: 'energyPerSecond',
  sustainedHeatPerSecond: 'heatPerSecond',
  sustainedRateOfFire: 'rateOfFire',
};
function survive(stockA, modA) {
  const sf = weaponMetrics(stockA),
    mf = modA ? weaponMetrics(modA) : null;
  const val = (a, f) => (a ? (F.includes(f) ? weaponMetrics(a)[f] : (a[f] ?? null)) : null);
  return F.filter((f) => {
    const o = R[f];
    const os = val(stockA, o),
      om = val(modA, o);
    const s = sf[f],
      m = mf ? mf[f] : null;
    if (os === null && om === null) return true; // mirror row absent
    return !(os === s && om === m);
  });
}
for (const [slot, bp] of [['SmallHardpoint1', 'Weapon_RapidFire']]) {
  const b = ShipLoadout.default('Anaconda');
  const stock = b.fittedModuleAt(slot).stats;
  console.log('symbol', b.fittedModuleAt(slot).symbol, 'clip', stock.clipSize);
  b.applyBlueprint(slot, bp, { grade: 5, quality: 1 });
  const mod = b.fittedModuleAt(slot).effectiveStats;
  console.log('survives:', survive(stock, mod));
}
// a reloading weapon
const b2 = ShipLoadout.default('Anaconda');
import { getModuleBySymbol } from '@elite-dangerous-almanac/core/ships/modules';
b2.setModule('SmallHardpoint1', getModuleBySymbol('Hpt_MultiCannon_Fixed_Small'));
const s2 = b2.fittedModuleAt('SmallHardpoint1').stats;
const c2 = ShipLoadout.default('Anaconda');
c2.setModule('SmallHardpoint1', getModuleBySymbol('Hpt_MultiCannon_Fixed_Small'));
c2.applyBlueprint('SmallHardpoint1', 'Weapon_RapidFire', { grade: 5, quality: 1 });
console.log(
  'multicannon clip',
  s2.clipSize,
  'survives:',
  survive(s2, c2.fittedModuleAt('SmallHardpoint1').effectiveStats),
);
