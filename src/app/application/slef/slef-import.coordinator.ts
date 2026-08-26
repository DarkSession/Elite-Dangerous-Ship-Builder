import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { importSlef } from '../../domain/slef/slef-import';
import type { SlefImportCandidate } from '../../domain/slef/slef-import.models';
import { ActiveBuildStore } from '../active-build/active-build.store';
import type { CandidateOutcome } from '../active-build/build-ingress.coordinator';
import { BuildIngressCoordinator } from '../active-build/build-ingress.coordinator';
import { SlefStore } from './slef.store';

/**
 * How one submitted draft ended, from the layer's point of view.
 *
 * `cancelled` has had no producer since feature 001 withdrew its replacement
 * question on 2026-08-25: nothing between a valid draft and a committed build
 * asks the Commander anything any more. It is kept as an ending the layer still
 * knows how to render, because abandoning a submission is feature 004's own
 * behaviour to define and this feature does not get to delete it from here.
 */
export type SlefImportSubmission =
  | { readonly kind: 'committed' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'superseded' };

/**
 * The one path from a pasted draft to an active build.
 *
 * Everything up to the handoff happens on a candidate nobody is looking at, and
 * the handoff itself is feature 001's `BuildIngressCoordinator` — the single
 * place in the application where the active build changes. Feature 004 writes
 * no active state, no record, no fragment and no history entry of its own; if
 * it did, there would be two ways to replace a build and one of them would
 * eventually skip the confirmation (import contract, steps 11 and 12).
 *
 * The request token is what makes a slow paste safe. A newer submit, a cancel,
 * a close or a route change issues a new one, and a result carrying an older
 * token is discarded rather than committed.
 */
@Injectable({ providedIn: 'root' })
export class SlefImportCoordinator {
  readonly #store = inject(SlefStore);
  readonly #ingress = inject(BuildIngressCoordinator);
  readonly #active = inject(ActiveBuildStore);
  readonly #gameText = inject(GameTextPresenter);
  readonly #router = inject(Router);

  /** Inspects the current draft and, if it becomes a build, offers it. */
  async submit(): Promise<SlefImportSubmission> {
    const token = this.#store.issueToken();
    const text = this.#store.draft().text;
    this.#store.setImportStatus('inspecting');

    const result = importSlef(text, token);

    if (!this.#store.isCurrent(token)) {
      return this.#settle('superseded');
    }

    if (!result.ok) {
      this.#store.setImportFailure(result.failure);
      return { kind: 'failed' };
    }

    this.#store.setImportStatus('awaitingReplacement');

    const ingress = await this.#ingress.commit((): CandidateOutcome =>
      this.#store.isCurrent(token)
        ? { ok: true, candidate: this.#candidate(result.candidate) }
        : { ok: false, reason: SUPERSEDED },
    );

    // Feature 001's answer is the last word. The token guards the handoff, not
    // what follows it: once feature 001 has committed, a token issued during the
    // handoff cannot un-commit the build, and reporting anything but `committed`
    // would describe an active build as one that never arrived. The dangerous
    // case — a slow paste landing on a build opened afterwards — is a newer
    // ingress, which feature 001's own token supersedes before it commits.
    //
    // Since 2026-08-25 the only ending here is a superseded one: nothing is
    // asked before a build is replaced, so nothing can be declined (FR-008).
    if (ingress.kind !== 'committed') {
      return this.#settle('superseded');
    }

    // The workspace, then the draft, then the layer — in that order.
    //
    // The order is the whole of it. A route change started after the layer
    // closes is a route change racing whatever the screen underneath does when
    // it is uncovered, and on the shipyard that screen replaces the URL as soon
    // as a pointer rests on a row. Moving first, while the layer still covers
    // it, is what makes the Commander land on the build they just imported
    // (import contract, step 12).
    // Compared exactly: `/builds` is the library, and starting with `/build`
    // is not the same thing as being the workspace.
    const path = this.#router.url.split(/[?#]/)[0];
    if (path !== WORKSPACE) {
      await this.#router.navigateByUrl(WORKSPACE);
    }

    // Only now: the draft has become a build, so it has stopped being a draft.
    // Every other ending keeps it exactly as it was typed (contract,
    // "Atomicity").
    this.#store.clearDraft();
    this.#store.closeLayer();
    return { kind: 'committed' };
  }

  /**
   * Abandons whatever is in flight, without touching the draft.
   *
   * The one operation behind close, cancel and a route change alike: all three
   * mean the answer being waited for is about a question nobody is asking.
   */
  abandon(): void {
    this.#store.issueToken();
    this.#store.setImportStatus('editing');
  }

  /**
   * The candidate, in feature 001's own shape.
   *
   * `working` provenance and no baseline: an imported build exists nowhere a
   * Commander could get it back from, so it arrives dirty and autosave mints it
   * a record of its own at the first write. Nothing else about where it came
   * from — the producer the envelope named, the draft — goes with it: neither
   * is build state.
   *
   * The quality completions travel as feature 001's own `qualityNotices`,
   * which is what the workspace's existing completion notice reads. Feature 004
   * publishes no second report of them: the same fact told twice on the same
   * screen is worse than the fact told once
   * (`specs/004-slef/design/import-outcome.md`, "Divergence").
   */
  #candidate(candidate: SlefImportCandidate) {
    const symbol = candidate.loadout.shipSymbol;
    return {
      loadout: candidate.loadout,
      hullName: this.#gameText.shipName(symbol).text ?? symbol,
      provenance: 'working' as const,
      qualityNotices: candidate.qualityCompletions.map((completion) => ({
        kind: 'qualityCompleted' as const,
        slotKey: completion.slotKey,
        moduleSymbol: completion.moduleSymbol,
        blueprintFdname: completion.blueprintFdname,
        previousQuality: completion.previousQuality,
        quality: completion.quality,
      })),
      sourceNamed: null,
      autosaveRecordId: null,
      baseline: null,
    };
  }

  #settle(kind: 'superseded'): SlefImportSubmission {
    this.#store.setImportEnding(kind);
    return { kind };
  }
}

/**
 * Why feature 001 was handed no candidate.
 *
 * A stable code rather than a sentence. Feature 004 discards it — the layer's
 * own status line says what happened, in the message layer's words — but
 * sibling features render `CommitResult.reason` directly, and an English
 * sentence written here would be an owned string that never passed through a
 * catalogue (FR-014).
 */
const SUPERSEDED = 'superseded';

/** Where an imported build is looked at. Feature 001's own workspace route. */
const WORKSPACE = '/build';
