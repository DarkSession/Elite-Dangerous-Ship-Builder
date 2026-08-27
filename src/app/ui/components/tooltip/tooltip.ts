import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/**
 * A short gloss on the word beside it, drawn when a reader asks for it.
 *
 * The reference canvases hang this kind of gloss on a `title` attribute or a
 * `data-tip`. Neither is built here. A `title` cannot be styled, cannot be
 * reached by touch, is announced inconsistently and disappears the moment the
 * pointer moves — it is not a tooltip so much as the absence of one. This is
 * the system's own: a real element, drawn from the token layer, reachable by
 * every input the application supports.
 *
 * ## Why the gloss is never actually hidden
 *
 * The tip is in the accessibility tree at all times, related to its trigger by
 * `aria-describedby`, whether or not it is currently drawn. So what the control
 * governs is whether the gloss is *drawn*, never whether it is *available*:
 * hover-only meaning is unreachable by touch (011 FR-006), and a reader who is
 * told the interface rather than shown it never has to find a control to hear
 * this. `aria-expanded` says which of the two the trigger is in, so the visual
 * state is programmatically determinable rather than carried by visibility
 * alone (011 FR-010).
 *
 * The native `button` role and that permanent description are also what carry
 * the fact that there is more here to read. The dotted rule under the word is
 * an affordance and nothing more — a line style cannot be the sole carrier of
 * meaning any more than a colour can (011 FR-010, and the semantics contract's
 * "line style" clause).
 *
 * ## How it opens, and how it closes
 *
 * A hover, a focus, and a press. A press because touch has no hover at all, and
 * a tip only a mouse could reach would be exactly the `title` this component
 * exists to replace. Hover is admitted only from a real mouse (`pointerType`):
 * a tap fires `pointerenter` too, and admitting it would open the tip and let
 * the `click` that follows shut it again, so a touch could never open one.
 *
 * A hover and a focus last exactly as long as they do. A press *pins*, and
 * clears the other two so that it is pinning rather than racing them — so a
 * press opens a closed tip, keeps a hovered one after the pointer moves on, and
 * a second press puts it away, whichever pointer it came from.
 *
 * ## Dismissible, hoverable, persistent
 *
 * Success criterion 1.4.13, which is not one of the seven keyboard criteria the
 * constitution excludes and so applies in full. Each of its three parts is a
 * decision here rather than a consequence:
 *
 * - **dismissible.** `Escape` is listened for on the *document*, not on this
 *   host. A tip opened by hover alone leaves the focus wherever it was, so a
 *   host listener would never see the key — the one case the criterion exists
 *   for. {@link dismiss} ignores the key unless this tip is the one on screen,
 *   so a tooltip elsewhere on the page is not quietly poisoned by it.
 * - **hoverable.** The bubble stands off the trigger by a gap, and the gap is
 *   bridged by the bubble's own `::before` — see the stylesheet. Being a child
 *   of the host is not enough on its own: `pointerleave` fires on geometry, not
 *   on parentage, so an unbridged gap collapses the tip just as the pointer
 *   sets off to read it.
 * - **persistent.** Nothing times out. It closes when the pointer leaves, when
 *   focus leaves, on the second press, or on `Escape`.
 */
@Component({
  selector: 'edsb-tooltip',
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut()',
    '(document:keydown.escape)': 'dismiss()',
  },
})
export class Tooltip {
  /** The trigger's visible text — the word the tip is a gloss on. */
  readonly label = input<string>('');

  /**
   * The trigger is a mark rather than a word.
   *
   * The reference draws some of these glosses on an icon: a route mark on a
   * module row has no word under it, and the sentence saying what the mark
   * means is already on the row for a reader. So the caller projects the mark
   * as content, hides the whole control from the accessibility tree, and this
   * takes it out of the tab order and drops the description — a tip that is
   * only a way to *see* a sentence the row already carries must not announce
   * that sentence a second time. The trigger takes the dense target floor with
   * it, because the mark is one of the chips the reference draws small.
   */
  readonly presentational = input(false);

  /** What that word is shorthand for. Always available; drawn on request. */
  readonly tip = input.required<string>();

