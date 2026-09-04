import type {
  EquipmentLoadout,
  FittedPersonalWeapon,
  ModificationSlots,
} from '../loadout-link/equipment-loadout';
import { MODIFICATION_SLOT_COUNT } from './loadout-edit';
import { CATALOGUE_MOUNTS } from './loadout-mounts';

/** The discriminator a stored loadout payload carries. */
export const STORED_LOADOUT_FORMAT = 'ednb.loadout';

/** The only published loadout-payload version. */
export const STORED_LOADOUT_VERSION = 1;

/**
 * One loadout as storage holds it.
 *
 * Its own format marker and version, like the build snapshot beside it: the
 * payload is what a future release has to be able to read, and a payload
 * version this release does not know is a record it declines to open rather
 * than one it guesses at.
 *
 * Identities only. Every figure the bench states about a loadout — shields,
 * damage, the material total — is asked of the package on open, so none of them
 * is stored and none of them can go stale (013 data-model, "the allowlist rule
 * holds").
 */
export interface StoredLoadoutV1 {
  readonly format: typeof STORED_LOADOUT_FORMAT;
  readonly version: typeof STORED_LOADOUT_VERSION;
  readonly suitFamily: string;
  readonly suitGrade: number;
  readonly suitModifications: ModificationSlots;
  /** One entry per catalogue mount, `null` where the mount is empty. */
  readonly weapons: readonly (FittedPersonalWeapon | null)[];
}

export type StoredLoadoutParseResult =
  | { readonly ok: true; readonly loadout: EquipmentLoadout }
  | {
      readonly ok: false;
      readonly failure: 'unsupported-version' | 'malformed';
      readonly reason: string;
    };

/**
 * Builds the payload field by field.
 *
 * An allowlist rather than a spread, for the reason the ship serializer states:
 * a caller could hand this a loadout carrying a stated figure alongside it, and
 * a spread would store both.
 *
 * Held content is stored exactly as it is held. A saved loadout carries every
 * mount the catalogue offers and every modification slot, so saving is never
 * destructive of a choice a Commander made (FR-018a).
 */
export function toStoredLoadout(loadout: EquipmentLoadout): StoredLoadoutV1 {
  return {
    format: STORED_LOADOUT_FORMAT,
    version: STORED_LOADOUT_VERSION,
    suitFamily: loadout.suitFamily,
    suitGrade: loadout.suitGrade,
    suitModifications: slots(loadout.suitModifications),
    weapons: CATALOGUE_MOUNTS.map((_, position) => {
      const fitted = loadout.weapons[position] ?? null;
      return fitted === null
        ? null
        : {
            symbol: fitted.symbol,
            grade: fitted.grade,
            modifications: slots(fitted.modifications),
          };
    }),
  };
}

/**
 * Reads one stored payload as untrusted input.
 *
 * Bytes in a browser store are untrusted even when this application wrote them
 * — another version wrote some of them, and a Commander can edit them by hand
 * — so every field is checked before any of it is believed. What is *not*
 * checked here is whether the package still carries these identities: that is
 * the reconstruction step, which happens on open and can refuse (FR-019).
 */
export function parseStoredLoadout(value: unknown): StoredLoadoutParseResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return malformed('The stored loadout is not an object.');
  }

  const stored = value as Record<string, unknown>;

  if (stored['format'] !== STORED_LOADOUT_FORMAT) {
    return malformed('The stored loadout carries no loadout format marker.');
  }

  const version = stored['version'];
  if (version !== STORED_LOADOUT_VERSION) {
    if (typeof version === 'number' && version > STORED_LOADOUT_VERSION) {
      return {
        ok: false,
        failure: 'unsupported-version',
        reason: `The loadout was written by payload version ${String(version)}.`,
      };
    }
    return malformed('The stored loadout version is not a supported value.');
  }

  const suitFamily = stored['suitFamily'];
  if (typeof suitFamily !== 'string' || suitFamily.length === 0) {
    return malformed('The stored loadout names no suit.');
  }

  const suitGrade = stored['suitGrade'];
  if (typeof suitGrade !== 'number' || !Number.isInteger(suitGrade) || suitGrade < 1) {
    return malformed('The stored loadout carries no suit grade.');
  }

  const suitModifications = readSlots(stored['suitModifications']);
  if (suitModifications === null) {
    return malformed('The stored suit modification slots are malformed.');
  }

  const weapons = readWeapons(stored['weapons']);
  if (weapons === null) {
    return malformed('The stored loadout’s mounts are malformed.');
  }

  return { ok: true, loadout: { suitFamily, suitGrade, suitModifications, weapons } };
}

function malformed(reason: string): StoredLoadoutParseResult {
  return { ok: false, failure: 'malformed', reason };
}

/** Exactly the published slot count, whatever length the caller handed over. */
function slots(fitted: ModificationSlots): ModificationSlots {
  return Array.from({ length: MODIFICATION_SLOT_COUNT }, (_, slot) => fitted[slot] ?? null);
}

function readSlots(value: unknown): ModificationSlots | null {
  if (!Array.isArray(value) || value.length !== MODIFICATION_SLOT_COUNT) {
    return null;
  }
  const read = value.map((entry) =>
    entry === null || (typeof entry === 'string' && entry.length > 0)
      ? (entry as string | null)
      : undefined,
  );
  return read.some((entry) => entry === undefined) ? null : (read as ModificationSlots);
}

function readWeapons(value: unknown): readonly (FittedPersonalWeapon | null)[] | null {
  if (!Array.isArray(value) || value.length !== CATALOGUE_MOUNTS.length) {
    return null;
  }

  const weapons: (FittedPersonalWeapon | null)[] = [];
  for (const entry of value) {
    if (entry === null) {
      weapons.push(null);
      continue;
    }
    if (typeof entry !== 'object' || Array.isArray(entry)) {
      return null;
    }
    const weapon = entry as Record<string, unknown>;
    const symbol = weapon['symbol'];
    const grade = weapon['grade'];
    const modifications = readSlots(weapon['modifications']);
    if (
      typeof symbol !== 'string' ||
      symbol.length === 0 ||
      typeof grade !== 'number' ||
      !Number.isInteger(grade) ||
      grade < 1 ||
      modifications === null
    ) {
      return null;
    }
    weapons.push({ symbol, grade, modifications });
  }

  return weapons;
}
