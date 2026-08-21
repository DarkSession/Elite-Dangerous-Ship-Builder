import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { createFieldRelations } from '../field/field-relations';

/** The input purposes this field covers. */
export type TextFieldKind = 'text' | 'search';

/**
 * A labelled single-line input.
 *
 * The label is a real `<label>` bound to the control. A placeholder is never a
 * label: it disappears the moment someone types, it is not announced reliably,
 * and it usually fails contrast. The component accepts one only as a supplement
 * to a label that is always present.
 *
 * The error is rendered *and* associated. Showing an error in red beside a
 * field without relating it is the same defect as not showing it at all, for
 * anyone who cannot see the colour.
 */
@Component({
  selector: 'edsb-text-field',
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextField {
  readonly label = input.required<string>();
  /**
   * Whether the label is drawn. A hidden label is still a real `<label>` bound
   * to the control — the reference's search field carries its words in the
   * placeholder and draws no label above it (canvas 1a/1b).
   */
  readonly labelHidden = input(false);
  readonly value = input<string>('');
  readonly kind = input<TextFieldKind>('text');
  readonly description = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly required = input(false);
  readonly disabled = input(false);
  readonly busy = input(false);

  readonly changed = output<string>();

  readonly relations = createFieldRelations({
    description: this.description,
    error: this.error,
  });

  onInput(event: Event): void {
    this.changed.emit((event.target as HTMLInputElement).value);
  }
}
