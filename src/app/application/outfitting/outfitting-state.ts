import type { EditFailure } from './build-edit-intent';

/**
 * The application state layered over feature 001's one active build.
 *
 * Everything here is *workflow*, not build state. Which slot is selected, which
 * surface is showing, what is typed into a chooser and what the last refusal
 * was are facts about a Commander's session, and none of them is ever
 * serialized, encoded into a link or exported. That separation is the reason a
 * refused edit can leave a search query and a selected slot exactly where they
 * were while changing nothing about the build (data model, "OutfittingState").
 */

/** Which feature 002 surface is currently showing inside `/outfitting`. */
export type OutfittingSurface = 'workspace' | 'replacement' | 'engineering';

/**
 * What the package currently permits on one slot.
 *
 * Every field is derived from current package operation and query evidence, and
 * from nothing else. There is no symbol list, no "cargo hatches are special"
 * branch and no inference from a slot's name: the cargo hatch ends up with
 * power controls alone because its menus come back empty and its mount is
 * immovable, which is the package telling us so (FR-009).
 *
 * `packageEmpty` is deliberately separate from `canFitSelection`. A chooser
 * that opened and found nothing is a successful answer worth showing; it is not
 * a fit capability, and collapsing the two would offer an action with nothing
 * behind it.
 */
export interface SlotCapabilities {
  readonly canOpenReplacement: boolean;
  readonly canFitSelection: boolean;
  readonly canRemove: boolean;
  readonly canOpenEngineering: boolean;
  readonly canSetEnabled: boolean;
  readonly canSetPriority: boolean;
  /** True when the package answered the candidate query with nothing. */
  readonly packageEmpty: boolean;
}

/** Nothing is permitted. The starting point every capability is added to. */
export const NO_SLOT_CAPABILITIES: SlotCapabilities = {
  canOpenReplacement: false,
  canFitSelection: false,
  canRemove: false,
  canOpenEngineering: false,
  canSetEnabled: false,
  canSetPriority: false,
  packageEmpty: false,
};

/** The ephemeral outfitting state, as one value. */
export interface OutfittingState {
  /** Feature 001's revision. Changes once per committed edit or replacement. */
  readonly buildRevision: number;
  /** The exact package slot key, never a position. `null` is no selection. */
  readonly selectedSlotKey: string | null;
  readonly surface: OutfittingSurface;
  /** The latest package or workflow refusal, retained until the next decision. */
  readonly lastEditFailure: EditFailure | null;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}
