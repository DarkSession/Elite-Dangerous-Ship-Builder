import { Injectable, Injector, effect, inject, signal } from '@angular/core';
import { toBuildSnapshotV1 } from '../../domain/ships/build/build-snapshot.serializer';
import { ClockAdapter } from '../../platform/browser/clock.adapter';
import { PageLifecycleAdapter } from '../../platform/browser/page-lifecycle.adapter';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import { ActiveBuildStore } from '../active-build/active-build.store';

/**
 * How long edits are gathered before one write.
 *
 * Long enough that a burst of edits is one `setItem` rather than twenty, short
 * enough that a Commander who closes the tab a moment after an edit still has
 * it. The lifecycle flush covers the rest.
 */
const COALESCE_MS = 400;

/**
 * Keeping this page's build recoverable.
 *
 * Autosave writes to exactly one key — an unnamed record this page minted or
 * took over — and never to a named save. Naming a build is a decision;
 * autosaving over something a Commander deliberately saved would take that
 * decision away from them, silently, which is the loss the withdrawn
 * replacement question existed to prevent (persistence contract, "Autosaved
 * records"; FR-008, ruled 2026-08-25).
 *
 * Two rules follow from that and are enforced here rather than assumed. Nothing
 * is written while the store is clean, so taking a record over does not rewrite
 * it and does not restart the seven days it is counting down. And a record whose
 * stored `kind` is `named` is refused as a target whatever this page believes it
 * is holding — a record named in another tab, or written before this rule
 * existed, cannot be reached by a coalesced edit.
 *
 * Nothing refuses a write because many records already exist. The count limit
 * that once did was replaced on 2026-08-25 by the seven-day expiry of unnamed
 * records, which removes what nobody came back to rather than refusing what a
 * Commander is working on now (FR-013).
 *
 * Every failure state here is a persistence state, never a build state: a
 * blocked store, a full one or a failed write changes what the status says and
 * changes nothing about whether the build can be edited (FR-014).
 */
@Injectable({ providedIn: 'root' })
export class AutosaveService {
  readonly #active = inject(ActiveBuildStore);
  readonly #records = inject(LocalRecordRepository);
  readonly #lifecycle = inject(PageLifecycleAdapter);
  readonly #uuid = inject(UuidAdapter);
  readonly #clock = inject(ClockAdapter);
  // Captured at construction so `start()` can create its watcher from anywhere.
  readonly #injector = inject(Injector);

  #timer: ReturnType<typeof setTimeout> | null = null;
  #createdAt: string | null = null;

  /** Paused after the record this tab owns is discarded somewhere else. */
  readonly #paused = signal(false);
  readonly paused = this.#paused.asReadonly();

  /**
   * Starts saving this tab's build.
   *
   * Returns an unsubscribe, because the lifecycle listener outlives any one
   * screen and a second registration would flush twice.
   */
  start(): () => void {
    const stopLifecycle = this.#lifecycle.onFlush(() => this.flush());

    const watcher = effect(
      () => {
        // Reading the revision is what subscribes: the loadout is edited in
        // place, so the object reference alone would never change.
        this.#active.revision();
        this.#active.loadout();
        this.#schedule();
      },
      { injector: this.#injector },
    );

    return () => {
      stopLifecycle();
      watcher.destroy();
      this.#clearTimer();
    };
  }

  /**
   * Pauses saving because the record was discarded elsewhere.
   *
   * Deliberately requires an explicit resume. A Commander who discarded a
   * build in another tab meant it; recreating it here behind their back would
   * undo a decision they made on purpose.
   */
  pauseAfterExternalDelete(): void {
    this.#paused.set(true);
    this.#clearTimer();
    this.#active.setPersistence('record-deleted-externally');
  }

  /** Resumes after an explicit request, writing the current build immediately. */
  resume(): void {
    this.#paused.set(false);
    this.flush();
  }

  /** Writes now, rather than at the end of the coalescing window. */
  flush(): void {
    this.#clearTimer();

    if (this.#paused()) {
      return;
    }

    const loadout = this.#active.loadout();
    if (loadout === null) {
      return;
    }

    // Nothing is owed while the build matches what a record already holds. This
    // is what makes opening a record free: taking one over writes nothing, so it
    // does not restart the expiry the entry is counting down (FR-013).
    if (!this.#active.dirty()) {
      return;
    }

    const recordId = this.#allocate();
    if (recordId === null) {
      return;
    }

    // A named record is never an autosave target, whatever this page is
    // holding. The check reads the stored record rather than this page's belief
    // about it, so a record named in another tab is covered too (FR-008).
    if (this.#records.isNamed(recordId)) {
      return;
    }

    this.#active.setPersistence('saving');
    const now = this.#clock.timestamp();
    this.#createdAt ??= now;

    const written = this.#records.write({
      id: recordId,
      kind: 'working',
      revisionId: this.#uuid.create(),
      createdAt: this.#createdAt,
      modifiedAt: now,
      name: null,
      note: null,
      validation: this.#active.validation() ?? { valid: false, complete: false },
      build: toBuildSnapshotV1(loadout),
      sourceNamed: this.#active.sourceNamed(),
    });

    if (written.ok) {
      this.#active.setPersistence('saved');
      return;
    }

    this.#active.setPersistence(
      written.code === 'quota'
        ? 'quota-full'
        : written.code === 'blocked'
          ? 'unavailable'
          : 'write-failed',
    );
  }

  /** Copies the current build into a freshly forked record. */
  adoptForkedRecord(): void {
    this.#createdAt = null;
    this.flush();
  }

  /**
   * The record this write belongs in, minting or taking one over if need be.
   *
   * The take-over is the whole of the reuse rule (clarification 2026-08-25): a
   * build identical to an unnamed record already stored is that record, not a
   * second copy of it. Creating the same stock hull twice, or opening one link
   * twice, therefore leaves one entry rather than two — and because the record
   * already holds this exact state, the take-over marks the build saved instead
   * of writing, so it does not touch `modifiedAt` and does not restart the
   * seven days.
   */
  #allocate(): string | null {
    const held = this.#active.autosaveRecordId();
    if (held !== null) {
      return held;
    }

    const fingerprint = this.#active.fingerprint();
    const identical = fingerprint === null ? null : this.#records.findUnnamedMatching(fingerprint);
    if (identical !== null) {
      this.#active.setAutosaveRecordId(identical);
      this.#active.markSaved(null);
      this.#active.setPersistence('saved');
      return null;
    }

    const minted = this.#uuid.create();
    this.#createdAt = null;
    this.#active.setAutosaveRecordId(minted);
    return minted;
  }

  #schedule(): void {
    if (this.#paused() || this.#active.loadout() === null) {
      return;
    }
    this.#clearTimer();
    this.#timer = setTimeout(() => this.flush(), COALESCE_MS);
  }

  #clearTimer(): void {
    if (this.#timer !== null) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }
}
