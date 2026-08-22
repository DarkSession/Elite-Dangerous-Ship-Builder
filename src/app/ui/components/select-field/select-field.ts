import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { createFieldRelations } from '../field/field-relations';

/** One choice in a select. `label` is what a Commander reads; `value` is the identity. */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * A labelled select.
 *
 * A native `<select>`, which brings the platform's own listbox — including the
 * one a mobile browser renders as a full-screen picker, and the one a screen
 * reader already knows how to operate. A custom listbox would have to
 * reimplement all of that to be no better.
 */
@Component({
  selector: 'edsb-select-field',
  templateUrl: './select-field.html',
  styleUrl: './select-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectField {
  readonly label = input.required<string>();
  readonly options = input.required<readonly SelectOption[]>();
  readonly value = input<string | null>(null);
  readonly description = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly required = input(false);
  readonly disabled = input(false);
  readonly busy = input(false);

  readonly changed = output<string>();

  readonly relations = createFieldRelations({
    description: this.description,
    error: this.error,
  });

  protected readonly control = viewChild<ElementRef<HTMLSelectElement>>('control');

  constructor() {
    // A `<select>` keeps whatever the Commander last chose, whatever the
    // `selected` attributes on its options say afterwards. Without this, a
    // value reset in code — a draft reverted, a menu rebuilt against a build
    // that changed — leaves the control showing a choice nothing holds.
    effect(() => {
      const element = this.control()?.nativeElement;
      const value = this.value() ?? '';
      // Read so the effect re-runs when the menu itself is rebuilt.
      this.options();
      if (element !== undefined && element.value !== value) {
        element.value = value;
      }
    });
  }

  onChange(event: Event): void {
    this.changed.emit((event.target as HTMLSelectElement).value);
  }
}
