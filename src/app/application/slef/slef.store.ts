import { Injectable, computed, signal } from '@angular/core';
import {
  SLEF_IMPORT_LIMIT_BYTES,
  type SlefImportDraft,
  type SlefImportFailure,
  type SlefImportStatus,
  type SlefRequestToken,
} from '../../domain/ships/slef/slef-import.models';
import type { JournalEntry, JournalScanReport } from '../../domain/journal/journal-scan';
import type { JournalLoadoutFacts } from '../../domain/ships/slef/journal-loadouts';
import type {
  DeliveryAction,
  DeliveryCapability,
  DeliveryOutcome,
  SlefExportArtifact,
} from '../../domain/ships/slef/slef-export.models';

/** One build a batch import did not store, and what answered for it. */
export interface SlefBatchRefusal {
  /** The build, by the name its record would have taken. */
  readonly title: string;
  readonly failure: SlefImportFailure;
}

/** How a batch import ended: what was stored, and what was not. */
export interface SlefBatchOutcome {
  readonly stored: number;
  readonly refused: readonly SlefBatchRefusal[];
}

/** How an attempt ended when it changed nothing. `null` while none has. */
export type SlefImportEnding = 'cancelled' | 'superseded' | null;

/** Which exchange layer is open. Neither adds a route or a history entry. */
export type SlefLayer = 'none' | 'import' | 'export';

/** Which mode the shared export layer is showing. */
export type SlefExportMode = 'link' | 'slef';

/**
 * Everything the SLEF workflow remembers, and nothing else.
 *
 * There is no `ShipLoadout` here, no committed build and no storage key. A
 * draft, a candidate in flight and a generated artifact are all session memory:
 * they describe an exchange a Commander is in the middle of, and an exchange
 * left half-finished when the tab closed is not something to restore
 * (plan, "Storage").
 *
 * The active build lives in feature 001's store, is committed by feature 001's
 * coordinator, and is read here only through an atomic snapshot. Two stores
 * holding a build would eventually hold two different builds.
 */
@Injectable({ providedIn: 'root' })
export class SlefStore {
  // ---- import ------------------------------------------------------------

  readonly #draftText = signal('');
  readonly #status = signal<SlefImportStatus>('editing');
  readonly #failure = signal<SlefImportFailure | null>(null);
  #token: SlefRequestToken = 0;

