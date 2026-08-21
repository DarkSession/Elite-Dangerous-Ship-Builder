import type { BuildSnapshotV1 } from './build-snapshot';

/**
 * A fingerprint of a build's modelled state.
 *
 * Derived only from a serialized snapshot, so it changes when — and only when —
 * something a Commander decided changed. A calculated value moving because the
 * package was updated is not an edit, and a fingerprint over anything derived
 * would mark every build dirty after an upgrade.
 *
 * It is an opaque comparison value, never a game identity and never stored as
 * one: the only question it answers is "is this the same modelled state as the
 * baseline".
 */
export function baselineFingerprint(snapshot: BuildSnapshotV1): string {
  return JSON.stringify(snapshot);
}

/**
 * Whether the active build has work a replacement would lose.
 *
 * A build with no baseline is dirty by definition — a stock build the Commander
 * has just created has never been saved anywhere they could get it back from,
 * so replacing it silently is exactly the loss the confirmation exists to
 * prevent (FR-009).
 */
export function isDirty(current: string | null, baseline: string | null): boolean {
  if (current === null) {
    return false;
  }
  return baseline === null || current !== baseline;
}
