import { Injectable, computed, signal } from '@angular/core';
import type {
  JournalEntry,
  JournalScanFailure,
  JournalScanReport,
} from '../../domain/journal/journal-scan';
import type { SuitLoadoutImportOutcome } from '@elite-dangerous-almanac/core/equipment/suit-loadout';
import type {
  SuitLoadoutImport,
  SuitLoadoutImportFailure,
} from '../../domain/equipment/loadout/suit-loadout-import';

/** Why an import did not happen, from every gate that can refuse one. */
export type LoadoutImportFailure =
  | JournalScanFailure
  | SuitLoadoutImportFailure
  | { readonly kind: 'empty' }
  | { readonly kind: 'syntax' }
  | { readonly kind: 'nothingSelected' }
  | { readonly kind: 'notStored' }
  /**
   * The import happened, and part of the event did not survive it.
   *
   * Not a refusal: the loadout is on the bench. It is carried here because it
   * is read where a refusal is read, and because the alternative is a Commander
   * never learning that a weapon they own was left behind (016/FR-015).
   */
  | {
      readonly kind: 'partial';
      readonly outcomes: readonly SuitLoadoutImportOutcome[];
      readonly heldBack: readonly string[];
    };

/** One loadout a batch import did not save, and what answered for it. */
export interface LoadoutBatchRefusal {
  readonly title: string;
  readonly failure: LoadoutImportFailure;
}

/** How a batch import ended: what was saved, and what was not. */
export interface LoadoutBatchOutcome {
  readonly stored: number;
  readonly refused: readonly LoadoutBatchRefusal[];
}

/**
 * Everything the bench's import remembers, and nothing else.
 *
 * No loadout: what a Commander is working on lives in `LoadoutStore`, and an
 * import that has not been accepted has not touched it. This is the exchange a
 * Commander is in the middle of, which is session memory and nothing more.
 */
@Injectable({ providedIn: 'root' })
export class LoadoutImportStore {
  readonly #open = signal(false);
  readonly #draft = signal('');
  readonly #scanningFiles = signal(0);
  readonly #entries = signal<readonly JournalEntry<SuitLoadoutImport>[]>([]);
  readonly #report = signal<JournalScanReport | null>(null);
  readonly #selected = signal<readonly string[]>([]);
  readonly #failure = signal<LoadoutImportFailure | null>(null);
  readonly #batch = signal<LoadoutBatchOutcome | null>(null);
  readonly #working = signal(false);

  readonly open = this.#open.asReadonly();
  readonly draft = this.#draft.asReadonly();
  readonly scanning = computed(() => this.#scanningFiles() > 0);
  readonly scanningFiles = this.#scanningFiles.asReadonly();
  readonly entries = this.#entries.asReadonly();
  readonly report = this.#report.asReadonly();
  readonly selectedKeys = this.#selected.asReadonly();
  readonly failure = this.#failure.asReadonly();
  readonly batchOutcome = this.#batch.asReadonly();
  /** True while a submitted import is being taken. */
  readonly working = this.#working.asReadonly();

  readonly selectedEntries = computed(() =>
    this.#entries().filter((entry) => this.#selected().includes(entry.key)),
  );

  openLayer(): void {
    this.#open.set(true);
  }

  closeLayer(): void {
    this.#open.set(false);
  }

  /** Records an edit, and forgets a scan the text is no longer about. */
  setDraft(text: string): void {
    this.#draft.set(text);
    this.#failure.set(null);
    this.clearScan();
  }

  setScanning(files: number): void {
    this.#scanningFiles.set(files);
    if (files > 0) {
      this.#failure.set(null);
    }
  }

  setWorking(working: boolean): void {
    this.#working.set(working);
  }

  /** Records what a scan found, and chooses the newest loadout to start from. */
  setScan(
    report: JournalScanReport | null,
    entries: readonly JournalEntry<SuitLoadoutImport>[],
  ): void {
    const [newest] = entries;
    this.#report.set(report);
    this.#entries.set(entries);
    this.#selected.set(newest === undefined ? [] : [newest.key]);
    this.#failure.set(null);
  }

  setSelection(keys: readonly string[]): void {
    this.#selected.set([...keys]);
    this.#failure.set(null);
  }

  setFailure(failure: LoadoutImportFailure | null): void {
    this.#failure.set(failure);
    this.#scanningFiles.set(0);
  }

  setBatchOutcome(outcome: LoadoutBatchOutcome | null): void {
    this.#batch.set(outcome);
  }

  clearScan(): void {
    this.#scanningFiles.set(0);
    this.#entries.set([]);
    this.#report.set(null);
    this.#selected.set([]);
    this.#batch.set(null);
  }

  /** Forgets the exchange entirely: a committed import, or a closed layer. */
  clear(): void {
    this.#draft.set('');
    this.#failure.set(null);
    this.#working.set(false);
    this.clearScan();
  }
}
