import { Injectable, inject } from '@angular/core';
import { reconstructFromSnapshot } from '../../domain/build/build-snapshot.reconstructor';
import { baselineFingerprint } from '../../domain/build/replacement-policy';
import { toBuildSnapshotV1 } from '../../domain/build/build-snapshot.serializer';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { RecordMigrationService } from '../../platform/storage/record-migration.service';
import type { BuildProvenance } from '../active-build/active-build.models';
import {
  ReplacementCoordinator,
  type CandidateOutcome,
  type ReplacementResult,
} from '../active-build/replacement-coordinator';

/**
 * Opening a stored build.
 *
 * The order is what makes this safe: decode, migrate, reconstruct through the
 * package, and only then offer the candidate to the shared coordinator. A
 * record that cannot be read, cannot be migrated or names a hull the installed
 * package no longer carries fails here, with the active build untouched — the
 * Commander loses nothing by trying to open something that turns out to be
 * unopenable (build-library design, "Operation rules").
 *
 * Opening never converts or mutates the source record. A named build opened
 * here is copied into this tab's working record; the named one stays exactly
 * as it was until an explicit save replaces it.
 */
@Injectable({ providedIn: 'root' })
export class RecordOpenService {
  readonly #migration = inject(RecordMigrationService);
  readonly #coordinator = inject(ReplacementCoordinator);
  readonly #gameText = inject(GameTextPresenter);

  /** Opens one record, asking about unsaved work first where there is any. */
  async open(recordId: string): Promise<ReplacementResult> {
    return this.#coordinator.replace(() => this.#construct(recordId));
  }

  #construct(recordId: string): CandidateOutcome {
    const opened = this.#migration.open(recordId);
    if (!opened.ok) {
      return { ok: false, reason: opened.reason };
    }

    const record = opened.record;
    const rebuilt = reconstructFromSnapshot(record.build);
    if (!rebuilt.ok) {
      return { ok: false, reason: rebuilt.reason };
    }

    // A named record is the baseline it was opened at, so it starts clean; a
    // working record has no version a Commander could return to, so it starts
    // dirty and is protected by the replacement question like any other
    // unsaved build.
    const provenance: BuildProvenance = record.kind === 'named' ? 'named' : 'working';
    const baseline =
      record.kind === 'named' ? baselineFingerprint(toBuildSnapshotV1(rebuilt.loadout)) : null;

    return {
      ok: true,
      candidate: {
        loadout: rebuilt.loadout,
        hullName: this.#gameText.shipName(record.hullSymbol).text ?? record.hullSymbol,
        provenance,
        sourceNamed:
          record.kind === 'named'
            ? { recordId: record.id, baseRevisionId: record.revisionId }
            : record.sourceNamed,
        baseline,
      },
    };
  }
}
