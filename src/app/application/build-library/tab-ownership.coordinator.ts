import { Injectable, inject, signal } from '@angular/core';
import { BroadcastChannelAdapter } from '../../platform/browser/broadcast-channel.adapter';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { TabDescriptorRepository } from '../../platform/storage/tab-descriptor.repository';

/**
 * Which working record this page owns.
 *
 * A duplicated tab is the problem this exists for. `sessionStorage` is copied
 * into the duplicate, so both pages wake up believing they own the same
 * working record — and both would autosave to it, each overwriting the other's
 * build with no warning and no conflict to resolve.
 *
 * The handshake is deliberately one-sided: on start, a page announces the id
 * it intends to use along with a nonce that exists only in memory. A page that
 * hears its own id announced by a *different* nonce knows a copy of it is
 * live, and the later claimant forks — a new id, and the current build copied
 * into it — before either page next autosaves.
 *
 * The nonce is never a record identity and is never stored. It answers exactly
 * one question: "is that other page me?"
 */
@Injectable({ providedIn: 'root' })
export class TabOwnershipCoordinator {
  readonly #tab = inject(TabDescriptorRepository);
  readonly #channel = inject(BroadcastChannelAdapter);
  readonly #uuid = inject(UuidAdapter);

  /** This page's own identity for the run. Ephemeral, by design. */
  readonly pageNonce = this.#uuid.create();

  readonly #workingRecordId = signal<string | null>(null);

  /** Called when this page has had to fork, so the caller can copy the build. */
  #onFork: ((previousId: string, nextId: string) => void) | null = null;

  readonly workingRecordId = this.#workingRecordId.asReadonly();

  /**
   * Claims a working record for this page, restoring the previous one if there
   * is one, and announces the claim to any sibling page.
   */
  claim(): string {
    const restored = this.#tab.read()?.workingRecordId ?? null;
    const id = restored ?? this.#uuid.create();

    this.#workingRecordId.set(id);
    this.#tab.write(id);
    this.#channel.post({ kind: 'working-claim', workingRecordId: id, pageNonce: this.pageNonce });

    return id;
  }

  /** Registers what to do when this page forks: copy the build into the new id. */
  onFork(handler: (previousId: string, nextId: string) => void): void {
    this.#onFork = handler;
  }

  /** Listens for a sibling page claiming the same record. Returns an unsubscribe. */
  listen(): () => void {
    return this.#channel.subscribe((message) => {
      if (message.kind !== 'working-claim') {
        return;
      }
      if (message.pageNonce === this.pageNonce) {
        return;
      }
      if (message.workingRecordId !== this.#workingRecordId()) {
        return;
      }

      // Another live page announced the id this page holds. The page that
      // hears the announcement is the earlier one still running, so it is the
      // one that steps aside — the announcing page has just started and has
      // nothing to preserve yet.
      this.fork();
    });
  }

  /**
   * Moves this page onto a fresh working record.
   *
   * The previous id is left alone: whatever is in it belongs to the other page
   * now, and nothing is deleted to make room.
   */
  fork(): string {
    const previous = this.#workingRecordId();
    const next = this.#uuid.create();

    this.#workingRecordId.set(next);
    this.#tab.write(next);
    if (previous !== null) {
      this.#onFork?.(previous, next);
    }

    return next;
  }
}
