import { Injectable, inject } from '@angular/core';
import { normalizeReconstructedBuild } from '../../domain/build/build-ingress-normalizer';
import { reconstructFromSnapshot } from '../../domain/build/build-snapshot.reconstructor';
import { baselineFingerprint } from '../../domain/build/replacement-policy';
import { toBuildSnapshotV1 } from '../../domain/build/build-snapshot.serializer';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { RecordMigrationService } from '../../platform/storage/record-migration.service';
import { ActiveBuildStore } from '../active-build/active-build.store';
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
  readonly #active = inject(ActiveBuildStore);

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

    // The ingress gate, before anything is offered for activation. A record
    // stored before this application completed rolls — or written by an older
    // version of it — can carry a partial one, and a partial roll is either
    // completed by the package or the whole candidate is refused. There is no
    // third outcome and no repair pass here (contract, "Mandatory ingress
    // normalization").
    const ingress = normalizeReconstructedBuild(rebuilt.loadout);
    if (ingress.kind === 'unusable') {
      return { ok: false, reason: ingress.reason };
    }
    if (ingress.kind === 'refused') {
      // Published, not thrown away: the surface that names every affected mount
      // is what makes this actionable. Nothing about the current build moves.
      this.#active.reportIngressRefusal(ingress.failures);
      return { ok: false, reason: refusalReason(ingress.failures) };
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
        loadout: ingress.candidate,
        hullName: this.#gameText.shipName(record.hullSymbol).text ?? record.hullSymbol,
        provenance,
        qualityNotices: ingress.notices,
        sourceNamed:
          record.kind === 'named'
            ? { recordId: record.id, baseRevisionId: record.revisionId }
            : record.sourceNamed,
        baseline,
      },
    };
  }
}

/** A diagnostic naming what the Almanac refused. Never Commander-facing text. */
function refusalReason(failures: readonly { readonly code: string | null }[]): string {
  return `The Almanac could not complete ${failures.length} partial engineering roll(s): ${failures
    .map((failure) => failure.code ?? 'unknown')
    .join(', ')}.`;
}
