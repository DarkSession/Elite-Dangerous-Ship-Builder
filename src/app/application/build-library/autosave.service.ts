import { Injectable, Injector, effect, inject, signal } from '@angular/core';
import { toBuildSnapshotV1 } from '../../domain/build/build-snapshot.serializer';
import { PageLifecycleAdapter } from '../../platform/browser/page-lifecycle.adapter';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { RetentionService } from './retention.service';
import { TabOwnershipCoordinator } from './tab-ownership.coordinator';

/**
 * How long edits are gathered before one write.
 *
 * Long enough that a burst of edits is one `setItem` rather than twenty, short
 * enough that a Commander who closes the tab a moment after an edit still has
 * it. The lifecycle flush covers the rest.
 */
const COALESCE_MS = 400;

/**
 * Keeping this tab's build recoverable.
 *
 * Autosave writes to exactly one key — this tab's own working record — and
 * never to a named save. Naming a build is a decision; autosaving over
 * something a Commander deliberately saved would take that decision away from
 * them (persistence contract, "Working records").
 *
 * Every failure state here is a persistence state, never a build state: a
 * blocked store, a full one or a failed write changes what the status says and
 * changes nothing about whether the build can be edited (FR-014).
 */
@Injectable({ providedIn: 'root' })
export class AutosaveService {
  readonly #active = inject(ActiveBuildStore);
  readonly #records = inject(LocalRecordRepository);
  readonly #retention = inject(RetentionService);
  readonly #ownership = inject(TabOwnershipCoordinator);
  readonly #lifecycle = inject(PageLifecycleAdapter);
  readonly #uuid = inject(UuidAdapter);
  // Captured at construction so `start()` can create its watcher from anywhere.
  readonly #injector = inject(Injector);

  #timer: ReturnType<typeof setTimeout> | null = null;
  #createdAt: string | null = null;

  /** Paused after the record this tab owns is discarded somewhere else. */
  readonly #paused = signal(false);
  readonly paused = this.#paused.asReadonly();

  /** The instant stamped on the next write. Injected so tests are not timing-dependent. */
  now: () => string = () => new Date().toISOString();

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
    const recordId = this.#ownership.workingRecordId();
    if (loadout === null || recordId === null) {
      return;
    }

    const verdict = this.#retention.mayWrite(recordId);
    if (!verdict.allowed) {
      // No write and no deletion. The build stays in memory and the library
      // offers the Commander the list to choose from (FR-013).
      this.#active.setPersistence('retention-limit');
      return;
    }

    this.#active.setPersistence('saving');
    const now = this.now();
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

  /** Copies the current build into a freshly forked working record. */
  adoptForkedRecord(): void {
    this.#createdAt = null;
    this.flush();
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
