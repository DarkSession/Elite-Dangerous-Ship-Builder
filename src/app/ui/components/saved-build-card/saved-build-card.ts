import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { GameTextPresentation } from '../../../i18n/game-text.presenter';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../a11y/text-equivalence';
import { ActionButton } from '../action/action-button';
import { GameText } from '../game-text/game-text';
import { StatusNotice } from '../status/status-notice';

/** One action a Commander can take on one record. */
export interface RecordAction {
  readonly id: string;
  /** The action's own words, naming the record it acts on. */
  readonly label: string;
  readonly emphasis?: 'primary' | 'secondary' | 'quiet' | 'danger';
}

/** One stored build, as the library shows it. */
export interface SavedBuild {
  readonly id: string;
  /**
   * The local name, or `null` for a working build.
   *
   * A working build is shown as what it is rather than given an invented name:
   * "Working build" is true, and "Untitled" would be a name it does not have.
   */
  readonly name: string | null;
  readonly hull: GameTextPresentation;
  /** The last-modified instant, already formatted for the active locale. */
  readonly modified: string;
  /** The package's verdict when the build was saved, in words. */
  readonly validation: { readonly label: string; readonly tone: 'success' | 'warning' | 'error' };
  readonly note: string | null;
  readonly actions: readonly RecordAction[];
}

/**
 * One stored build.
 *
 * The validation state is a piece of text with a tone, never a coloured dot: a
 * Commander has to be able to tell an invalid build from a complete one
 * without seeing the colour, and "recorded at the time it was saved" is part
 * of what it means (FR-010).
 *
 * Every action names the record it acts on. A row of buttons reading "Open",
 * "Rename", "Delete" is unusable to anyone reading them out of context, and
 * "Delete" is the one where being wrong costs the most.
 */
@Component({
  selector: 'edsb-saved-build-card',
  imports: [ActionButton, GameText, StatusNotice],
  templateUrl: './saved-build-card.html',
  styleUrl: './saved-build-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedBuildCard {
  readonly #messages = inject(MessageService);

  readonly build = input.required<SavedBuild>();

  readonly actionSelected = output<{ recordId: string; actionId: string }>();

  readonly cardId = relationId('saved-build');

  readonly workingLabel = this.#messages.messageSignal('library.record.working');
  readonly hullLabel = this.#messages.messageSignal('library.record.hull');
  readonly modifiedLabel = this.#messages.messageSignal('library.record.modified');
  readonly validationLabel = this.#messages.messageSignal('library.record.validation');
  readonly noteLabel = this.#messages.messageSignal('library.record.note');

  /** The name, or the words that say it has none. */
  readonly title = computed(() => this.build().name ?? this.workingLabel());

  select(action: RecordAction): void {
    this.actionSelected.emit({ recordId: this.build().id, actionId: action.id });
  }
}
