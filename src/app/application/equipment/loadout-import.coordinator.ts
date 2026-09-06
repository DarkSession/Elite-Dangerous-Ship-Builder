import { Injectable, Injector, inject } from '@angular/core';
import { getSuitByFamily } from '@elite-dangerous-almanac/core/equipment/suits';
import {
  SUIT_JOURNAL_READER,
  importSuitLoadout,
  type SuitLoadoutImport,
} from '../../domain/equipment/loadout/suit-loadout-import';
import {
  scanJournalFiles,
  scanJournalText,
  type JournalEntry,
  type JournalFile,
} from '../../domain/journal/journal-scan';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import { ClockAdapter } from '../../platform/browser/clock.adapter';
import { BuildLibraryStore } from '../build-library/build-library.store';
import { NamedRecordService } from '../build-library/named-record.service';
import { LoadoutStore } from './loadout.store';
import { LoadoutImportStore, type LoadoutBatchRefusal } from './loadout-import.store';

/** How one submitted import ended, from the layer's point of view. */
export type LoadoutImportSubmission =
  | { readonly kind: 'opened' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'listed' }
  | {
      readonly kind: 'stored';
      readonly stored: number;
      readonly refused: readonly LoadoutBatchRefusal[];
    };

/**
 * The one path from a journal event to a loadout.
 *
 * Nothing reaches the bench until an import has succeeded. One chosen loadout
 * opens on it; several are saved and none opens, so the bench a Commander was
 * working on is where they left it and the records are what they choose from
 * (016/FR-017).
 */
@Injectable({ providedIn: 'root' })
export class LoadoutImportCoordinator {
  readonly #store = inject(LoadoutImportStore);
  readonly #bench = inject(LoadoutStore);
  readonly #named = inject(NamedRecordService);
  readonly #clock = inject(ClockAdapter);
  readonly #gameText = inject(GameTextPresenter);
  readonly #messages = inject(MessageService);
  readonly #injector = inject(Injector);
  /**
   * The library, resolved when there is something to tell it about.
   *
   * Not injected into a field. The store reaches `RetentionService`, which
   * takes a page nonce from `UuidAdapter`, which throws where there is no
   * `crypto` rather than fabricating an identity — and the import layer is
   * mounted in the shell, so a field would construct that chain in the
   * prerenderer and empty every built document (`app.config.ts`, the sweep's
   * own initializer; 015/FR-001).
   */
  get #library(): BuildLibraryStore {
    return this.#injector.get(BuildLibraryStore);
  }

  /** Reads the journal files a Commander chose. Imports nothing. */
  async scanFiles(files: readonly JournalFile[]): Promise<void> {
    this.#store.clearScan();
    this.#store.setScanning(files.length);

    const result = await scanJournalFiles(files, SUIT_JOURNAL_READER);

    this.#store.setScanning(0);
    if (!result.ok) {
      this.#store.setFailure(result.failure);
      return;
    }
    this.#store.setScan(result.report, result.entries);
  }

  /**
   * Takes what the Commander chose, whether they pasted it or scanned for it.
   *
   * A paste is scanned the same way a file is: a Commander who copied a stretch
   * of their journal has pasted a log, and the answer to a log holding several
   * loadouts is the same list either way.
   */
  async submit(): Promise<LoadoutImportSubmission> {
    if (this.#store.entries().length === 0 && !this.#scanDraft()) {
      return { kind: 'failed' };
    }
    if (this.#store.entries().length > 1 && this.#store.selectedKeys().length === 0) {
      this.#store.setFailure({ kind: 'nothingSelected' });
      return { kind: 'failed' };
    }

    const chosen = this.#store.selectedEntries();
    const [only] = chosen;
    if (chosen.length === 0) {
      this.#store.setFailure({ kind: 'nothingSelected' });
      return { kind: 'failed' };
    }
    if (chosen.length === 1 && only !== undefined) {
      return this.#openOnBench(only.value);
    }
    return this.#storeSelection(chosen);
  }

  /**
   * Reads the paste box, and lists what it holds where it holds several.
   *
   * `false` means the layer now carries a refusal and there is nothing to
   * submit. A list is not a refusal: the Commander is being asked which of the
   * loadouts they pasted they meant.
   */
  #scanDraft(): boolean {
    const raw = this.#store.draft().trim();
    if (raw.length === 0) {
      this.#store.setFailure({ kind: 'empty' });
      return false;
    }

    const found = scanJournalText(raw, SUIT_JOURNAL_READER);
    if (found.length > 0) {
      this.#store.setScan(null, found);
      return true;
    }

    // Nothing the reader recognised. The package is asked directly so the
    // refusal names what was wrong with the payload rather than reporting that
    // a scan found nothing in something that was never a log.
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      this.#store.setFailure({ kind: 'syntax' });
      return false;
    }

    const result = importSuitLoadout(payload);
    this.#store.setFailure(result.ok ? { kind: 'malformed' } : result.failure);
    return false;
  }

  /**
   * Opens one imported loadout on the bench.
   *
   * The layer closes on a clean import. It stays open where the package left
   * something out, because that is the one place the Commander can read what it
   * was — and the loadout is on the bench behind it either way.
   */
  #openOnBench(value: SuitLoadoutImport): LoadoutImportSubmission {
    this.#bench.open(value.loadout);
    this.#store.setBatchOutcome(null);

    const clean = value.outcomes.length === 0 && value.heldBack.length === 0;
    if (clean) {
      this.#store.clear();
      this.#store.closeLayer();
      return { kind: 'opened' };
    }

    this.#store.clearScan();
    this.#store.setFailure({
      kind: 'partial',
      outcomes: value.outcomes,
      heldBack: value.heldBack,
    });
    return { kind: 'opened' };
  }

  /**
   * Saves every chosen loadout, and opens none of them.
   *
   * A name clash is not asked about: the Commander asked for one import, and a
   * question for every name in it would be a queue of questions nobody asked
   * for (016/FR-016). Both copies are kept.
   */
  async #storeSelection(
    chosen: readonly JournalEntry<SuitLoadoutImport>[],
  ): Promise<LoadoutImportSubmission> {
    this.#store.setWorking(true);
    const now = this.#clock.timestamp();
    // The row's own note, as the canvas draws it. It is stored in the language
    // the Commander imported in, as any note they typed themselves would be.
    const note = this.#messages.message('equipment.import.note');

    let stored = 0;
    const refused: LoadoutBatchRefusal[] = [];

    for (const entry of chosen) {
      const saved = await this.#named.createNamed({
        name: this.recordName(entry.value),
        note,
        payload: { tool: 'equipment', loadout: entry.value.loadout },
        now,
      });
      if (saved.kind === 'saved') {
        stored += 1;
      } else {
        refused.push({ title: this.recordName(entry.value), failure: { kind: 'notStored' } });
      }
    }

    this.#store.setWorking(false);
    this.#library.refresh();

    if (refused.length === 0) {
      this.#store.clear();
      this.#store.closeLayer();
    }
    this.#store.setBatchOutcome({ stored, refused });

    return { kind: 'stored', stored, refused };
  }

  /**
   * The name a saved loadout takes.
   *
   * The name the Commander gave it in the game, and the suit's own name where
   * the event carries none. Neither is invented here: the first is theirs and
   * the second is the package's (016/FR-017).
   */
  recordName(value: SuitLoadoutImport): string {
    if (value.name !== null && value.name.trim().length > 0) {
      return value.name;
    }
    const family = value.loadout.suitFamily;
    return this.#gameText.suitName(family).text ?? getSuitByFamily(family)?.name ?? family;
  }
}
