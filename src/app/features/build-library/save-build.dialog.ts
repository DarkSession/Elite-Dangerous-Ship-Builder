import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { relationId } from '../../ui/a11y/text-equivalence';
import { Formatters } from '../../i18n/formatters/formatters';
import { ActionButton } from '../../ui/components/action/action-button';
import { Layer } from '../../ui/components/layer/layer';
import { StatusNotice } from '../../ui/components/status/status-notice';
import { TextField } from '../../ui/components/text-field/text-field';

/** What the Commander chose to do with the name they typed. */
export interface SaveRequest {
  readonly name: string;
  /** True to replace the record this build was opened from. */
  readonly overwrite: boolean;
}

/**
 * Naming a build, and deciding what that means.
 *
 * The distinction the dialog exists to keep straight: "save as new" and
 * "replace the build I opened" are two different operations, and neither of
 * them is decided by whether the name happens to match something. A Commander
 * who types a name that already exists gets a warning and a new record — never
 * a silent overwrite of a build with the same label (build-workspace design,
 * "Composition").
 *
 * **Revised 2026-08-25.** Since a save consumes the unsaved entry these edits
 * were autosaved into, the two choices no longer differ only in which record is
 * written: replacing removes that entry, and saving as new keeps both builds.
 * One of them therefore ends with a record fewer than it started with, which is
 * exactly the sort of thing a Commander has to be told before they press it and
 * not after — so each choice states its outcome in visible, associated words,
 * the same way the conflict dialog does (FR-008, T150a).
 */
@Component({
  selector: 'edsb-save-build-dialog',
  imports: [ActionButton, Layer, StatusNotice, TextField],
  templateUrl: './save-build.dialog.html',
  styleUrl: './save-build.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveBuildDialog {
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  readonly open = input(false);

  /** The name to start from: the source record's, or empty. */
  readonly initialName = input<string>('');

  /** How many stored builds already use the typed name. */
  readonly duplicateCount = input(0);

  /** True when this build was opened from a named record that could be replaced. */
  readonly canOverwrite = input(false);

  /** Why replacing is unavailable, when it is. */
  readonly overwriteUnavailable = input<string | null>(null);

  readonly nameChanged = output<string>();
  readonly saveRequested = output<SaveRequest>();
  readonly dismissed = output<void>();

  readonly title = this.#messages.messageSignal('library.save.title');
  readonly nameLabel = this.#messages.messageSignal('library.save.name.label');
  readonly nameDescription = this.#messages.messageSignal('library.save.name.description');
  readonly overwriteLabel = this.#messages.messageSignal('library.save.overwrite');
  readonly asNewLabel = this.#messages.messageSignal('library.save.as-new');
  readonly overwriteOutcome = this.#messages.messageSignal('library.save.overwrite.outcome');
  readonly asNewOutcome = this.#messages.messageSignal('library.save.as-new.outcome');
  readonly dismissLabel = this.#messages.messageSignal('action.close');

  readonly overwriteOutcomeId = relationId('save-overwrite-outcome');
  readonly asNewOutcomeId = relationId('save-as-new-outcome');

  /** The name currently typed. Starts from the source record's own. */
  readonly name = signal('');

  readonly duplicateWarning = computed(() => {
    const count = this.duplicateCount();
    return count > 0
      ? this.#messages.message('library.save.duplicate-name', {
          count: this.#formatters.integer(count),
        })
      : null;
  });

  readonly currentName = computed(() => {
    const typed = this.name();
    return typed.length > 0 ? typed : this.initialName();
  });

  readonly canSave = computed(() => this.currentName().trim().length > 0);

  changeName(value: string): void {
    this.name.set(value);
    this.nameChanged.emit(value);
  }

  save(overwrite: boolean): void {
    if (!this.canSave()) {
      return;
    }
    this.saveRequested.emit({ name: this.currentName().trim(), overwrite });
  }
}
