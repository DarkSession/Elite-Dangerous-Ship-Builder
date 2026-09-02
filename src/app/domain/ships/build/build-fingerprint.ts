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
 * Whether the active build differs from the state it was last stored at.
 *
 * A build with no baseline is dirty by definition — a stock build the Commander
 * has just created is in no record yet, and it is this answer that sends
 * autosave to mint one for it (FR-008).
 *
 * **Revised 2026-08-25.** This decided whether replacing a build had to be
 * confirmed until that question was withdrawn. It now decides whether there is
 * anything to write, which is why taking over a record identical to the build
 * writes nothing at all and does not restart the record's seven days (FR-013).
 */
export function isDirty(current: string | null, baseline: string | null): boolean {
  if (current === null) {
    return false;
  }
  return baseline === null || current !== baseline;
}
