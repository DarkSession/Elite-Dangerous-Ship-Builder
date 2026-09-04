import { HISTORY_CAPACITY } from '../../domain/ships/outfitting/session-edit-history';
import type { EquipmentLoadout } from '../../domain/equipment/loadout-link/equipment-loadout';

/**
 * A session's loadouts, so every outfitting choice can be taken back (FR-022).
 *
 * A stack of committed loadouts rather than a stack of edits, which is the ship
 * side's own pattern: a loadout is a small immutable value, so keeping the state
 * before each decision is cheaper to hold and impossible to get wrong in the
 * way a reverse-edit can be. The bound is the ship side's too — one number for
 * both tools, stated where the ship tape states it.
 *
 * Framework-agnostic: no signals, no injector. Every transition returns a new
 * tape, so a caller that cannot complete a restore simply never installs it.
 *
 * Opening a saved loadout, saving and exporting are not edits and never enter
 * the tape (013 contracts/equipment-bench.md, "Undo and redo").
 */
export interface LoadoutHistory {
  /** Oldest first. The newest is the one undo returns to. */
  readonly past: readonly EquipmentLoadout[];
  /** Newest first. The first is the one redo goes forward to. */
  readonly future: readonly EquipmentLoadout[];
}

/** What a transition produced: what to restore, and the tape that follows. */
export interface LoadoutHistoryTransition {
  readonly restore: EquipmentLoadout;
  readonly next: LoadoutHistory;
}

export function emptyLoadoutHistory(): LoadoutHistory {
  return { past: [], future: [] };
}

/**
 * Records one committed choice.
 *
 * The future is discarded: the bench has left the branch those loadouts
 * described, and offering to redo onto one would offer a loadout nobody had.
 */
export function recordLoadout(history: LoadoutHistory, previous: EquipmentLoadout): LoadoutHistory {
  return { past: capped([...history.past, previous]), future: [] };
}

/** Steps back one choice, or reports that there is none. */
export function undoLoadout(
  history: LoadoutHistory,
  current: EquipmentLoadout,
): LoadoutHistoryTransition | null {
  const restore = history.past.at(-1);
  if (restore === undefined) return null;
  return {
    restore,
    next: { past: history.past.slice(0, -1), future: [current, ...history.future] },
  };
}

/** Steps forward one choice, or reports that there is none. */
export function redoLoadout(
  history: LoadoutHistory,
  current: EquipmentLoadout,
): LoadoutHistoryTransition | null {
  const restore = history.future[0];
  if (restore === undefined) return null;
  return {
    restore,
    // Capped here too: moving a loadout back and forth must not grow the
    // retained path past the capacity.
    next: { past: capped([...history.past, current]), future: history.future.slice(1) },
  };
}

function capped(past: readonly EquipmentLoadout[]): readonly EquipmentLoadout[] {
  return past.length <= HISTORY_CAPACITY ? past : past.slice(past.length - HISTORY_CAPACITY);
}
