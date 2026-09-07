import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { RecordTool } from '../../domain/records/local-record';
import { EDNB_BROADCAST_CHANNEL } from '../storage/storage-keys';

/** What one page tells the others about its persistence state. */
export type PersistenceBroadcast =
  | {
      readonly kind: 'working-claim';
      /**
       * Which tool the claimed record belongs to.
       *
       * Absent from a claim made by a page running a version that held one
       * record per tab, which was the ship tool's. A reader treats it as that
       * rather than as a claim on nothing (017/FR-010).
       */
      readonly tool?: RecordTool;
      readonly workingRecordId: string;
      readonly pageNonce: string;
    }
  | {
      /**
       * This page has stopped writing to the record it claimed for one tool.
       *
       * What a sibling page needs in order to stop protecting that record from
       * the expiry sweep: a claim it never hears the end of would keep a record
       * nobody is working on alive for as long as the claiming page runs
       * (001/FR-013).
       */
      readonly kind: 'working-release';
      readonly tool?: RecordTool;
      readonly pageNonce: string;
    }
  | { readonly kind: 'record-written'; readonly recordId: string; readonly revisionId: string }
  | { readonly kind: 'record-deleted'; readonly recordId: string };

/**
 * Cross-page messaging for persistence, with a working no-op fallback.
 *
 * Two pages of this application in one browser have to agree on which of them
 * owns a working record, and have to know when the other rewrites a named one.
 * `BroadcastChannel` is how they say so.
 *
 * Where the API is absent the adapter degrades to silence rather than failing:
 * a browser without it still gets a usable application, it simply cannot
 * negotiate with its siblings. Nothing here is a correctness guarantee on its
 * own — the revision precondition on every named write is (persistence
 * contract, "Named operations and conflicts").
 */
@Injectable({ providedIn: 'root' })
export class BroadcastChannelAdapter {
  readonly #channel = createChannel(inject(DOCUMENT).defaultView);

  /** Whether messages actually reach other pages. */
  get available(): boolean {
    return this.#channel !== null;
  }

  /** Tells every other page something. Silent when the API is unavailable. */
  post(message: PersistenceBroadcast): void {
    this.#channel?.postMessage(message);
  }

  /** Listens until the returned function is called. */
  subscribe(listener: (message: PersistenceBroadcast) => void): () => void {
    const channel = this.#channel;
    if (!channel) {
      return () => {};
    }

    const handler = (event: MessageEvent<unknown>) => {
      const message = event.data;
      // Another application on this origin may share the channel name; a
      // message that is not one of ours is not interpreted.
      if (isPersistenceBroadcast(message)) {
        listener(message);
      }
    };

    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
  }
}

function createChannel(view: Window | null): BroadcastChannel | null {
  // Read through an index rather than a property: `Window` in the DOM lib does
  // not declare the constructor, and a browser that lacks it must be a runtime
  // answer rather than a compile error.
  const constructor = (view as unknown as { BroadcastChannel?: typeof BroadcastChannel } | null)
    ?.BroadcastChannel;
  if (typeof constructor !== 'function') {
    return null;
  }
  try {
    return new constructor(EDNB_BROADCAST_CHANNEL);
  } catch {
    return null;
  }
}

/** Whether a received message is one this application recognises. */
export function isPersistenceBroadcast(value: unknown): value is PersistenceBroadcast {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const message = value as { kind?: unknown };
  return (
    message.kind === 'working-claim' ||
    message.kind === 'working-release' ||
    message.kind === 'record-written' ||
    message.kind === 'record-deleted'
  );
}
