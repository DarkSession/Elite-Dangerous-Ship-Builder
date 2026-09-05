import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { createFieldRelations } from '../field/field-relations';

/**
 * A labelled multi-line input.
 *
 * Used where a Commander pastes or edits something long — a SLEF payload, a
 * build note. It stays vertically resizable: a fixed height that clips content
 * at 200% text is a reflow failure, and the platform's own resize handle is the
 * simplest correct answer.
 *
 * `technical` is the payload mode the reference draws for both exchange layers
 * (canvases 1a–1d): monospaced, so a JSON structure reads as a structure, and
 * direction-isolated, so a right-to-left interface cannot reorder a path or a
 * URL inside it. Combined with `readonly` it is the export payload — selectable
 * and copyable, but not editable, and still a real form control with a real
 * label rather than a block of text pretending to be one.
 */
@Component({
  selector: 'ednb-textarea-field',
  templateUrl: './textarea-field.html',
  styleUrl: './textarea-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaField {
  readonly label = input.required<string>();
  readonly value = input<string>('');
  readonly description = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly rows = input(4);
  readonly required = input(false);
  readonly disabled = input(false);
  readonly busy = input(false);

  /**
   * Readable and selectable, but not editable.
   *
   * `readonly` rather than `disabled`: a disabled control is skipped by a
   * screen reader's form navigation and cannot be selected, which is exactly
   * what an export payload has to allow (export contract, "Artifact lifecycle").
   */
  readonly readonlyValue = input(false, { alias: 'readonly' });

  /** Monospaced and direction-isolated, for a payload rather than prose. */
  readonly technical = input(false);

  /**
   * The label is read but not drawn.
   *
   * For the one case where the surface around the field already names it in
   * words a reader can see — a layer titled `Import build` whose only control
   * is the payload, with the sentence saying what to paste directly above it.
   * A second `SLEF payload` over the top of that is the same fact twice, and
   * neither exchange canvas draws it (Commander request 2026-08-26). The label
   * itself stays: it is what gives the control its accessible name, and a
   * control whose name lives only in a nearby paragraph has none.
   */
  readonly labelHidden = input(false);

  readonly changed = output<string>();

  readonly relations = createFieldRelations({
    description: this.description,
    error: this.error,
  });

  onInput(event: Event): void {
    this.changed.emit((event.target as HTMLTextAreaElement).value);
  }
}
