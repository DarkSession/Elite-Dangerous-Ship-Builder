import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { DOCUMENT } from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/**
 * How the layer presents itself.
 *
 * All four share one state and intent contract. The presentation changes where
 * the content sits and how it is sized; it never changes what a Commander can
 * do or what a reader is told (responsive composition, "Adaptive layer rule").
 *
 * `adaptive` is the default and the one to reach for: it resolves in CSS to a
 * centred dialog where there is room, a bottom sheet where the space is narrow,
 * and a full-height panel where the viewport is too short for either. Resolving
 * it in CSS rather than by reading the viewport in TypeScript means it also
 * responds to zoom, text scale and a resized window, which a measurement taken
 * once at construction would not.
 */
export type LayerPresentation = 'adaptive' | 'dialog' | 'sheet' | 'full-height';

/**
 * How wide the layer is allowed to get before its content stops growing.
 *
 * A dialog's width is a property of what it holds rather than of which dialog it
 * is. `default` is the one a layer of prose and a field takes, which is most of
 * them; `wide` is the layer that stands two regions side by side, which canvas
 * 1c's export dialog is; `widest` is the library, which is a whole list under
 * its own column headers and is drawn at 860px on canvas 1a.
 *
 * Three members, not the ladder the tokens hold: a step nothing takes is a rule
 * shipped in every bundle that never matches. The narrow step exists as
 * `--edsb-layout-layer-narrow` for the surface that needs it to name it here.
 *
 * It bounds the centred presentations only. A sheet and a full-height layer own
 * the width they are given, so the stylesheet pairs each step with the two
 * presentations that have a width to bound and ignores it on the two that do
 * not. The class is emitted either way, because what a layer was asked for is
 * worth being able to read off the element.
 */
export type LayerWidth = 'default' | 'wide' | 'widest';

/**
 * A modal layer: dialog, bottom sheet or full-height panel.
 *
 * Built on the native `<dialog>` element, which brings background inertness,
 * the top layer and platform dismissal behaviour without reimplementing any of
 * it. While the layer is open the rest of the page is genuinely inert and
 * genuinely absent from the accessibility tree — not merely covered by an
 * overlay a reader can still wander behind.
 *
 * Dismissal restores the invoking control, so a Commander who opens a layer
 * from a row ends up back on that row rather than at the top of the document.
 *
 * A click on the ground around the layer dismisses it, as the reference does on
 * both of its modals (Commander request 2026-08-26). It is the same act as
 * Escape, which the native element has always honoured here through its own
 * `close` event, and it means the same thing: every layer's dismissal is a
 * cancel, and the one destructive answer any of them offers is behind a button
 * a Commander has to press.
 */
