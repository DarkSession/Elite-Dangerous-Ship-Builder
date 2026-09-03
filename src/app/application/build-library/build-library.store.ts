import { Injectable, computed, inject, signal } from '@angular/core';
import type { LocalRecord, StoredRecordEntry } from '../../domain/records/local-record';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import type { StorageFailureCode } from '../../platform/storage/web-storage.port';
import { RecordInvalidationService } from './record-invalidation.service';
import { RetentionService } from './retention.service';

/** What the library is currently able to show. */
export type LibraryStatus = 'ready' | 'unavailable';

/**
 * Every stored build, as the library screen sees it.
 *
 * Ordering is by modified instant, newest first, with the record id breaking
 * ties. The tie-breaker is not cosmetic: without one, two records saved in the
 * same millisecond swap places between renders, and a Commander clicking
 * "delete" on the second row would sometimes delete a different build.
 *
 * Order never implies eviction. The oldest record at the bottom of the list is
 * not next in line for anything: the only automatic removal is the seven-day
 * expiry of an unnamed record, which each row states beforehand and which a
 * name stops (FR-013).
 */
@Injectable({ providedIn: 'root' })
export class BuildLibraryStore {
  readonly #records = inject(LocalRecordRepository);
  readonly #invalidation = inject(RecordInvalidationService);
  readonly #retention = inject(RetentionService);

  readonly #entries = signal<readonly StoredRecordEntry[]>([]);
  readonly #status = signal<LibraryStatus>('ready');
  readonly #failure = signal<StorageFailureCode | null>(null);

  readonly entries = this.#entries.asReadonly();
  readonly status = this.#status.asReadonly();
  readonly failure = this.#failure.asReadonly();

  /**
   * Every readable record, newest first.
   *
   * One list rather than two groups since 2026-08-27. Named and unnamed records
   * differ in what they are, and every row says which it is in its own title; a
   * heading above a group said it a second time and split one order into two,
   * so the build edited most recently was not reliably the row at the top
   * (FR-010, clarification 2026-08-27).
   */
  readonly records = computed(() => this.#ordered(this.#entries()));

  /**
   * Unnamed builds, newest first.
   *
   * Not a group the library draws any more. It is what the quota manager offers
   * for discard, which is a different question from how the library lists
   * records: a named save is what a Commander asked to keep, so a full store
   * offers the ones nothing has asked to keep first (FR-013).
   */
  readonly working = computed(() =>
    this.#ordered(
      this.#entries().filter((entry) => entry.available && entry.record.kind === 'working'),
    ),
  );

  /** Records this build cannot open, listed rather than hidden. */
  readonly unavailable = computed(() => this.#entries().filter((entry) => !entry.available));

  readonly total = computed(() => this.#entries().length);

  readonly isEmpty = computed(() => this.#entries().length === 0);

  constructor() {
    // Any change made anywhere — this page, another tab — re-reads storage.
    // Nothing here trusts a cached listing to still be true.
    this.refresh();
  }

  /** Re-reads every owned record from storage. */
  refresh(): void {
    // Expired unnamed records are removed before the listing is read, not on a
    // timer: this way a row is gone when the list is drawn rather than
    // disappearing under a Commander who is reading it (FR-013, ruled
    // 2026-08-25).
    this.#retention.sweep();

    const listed = this.#records.list();

    if (!listed.ok) {
      this.#status.set('unavailable');
      this.#failure.set(listed.code);
      this.#entries.set([]);
      return;
    }

    this.#status.set('ready');
    this.#failure.set(null);
    this.#entries.set(listed.value);
  }

  /** Starts following changes made by other pages. Returns an unsubscribe. */
  follow(): () => void {
    const stop = this.#invalidation.listen();
    return stop;
  }

  /** One record by identity, if it is currently readable. */
  find(recordId: string): LocalRecord | null {
    const entry = this.#entries().find((candidate) =>
      candidate.available ? candidate.record.id === recordId : candidate.id === recordId,
    );
    return entry?.available === true ? entry.record : null;
  }

  /** How many stored builds already carry this display name. */
  countByName(name: string): number {
    const wanted = name.trim().toLowerCase();
    if (wanted.length === 0) {
      return 0;
    }
    return this.#entries().filter(
      (entry) => entry.available && (entry.record.name ?? '').trim().toLowerCase() === wanted,
    ).length;
  }

  #ordered(entries: readonly StoredRecordEntry[]): readonly StoredRecordEntry[] {
    return entries
      .filter((entry) => entry.available)
      .sort((left, right) => {
        if (!left.available || !right.available) {
          return 0;
        }
        const byInstant = Date.parse(right.record.modifiedAt) - Date.parse(left.record.modifiedAt);
        // A stable identity breaks the tie, so the list does not reshuffle
        // between renders and an action always lands on the row it was aimed at.
        return byInstant !== 0 ? byInstant : left.record.id.localeCompare(right.record.id);
      });
  }
}
