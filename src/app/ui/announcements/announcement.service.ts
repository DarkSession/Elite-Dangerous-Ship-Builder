import { Injectable, computed, inject, signal } from '@angular/core';
import type { MessageKey } from '../../i18n/locale-registry';
import { MessageService, type MessageParams } from '../../i18n/message.service';

/** How urgently an event interrupts. */
export type AnnouncementUrgency = 'assertive' | 'polite';

/**
 * A request to announce something.
 *
 * `kind` is a stable application event id, never derived from translated text —
 * deduplication must survive a locale switch, and two languages would otherwise
 * look like two different events.
 *
 * `revision` is the revision of the source the event describes. It is what lets
 * a stale result be recognised and dropped: an async outcome that arrives after
 * its source has moved on describes something that is no longer on screen.
 */
export interface AnnouncementRequest {
  readonly kind: string;
  readonly revision: number;
  readonly urgency: AnnouncementUrgency;
  readonly messageKey: MessageKey;
  readonly params?: MessageParams;
}

/** What an outlet currently holds. */
export interface AnnouncementState {
  readonly assertive: string;
  readonly polite: string;
}

/**
 * The announcement policy.
 *
 * Publishes at most one message per outlet, and only for an event that is
 * genuinely new. The dedupe identity is `(kind, revision, urgency)`.
 *
 * What is deliberately silent:
 *
 *   * **initial content** — it is discoverable in reading order, and announcing
 *     it means every page load starts by talking over the reader;
 *   * **an unchanged or replayed event** — same identity, nothing happened;
 *   * **a stale outcome** — its revision is behind what is presented, so it
 *     describes something that is no longer true;
 *   * **unaffected values** — an outlet carries the change, not its neighbours.
 *
 * Visible feedback is a separate projection. Removing outlet text during a
 * locale switch does not replay old events, and a genuinely new event
 * afterwards resolves in the new language.
 */
@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  readonly #messages = inject(MessageService);

  readonly #assertive = signal('');
  readonly #polite = signal('');

  /** The highest revision seen per (kind, urgency), for staleness. */
  readonly #latestRevision = new Map<string, number>();

  /** The identity of the last event published to each outlet. */
  readonly #published = new Map<AnnouncementUrgency, string>();

  readonly assertive = this.#assertive.asReadonly();
  readonly polite = this.#polite.asReadonly();

  readonly state = computed<AnnouncementState>(() => ({
    assertive: this.#assertive(),
    polite: this.#polite(),
  }));

  /**
   * Announces an event if the policy says it is worth interrupting for.
   *
   * Returns whether anything was published, which is what the tests assert
   * against — "it stayed silent" is as much a behaviour as "it spoke".
   */
  announce(request: AnnouncementRequest): boolean {
    const identity = `${request.kind}|${request.revision}|${request.urgency}`;
    const staleKey = `${request.kind}|${request.urgency}`;

    // Already said, for this exact source revision.
    if (this.#published.get(request.urgency) === identity) {
      return false;
    }

    // Behind what has already been announced for this event: a late arrival
    // describing a state the interface has moved past.
    const latest = this.#latestRevision.get(staleKey);
    if (latest !== undefined && request.revision < latest) {
      return false;
    }

    this.#latestRevision.set(staleKey, Math.max(latest ?? request.revision, request.revision));
    this.#published.set(request.urgency, identity);

    const text = this.#messages.message(request.messageKey, request.params);
    if (request.urgency === 'assertive') {
      this.#assertive.set(text);
    } else {
      this.#polite.set(text);
    }

    return true;
  }

  /**
   * Clears the outlets without forgetting what has been announced.
   *
   * Used on a locale switch: the old translated text must go, but clearing the
   * dedupe history would let every prior event replay itself in the new
   * language.
   */
  clearOutlets(): void {
    this.#assertive.set('');
    this.#polite.set('');
  }

  /** Forgets everything. Test support and full application reset only. */
  reset(): void {
    this.clearOutlets();
    this.#latestRevision.clear();
    this.#published.clear();
  }
}
