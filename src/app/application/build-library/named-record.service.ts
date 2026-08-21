import { Injectable, inject } from '@angular/core';
import type { BuildSnapshotV1 } from '../../domain/build/build-snapshot';
import type { LocalRecordV1, RecordValidation } from '../../domain/build/stored-build';
import { LocksUnavailableError, WebLocksAdapter } from '../../platform/browser/web-locks.adapter';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import { namedRecordLockName } from '../../platform/storage/storage-keys';
import type { StorageFailureCode } from '../../platform/storage/web-storage.port';

/** What a named write is trying to do. */
export interface NamedSaveRequest {
  /** The record to replace, or `null` to create a new one. */
  readonly recordId: string | null;
  /** The revision this tab believes it is replacing. */
  readonly expectedRevisionId: string | null;
  readonly name: string;
  readonly note: string | null;
  readonly build: BuildSnapshotV1;
  readonly validation: RecordValidation;
  /** The instant to stamp. Passed in so the service stays clock-free. */
  readonly now: string;
}

/** How a named write ended. */
export type NamedSaveResult =
  | { readonly kind: 'saved'; readonly record: LocalRecordV1 }
  | {
      readonly kind: 'conflict';
      readonly recordId: string;
      readonly expectedRevisionId: string | null;
      readonly observed: LocalRecordV1;
    }
  | { readonly kind: 'failed'; readonly code: StorageFailureCode }
  | { readonly kind: 'locks-unavailable' }
  | { readonly kind: 'missing' };

/**
 * Named saves, renames and deletes — the writes two tabs can collide over.
 *
 * Web Storage has no compare-and-swap, so the protection is two things
 * together: a short exclusive lock that keeps two pages out of each other's
 * read-then-write window, and a revision precondition inside it that decides
 * whether this page is replacing the version it actually saw.
 *
 * The revision is the part that matters. The lock narrows the window; the
 * precondition is what makes a stale write a *conflict* the Commander answers
 * rather than a version that quietly disappears (FR-012).
 *
 * No dialog is ever shown while the lock is held. A lock held across a human
 * decision blocks every other page for as long as they take to make it.
 */
@Injectable({ providedIn: 'root' })
export class NamedRecordService {
  readonly #records = inject(LocalRecordRepository);
  readonly #locks = inject(WebLocksAdapter);
  readonly #uuid = inject(UuidAdapter);

  /** Whether an in-place replacement can be made safely in this browser. */
  get canOverwrite(): boolean {
    return this.#locks.available;
  }

  /** Creates a new named record. Never replaces anything. */
  async createNamed(
    request: Omit<NamedSaveRequest, 'recordId' | 'expectedRevisionId'>,
  ): Promise<NamedSaveResult> {
    const id = this.#uuid.create();
    const record = {
      id,
      kind: 'named' as const,
      revisionId: this.#uuid.create(),
      createdAt: request.now,
      modifiedAt: request.now,
      name: request.name,
      note: request.note,
      validation: request.validation,
      build: request.build,
      sourceNamed: null,
    };

    const written = this.#records.write(record);
    if (!written.ok) {
      return { kind: 'failed', code: written.code };
    }

    const read = this.#records.open(id);
    return read.ok && read.value !== null
      ? { kind: 'saved', record: read.value.record }
      : { kind: 'failed', code: 'failed' };
  }

  /**
   * Replaces an existing named record, if it is still the revision this tab saw.
   *
   * Without a lock this is refused outright rather than attempted: an
   * unprotected read-then-write is exactly how one tab's version disappears,
   * and keep-both remains available to a Commander who needs to save anyway.
   */
  async overwriteNamed(request: NamedSaveRequest & { recordId: string }): Promise<NamedSaveResult> {
    if (!this.#locks.available) {
      return { kind: 'locks-unavailable' };
    }

    try {
      return await this.#locks.request(namedRecordLockName(request.recordId), async () =>
        this.#writeIfCurrent(request),
      );
    } catch (error) {
      return error instanceof LocksUnavailableError
        ? { kind: 'locks-unavailable' }
        : { kind: 'failed', code: 'failed' };
    }
  }

  /** Renames a record in place, under the same precondition as any other write. */
  async rename(
    recordId: string,
    name: string,
    expectedRevisionId: string,
    now: string,
  ): Promise<NamedSaveResult> {
    const current = this.#records.open(recordId);
    if (!current.ok) {
      return { kind: 'failed', code: current.code };
    }
    if (current.value === null) {
      return { kind: 'missing' };
    }

    const record = current.value.record;
    return this.overwriteNamed({
      recordId,
      expectedRevisionId,
      name,
      note: record.note,
      build: record.build,
      validation: record.validation,
      now,
    });
  }

  /** Removes one record. Only ever called after an explicit confirmation. */
  async remove(recordId: string): Promise<NamedSaveResult> {
    const removed = this.#records.remove(recordId);
    return removed.ok ? { kind: 'missing' } : { kind: 'failed', code: removed.code };
  }

  /** The read-check-write that runs inside the lock. */
  #writeIfCurrent(request: NamedSaveRequest & { recordId: string }): NamedSaveResult {
    const current = this.#records.open(request.recordId);
    if (!current.ok) {
      return { kind: 'failed', code: current.code };
    }
    if (current.value === null) {
      return { kind: 'missing' };
    }

    const observed = current.value.record;
    if (request.expectedRevisionId !== null && observed.revisionId !== request.expectedRevisionId) {
      return {
        kind: 'conflict',
        recordId: request.recordId,
        expectedRevisionId: request.expectedRevisionId,
        observed,
      };
    }

    const written = this.#records.write({
      id: request.recordId,
      kind: 'named',
      // A fresh revision per successful write, so another tab's stale
      // precondition can never match by coincidence.
      revisionId: this.#uuid.create(),
      createdAt: observed.createdAt,
      modifiedAt: request.now,
      name: request.name,
      note: request.note,
      validation: request.validation,
      build: request.build,
      sourceNamed: observed.sourceNamed,
    });
    if (!written.ok) {
      return { kind: 'failed', code: written.code };
    }

    const reread = this.#records.open(request.recordId);
    return reread.ok && reread.value !== null
      ? { kind: 'saved', record: reread.value.record }
      : { kind: 'failed', code: 'failed' };
  }
}
