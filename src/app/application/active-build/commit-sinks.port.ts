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
