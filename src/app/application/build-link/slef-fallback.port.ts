import { InjectionToken } from '@angular/core';
import type { SlefFallback } from '../active-build/commit-sinks.port';

export type { SlefFallback };

/**
 * What a refusal reaches for when a build cannot be a link.
 *
 * Until feature 004 lands, this is an explicit "not available yet" rather than
 * a silent no-op. The difference matters at the surface: an unavailable export
 * is *said*, so a Commander whose build cannot be shared as a link learns that
 * the alternative does not exist in this version instead of pressing a button
 * that does nothing (build-link contract, "Active-edit synchronization").
 */
export const UNAVAILABLE_SLEF_FALLBACK: SlefFallback = {
  available: false,
  export: () => false,
};

/** Feature 004 replaces this provider with the delivered export action. */
export const SLEF_FALLBACK = new InjectionToken<SlefFallback>('SLEF_FALLBACK', {
  providedIn: 'root',
  factory: () => UNAVAILABLE_SLEF_FALLBACK,
});
