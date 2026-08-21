import { Injectable, inject } from '@angular/core';
import { reconstructFromSnapshot } from '../../domain/build/build-snapshot.reconstructor';
import { toBuildSnapshotV1 } from '../../domain/build/build-snapshot.serializer';
import type { LocalRecordV1 } from '../../domain/build/stored-build';
import { LocalRecordRepository } from './local-record.repository';

/** What happened when a record was opened. */
export type OpenOutcome =
  | {
      readonly ok: true;
      readonly record: LocalRecordV1;
      /** True when the record was rewritten in its newer form. */
      readonly rewritten: boolean;
      /** True when it was migrated but the rewrite could not be stored. */
      readonly rewriteFailed: boolean;
    }
  | { readonly ok: false; readonly reason: string };

/**
 * Opening a record, including any migration it needs.
 *
 * The order is the whole design. Decode, migrate, reconstruct through the
 * package, re-serialize — and only if **all four** succeed is the record's own
 * key replaced. A record that decodes but cannot be rebuilt is left exactly as
 * it was, because rewriting it would replace something recoverable with
 * something this build has already proved it cannot open (persistence
 * contract, "Version and migration behavior").
 *
 * A failed rewrite is not a failed open: the candidate is in memory and
 * perfectly usable, so opening continues and persistence says it could not
 * store the newer form.
 */
@Injectable({ providedIn: 'root' })
export class RecordMigrationService {
  readonly #records = inject(LocalRecordRepository);

  open(id: string): OpenOutcome {
    const read = this.#records.open(id);
    if (!read.ok) {
      return { ok: false, reason: `This browser could not read the stored build (${read.code}).` };
    }
    if (read.value === null) {
      return { ok: false, reason: 'This stored build could not be read.' };
    }

    const { record, migrated } = read.value;

    // Through the package before anything is written back: an unknown hull or
    // an unresolvable module identity refuses here, and the original bytes are
    // never touched.
    const rebuilt = reconstructFromSnapshot(record.build);
    if (!rebuilt.ok) {
      return { ok: false, reason: rebuilt.reason };
    }

    if (!migrated) {
      return { ok: true, record, rewritten: false, rewriteFailed: false };
    }

    // The reconstructed build is what gets stored, so the migrated record and
    // the build a Commander is now editing are the same thing.
    const written = this.#records.write({
      id: record.id,
      kind: record.kind,
      revisionId: record.revisionId,
      createdAt: record.createdAt,
      modifiedAt: record.modifiedAt,
      name: record.name,
      note: record.note,
      validation: record.validation,
      build: toBuildSnapshotV1(rebuilt.loadout),
      sourceNamed: record.sourceNamed,
    });

    return { ok: true, record, rewritten: written.ok, rewriteFailed: !written.ok };
  }
}
