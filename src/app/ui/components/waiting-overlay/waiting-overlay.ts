import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/**
 * The statement that the application is waiting for a screen.
 *
 * A native modal `<dialog>`, as the layer is. That is what makes the screen
 * behind it genuinely inert rather than merely covered: no pointer, no focus,
 * and absent from the accessibility tree, so a second press cannot start a
 * second navigation on top of the one in flight. It also puts the statement in
 * the top layer, so it stands in front of a surface that was already open.
 *
 * It is not the layer component with another presentation. A layer is a titled
 * panel of content with a way out; this has no title bar, no panel and no
 * control. There is nothing to answer — the navigation is already running, and
 * the way out is the navigation ending.
 *
 * What it draws is the mark on its ground. The sentence beside it is carried
 * for a reader and is what names the statement, the way the hull illustration
 * carries its own: the mark is decoration and is exposed as none.
 *
 * Presentation only. When it stands is decided by
 * `src/app/application/navigation/navigation-waiting.store.ts` (constitution
 * III).
 */
@Component({
  selector: 'ednb-waiting-overlay',
  templateUrl: './waiting-overlay.html',
  styleUrl: './waiting-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaitingOverlay {
  readonly #host = inject(ElementRef<HTMLElement>);

  /** Whether the application is waiting. */
  readonly open = input(false);

  /**
   * What a reader is told while it stands.
   *
   * The statement's accessible name. Opening a modal moves focus into it and a
   * reader is told what it is by its name, so this is the sentence rather than
   * a description of a graphic.
   */
  readonly text = input.required<string>();

  readonly textId = relationId('waiting-text');

  /**
   * The mark, served from this origin like every other asset, by a relative
   * path — a pull request is served from a sub-path, so a leading `/` would
   * miss the file.
   *
   * The same file the hull illustration and the hull schematic draw, which is
   * also where it is held still for a Commander who asked for less motion: the
   * file is a separate document, so the page's own rule cannot reach it.
   */
  readonly markSource = 'assets/loader.svg';

  constructor() {
    effect(() => {
      // The input is read first, before anything can return. It is the only
      // signal here — the element is found by query, not held in one — so an
      // effect that returned before reading it would register no dependency and
      // never run again, leaving the statement closed for the life of the
      // component and saying nothing about it.
      const open = this.open();
      const dialog = this.#dialog();
      if (!dialog) {
        return;
      }
      if (open && !dialog.open) {
        dialog.showModal();
      } else if (!open && dialog.open) {
        dialog.close();
      }
    });
  }

  /**
   * Refuses the native cancel.
   *
   * `<dialog>` closes itself on Escape. A statement that closed on Escape would
   * say the application had stopped waiting while the fetch was still running,
   * which is a statement that is not true. What removes it is the navigation
   * ending. Holding a reader inside is what criterion 2.1.2 is about, and
   * constitution V excludes it.
   */
  blockCancel(event: Event): void {
    event.preventDefault();
  }

  #dialog(): HTMLDialogElement | null {
    return this.#host.nativeElement.querySelector('dialog');
  }
}
