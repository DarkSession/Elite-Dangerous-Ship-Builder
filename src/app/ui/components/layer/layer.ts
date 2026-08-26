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
 * is. `default` is the one a layer of prose and a field takes, which is every
 * layer in the application but one; `wide` is the layer that stands two regions
 * side by side, which canvas 1c's export dialog is.
 *
 * Two members, not the ladder the tokens hold: a step nothing takes is a rule
 * shipped in every bundle that never matches. The narrow step exists as
 * `--edsb-layout-layer-narrow` for the surface that needs it to name it here.
 *
 * It bounds the centred presentations only. A sheet and a full-height layer own
 * the width they are given, so the stylesheet pairs each step with the two
 * presentations that have a width to bound and ignores it on the two that do
 * not. The class is emitted either way, because what a layer was asked for is
 * worth being able to read off the element.
 */
export type LayerWidth = 'default' | 'wide';

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

  /** The dismiss control's visible label. */
  readonly dismissLabel = input.required<string>();

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
        dialog.close();
        // Restore the invoking context rather than dropping the reader at the
        // top of the document.
        this.#invoker?.focus?.();
        this.#invoker = null;
      }
    });
  }

  dismiss(): void {
    this.dismissed.emit();
  }

  #dialog(): HTMLDialogElement | null {
    return this.#host.nativeElement.querySelector('dialog');
  }
}
