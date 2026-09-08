/**
 * Whether stored state has moved, for both tools' records.
 *
 * A build and a loadout are fingerprinted over their own stored forms and
 * compared the same way, so the rule that decides whether autosave owes a write
 * is written once (persistence contract, "Autosaved records").
 */

/**
 * Whether what is open differs from the state it was last stored at.
 *
 * Work with no baseline is dirty by definition — a stock build the Commander
 * has just created, or a suit they have just chosen, is in no record yet, and
 * it is this answer that sends autosave to mint one for it (001/FR-008,
 * 017/FR-007).
 *
 * What this decides is whether there is anything to write, which is why taking
 * over a record identical to what is open writes nothing at all and does not
 * restart the record's seven days (001/FR-013, 017/SC-003).
 */
export function isDirty(current: string | null, baseline: string | null): boolean {
  if (current === null) {
    return false;
  }
  return baseline === null || current !== baseline;
}
