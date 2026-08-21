import { Injectable, inject } from '@angular/core';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';

/**
 * How many working records this browser will keep.
 *
 * Working records are autosaves, and an abandoned tab leaves one behind. A
 * finite limit stops those accumulating without bound; twenty is generous
 * enough that a Commander reaches it only by genuinely working on twenty
 * builds, and small enough to be a list they can look through (research,
 * "Working ownership and retention").
 *
 * Named saves do not count against it. Those are deliberate, and are bounded
 * by the browser's own quota rather than by a number chosen here.
 */
export const WORKING_RECORD_LIMIT = 20;

/** Whether a new working record can be created, and what to do if not. */
export type RetentionVerdict =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: 'retention-limit'; readonly limit: number };

/**
 * The retention rule, and nothing else.
 *
 * There is deliberately no eviction here — no age, no count, no least-recently
 * used, no "the tab closed so it must be abandoned". Every one of those
 * deletes a Commander's work on a guess about what they meant, and the answer
 * to a full library is to show them the list and let them choose (FR-013).
 *
 * Note what *is* allowed at the limit: updating any record that already
 * exists. A Commander at twenty working builds can carry on editing all
 * twenty; only creating a twenty-first is refused.
 */
@Injectable({ providedIn: 'root' })
export class RetentionService {
  readonly #records = inject(LocalRecordRepository);

  /** How many working records exist right now. Unreadable ones still occupy one. */
  workingCount(): number {
    const listed = this.#records.list();
    if (!listed.ok) {
      return 0;
    }
    return listed.value.filter((entry) => !entry.available || entry.record.kind === 'working')
      .length;
  }

  /**
   * Whether this record may be written.
   *
   * An existing record always may. It is only the creation of one beyond the
   * limit that is refused — and refused by writing nothing at all, rather than
   * by making room.
   */
  mayWrite(recordId: string): RetentionVerdict {
    const listed = this.#records.list();
    if (!listed.ok) {
      return { allowed: true };
    }

    const working = listed.value.filter(
      (entry) => !entry.available || entry.record.kind === 'working',
    );
    const exists = working.some((entry) =>
      entry.available ? entry.record.id === recordId : entry.id === recordId,
    );

    if (exists || working.length < WORKING_RECORD_LIMIT) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'retention-limit', limit: WORKING_RECORD_LIMIT };
  }
}