  /**
   * Drawn open from the start.
   *
   * For a preview or a test that needs the open presentation without a
   * pointer. A press still closes it, because the input seeds the state rather
   * than pinning it.
   */
  readonly open = input(false);

  readonly tipId = relationId('tooltip');

  /**
   * A press, which is the only way in that touch has.
   *
   * Seeded from {@link open} rather than read alongside it, so that a press on
   * a tip that opened itself shuts it. Read alongside, the input would go on
   * asserting itself and the trigger would be a control that does nothing.
   */
  readonly #pressed = linkedSignal(() => this.open());
  /** A real mouse over the host or its bubble. */
  readonly #hovered = signal(false);
  /** Focus inside the host, which a press clears so the two do not fight. */
  readonly #focused = signal(false);
  /** `Escape`, until every reason this tip was open has gone. */
  readonly #dismissed = signal(false);

  /** Whether the gloss is drawn. It is readable either way. */
  readonly shown = computed(() => !this.#dismissed() && this.#wanted());

  /** Whether anything is asking for the tip, before `Escape` is considered. */
  readonly #wanted = computed(() => this.#pressed() || this.#hovered() || this.#focused());

  /**
   * The press, which pins rather than merely toggles what is on screen.
   *
   * It acts on the pin alone and clears the hover and the focus, because both
   * of those are already true by the time a press arrives — a pointer has to be
   * over the trigger to press it, and a browser focuses a button it is pressed
   * on. Read against what is *drawn*, the first press on a hovered tip would
   * therefore always be a press that closes it, and on a keyboard the tip could
   * not be closed at all.
   */
  toggle(): void {
    const pinning = !this.#pressed();
    this.#dismissed.set(false);
    this.#hovered.set(false);
    this.#focused.set(false);
    this.#pressed.set(pinning);
  }

  /**
   * A mouse arrived.
   *
   * Only a mouse: a tap fires this too, and admitting it would open the tip on
   * `pointerenter` and shut it again on the `click` that follows.
   */
  onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.#hovered.set(true);
    }
  }

  /** The mouse left. */
  onPointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.#hovered.set(false);
      this.#settle();
    }
  }

  /**
   * Focus arrived, which is the other half of "on hover or focus".
   *
   * It fires on a press too, a moment before the `click`. That is exactly why
   * {@link toggle} clears it: what a press acts on is the pin, and a focus it
   * took itself is not a second reason to stay open.
   */
  onFocusIn(): void {
    this.#focused.set(true);
  }

  /**
   * Focus left the trigger and its bubble.
   *
   * Which is also how a tap elsewhere on the screen shuts a pressed tip: a
   * press focuses the trigger, so anything taken up next takes the focus off
   * it.
   */
  onFocusOut(): void {
    this.#focused.set(false);
    this.#pressed.set(false);
    this.#settle();
  }

  /**
   * `Escape`: 1.4.13's dismissal, without moving the pointer or the focus.
   *
   * Heard on the document, so it reaches a tip a hover opened while the focus
   * is elsewhere — and ignored by every tip that is not currently drawn, so one
   * `Escape` cannot leave a page of tooltips refusing the next hover.
   *
   * It settles afterwards because unpinning can be the last reason to go: a
   * pinned tip the pointer has already left is held open by the pin alone, so
   * clearing it leaves nothing asking and nothing on the way to ask. Without
   * this the dismissal outlives the tip it dismissed, and the next hover is
   * swallowed by an `Escape` for a tip that had already closed.
   */
  dismiss(): void {
    if (!this.shown()) {
      return;
    }
    this.#dismissed.set(true);
    this.#pressed.set(false);
    this.#settle();
  }

  /**
   * Forget an `Escape` once, and only once, nothing is asking for the tip.
   *
   * Cleared any earlier and a dismissal undoes itself: a tip dismissed while it
   * was both focused and hovered would come back on its own the moment the
   * pointer left, with the Commander having asked for nothing.
   */
  #settle(): void {
    if (!this.#wanted()) {
      this.#dismissed.set(false);
    }
  }
}
