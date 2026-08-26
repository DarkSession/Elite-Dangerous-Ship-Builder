import { InjectionToken } from '@angular/core';

/**
 * The alternative offered when a build cannot be represented as a link.
 *
 * Feature 004 owns SLEF export; feature 001 owns the refusal that reaches for
 * it. The seam is what keeps the two from knowing about each other — the
 * workspace's Export action and a link refusal both come through here
 * (build-link contract, "Active-edit synchronization").
 */
export interface SlefFallback {
  /** Starts the export. Returns false when there was nothing to start. */
  export(): boolean;
}

/** Bound to feature 004's exchange layer by `SLEF_FALLBACK_PROVIDER`. */
export const SLEF_FALLBACK = new InjectionToken<SlefFallback>('SLEF_FALLBACK');
