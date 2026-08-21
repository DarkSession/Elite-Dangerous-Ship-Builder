import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { BroadcastChannelAdapter } from '../../platform/browser/broadcast-channel.adapter';
import { EDSB_RECORD_KEY_PREFIX, recordIdFromKey } from '../../platform/storage/storage-keys';

/**
 * Noticing that another page changed something.
 *
 * Two signals, because neither is sufficient alone: the `storage` event fires
 * in *other* tabs when one writes, and the broadcast covers the cases the
 * event does not describe well — a delete this page needs to react to
 * specifically, and browsers whose event detail is unreliable.
 *
 * What this deliberately does not do is patch a cached listing from the event.
 * The event says something changed; the authority on what it now says is
 * storage, and a handler that trusted the event's payload would eventually
 * show a Commander a version that was never stored (persistence contract).
 */
@Injectable({ providedIn: 'root' })
export class RecordInvalidationService {
  readonly #document = inject(DOCUMENT);
  readonly #channel = inject(BroadcastChannelAdapter);

  /** Increments whenever something owned by this application changed elsewhere. */
  readonly #revision = signal(0);

  readonly revision = this.#revision.asReadonly();

  /** Ids observed as deleted elsewhere, so a tab can pause its own autosave. */
  readonly #deleted = signal<readonly string[]>([]);
  readonly deleted = this.#deleted.asReadonly();

  /** Starts listening. Returns an unsubscribe. */
  listen(): () => void {
    const view = this.#document.defaultView;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && recordIdFromKey(event.key) === null) {
        return;
      }
      // A null key means the whole store was cleared, which is as much an
      // invalidation as a single write.
      if (event.key !== null && event.newValue === null) {
        this.#markDeleted(recordIdFromKey(event.key));
      }
      this.#invalidate();
    };

    view?.addEventListener('storage', onStorage);

    const unsubscribe = this.#channel.subscribe((message) => {
      if (message.kind === 'record-deleted') {
        this.#markDeleted(message.recordId);
      }
      if (message.kind === 'record-deleted' || message.kind === 'record-written') {
        this.#invalidate();
      }
    });

    return () => {
      view?.removeEventListener('storage', onStorage);
      unsubscribe();
    };
  }

  /** Announces this page's own write, so siblings re-read rather than assume. */
  announceWrite(recordId: string, revisionId: string): void {
    this.#channel.post({ kind: 'record-written', recordId, revisionId });
  }

  announceDelete(recordId: string): void {
    this.#channel.post({ kind: 'record-deleted', recordId });
  }

  /** Forgets a delete once the Commander has been told about it. */
  acknowledgeDeleted(recordId: string): void {
    this.#deleted.update((ids) => ids.filter((id) => id !== recordId));
  }

  /** The key prefix this service watches. Exposed for tests and diagnostics. */
  get watchedPrefix(): string {
    return EDSB_RECORD_KEY_PREFIX;
  }

  #invalidate(): void {
    this.#revision.update((revision) => revision + 1);
  }

  #markDeleted(recordId: string | null): void {
    if (recordId === null) {
      return;
    }
    this.#deleted.update((ids) => (ids.includes(recordId) ? ids : [...ids, recordId]));
  }
}
