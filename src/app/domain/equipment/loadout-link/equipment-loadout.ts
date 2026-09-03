/**
 * One planned on-foot Commander, as a link carries it.
 *
 * The equipment catalogue publishes suits, weapons and modification recipes;
 * what it does not publish is an assembled loadout, so this is the application's
 * own record of the choices a Commander made. Every identity in it is the
 * package's — `Suit.family`, `PersonalWeapon.symbol` and the recipe key
 * `PERSONAL_MODIFICATIONS` is keyed by — and every figure the bench states about
 * one is asked of the package rather than kept here (constitution II).
 */

/**
 * What one item holds in its modification slots, one entry per slot.
 *
 * By slot rather than a list of what is fitted, because a slot's position is
 * part of what a loadout says: the slots a grade unlocks are its first ones, so
 * an item at grade 3 holds what is in slots 1 and 2 and has locked whatever is
 * in 3 and 4 (013/US2). A list that closed up around a cleared slot would move
 * a modification from a locked slot into an unlocked one, and the loadout a
 * link restored would not be the loadout it was made from.
 *
 * A locked slot keeps what was fitted to it. It is not counted in the material
 * requirement while it is locked, and it is still there when the grade is
 * raised again.
 */
export type ModificationSlots = readonly (string | null)[];

/** One handheld weapon on one of the suit's mounts, at a grade, with its modifications. */
export interface FittedPersonalWeapon {
  /** `PersonalWeapon.symbol`. */
  readonly symbol: string;
  /** A grade the weapon publishes. */
  readonly grade: number;
  /** What each of the weapon's modification slots holds. */
  readonly modifications: ModificationSlots;
}

/** One planned Commander: a suit at a grade, and what is on its mounts. */
export interface EquipmentLoadout {
  /** `Suit.family`, which is the identity a suit keeps at every grade. */
  readonly suitFamily: string;
  /** A grade the suit publishes. */
  readonly suitGrade: number;
  /** What each of the suit's modification slots holds. */
  readonly suitModifications: ModificationSlots;
  /**
   * What is on each mount the **catalogue** offers, one entry per key in
   * `PersonalMountKey` order — `PrimaryWeapon1`, `PrimaryWeapon2`,
   * `SecondaryWeapon`. `null` is a mount left empty.
   *
   * The catalogue's widest mount set rather than the selected suit's, so a
   * weapon on a mount this suit has no room for is *held*: retained, excluded
   * from every stated figure and from the material requirement, and back in
   * effect the moment a suit offering that mount is selected again (FR-007,
   * FR-018a). A list sized to the suit could not say that, and switching suits
   * would silently throw a weapon away.
   *
   * A mount is addressed by the game's own journal `SlotName`, published on
   * `Suit.mounts[].key`, like a ship's slots and never by a positional index
   * (constitution II). A refusal that names one names it through
   * `getPersonalMountName`, so `PrimaryWeapon1` never reaches a screen.
   */
  readonly weapons: readonly (FittedPersonalWeapon | null)[];
}
