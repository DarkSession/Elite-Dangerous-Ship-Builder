import { Injector, effect, signal } from '@angular/core';
import { ClockAdapter } from '../../platform/browser/clock.adapter';
import { PageLifecycleAdapter } from '../../platform/browser/page-lifecycle.adapter';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import type { WorkingRecordSubject } from './working-record.port';

/**
 * How long edits are gathered before one write.
 *
 * Long enough that a burst of edits is one `setItem` rather than twenty, short
 * enough that a Commander who closes the tab a moment after an edit still has
 * it. The lifecycle flush covers the rest.
 */
const COALESCE_MS = 400;

/**
 * Keeping one tool's open work recoverable.
 *
 * Autosave writes to exactly one key — an unnamed record this page minted or
 * took over — and never to a named save. Naming what is open is a decision;
 * autosaving over something a Commander deliberately saved would take that
 * decision away from them, silently, which is the loss the withdrawn
 * replacement question existed to prevent (persistence contract, "Autosaved
 * records"; 001/FR-008, ruled 2026-08-25).
 *
 * Two rules follow from that and are enforced here rather than assumed. Nothing
 * is written while the subject is clean, so taking a record over does not
 * rewrite it and does not restart the seven days it is counting down. And a
 * record whose stored `kind` is `named` is refused as a target whatever this
 * page believes it is holding — a record named in another tab, or written
 * before this rule existed, cannot be reached by a coalesced edit.
 *
 * Nothing refuses a write because many records already exist. The count limit
 * that once did was replaced on 2026-08-25 by the seven-day expiry of unnamed
 * records, which removes what nobody came back to rather than refusing what a
 * Commander is working on now (001/FR-013).
 *
 * Every failure state here is a persistence state, never a state of the work: a
 * blocked store, a full one or a failed write changes what the status says and
 * changes nothing about whether the build or the loadout can be edited
 * (001/FR-014).
 *
 * One class, one subject. Each tool provides its own instance, because a page
 * holds a build and a loadout at once and neither may be written into the
 * other's record.
 */
export class WorkingRecordAutosave {
  #timer: ReturnType<typeof setTimeout> | null = null;
  #createdAt: string | null = null;

  /** Paused after the record this tab owns is discarded somewhere else. */
  readonly #paused = signal(false);
  readonly paused = this.#paused.asReadonly();

  readonly #subject: WorkingRecordSubject;
  readonly #records: LocalRecordRepository;
  readonly #lifecycle: PageLifecycleAdapter;
  readonly #uuid: UuidAdapter;
  readonly #clock: ClockAdapter;
  /** Captured at construction so `start()` can create its watcher from anywhere. */
  readonly #injector: Injector;

  protected constructor(
    subject: WorkingRecordSubject,
    records: LocalRecordRepository,
    lifecycle: PageLifecycleAdapter,
    uuid: UuidAdapter,
    clock: ClockAdapter,
    injector: Injector,
  ) {
    this.#subject = subject;
    this.#records = records;
    this.#lifecycle = lifecycle;
    this.#uuid = uuid;
    this.#clock = clock;
    this.#injector = injector;
  }

  /** Which tool's work this keeps. Read by whoever asks about a record. */
  get tool(): WorkingRecordSubject['tool'] {
    return this.#subject.tool;
  }

  /**
   * Starts saving this tab's work.
   *
   * Returns an unsubscribe, because the lifecycle listener outlives any one
   * screen and a second registration would flush twice.
   */
  start(): () => void {
    const stopLifecycle = this.#lifecycle.onFlush(() => this.flush());

    const watcher = effect(
      () => {
        // Reading the fingerprint is what subscribes: it is derived from the
        // revision and from the work itself, which is edited in place, so the
        // object reference alone would never change.
        this.#subject.revision();
        this.#subject.fingerprint();
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
   * Deliberately requires an explicit resume. A Commander who discarded work in
   * another tab meant it; recreating it here behind their back would undo a
   * decision they made on purpose.
   */
  pauseAfterExternalDelete(): void {
    this.#paused.set(true);
    this.#clearTimer();
    this.#subject.setPersistence('record-deleted-externally');
  }

  /** Resumes after an explicit request, writing the current state immediately. */
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

    const payload = this.#subject.payload();
    if (payload === null) {
      return;
    }

    // Nothing is owed while the work matches what a record already holds. This
    // is what makes opening a record free: taking one over writes nothing, so it
    // does not restart the expiry the entry is counting down (001/FR-013).
    if (!this.#subject.dirty()) {
      return;
    }

    const recordId = this.#allocate();
    if (recordId === null) {
      return;
    }

    // A named record is never an autosave target, whatever this page is
    // holding. The check reads the stored record rather than this page's belief
    // about it, so a record named in another tab is covered too (001/FR-008).
    if (this.#records.isNamed(recordId)) {
      return;
    }

    this.#subject.setPersistence('saving');
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
      sourceNamed: this.#subject.sourceNamed(),
      payload,
    });

    if (written.ok) {
      this.#subject.setPersistence('saved');
      return;
    }

    this.#subject.setPersistence(
      written.code === 'quota'
        ? 'quota-full'
        : written.code === 'blocked'
          ? 'unavailable'
          : 'write-failed',
    );
  }

  /** Copies the current state into a freshly forked record. */
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
   * already holds this exact state, the take-over marks the work saved instead
   * of writing, so it does not touch `modifiedAt` and does not restart the
   * seven days.
   *
   * A record of the other tool is never a match. The fingerprint is a build's
   * or a loadout's, and the two hold different content.
   */
  #allocate(): string | null {
    const held = this.#subject.autosaveRecordId();
    if (held !== null) {
      return held;
    }

    const fingerprint = this.#subject.fingerprint();
    const identical =
      fingerprint === null ? null : this.#records.findUnnamedMatching(fingerprint, this.tool);
    if (identical !== null) {
      this.#subject.setAutosaveRecordId(identical);
      this.#subject.markSaved(null);
      this.#subject.setPersistence('saved');
      return null;
    }

    const minted = this.#uuid.create();
    this.#createdAt = null;
    this.#subject.setAutosaveRecordId(minted);
    return minted;
  }

  #schedule(): void {
    if (this.#paused() || this.#subject.fingerprint() === null) {
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
