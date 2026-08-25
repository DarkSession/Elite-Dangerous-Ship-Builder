import type { BuildCandidate } from './active-build.models';

/**
 * Where a committed build goes after it becomes active.
 *
 * One seam, so stock creation, opening a record and loading a link all reach
 * the same autosave and the same fragment publication. Three separate wirings
 * would be three chances for one of them to forget (routes-and-ui contract,
 * "Intent boundary").
 *
 * Persistence is implemented by feature 001's autosave service; it exists as a
 * port so the ingress coordinator can be tested without a browser store.
 */
export interface CommitSink {
  /** Called once, after the candidate has become the active build. */
  onCommitted(candidate: BuildCandidate): void;
}

/**
 * The alternative offered when a build cannot be represented as a link.
 *
 * Feature 004 owns SLEF export. Feature 001 owns the refusal that reaches for
 * it, so the seam is declared here and its default until that feature lands is
 * an explicit "not available yet" rather than a silent no-op.
 */
export interface SlefFallback {
  /** Whether a SLEF export is actually available in this build. */
  readonly available: boolean;
  /** Starts the export. Returns false when there was nothing to start. */
  export(): boolean;
}
