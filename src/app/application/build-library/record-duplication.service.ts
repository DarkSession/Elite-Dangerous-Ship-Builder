import { Injectable, inject } from '@angular/core';
import type { LocalRecordV1 } from '../../domain/build/stored-build';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import type { StorageFailureCode } from '../../platform/storage/web-storage.port';

export type DuplicationResult =
  | { readonly ok: true; readonly record: LocalRecordV1 }
  | { readonly ok: false; readonly code: StorageFailureCode }
  | { readonly ok: false; readonly code: 'missing' };

/**
 * Making a second copy of a build, under a new identity.
 *
 * Every path here — duplicate, keep-both, name a working record — creates a
 * fresh record id *and* a fresh revision id, even when the display name is
 * identical. Names are what a Commander reads; identity is what the
 * application writes, and the two are deliberately unrelated so duplicate
 * names stay allowed (FR-009).
 *
 * The source is never modified. Naming a working build gives the Commander a
 * named copy and leaves the tab still autosaving to its own working record,
 * because the tab has not stopped working on it.
 */
@Injectable({ providedIn: 'root' })
export class RecordDuplicationService {
  readonly #records = inject(LocalRecordRepository);
  readonly #uuid = inject(UuidAdapter);

  /** Copies a record into a new named record, preserving what it recorded. */
  duplicate(sourceId: string, name: string, now: string): DuplicationResult {
    const source = this.#records.open(sourceId);
    if (!source.ok) {
      return { ok: false, code: source.code };
    }
    if (source.value === null) {
      return { ok: false, code: 'missing' };
    }

    return this.copy(source.value.record, name, now);
  }

  /**
   * Writes a copy of a record under a fresh identity.
   *
   * The validation snapshot travels with the build rather than being
   * recomputed: it is what the package said about *this* build, and a copy of
   * a build the package called incomplete is still incomplete.
   */
  copy(source: LocalRecordV1, name: string, now: string): DuplicationResult {
    const id = this.#uuid.create();

    const written = this.#records.write({
      id,
      kind: 'named',
      revisionId: this.#uuid.create(),
      createdAt: now,
      modifiedAt: now,
      name,
      note: source.note,
      validation: source.validation,
      build: source.build,
      sourceNamed: null,
    });
    if (!written.ok) {
      return { ok: false, code: written.code };
    }

    const reread = this.#records.open(id);
    return reread.ok && reread.value !== null
      ? { ok: true, record: reread.value.record }
      : { ok: false, code: 'failed' };
  }
}
