import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/**
 * Where files come in: a target to drop on, and a control to choose with.
 *
 * Both, because neither is enough on its own. A drop target is unreachable
 * without a pointer, and it is invisible to anyone who has never learned that a
 * dashed box takes a file; a file control is reachable by everyone and is what
 * the accessible name belongs to. The canvas draws them as one plate, so the
 * control is the plate's own button and the plate is the target.
 *
 * The component reads nothing. It hands over the files it was given and says
 * what it was told to say about them; what is in a file is the business of
 * whatever asked for it.
 */
@Component({
  selector: 'ednb-file-drop',
  templateUrl: './file-drop.html',
  styleUrl: './file-drop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileDrop {
  /** What the control asks for. Its own accessible name. */
  readonly label = input.required<string>();
  /** What kinds of file it takes, said once beneath the label. */
  readonly hint = input<string | null>(null);
  /** What the last selection came to, or `null` before one. */
  readonly scanned = input<string | null>(null);
  /** The `accept` list, in the browser's own spelling. */
  readonly accept = input('');
  /** True while what was chosen is being read. */
  readonly busy = input(false);
  readonly disabled = input(false);

  readonly chosen = output<readonly File[]>();

  /** Whether files are over the target. Drawn, and nothing else depends on it. */
  readonly dragging = signal(false);

  // `private` rather than `#private`, which Angular's `viewChild` does not
  // take (NG1053).
  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');

  readonly controlId = relationId('file-drop');
  readonly hintId = computed(() => `${this.controlId}-hint`);
  readonly scannedId = computed(() => `${this.controlId}-scanned`);

  readonly describedBy = computed(() => {
    const parts = [
      this.hint() === null ? null : this.hintId(),
      this.scanned() === null ? null : this.scannedId(),
    ].filter((part): part is string => part !== null);
    return parts.length === 0 ? null : parts.join(' ');
  });

  /** Opens the browser's own file picker, which is all the input is here for. */
  choose(): void {
    this.control().nativeElement.click();
  }

  /**
   * Takes what the control was given, then forgets it.
   *
   * The value is cleared so that choosing the same file twice is two events. A
   * Commander who edited a journal and picked it again means it.
   */
  select(event: Event): void {
    const control = event.target as HTMLInputElement;
    this.#emit(control.files);
    control.value = '';
  }

  over(event: DragEvent): void {
    if (this.disabled()) {
      return;
    }
    event.preventDefault();
    this.dragging.set(true);
  }

  leave(): void {
    this.dragging.set(false);
  }

  drop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.disabled()) {
      return;
    }
    this.#emit(event.dataTransfer?.files ?? null);
  }

  #emit(files: FileList | null): void {
    const chosen = Array.from(files ?? []);
    if (chosen.length > 0) {
      this.chosen.emit(chosen);
    }
  }
}
