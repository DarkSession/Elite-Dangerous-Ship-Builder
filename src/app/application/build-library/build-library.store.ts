import { Injectable, computed, inject, signal } from '@angular/core';
import type { LocalRecordV1, StoredRecordEntry } from '../../domain/build/stored-build';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import type { StorageFailureCode } from '../../platform/storage/web-storage.port';
import { RecordInvalidationService } from './record-invalidation.service';

/** What the library is currently able to show. */
export type LibraryStatus = 'ready' | 'unavailable';

/** One group of records, in the order the screen lists them. */
export interface RecordGroup {
  readonly kind: 'working' | 'named';
  readonly entries: readonly StoredRecordEntry[];
}

/**
 * Every stored build, as the library screen sees it.
 *
 * Ordering is by modified instant, newest first, with the record id breaking
 * ties. The tie-breaker is not cosmetic: without one, two records saved in the
 * same millisecond swap places between renders, and a Commander clicking
 * "delete" on the second row would sometimes delete a different build.
 *
 * Order never implies eviction. The oldest record at the bottom of the list is
 * not next to be removed, because nothing is ever removed automatically
 * (FR-013).
 */
@Injectable({ providedIn: 'root' })
export class BuildLibraryStore {
  readonly #records = inject(LocalRecordRepository);
  readonly #invalidation = inject(RecordInvalidationService);

  readonly #entries = signal<readonly StoredRecordEntry[]>([]);
  readonly #status = signal<LibraryStatus>('ready');
  readonly #failure = signal<StorageFailureCode | null>(null);

  readonly entries = this.#entries.asReadonly();
  readonly status = this.#status.asReadonly();
  readonly failure = this.#failure.asReadonly();

  /** Working builds, newest first. */
  readonly working = computed(() => this.#grouped('working'));

  /** Named builds, newest first. */
  readonly named = computed(() => this.#grouped('named'));

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
  find(recordId: string): LocalRecordV1 | null {
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

  #grouped(kind: 'working' | 'named'): readonly StoredRecordEntry[] {
    return this.#entries()
      .filter((entry) => entry.available && entry.record.kind === kind)
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
