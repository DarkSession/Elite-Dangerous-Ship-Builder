import { applyPersonalModifiers } from '@elite-dangerous-almanac/core/equipment/engineering';
import {
  getPersonalWeaponBySymbol,
  getPersonalWeaponGrade,
  personalWeaponMetrics,
} from '@elite-dangerous-almanac/core/equipment/weapons';
import type {
  PersonalWeapon,
  PersonalWeaponMetrics,
} from '@elite-dangerous-almanac/core/equipment/weapons';
import type { PersonalModifier } from '@elite-dangerous-almanac/core/equipment/engineering';
import type { EquipmentLoadout, FittedPersonalWeapon } from '../loadout-link/equipment-loadout';
import { CATALOGUE_MOUNTS, mountAvailability } from '../loadout/loadout-mounts';
import { modifiersOf, unlockedRecipes } from './fitted-modifiers';
import { suitReadings } from './suit-readings';

/** The recipe whose whole numeric effect is the weapon's own `reloadTime.upgraded`. */
const RELOAD_SPEED = 'weapon_reloadspeed';

/** What one fitted weapon is worth at the grade it is set to. */
export interface WeaponReadings {
  /** The mount it is on, as Frontier's journal `SlotName` spells it. */
  readonly mount: string;
  /** `PersonalWeapon.symbol`. */
  readonly symbol: string;
  /** The weapon's catalogue facts, which no grade or recipe moves. */
  readonly weapon: PersonalWeapon;
  readonly grade: number;
  /** Damage per projectile at this grade, modified. */
  readonly damage: number;
  readonly rateOfFire: number;
  readonly magazineSize: number;
  /** Spare rounds, folded with the weapon's modifiers **and** the suit's. */
  readonly reserveAmmo: number;
  readonly effectiveRange: number;
  readonly headshotMultiplier: number;
  /** Aim-down-sights magnification, `upgraded` where Scope is fitted. */
  readonly scopeMagnification: number;
  /** Seconds to reload, `upgraded` where Reload Speed is fitted. */
  readonly reloadTime: number;
  /** Every derived combat figure, exactly as the package returns them. */
  readonly metrics: PersonalWeaponMetrics;
  /** Modification slots this grade unlocks. */
  readonly modificationSlots: number;
  /** The recipes in those slots, which are the ones in effect. */
  readonly unlocked: readonly string[];
}

/**
 * One fitted weapon's figures, each one the package's answer.
 *
 * **Two calling rules the arithmetic depends on**, both the library's:
 *
 * - the fitted modifiers go in as they are. `personalWeaponMetrics` reads
 *   `magazineSize` and `headshotMultiplier` off them and ignores the rest, so a
 *   filtered list would be this application deciding what a figure is made of.
 * - **Reload Speed carries no modifier at all.** Its magnitude is the weapon's
 *   own `reloadTime.upgraded`, reached through `options.reloadSpeed`. A call
 *   passing only the modifier list would state the unmodified sustained figure
 *   for every weapon carrying the recipe, and nothing in the list would say so.
 *
 * `suitModifiers` carries the worn suit's unlocked modifiers, because Extra Ammo
 * Capacity is a *suit* recipe that moves a *weapon's* `reserveAmmo`.
 */
export function weaponReadings(
  mount: string,
  fitted: FittedPersonalWeapon,
  suitModifiers: readonly PersonalModifier[],
): WeaponReadings | null {
  const weapon = getPersonalWeaponBySymbol(fitted.symbol);
  if (weapon === null) return null;
  // Asked of the published list first: the accessor raises on a grade outside
  // 1-5 rather than answering `null`, and a loadout that arrived from storage or
  // an older release may name one.
  if (!publishedWeaponGrades(weapon.symbol).includes(fitted.grade)) return null;
  const grade = getPersonalWeaponGrade(weapon, fitted.grade);
  if (grade === null) return null;

  const unlocked = unlockedRecipes(fitted.modifications, grade.modificationSlots);
  const modifiers = modifiersOf(unlocked);
  const fold = (stat: string, base: number): number =>
    applyPersonalModifiers(stat, base, modifiers);
  const reloadSpeed = unlocked.includes(RELOAD_SPEED);
  const metrics = personalWeaponMetrics(weapon, fitted.grade, modifiers, { reloadSpeed });
  // The package answers `null` for a grade it does not publish. The grade above
  // is that same promise, so this cannot be reached today; it is here because
  // stating a figure the package declined to give would be fabricating one.
  if (metrics === null) return null;

  return {
    mount,
    symbol: weapon.symbol,
    weapon,
    grade: fitted.grade,
    damage: fold('damage', grade.damage),
    rateOfFire: fold('rateOfFire', weapon.rateOfFire),
    magazineSize: fold('magazineSize', weapon.magazineSize),
    // The weapon's own modifiers and the suit's, because the recipe that moves
    // this figure is fitted to the suit rather than to the weapon.
    reserveAmmo: applyPersonalModifiers('reserveAmmo', weapon.reserveAmmo, [
      ...modifiers,
      ...suitModifiers,
    ]),
    effectiveRange: fold('effectiveRange', weapon.effectiveRange),
    headshotMultiplier: fold('headshotMultiplier', weapon.headshotMultiplier),
    // Scope and Reload Speed each carry no modifier: the catalogue's own pair of
    // values is the whole of their numeric effect, and it differs per weapon.
    scopeMagnification: unlocked.includes('weapon_scope')
      ? weapon.scopeMagnification.upgraded
      : weapon.scopeMagnification.default,
    reloadTime: reloadSpeed ? weapon.reloadTime.upgraded : weapon.reloadTime.default,
    metrics,
    modificationSlots: grade.modificationSlots,
    unlocked,
  };
}

/**
 * Every weapon that counts, in mount order.
 *
 * A weapon on a held mount contributes nothing: it is named in the ledger and
 * stated by no figure until a suit carrying its mount is worn again (FR-007).
 */
export function fittedWeaponReadings(loadout: EquipmentLoadout): readonly WeaponReadings[] {
  const suitModifiers = modifiersOf(suitReadings(loadout)?.unlocked ?? []);
  const availability = mountAvailability(loadout);
  return CATALOGUE_MOUNTS.flatMap((mount, position) => {
    const fitted = loadout.weapons[position];
    if (fitted == null || availability[position] !== 'offered') return [];
    const readings = weaponReadings(mount.key, fitted, suitModifiers);
    return readings === null ? [] : [readings];
  });
}

/** Every grade the weapon publishes, lowest first. */
export function publishedWeaponGrades(symbol: string): readonly number[] {
  const weapon = getPersonalWeaponBySymbol(symbol);
  if (weapon === null) return [];
  return Object.keys(weapon.grades)
    .map(Number)
    .sort((one, other) => one - other);
}
