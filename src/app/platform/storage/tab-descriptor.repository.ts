import { Injectable, inject } from '@angular/core';
import { EDNB_TAB_KEY } from './storage-keys';
import { SESSION_STORAGE_PORT } from './web-storage.port';

/** The only published tab-descriptor version. */
export const TAB_DESCRIPTOR_VERSION = 1;

/** What this top-level browsing context remembers about itself. */
export interface TabDescriptorV1 {
  readonly version: typeof TAB_DESCRIPTOR_VERSION;
  /** The working record this tab autosaves to, across reloads. */
  readonly workingRecordId: string;
}

/**
 * This tab's own identity, in `sessionStorage`.
 *
 * `sessionStorage` is the right store precisely because it is not shared: two
 * windows browsing the same application get two working records and cannot
 * overwrite each other's autosave. It survives a reload, which is the whole
 * point, and does not survive the tab, which is also correct — the record it
 * names does survive, and the library is where it is found again.
 *
 * A duplicated tab is the exception the descriptor cannot handle alone: the
 * copy inherits the original's session storage, so both pages believe they own
 * one record. The broadcast claim resolves that; this only remembers.
 */
@Injectable({ providedIn: 'root' })
export class TabDescriptorRepository {
  readonly #session = inject(SESSION_STORAGE_PORT);

  /** The working record this tab owns, or `null` when it has none yet. */
  read(): TabDescriptorV1 | null {
    const raw = this.#session.read(EDNB_TAB_KEY);
    if (!raw.ok || raw.value === null) {
      return null;
    }

    let value: unknown;
    try {
      value = JSON.parse(raw.value);
    } catch {
      return null;
    }

    if (typeof value !== 'object' || value === null) {
      return null;
    }
    const descriptor = value as Record<string, unknown>;
    // A newer descriptor is not guessed at: this tab simply starts a new
    // working record rather than adopting a record it cannot describe.
    if (descriptor['version'] !== TAB_DESCRIPTOR_VERSION) {
      return null;
    }
    const workingRecordId = descriptor['workingRecordId'];
    if (typeof workingRecordId !== 'string' || workingRecordId.length === 0) {
      return null;
    }

    return { version: TAB_DESCRIPTOR_VERSION, workingRecordId };
  }

  /** Claims a working record for this tab. Best effort, like every session write. */
  write(workingRecordId: string): void {
    this.#session.write(
      EDNB_TAB_KEY,
      JSON.stringify({ version: TAB_DESCRIPTOR_VERSION, workingRecordId }),
    );
  }

  clear(): void {
    this.#session.remove(EDNB_TAB_KEY);
  }
}
