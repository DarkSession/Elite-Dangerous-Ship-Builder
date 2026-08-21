import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MessageService } from '../../../i18n/message.service';
import { ActionButton } from '../action/action-button';
import { TextareaField } from '../textarea-field/textarea-field';

/**
 * One record's local note.
 *
 * Local in the strongest sense: a note is record metadata, it never enters a
 * build link or a SLEF export, and editing one is not an edit to the build
 * (FR-011). That is why it is its own control with its own save action rather
 * than a field inside the build — nothing here can mark a build as changed.
 */
@Component({
  selector: 'edsb-record-note-editor',
  imports: [ActionButton, TextareaField],
  templateUrl: './record-note-editor.html',
  styleUrl: './record-note-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordNoteEditor {
  readonly #messages = inject(MessageService);

  readonly note = input<string | null>(null);
  readonly disabled = input(false);

  readonly changed = output<string>();
  readonly saveRequested = output<string>();

  readonly label = this.#messages.messageSignal('library.record.note');
  readonly description = this.#messages.messageSignal('library.record.note.placeholder');
  readonly saveLabel = this.#messages.messageSignal('library.record.note.save');

  /** The current draft, so the save action sends what is on screen. */
  draft = '';

  onChanged(value: string): void {
    this.draft = value;
    this.changed.emit(value);
  }

  save(): void {
    this.saveRequested.emit(this.draft);
  }
}
