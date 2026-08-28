import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
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

  /**
   * Whether the description is bound to the control without being drawn.
   *
   * The same arrangement `labelHidden` already offers, for the same reason: a
   * field the reference draws with nothing beside it still has to say what it
   * matches to a reader who cannot see the manifest fill in as they type.
   */
  readonly descriptionHidden = input(false);
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

  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');

  onInput(event: Event): void {
    this.changed.emit((event.target as HTMLInputElement).value);
  }

  /**
   * Puts the caret in the field, and answers whether it arrived.
   *
   * For a caller that offers a way to reach the field from elsewhere on the
   * screen. The control is the component's own, so reaching it is the
   * component's job rather than the caller's. The answer matters because a
   * field can be unreachable without being absent: an open modal makes the rest
   * of the document inert, and a caller that cancelled a key press on the
   * strength of a focus that never landed would leave the press doing nothing
   * at all.
   */
  focus(): boolean {
    const control = this.control().nativeElement;
    control.focus();
    return control.ownerDocument.activeElement === control;
  }
}
