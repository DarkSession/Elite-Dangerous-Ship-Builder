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