@Component({
  selector: 'edsb-layer',
  templateUrl: './layer.html',
  styleUrl: './layer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layer {
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #document = inject(DOCUMENT);

  /** The layer's visible title. A layer without one is unnavigable. */
  readonly title = input.required<string>();

  /** Supporting description, associated with the layer. */
  readonly description = input<string | null>(null);

  readonly open = input(false);
  readonly presentation = input<LayerPresentation>('adaptive');
  readonly width = input<LayerWidth>('default');

  /**
   * Whether the body keeps its own padding.
   *
   * A layer whose content is one flow is padded here, so every such layer is
   * inset by the same step. A layer whose content is two regions divided by a
   * rule is not: canvas 1c's export dialog runs that rule from under the title
   * bar to the foot of the panel, which is only true if each region carries its
   * own padding and the body carries none.
   */
  readonly flush = input(false);

  /**
   * The dismiss control's visible label, or `null` for a layer with no way out.
   *
   * One input rather than two, because a label and a separate "is it
   * dismissible" flag can disagree and this cannot: a layer that offers no way
   * out has no control to name, and a layer that has one always names it.
   *
   * Required rather than defaulted, because `null` is a decision. A layer that
   * a Commander cannot leave is the strongest thing this component does, and it
   * should not be reachable by forgetting an input.
   *
   * No label also stops Escape and the ground closing it, so the two routes a
   * reader can find are absent together with the control. The third, a direct
   * `close()` on the element, is not blocked and does not need to be: nothing
   * calls it, and the owner lowering `open` is the same act by another name.
   * Exactly one layer takes it — the overlay that stands while a published
   * version restarts the page under it, where there is nothing to cancel
   * because the restart is not a question (011/FR-025).
   */
  readonly dismissLabel = input.required<string | null>();

  readonly dismissed = output<void>();

  readonly titleId = relationId('layer-title');
  readonly descriptionId = relationId('layer-description');

  readonly presentationClass = computed(() => {
    const classes = ['layer', `layer--${this.presentation()}`];
    if (this.width() !== 'default') {
      classes.push(`layer--${this.width()}`);
    }
    return classes.join(' ');
  });

  readonly bodyClass = computed(() =>
    this.flush() ? 'layer__body layer__body--flush' : 'layer__body',
  );

  /** The control that opened the layer, so focus can be handed back to it. */
  #invoker: HTMLElement | null = null;

  /** Whether the press that produces the next click landed on the ground. */
  #pressedOnGround = false;

  /**
   * Whether the close now in flight is this component's own doing.
   *
   * A native `dialog` fires `close` however it was closed, `close()` called
   * here among the ways — and the event is queued rather than dispatched
   * inline, so it arrives after the call that caused it has returned. Reported
   * as a dismissal it tells the owner a Commander cancelled something the owner
   * itself had just closed, which is how the save layer stepping aside for a
   * conflict question lost the attempt it was holding: closing to ask the
   * question read back as abandoning it.
   *
   * Set where `open` drives the close and consumed by the event it queued, so
   * `dismissed` says what it has always meant — Escape, the ground, or the
   * dismiss control — and says it once rather than twice.
   */
  #closingFromInput = false;

  constructor() {
    effect(() => {
      const dialog = this.#dialog();
      if (!dialog) {
        return;
      }

      if (this.open() && !dialog.open) {
        // Remembered before the layer opens, because opening moves focus.
        this.#invoker = this.#document.activeElement as HTMLElement | null;
        dialog.showModal();
      } else if (!this.open() && dialog.open) {
        this.#closingFromInput = true;
        dialog.close();
        // Restore the invoking context rather than dropping the reader at the
        // top of the document.
        this.#invoker?.focus?.();
        this.#invoker = null;
      }
    });
  }

  /**
   * Whether this layer offers any way out at all.
   *
   * Blank counts as absent, and must: the template draws no control for an
   * empty label, so treating `''` as dismissable would leave Escape and the
   * ground closing a layer that shows no way out — the split this single input
   * exists to make impossible.
   */
  readonly dismissible = computed(() => (this.dismissLabel() ?? '').trim().length > 0);

  dismiss(): void {
    this.dismissed.emit();
  }

  /**
   * Refuses the native cancel a layer with no way out must not honour.
   *
   * `<dialog>` closes itself on Escape, and an undismissable layer that closed
   * on Escape would be dismissable by exactly one route and look like none.
   * Preventing it holds the reader inside the layer, which criterion 2.1.2 is
   * about and which constitution V excludes.
   */
  blockCancel(event: Event): void {
    if (!this.dismissible()) {
      event.preventDefault();
    }
  }

  /**
   * The native `close`, whoever caused it.
   *
   * Escape is the case this exists for: the element honours it itself, and it
   * reaches the owner as the cancel it is. A close the owner asked for by
   * lowering `open` is consumed here instead, having already been accounted
   * for by whatever lowered it.
   */
  closed(): void {
    if (this.#closingFromInput) {
      this.#closingFromInput = false;
      return;
    }
    this.dismissed.emit();
  }

  /**
   * Remembers where the gesture that produces the next click began.
   *
   * A `click` is dispatched at the nearest common ancestor of where the button
   * went down and where it came up, so a drag that starts inside the panel and
   * ends on the ground is reported against the dialog itself with coordinates
   * outside the panel — indistinguishable, from the click alone, from a press
   * on the ground. Selecting the payload in the export layer and releasing past
   * its edge is exactly that gesture, and it closed the layer.
   */
  pressOn(event: MouseEvent): void {
    this.#pressedOnGround = event.target === event.currentTarget;
  }

  /**
   * Dismiss a click that landed on the ground rather than on the layer.
   *
   * Three checks now, and each rules out a different thing. The press says the
   * gesture *began* on the ground rather than ending up there. The target says
   * the click reached the dialog element itself rather than bubbling from
   * something inside it. The box says it was outside the panel rather than on
   * the padding the panel draws around its own content, which is still the
   * dialog element.
   *
   * A click a keyboard produced carries no position — it reports the origin —
   * so the box check would call it a backdrop click. It never reaches here:
   * such a click is dispatched at the control that was activated, and the
   * target check has already turned it away.
   */
  dismissFromBackdrop(event: MouseEvent): void {
    const dialog = event.currentTarget;
    const pressedOnGround = this.#pressedOnGround;
    this.#pressedOnGround = false;
    if (!this.dismissible()) {
      return;
    }
    if (!pressedOnGround || event.target !== dialog || !(dialog instanceof HTMLElement)) {
      return;
    }
    const box = dialog.getBoundingClientRect();
    const onThePanel =
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom;
    if (!onThePanel) {
      this.dismiss();
    }
  }

  #dialog(): HTMLDialogElement | null {
    return this.#host.nativeElement.querySelector('dialog');
  }
}
