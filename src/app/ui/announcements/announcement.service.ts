import { Injectable, computed, inject, signal } from '@angular/core';
import type { MessageKey, MessageParams } from '../../i18n/locale-registry';
import { MessageService } from '../../i18n/message.service';

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

/**
 * What an outlet holds, and which event put it there.
 *
 * The identity travels with the text because two different events can be
 * spoken in the same words — two navigations that both failed say "The screen
 * could not be opened." A live region announces a change to its contents, and
 * the same sentence written over itself is not a change: the second event would
 * be the silence the policy exists to remove. The outlet uses the identity to
 * rebuild what it holds, so a genuinely new event is a new node in the region
 * whether or not the words moved.
 */
export interface SpokenEvent {
  readonly identity: string;
  readonly text: string;
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

  readonly #assertive = signal<SpokenEvent | null>(null);
  readonly #polite = signal<SpokenEvent | null>(null);

  /** The highest revision seen per (kind, urgency), for staleness. */
  readonly #latestRevision = new Map<string, number>();

  /** The identity of the last event published to each outlet. */
  readonly #published = new Map<AnnouncementUrgency, string>();

  /** What each outlet is saying, for a reader of text rather than of nodes. */
  readonly assertive = computed(() => this.#assertive()?.text ?? '');
  readonly polite = computed(() => this.#polite()?.text ?? '');

  /** The same, with the event that put it there, which the outlet renders by. */
  readonly assertiveEvent = this.#assertive.asReadonly();
  readonly politeEvent = this.#polite.asReadonly();

  readonly state = computed<AnnouncementState>(() => ({
    assertive: this.assertive(),
    polite: this.polite(),
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

    const spoken: SpokenEvent = {
      identity,
      text: this.#messages.message(request.messageKey, request.params),
    };
    if (request.urgency === 'assertive') {
      this.#assertive.set(spoken);
    } else {
      this.#polite.set(spoken);
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
    this.#assertive.set(null);
    this.#polite.set(null);
  }

  /** Forgets everything. Test support and full application reset only. */
  reset(): void {
    this.clearOutlets();
    this.#latestRevision.clear();
    this.#published.clear();
  }
}
