import { Injectable, computed, signal } from '@angular/core';
import {
  SLEF_IMPORT_LIMIT_BYTES,
  type SlefImportDraft,
  type SlefImportFailure,
  type SlefImportStatus,
  type SlefRequestToken,
} from '../../domain/slef/slef-import.models';
import type {
  DeliveryAction,
  DeliveryCapability,
  DeliveryOutcome,
  SlefExportArtifact,
} from '../../domain/slef/slef-export.models';

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

  /** Records an edit. A newer edit clears a failure that described older text. */
  setDraft(text: string): void {
    this.#draftText.set(text);
    this.#failure.set(null);
    this.#ending.set(null);
    this.#status.set('editing');
  }

  clearDraft(): void {
    this.#draftText.set('');
    this.#failure.set(null);
    this.#ending.set(null);
    this.#status.set('editing');
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
  readonly #exportMode = signal<SlefExportMode>('link');

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
