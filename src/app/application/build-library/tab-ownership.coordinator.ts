import { Injectable, Injector, effect, inject } from '@angular/core';
import { BroadcastChannelAdapter } from '../../platform/browser/broadcast-channel.adapter';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { TabDescriptorRepository } from '../../platform/storage/tab-descriptor.repository';
import { ActiveBuildStore } from '../active-build/active-build.store';

/**
 * Which record this page autosaves into, and nobody else does.
 *
 * A duplicated tab is the problem this exists for. `sessionStorage` is copied
 * into the duplicate, so both pages wake up believing they own the same
 * record — and both would autosave to it, each overwriting the other's build
 * with no warning and no conflict to resolve.
 *
 * The handshake is deliberately one-sided: a page announces the id it intends
 * to write to along with a nonce that exists only in memory. A page that hears
 * its own id announced by a *different* nonce knows a copy of it is live, and
 * the later claimant forks — a new id, and the current build copied into it —
 * before either page next autosaves.
 *
 * The nonce is never a record identity and is never stored. It answers exactly
 * one question: "is that other page me?"
 *
 * **Revised 2026-08-25.** The id itself belongs to `ActiveBuildStore`, which
 * writes it with everything else that says where a build came from, in one
 * commit. This coordinator does not hold a second copy of it: it persists it,
 * announces it and forks it. Two signals holding one identity is two places for
 * it to disagree, and the disagreement would be about which record a
 * Commander's next keystroke lands in.
 *
 * Two pages holding one *named* record open is not a collision and is not
 * announced here. Neither of them autosaves into it (FR-012).
 */
@Injectable({ providedIn: 'root' })
export class TabOwnershipCoordinator {
  readonly #tab = inject(TabDescriptorRepository);
  readonly #channel = inject(BroadcastChannelAdapter);
  readonly #uuid = inject(UuidAdapter);
  readonly #active = inject(ActiveBuildStore);
  readonly #injector = inject(Injector);

  /** This page's own identity for the run. Ephemeral, by design. */
  readonly pageNonce = this.#uuid.create();

  /** Called when this page has had to fork, so the caller can copy the build. */
  #onFork: ((previousId: string, nextId: string) => void) | null = null;

  /** The unnamed record this page autosaves into, or `null` while there is none. */
  readonly autosaveRecordId = this.#active.autosaveRecordId;

  /** The last id this page announced, so one id is not announced twice. */
  #announced: string | null = null;

  /**
   * Reads back the record this page was working from before a reload.
   *
   * It returns the id and nothing more. Whether that record becomes this page's
   * autosave target or is merely held depends on whether it turns out to be
   * named, and the record itself is the only honest answer to that — so the
   * decision belongs to whoever opens it, not to a flag written beside it here.
   */
  claim(): string | null {
    return this.#tab.read()?.workingRecordId ?? null;
  }

  /**
   * Starts persisting and announcing whatever record the store is holding.
   *
   * Returns an unsubscribe. Driven by the store rather than called at each
   * ingress, so a record taken over at commit, one minted by autosave and one
   * arrived at by forking are all announced by the same line of code.
   */
  track(): () => void {
    const watcher = effect(
      () => {
        const id = this.autosaveRecordId();
        if (id === null || id === this.#announced) {
          return;
        }
        this.#announced = id;
        this.#tab.write(id);
        this.#channel.post({
          kind: 'working-claim',
          workingRecordId: id,
          pageNonce: this.pageNonce,
        });
      },
      { injector: this.#injector },
    );

    return () => watcher.destroy();
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
      if (message.workingRecordId !== this.autosaveRecordId()) {
        return;
      }

      // Another live page announced the id this page writes to. The page that
      // hears the announcement is the earlier one still running, so it is the
      // one that steps aside — the announcing page has just started and has
      // nothing to preserve yet.
      this.fork();
    });
  }

  /**
   * Moves this page onto a fresh record.
   *
   * The previous id is left alone: whatever is in it belongs to the other page
   * now, and nothing is deleted to make room.
   */
  fork(): string {
    const previous = this.autosaveRecordId();
    const next = this.#uuid.create();

    this.#active.setAutosaveRecordId(next);
    if (previous !== null) {
      this.#onFork?.(previous, next);
    }

    return next;
  }
}
