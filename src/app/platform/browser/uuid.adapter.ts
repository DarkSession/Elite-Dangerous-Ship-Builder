import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * Record, revision and page-nonce identities.
 *
 * Random rather than time-derived, because a revision id is compared for
 * equality across pages whose clocks need not agree, and two writes in the same
 * millisecond must still be two revisions (research, "Named-save concurrency").
 *
 * `crypto.randomUUID` is the source. The fallback below is for a runtime that
 * exposes `crypto.getRandomValues` but not the newer helper; it is still
 * cryptographically random, never `Math.random`.
 */
@Injectable({ providedIn: 'root' })
export class UuidAdapter {
  readonly #crypto = inject(DOCUMENT).defaultView?.crypto ?? null;

  create(): string {
    const source = this.#crypto;
    if (source && typeof source.randomUUID === 'function') {
      return source.randomUUID();
    }
    if (source && typeof source.getRandomValues === 'function') {
      return formatUuid(source.getRandomValues(new Uint8Array(16)));
    }
    throw new Error('This browser offers no cryptographic random source for record identities.');
  }
}

/** Formats 16 random bytes as a version-4 UUID. */
export function formatUuid(bytes: Uint8Array): string {
  const octets = Uint8Array.from(bytes);
  octets[6] = (octets[6]! & 0x0f) | 0x40;
  octets[8] = (octets[8]! & 0x3f) | 0x80;
  const hex = [...octets].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