  /** The exact text, its measured size and the one limit, published together. */
  readonly draft = computed<SlefImportDraft>(() => ({
    text: this.#draftText(),
    utf8Bytes: utf8ByteLength(this.#draftText()),
    limitBytes: SLEF_IMPORT_LIMIT_BYTES,
  }));

  readonly #ending = signal<SlefImportEnding>(null);

  // ---- what a journal scan found -----------------------------------------

  readonly #scanningFiles = signal(0);
  readonly #entries = signal<readonly JournalEntry<JournalLoadoutFacts>[]>([]);
  readonly #report = signal<JournalScanReport | null>(null);
  readonly #selected = signal<readonly string[]>([]);

  /** True while files are being read. The layer says so and stays usable. */
  readonly scanning = computed(() => this.#scanningFiles() > 0);
  /** How many files the running scan is reading. */
  readonly scanningFiles = this.#scanningFiles.asReadonly();
  /** Every build the last scan found, newest first. Empty before one. */
  readonly journalEntries = this.#entries.asReadonly();
  /** What the last scan read, for the sentence the layer states afterwards. */
  readonly scanReport = this.#report.asReadonly();
  /** The keys of the builds the Commander chose, in the order they chose them. */
  readonly selectedKeys = this.#selected.asReadonly();

  /** The chosen builds themselves, in the order the list draws them. */
  readonly selectedEntries = computed(() =>
    this.#entries().filter((entry) => this.#selected().includes(entry.key)),
  );

  readonly #batch = signal<SlefBatchOutcome | null>(null);

  /** What the last batch import stored, and what it did not. */
  readonly batchOutcome = this.#batch.asReadonly();

  readonly importStatus = this.#status.asReadonly();
  readonly importFailure = this.#failure.asReadonly();

  /**
   * How the last attempt ended when nothing happened.
   *
   * A cancel and a supersession are not failures — nothing is wrong with the
   * draft — but they are not silence either: the canvas's one status line is
   * where a Commander finds out their build was left alone.
   */
  readonly importEnding = this.#ending.asReadonly();

  /** The token a result must still carry to be acted on. */
  get requestToken(): SlefRequestToken {
    return this.#token;
  }

  /**
   * Issues a new token, invalidating every result still in flight.
   *
   * Called by a new submit, a cancel, a close and a route change alike: all
   * four mean "whatever is still running is about a question nobody is asking
   * any more" (import contract, "Atomicity").
   */
  issueToken(): SlefRequestToken {
    this.#token += 1;
    return this.#token;
  }

  /** True while this token is still the current one. */
  isCurrent(token: SlefRequestToken): boolean {
    return token === this.#token;
  }

  /**
   * Records an edit. A newer edit clears a failure that described older text.
   *
   * It clears a scan with it. Typing into the box says which payload the
   * Commander means, and leaving a list of builds standing beside text that is
   * no longer about them is how the wrong build gets imported.
   */
  setDraft(text: string): void {
    this.#draftText.set(text);
    this.#failure.set(null);
    this.#ending.set(null);
    this.#status.set('editing');
    this.clearScan();
  }

  clearDraft(): void {
    this.#draftText.set('');
    this.#failure.set(null);
    this.#ending.set(null);
    this.#status.set('editing');
    this.clearScan();
  }

  /** Says a scan of this many files is running. Zero says none is. */
  setScanning(files: number): void {
    this.#scanningFiles.set(files);
    if (files > 0) {
      this.#failure.set(null);
      this.#ending.set(null);
    }
  }

  /**
   * Records what a scan found, and chooses the newest build for the Commander.
   *
   * One build is chosen rather than none because a scan that found one thing
   * has nothing to choose between, and a Commander who dropped a file has
   * already said what they want. Choosing is still theirs: every row can be
   * turned off, and loading with none on is refused rather than guessed at.
   */
  setScan(report: JournalScanReport, entries: readonly JournalEntry<JournalLoadoutFacts>[]): void {
    const [newest] = entries;
    this.#report.set(report);
    this.#entries.set(entries);
    this.#selected.set(newest === undefined ? [] : [newest.key]);
    this.#failure.set(null);
    this.#ending.set(null);
  }

  /** Replaces the whole selection, as a group of checkboxes reports it. */
  setSelection(keys: readonly string[]): void {
    this.#selected.set([...keys]);
    this.#failure.set(null);
  }

  /** Turns one build on or off, keeping the order the list draws. */
  toggleSelection(key: string): void {
    this.#selected.update((keys) =>
      keys.includes(key) ? keys.filter((chosen) => chosen !== key) : [...keys, key],
    );
    this.#failure.set(null);
  }

  /** Records how a batch ended. Read by the layer and by the record list. */
  setBatchOutcome(outcome: SlefBatchOutcome | null): void {
    this.#batch.set(outcome);
  }

  /** Forgets a scan. A new scan, a close and a committed import all do this. */
  clearScan(): void {
    this.#scanningFiles.set(0);
    this.#entries.set([]);
    this.#report.set(null);
    this.#selected.set([]);
    this.#batch.set(null);
  }

  setImportStatus(status: SlefImportStatus): void {
    this.#status.set(status);
    if (status !== 'editing') {
      this.#ending.set(null);
    }
  }

  /** Records a no-op ending. Cleared by the next edit or submit. */
  setImportEnding(ending: SlefImportEnding): void {
    this.#ending.set(ending);
    this.#status.set('editing');
  }

  setImportFailure(failure: SlefImportFailure | null): void {
    this.#failure.set(failure);
    this.#ending.set(null);
    this.#status.set('editing');
  }

  // ---- export ------------------------------------------------------------

  readonly #artifact = signal<SlefExportArtifact | null>(null);
  readonly #generating = signal(false);
  readonly #capability = signal<DeliveryCapability | null>(null);
  readonly #delivery = signal<Readonly<Partial<Record<DeliveryAction, DeliveryOutcome>>>>({});

  readonly #invalidated = signal(false);

  readonly artifact = this.#artifact.asReadonly();
  /** True when the last artifact was dropped because the build moved on. */
  readonly artifactInvalidated = this.#invalidated.asReadonly();
  readonly generating = this.#generating.asReadonly();
  readonly capability = this.#capability.asReadonly();
  readonly delivery = this.#delivery.asReadonly();

  setGenerating(generating: boolean): void {
    this.#generating.set(generating);
  }

  /** Holds at most one artifact, and forgets the previous delivery results. */
  setArtifact(artifact: SlefExportArtifact | null): void {
    this.#artifact.set(artifact);
    this.#delivery.set({});
    if (artifact !== null) {
      this.#invalidated.set(false);
    }
  }

  /**
   * Drops the artifact the moment the build it described stopped being current.
   *
   * Synchronous, and called before any delivery reads it, so a Commander cannot
   * copy a payload for a build they have already edited (export contract,
   * "Artifact lifecycle").
   */
  invalidateArtifactUnless(revision: number): void {
    const artifact = this.#artifact();
    if (artifact !== null && artifact.revision !== revision) {
      this.setArtifact(null);
      // Remembered, because an empty payload field with no explanation reads as
      // a broken export rather than as one that describes a build the Commander
      // has since edited.
      this.#invalidated.set(true);
    }
  }

  setCapability(capability: DeliveryCapability): void {
    this.#capability.set(capability);
  }

  /** Records one action's result. A failure never clears the artifact. */
  setDelivery(outcome: DeliveryOutcome): void {
    this.#delivery.update((current) => ({ ...current, [outcome.action]: outcome }));
  }

  // ---- layer -------------------------------------------------------------

  readonly #layer = signal<SlefLayer>('none');
  // The format the layer opens on: the one canvas 1c draws first and draws
  // selected. It is sticky afterwards, so a Commander who moved to the link
  // finds the link the next time they open it.
  readonly #exportMode = signal<SlefExportMode>('slef');

  readonly layer = this.#layer.asReadonly();
  readonly exportMode = this.#exportMode.asReadonly();

  openLayer(layer: SlefLayer): void {
    this.#layer.set(layer);
  }

  closeLayer(): void {
    this.#layer.set('none');
  }

  selectExportMode(mode: SlefExportMode): void {
    this.#exportMode.set(mode);
  }
}

/** The original string's size in UTF-8 bytes — the only measurement that gates. */
export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}
