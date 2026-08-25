import { Injectable } from '@angular/core';

/**
 * The instant everything that stamps or expires a record reads.
 *
 * One seam rather than two. A record's `modifiedAt` is written from this clock
 * and the seven-day deadline is measured against it, and a design where those
 * two read different sources can expire a record it has just written.
 *
 * It exists at all for two reasons the constitution names. Principle III keeps
 * the wall clock out of a service, the same way it keeps every other browser
 * API behind a port. And principle VIII will not wait seven days for an
 * assertion: a test that needs a record to be eight days old moves the clock,
 * not the calendar (plan, "Revision 2026-08-25").
 */
@Injectable({ providedIn: 'root' })
export class ClockAdapter {
  /** The current instant. */
  now(): Date {
    return new Date();
  }

  /**
   * The current instant as the ISO-8601 string a record is stamped with.
   *
   * Derived from `now()` rather than read separately, so overriding one moves
   * both and no test can end up with a record stamped at a different instant
   * from the one its deadline is measured against.
   */
  timestamp(): string {
    return this.now().toISOString();
  }
}
