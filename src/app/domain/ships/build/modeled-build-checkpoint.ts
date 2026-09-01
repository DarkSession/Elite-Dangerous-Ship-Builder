import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { BuildSnapshotV1 } from './build-snapshot';
import { reconstructFromSnapshot } from './build-snapshot.reconstructor';
import { toBuildSnapshotV1 } from './build-snapshot.serializer';

/**
 * One point a build can be returned to, exactly.
 *
 * It is feature 001's canonical modelled snapshot and nothing else. That is the
 * whole design: the snapshot already contains every field a Commander chose and
 * deliberately contains no price, no calculated figure and no record of when it
 * was taken, so a checkpoint cannot carry any of those back either. Undo
 * restores decisions and lets the package recompute everything that follows
 * from them (FR-016, data model "ModeledBuildCheckpoint").
 *
 * Wrapping the snapshot in a named type rather than passing it bare is what
 * keeps the boundary checkable: a serializer, a link codec or a SLEF exporter
 * that accepted one would be a type error, not a review comment
 * (edit-history contract, "Boundary isolation").
 */
export interface ModeledBuildCheckpoint {
  readonly snapshot: BuildSnapshotV1;
}

/** Why a checkpoint could not become a live build again. */
export interface CheckpointRestoreFailure {
  readonly failure: 'unknown-hull' | 'unknown-identity' | 'refused';
  readonly reason: string;
}

export type CheckpointRestoreResult =
  | { readonly ok: true; readonly loadout: ShipLoadout }
  | ({ readonly ok: false } & CheckpointRestoreFailure);

/** Captures the current modelled state of a live build. */
export function captureCheckpoint(loadout: ShipLoadout): ModeledBuildCheckpoint {
  return { snapshot: toBuildSnapshotV1(loadout) };
}

/**
 * Rebuilds a detached live build from a checkpoint, through the package.
 *
 * Detached is the operative word: what comes back is a candidate nobody is
 * looking at yet. Installing it is a separate decision made by the one boundary
 * that owns the active slot, so a restore that fails cannot leave a Commander
 * halfway between two builds.
 *
 * A failure here is blocking rather than recoverable. It means the installed
 * package can no longer rebuild something it previously produced, and quietly
 * restoring a near-miss would be worse than restoring nothing.
 */
export function restoreCheckpoint(checkpoint: ModeledBuildCheckpoint): CheckpointRestoreResult {
  const rebuilt = reconstructFromSnapshot(checkpoint.snapshot);
  return rebuilt.ok
    ? { ok: true, loadout: rebuilt.loadout }
    : { ok: false, failure: rebuilt.failure, reason: rebuilt.reason };
}

/** Whether two checkpoints describe the same modelled build. */
export function sameCheckpoint(
  left: ModeledBuildCheckpoint,
  right: ModeledBuildCheckpoint,
): boolean {
  return JSON.stringify(left.snapshot) === JSON.stringify(right.snapshot);
}
