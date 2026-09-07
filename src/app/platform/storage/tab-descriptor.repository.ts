import { Injectable, inject } from '@angular/core';
import type { RecordTool } from '../../domain/records/local-record';
import { EDNB_TAB_KEY } from './storage-keys';
import { SESSION_STORAGE_PORT } from './web-storage.port';

/** The only published tab-descriptor version. */
export const TAB_DESCRIPTOR_VERSION = 2;

/** What this top-level browsing context remembers about itself. */
export interface TabDescriptorV2 {
  readonly version: typeof TAB_DESCRIPTOR_VERSION;
  /** The working record this tab autosaves to, per tool, across reloads. */
  readonly workingRecords: Readonly<Partial<Record<RecordTool, string>>>;
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
 * One record per tool. A page holds a build and a loadout at the same time, and
 * each is autosaved into an unnamed record of its own (017/FR-010).
 *
 * A duplicated tab is the exception the descriptor cannot handle alone: the
 * copy inherits the original's session storage, so both pages believe they own
 * one record. The broadcast claim resolves that; this only remembers.
 */
@Injectable({ providedIn: 'root' })
export class TabDescriptorRepository {
  readonly #session = inject(SESSION_STORAGE_PORT);

  /** The working records this tab owns, by tool. Empty where it owns none. */
  read(): TabDescriptorV2 | null {
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

    // A descriptor written before a page held two records named one, and it
    // named the ship tool's. It is read as that rather than discarded: applying
    // a published update restarts the page in the same tab, where session
    // storage survives, and a tab that forgot its record would leave the build
    // it was writing to behind and start a second one.
    if (descriptor['version'] === 1) {
      const workingRecordId = descriptor['workingRecordId'];
      return typeof workingRecordId === 'string' && workingRecordId.length > 0
        ? { version: TAB_DESCRIPTOR_VERSION, workingRecords: { ship: workingRecordId } }
        : null;
    }

    // A newer descriptor is not guessed at: this tab simply starts new working
    // records rather than adopting records it cannot describe.
    if (descriptor['version'] !== TAB_DESCRIPTOR_VERSION) {
      return null;
    }

    const stored = descriptor['workingRecords'];
    if (typeof stored !== 'object' || stored === null) {
      return null;
    }

    const workingRecords: Partial<Record<RecordTool, string>> = {};
    for (const tool of ['ship', 'equipment'] as const) {
      const id = (stored as Record<string, unknown>)[tool];
      if (typeof id === 'string' && id.length > 0) {
        workingRecords[tool] = id;
      }
    }

    return { version: TAB_DESCRIPTOR_VERSION, workingRecords };
  }

  /** Claims a working record for one tool. Best effort, like every session write. */
  write(tool: RecordTool, workingRecordId: string): void {
    const held = this.read()?.workingRecords ?? {};
    this.#session.write(
      EDNB_TAB_KEY,
      JSON.stringify({
        version: TAB_DESCRIPTOR_VERSION,
        workingRecords: { ...held, [tool]: workingRecordId },
      }),
    );
  }

  /**
   * Lets go of one tool's working record, leaving the other tool's alone.
   *
   * What a tool calls when it stops writing to a record and is not taking up
   * another one: the bench was emptied, or the record was deleted on this page.
   * Without it the claim outlives the work, and the next page built in this tab
   * restores what a Commander cleared or names a record that is gone
   * (017/FR-006, FR-008).
   *
   * The record itself is not touched here. Whether one is still there is the
   * caller's to know.
   */
  release(tool: RecordTool): void {
    const held = this.read()?.workingRecords;
    if (held === undefined || held[tool] === undefined) {
      return;
    }

    const remaining = { ...held };
    delete remaining[tool];
    if (Object.keys(remaining).length === 0) {
      this.clear();
      return;
    }

    this.#session.write(
      EDNB_TAB_KEY,
      JSON.stringify({ version: TAB_DESCRIPTOR_VERSION, workingRecords: remaining }),
    );
  }

  clear(): void {
    this.#session.remove(EDNB_TAB_KEY);
  }
}
