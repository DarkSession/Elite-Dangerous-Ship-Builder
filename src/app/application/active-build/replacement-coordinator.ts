import { Injectable, inject } from '@angular/core';
import { ActiveBuildStore } from './active-build.store';
import type { BuildCandidate } from './active-build.models';
import type { CommitSink } from './commit-sinks.port';

/** What a construction attempt produced. */
export type CandidateOutcome =
  | { readonly ok: true; readonly candidate: BuildCandidate }
  | { readonly ok: false; readonly reason: string };

/** How a replacement attempt ended. */
export type ReplacementResult =
  | { readonly kind: 'committed'; readonly candidate: BuildCandidate }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'superseded' }
  | { readonly kind: 'failed'; readonly reason: string };

/** What the Commander is shown when unsaved work is about to be replaced. */
export interface ReplacementQuestion {
  /** The hull about to be replaced, named in the Commander's language. */
  readonly currentHull: string | null;
  /** The hull arriving, named the same way. */
  readonly incomingHull: string;
}

/** Answers a replacement question. Returns true to replace. */
export type ReplacementConfirmer = (question: ReplacementQuestion) => Promise<boolean>;

/**
 * The single path by which the active build is replaced.
 *
 * Four things reach it — creating a stock build, opening a record, loading a
 * link, importing a SLEF file — and all four go through the same four steps:
 * construct a detached candidate, let it fail if it is going to, ask before
 * discarding unsaved work, and commit exactly once. One boundary rather than
 * four is the reason no ingress path can half-replace a build (plan, "Complexity
 * Tracking").
 *
 * The request token is what makes concurrency safe: a decode that finishes
 * after a newer navigation has started is discarded rather than committed, so
 * a slow paste cannot overwrite the build a Commander opened afterwards.
 */
@Injectable({ providedIn: 'root' })
export class ReplacementCoordinator {
  readonly #store = inject(ActiveBuildStore);

  #token = 0;
  #confirm: ReplacementConfirmer | null = null;
  readonly #sinks: CommitSink[] = [];

  /**
   * Registers who asks the Commander about replacing unsaved work.
   *
   * Until one is registered, replacing unsaved work is refused rather than
   * performed silently: no confirmer means nobody asked, and the safe reading
   * of "nobody asked" is "do not replace".
   */
  setConfirmer(confirm: ReplacementConfirmer | null): void {
    this.#confirm = confirm;
  }

  /** Registers something that runs after each successful commit. */
  addSink(sink: CommitSink): () => void {
    this.#sinks.push(sink);
    return () => {
      const index = this.#sinks.indexOf(sink);
      if (index >= 0) {
        this.#sinks.splice(index, 1);
      }
    };
  }

  /**
   * Constructs, validates, confirms and commits — in that order, or not at all.
   *
   * `construct` is given the whole job of producing a candidate, including
   * asking the package for it. Nothing it does touches active state; the store
   * is written on exactly one line of this method.
   */
  async replace(
    construct: () => CandidateOutcome | Promise<CandidateOutcome>,
  ): Promise<ReplacementResult> {
    this.#token += 1;
    const token = this.#token;

    let outcome: CandidateOutcome;
    try {
      outcome = await construct();
    } catch (error) {
      return { kind: 'failed', reason: error instanceof Error ? error.message : String(error) };
    }

    if (token !== this.#token) {
      return { kind: 'superseded' };
    }
    if (!outcome.ok) {
      return { kind: 'failed', reason: outcome.reason };
    }

    if (this.#store.dirty()) {
      const confirm = this.#confirm;
      if (confirm === null) {
        return { kind: 'cancelled' };
      }

      const replace = await confirm({
        currentHull: this.#store.hullName(),
        incomingHull: outcome.candidate.hullName,
      });

      // Both the answer and the world may have moved while the question was on
      // screen: a newer request wins, and a "no" leaves everything alone.
      if (token !== this.#token) {
        return { kind: 'superseded' };
      }
      if (!replace) {
        return { kind: 'cancelled' };
      }
    }

    this.#store.commit(outcome.candidate);
    for (const sink of this.#sinks) {
      sink.onCommitted(outcome.candidate);
    }
    return { kind: 'committed', candidate: outcome.candidate };
  }
}
