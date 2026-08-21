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

  /** The dismiss control's visible label. */
  readonly dismissLabel = input.required<string>();

  readonly dismissed = output<void>();

  readonly titleId = relationId('layer-title');
  readonly descriptionId = relationId('layer-description');

  readonly presentationClass = computed(() => `layer layer--${this.presentation()}`);

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
