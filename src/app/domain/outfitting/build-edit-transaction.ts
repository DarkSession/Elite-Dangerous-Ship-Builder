import {
  LoadoutEditError,
  type ShipLoadout,
} from '@elite-dangerous-almanac/core/ships/ship-loadout';
import {
  captureCheckpoint,
  restoreCheckpoint,
  sameCheckpoint,
  type ModeledBuildCheckpoint,
} from '../build/modeled-build-checkpoint';

/**
 * One package operation, applied to a build nobody is looking at.
 *
 * The operation receives a detached candidate and either changes it or throws.
 * It never sees the active build, so a half-finished edit has nothing to be
 * half-finished on.
 */
export type EditOperation = (candidate: ShipLoadout) => void;

/** How one attempted edit ended. */
export type TransactionOutcome =
  | {
      readonly kind: 'changed';
      /** The candidate to install. It is not installed by this module. */
      readonly candidate: ShipLoadout;
      /** The modelled state before the edit — the history frame to keep. */
      readonly previous: ModeledBuildCheckpoint;
    }
  /** The operation ran and changed nothing. No revision, no history frame. */
  | { readonly kind: 'unchanged' }
  /** The package refused, with its own structured reason. */
  | { readonly kind: 'refused'; readonly error: LoadoutEditError; readonly slotKey: string | null }
  /**
   * The operation threw something that was not a structured refusal, after the
   * package had offered the action. That is a defect somewhere, not a game rule.
   */
  | { readonly kind: 'unexpected'; readonly error: unknown; readonly slotKey: string | null }
  /** The current build could not be rebuilt from its own modelled state. */
  | { readonly kind: 'blocked'; readonly reason: string };

/**
 * Candidate-first editing, in one place.
 *
 * Every Commander edit in this feature runs through here, and the shape is
 * always the same: capture what the build is now, rebuild a detached copy of it
 * through the package, run exactly one operation on the copy, and hand back the
 * copy only if it actually changed. The active build is never the thing being
 * edited, so a thrown package refusal cannot leave it partly modified — there
 * is nothing to roll back, because nothing was ever rolled forward
 * (research, "Decision 2").
 *
 * The no-op check is by modelled comparison rather than by trusting the
 * operation to report one. Setting a priority to the value it already has is a
 * package call that succeeds and changes nothing, and spending a revision and a
 * history frame on it would mean a Commander pressing undo and watching nothing
 * happen.
 */
export function runEditTransaction(
  current: ShipLoadout,
  operation: EditOperation,
  slotKey: string | null = null,
): TransactionOutcome {
  const previous = captureCheckpoint(current);

  const restored = restoreCheckpoint(previous);
  if (!restored.ok) {
    // The package can no longer rebuild a build it produced. Editing on top of
    // that would be building on something we cannot describe.
    return { kind: 'blocked', reason: restored.reason };
  }
  const candidate = restored.loadout;

  try {
    operation(candidate);
  } catch (error) {
    if (error instanceof LoadoutEditError) {
      return { kind: 'refused', error, slotKey };
    }
    return { kind: 'unexpected', error, slotKey };
  }

  if (sameCheckpoint(captureCheckpoint(candidate), previous)) {
    return { kind: 'unchanged' };
  }

  return { kind: 'changed', candidate, previous };
}
