import { getSuitBySymbol } from '@elite-dangerous-almanac/core/equipment/suits';
import { parseSuitLoadout } from '@elite-dangerous-almanac/core/equipment/suit-loadout';
import type {
  SuitLoadoutEvent,
  SuitLoadoutImportOutcome,
} from '@elite-dangerous-almanac/core/equipment/suit-loadout';
import type { EquipmentLoadout, ModificationSlots } from '../loadout-link/equipment-loadout';
import { MODIFICATION_SLOT_COUNT } from './loadout-edit';
import type { JournalReader } from '../../journal/journal-scan';
import { CATALOGUE_MOUNTS } from './loadout-mounts';

/** One suit loadout a journal event holds, in the bench's own shape. */
export interface SuitLoadoutImport {
  readonly loadout: EquipmentLoadout;
  /** The name the Commander gave the loadout, or `null` where the event has none. */
  readonly name: string | null;
  readonly weaponCount: number;
  readonly modificationCount: number;
  /**
   * Everything the package could not use, exactly as it reported it.
   *
   * Never repaired, never substituted for: an unknown weapon is stated as an
   * unknown weapon (016/FR-015).
   */
  readonly outcomes: readonly SuitLoadoutImportOutcome[];
  /**
   * Recipes the package resolved that the bench has no slot for.
   *
   * The game gives an item four modification slots, and the bench addresses
   * four. An event stating more than that describes an item this application
   * cannot hold, so the surplus is named rather than dropped where nobody would
   * see it (constitution IV).
   */
  readonly heldBack: readonly string[];
}

/** Why an event did not become a loadout. */
export type SuitLoadoutImportFailure =
  { readonly kind: 'unknownSuit'; readonly sourceSuit: string } | { readonly kind: 'malformed' };

export type SuitLoadoutImportResult =
  | { readonly ok: true; readonly value: SuitLoadoutImport }
  | { readonly ok: false; readonly failure: SuitLoadoutImportFailure };

/**
 * Reads one journal `SuitLoadout`, `SwitchSuitLoadout` or `CreateSuitLoadout`
 * event.
 *
 * The package does the reading. It resolves the suit, the grade, every weapon
 * and every modification recipe — including the three recipes whose journal
 * symbol is settled by the weapon carrying them — and reports whatever it left
 * out. This turns its answer into the shape the bench holds and adds nothing to
 * it (constitution II).
 */
export function importSuitLoadout(event: unknown): SuitLoadoutImportResult {
  let parsed;
  try {
    parsed = parseSuitLoadout(event as SuitLoadoutEvent);
  } catch {
    return { ok: false, failure: classifyRefusal(event) };
  }

  const heldBack: string[] = [];
  const weapons = CATALOGUE_MOUNTS.map((mount) => {
    const fitted = parsed.weapons.find((one) => one.mount === mount.key);
    return fitted === undefined
      ? null
      : {
          symbol: fitted.weapon.symbol,
          grade: fitted.grade,
          modifications: slotsOf(
            fitted.modifications.map((one) => one.symbol),
            heldBack,
          ),
        };
  });

  return {
    ok: true,
    value: {
      loadout: {
        suitFamily: parsed.suit.family,
        suitGrade: parsed.grade,
        suitModifications: slotsOf(
          parsed.modifications.map((one) => one.symbol),
          heldBack,
        ),
        weapons,
      },
      name: parsed.name,
      weaponCount: parsed.weapons.length,
      modificationCount:
        parsed.modifications.length +
        parsed.weapons.reduce((total, one) => total + one.modifications.length, 0),
      outcomes: parsed.importOutcomes,
      heldBack,
    },
  };
}

/**
 * Whether the suit is what the package refused over.
 *
 * Asked of the package, not read out of its exception message: the suit is the
 * one identity a miss refuses outright, and a release that reworded the message
 * would silently turn every unknown suit into a generic refusal — the same rule
 * `classifyConstructionFailure` follows for a hull.
 */
function classifyRefusal(event: unknown): SuitLoadoutImportFailure {
  const symbol = suitSymbol(event);
  if (symbol !== null && getSuitBySymbol(symbol) === null) {
    return { kind: 'unknownSuit', sourceSuit: symbol };
  }
  return { kind: 'malformed' };
}

function suitSymbol(event: unknown): string | null {
  if (event === null || typeof event !== 'object') {
    return null;
  }
  const name = (event as { SuitName?: unknown }).SuitName;
  return typeof name === 'string' ? name : null;
}

/**
 * The recipes an item carries, in the slots the bench addresses.
 *
 * The package lists what is fitted, in the order the event stated it; the bench
 * holds four addressed slots, because which slot a recipe sits in is part of
 * what a grade has unlocked. The first slots are the unlocked ones, so a
 * fitted list fills them in order.
 */
function slotsOf(symbols: readonly string[], heldBack: string[]): ModificationSlots {
  heldBack.push(...symbols.slice(MODIFICATION_SLOT_COUNT));
  return Array.from({ length: MODIFICATION_SLOT_COUNT }, (_unused, slot) => symbols[slot] ?? null);
}

/**
 * What the Equipment Builder looks for in a journal.
 *
 * The game writes the same payload under three event names, so all three are
 * taken. An event the package refuses is left out of the list rather than
 * offered and refused later — there is nothing a Commander can do about a line
 * the game wrote, and the refusal a Commander does read belongs to the event
 * they chose or pasted.
 */
export const SUIT_JOURNAL_READER: JournalReader<SuitLoadoutImport> = {
  events: ['suitloadout', 'switchsuitloadout', 'createsuitloadout'],
  read: (payload) => {
    const result = importSuitLoadout(payload);
    return result.ok ? [{ key: identity(result.value), value: result.value }] : [];
  },
};

/**
 * What makes two events the same loadout.
 *
 * The loadout itself, and the name it was saved under. A journal writes a suit
 * loadout again at every session start and on every switch, so the same
 * Commander comes back a dozen times identical.
 */
function identity(value: SuitLoadoutImport): string {
  return `${value.name ?? ''}|${JSON.stringify(value.loadout)}`;
}
