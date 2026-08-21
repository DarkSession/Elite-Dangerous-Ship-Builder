/**
 * The browser key space this application owns.
 *
 * Everything the application writes to a browser store is named here, so "what
 * belongs to us" is one list rather than a set of string literals scattered
 * across repositories. Enumeration filters on these prefixes: a key this
 * application did not write is never read, migrated, repaired or removed, even
 * when it looks like one of ours (persistence contract, "Ownership and key
 * space").
 */

/** Every local record key begins with this. The suffix is the record's UUID. */
export const EDSB_RECORD_KEY_PREFIX = 'edsb:record:';

/** This top-level browsing context's tab descriptor, in `sessionStorage`. */
export const EDSB_TAB_KEY = 'edsb:tab';

/** The channel duplicated tabs negotiate working-record ownership over. */
export const EDSB_BROADCAST_CHANNEL = 'edsb.persistence.v1';

/** The storage key one local record lives under. */
export function recordKey(recordId: string): string {
  return `${EDSB_RECORD_KEY_PREFIX}${recordId}`;
}

/** The record id a key names, or `null` when the key is not one of ours. */
export function recordIdFromKey(key: string): string | null {
  if (!key.startsWith(EDSB_RECORD_KEY_PREFIX)) {
    return null;
  }
  const id = key.slice(EDSB_RECORD_KEY_PREFIX.length);
  return id.length > 0 ? id : null;
}

/**
 * The Web Lock guarding writes to one named record.
 *
 * Scoped per record rather than globally: two Commanders' tabs saving two
 * different builds have nothing to serialize between them, and a single lock
 * would make one wait on the other for no reason.
 */
export function namedRecordLockName(recordId: string): string {
  return `edsb:named:${recordId}`;
}
