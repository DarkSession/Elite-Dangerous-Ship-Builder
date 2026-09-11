import { Injectable, computed, inject, signal } from '@angular/core';
import type { MessageKey, MessageParams } from '../../i18n/locale-registry';
import { MessageService } from '../../i18n/message.service';

/** How urgently an event interrupts. */
export type AnnouncementUrgency = 'assertive' | 'polite';

/**
 * A request to announce something.
 *
 * `kind` is a stable application event id, never derived from translated text.
 * The outlet keys what it holds by the event rather than by its words, and two
 * languages saying one thing must not look like two events.
 *
 * There is no number here, and that is the contract. Every request is
 * announced. A caller that must not be heard twice decides that before it calls
 * — see the two silences below.
 */
export interface AnnouncementRequest {
  readonly kind: string;
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
 * Every request is announced. A reader is told about the second of two things
 * as reliably as the first, which is the whole of 011/FR-009 and the one thing
 * a policy holding a number could not promise: a caller supplying a number that
 * did not rise silenced itself, and silence reports nothing.
 *
 * **The two silences are the caller's, because only the caller has the facts.**
 *
 *   * **A replay.** One occurrence is announced once. An announcement published
 *     from an effect resolves its message inside `untracked`, and that effect
 *     reads the message catalogue nowhere else, so a committed locale does not
 *     re-run it. What the effect does depend on is the caller's to choose, and
 *     it has to be the event: a trigger rebuilt on every recompute re-runs the
 *     effect whether or not a word moved, so the ship catalogue reads its count
 *     as a number. Where an effect must watch more than its own event, the
 *     caller remembers what it announced — `src/app/app.ts` and the restart
 *     overlay. `scripts/check-interface-foundations.mjs` holds the half of this
 *     that is visible in the text of a call; the trigger's own identity is not,
 *     and is held by each caller's unit suite.
 *   * **An outcome to a withdrawn question.** Whether the request an outcome
 *     belongs to is still the one a Commander is waiting for is a fact its store
 *     holds — `SlefStore.isCurrent`, `LoadoutImportStore.isCurrent` — and not
 *     one this service can read from a number handed to it. A Commander who
 *     cancels without starting another leaves any high-water mark where it
 *     stands, so a late outcome would be behind nothing. A withdrawn question
 *     whose answer is already on disk is still answered: see the batch import.
 *
 * Two things stay silent here and are not the caller's:
 *
 *   * **initial content** — it is discoverable in reading order, and announcing
 *     it means every page load starts by talking over the reader. Each screen
 *     holds its own first-run guard;
 *   * **unaffected values** — an outlet carries the change, not its neighbours.
 *
 * Visible feedback is a separate projection. Removing outlet text during a
 * locale switch replays nothing, and a later event resolves in the new
 * language.
 */
@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  readonly #messages = inject(MessageService);

  readonly #assertive = signal<SpokenEvent | null>(null);
  readonly #polite = signal<SpokenEvent | null>(null);

  /**
   * How many events this session has announced.
   *
   * The whole of the policy's memory, and it exists for the outlet rather than
   * for the policy. Two events can be spoken in identical words, and a live
   * region announces a change to what it holds — so the outlet rebuilds by this
   * number and a reader hears the second one.
   *
   * It never goes backwards while the application runs, `clearOutlets()`
   * included: a number reused after a locale switch would hand the outlet an
   * event it has already drawn. Only `reset()` puts it back to nothing, and a
   * reset is the whole policy starting again.
   */
  #sequence = 0;

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

  /** Announces an event. */
  announce(request: AnnouncementRequest): void {
    this.#sequence += 1;

    const spoken: SpokenEvent = {
      identity: `${request.kind}|${this.#sequence}|${request.urgency}`,
      text: this.#messages.message(request.messageKey, request.params),
    };
    if (request.urgency === 'assertive') {
      this.#assertive.set(spoken);
    } else {
      this.#polite.set(spoken);
    }
  }

  /**
   * Empties the outlets.
   *
   * For a locale switch, where the old translated text must go. Nothing in the
   * application calls it: a committed locale leaves the outlets holding the
   * last event in the language it was spoken in, which no reader is told about
   * again and which the next event replaces. The sequence is untouched here,
   * because it identifies events to the outlet and reusing a number would hand
   * it one it has already drawn.
   */
  clearOutlets(): void {
    this.#assertive.set(null);
    this.#polite.set(null);
  }

  /** Forgets everything. Test support and full application reset only. */
  reset(): void {
    this.clearOutlets();
    this.#sequence = 0;
  }
}
