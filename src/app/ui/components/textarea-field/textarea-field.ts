import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { createFieldRelations } from '../field/field-relations';

/**
 * A labelled multi-line input.
 *
 * Used where a Commander pastes or edits something long — a SLEF payload, a
 * build note. It stays vertically resizable: a fixed height that clips content
 * at 200% text is a reflow failure, and the platform's own resize handle is the
 * simplest correct answer.
 */
@Component({
  selector: 'edsb-textarea-field',
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

  readonly changed = output<string>();

  readonly relations = createFieldRelations({
    description: this.description,
    error: this.error,
  });

  onInput(event: Event): void {
    this.changed.emit((event.target as HTMLTextAreaElement).value);
  }
}
