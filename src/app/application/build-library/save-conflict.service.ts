import { Injectable, inject, signal } from '@angular/core';
import type { LocalRecordV1 } from '../../domain/ships/build/stored-build';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import {
  NamedRecordService,
  type NamedSaveRequest,
  type NamedSaveResult,
} from './named-record.service';

/** Two versions of one named record, and what this tab was trying to save. */
export interface SaveConflict {
  readonly recordId: string;
  readonly expectedRevisionId: string | null;
  readonly observedRevisionId: string;
  /** This tab's version. Still in memory and still in its working record. */
  readonly attempted: NamedSaveRequest & { recordId: string };
  /** What is actually stored right now. */
  readonly observed: LocalRecordV1;
  /**
   * The unnamed record these edits were autosaved into, if there is one.
   *
   * Carried through the question because the answer decides what happens to it:
   * replacing the stored version consumes it, keeping both names it in place,
   * and cancelling leaves it exactly where it is — which is what makes cancel
   * safe (FR-008).
   */
  readonly consumes: string | null;
}

/** The three ways out, and nothing else. */
export type ConflictChoice = 'overwrite' | 'keep-both' | 'cancel';

/**
 * Resolving two tabs saving one named build.
 *
 * The three choices are the contract: overwrite keeps this tab's version,
 * keep-both keeps them as two records, cancel keeps the stored one. Every one
 * of them is a version a Commander chose — none of them is a version that
 * disappeared (FR-012).
 *
 * Two properties are easy to get wrong and are the reason this is its own
 * service. No lock is held while the question is on screen, so a slow decision
 * cannot block another page. And overwrite re-checks: if a *third* revision
 * appeared while the Commander was deciding, they are asked again about that
 * one rather than silently replacing a version they were never shown.
 */
@Injectable({ providedIn: 'root' })
export class SaveConflictService {
  readonly #named = inject(NamedRecordService);
  readonly #records = inject(LocalRecordRepository);

  readonly #conflict = signal<SaveConflict | null>(null);

  /** The conflict currently awaiting an answer. */
  readonly conflict = this.#conflict.asReadonly();

  /** Whether an in-place replacement can be offered at all in this browser. */
  get canOverwrite(): boolean {
    return this.#named.canOverwrite;
  }

  /**
   * Attempts a named save, raising a conflict rather than losing a version.
   */
  async save(
    request: NamedSaveRequest & { recordId: string },
    consumes: string | null = null,
  ): Promise<NamedSaveResult> {
    const result = await this.#named.overwriteNamed(request, consumes);

    if (result.kind === 'conflict') {
      this.#conflict.set({
        recordId: result.recordId,
        expectedRevisionId: result.expectedRevisionId,
        observedRevisionId: result.observed.revisionId,
        attempted: request,
        observed: result.observed,
        consumes,
      });
    }

    return result;
  }

  /** Answers the outstanding conflict. */
  async resolve(choice: ConflictChoice): Promise<NamedSaveResult | null> {
    const conflict = this.#conflict();
    if (conflict === null) {
      return null;
    }

    switch (choice) {
      case 'cancel':
        // Nothing is written. This tab's version is still in memory and still
        // in its own working record.
        this.#conflict.set(null);
        return null;

      case 'keep-both': {
        this.#conflict.set(null);
        // Both versions survive, and this one is named where it already lives:
        // the unnamed record these edits were in becomes the second named
        // record, rather than a third entry being written beside it (FR-008).
        return conflict.consumes === null
          ? this.#named.createNamed({
              name: conflict.attempted.name,
              note: conflict.attempted.note,
              build: conflict.attempted.build,
              validation: conflict.attempted.validation,
              now: conflict.attempted.now,
            })
          : this.#named.nameHeldRecord({
              recordId: conflict.consumes,
              name: conflict.attempted.name,
              note: conflict.attempted.note,
              build: conflict.attempted.build,
              validation: conflict.attempted.validation,
              now: conflict.attempted.now,
            });
      }

      case 'overwrite': {
        // Replace exactly the revision the Commander was shown. A third one
        // that appeared while they decided produces a refreshed question.
        const result = await this.#named.overwriteNamed(
          {
            ...conflict.attempted,
            expectedRevisionId: conflict.observedRevisionId,
          },
          conflict.consumes,
        );

        if (result.kind === 'conflict') {
          this.#conflict.set({
            recordId: result.recordId,
            expectedRevisionId: conflict.observedRevisionId,
            observedRevisionId: result.observed.revisionId,
            attempted: conflict.attempted,
            observed: result.observed,
            consumes: conflict.consumes,
          });
          return result;
        }

        this.#conflict.set(null);
        return result;
      }
    }
  }

  /** Re-reads the stored record, so a displayed conflict is never stale bytes. */
  refresh(): void {
    const conflict = this.#conflict();
    if (conflict === null) {
      return;
    }

    const current = this.#records.open(conflict.recordId);
    if (!current.ok || current.value === null) {
      this.#conflict.set(null);
      return;
    }

    this.#conflict.set({
      ...conflict,
      observedRevisionId: current.value.record.revisionId,
      observed: current.value.record,
    });
  }

  clear(): void {
    this.#conflict.set(null);
  }
}
