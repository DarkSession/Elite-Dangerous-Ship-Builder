import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { createFieldRelations } from '../field/field-relations';

/**
 * A labelled slider over a numeric range, with the value it is set to beside it.
 *
 * A native `<input type="range">`, for the reason `edsb-select-field` uses a
 * native `<select>`: the platform's own slider is already operable by touch,
 * pointer and assistive technology, and already announces its value. A track
 * built from a `<div>` and pointer handlers — which is what canvas 1c draws —
 * would have to reimplement all of that to end up no better, and would announce
 * nothing until it did.
 *
 * The readout is part of the control rather than a caption near it: the figure
 * is what the slider is *for*, and `aria-valuetext` carries the same formatted
 * string so that what is heard and what is seen are one value.
 */
@Component({
  selector: 'edsb-range-field',
  templateUrl: './range-field.html',
  styleUrl: './range-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeField {
  readonly label = input.required<string>();
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly step = input(1);
  readonly value = input.required<number>();
  /** The value as a Commander reads it, units and all — shown, and announced. */
  readonly valueText = input.required<string>();
  readonly description = input<string | null>(null);
  /** The ends of the scale, as the canvas prints them under its own track. */
  readonly minText = input<string | null>(null);
  readonly maxText = input<string | null>(null);
  readonly disabled = input(false);

  readonly changed = output<number>();

  readonly relations = createFieldRelations({
    description: this.description,
    error: computed(() => null),
  });

  /** How far along the track the value sits, for the fill the canvas draws behind it. */
  readonly fraction = computed(() => {
    const span = this.max() - this.min();
    return span > 0 ? Math.min(1, Math.max(0, (this.value() - this.min()) / span)) : 0;
  });

  protected readonly control = viewChild<ElementRef<HTMLInputElement>>('control');

  constructor() {
    // A range input keeps what it was last dragged to, whatever `value` says
    // afterwards. Without this, a figure reset in code leaves the thumb
    // somewhere the readout beside it disagrees with.
    effect(() => {
      const element = this.control()?.nativeElement;
      const value = String(this.value());
      if (element !== undefined && element.value !== value) {
        element.value = value;
      }
    });
  }

  onInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value)) {
      this.changed.emit(value);
    }
  }
}
