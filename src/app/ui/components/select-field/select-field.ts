import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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

  onChange(event: Event): void {
    this.changed.emit((event.target as HTMLSelectElement).value);
  }
}
