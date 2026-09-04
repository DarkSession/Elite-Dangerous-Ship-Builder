import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../a11y/text-equivalence';
import { ActionButton } from '../action/action-button';
import { ChoiceGroup, type Choice } from '../choice-group/choice-group';

/** One record offered for discard. */
export interface ManageableRecord {
  readonly id: string;
  /** What it is, in enough words to decide: name or working state, hull, date. */
  readonly label: string;
  readonly detail: string;
}

/**
 * Choosing what to discard when there is no room left.
 *
 * The only thing this component may not do is decide. Every record is listed,
 * every one is selected individually, and nothing is removed until a
 * confirmation the caller owns. There is no "clear the oldest", no "tidy up"
 * and no preselection, because each of those is the application deciding which
 * of a Commander's builds mattered least (FR-013).
 */
@Component({
  selector: 'ednb-record-manager',
  imports: [ActionButton, ChoiceGroup],
  templateUrl: './record-manager.html',
  styleUrl: './record-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordManager {
  readonly #messages = inject(MessageService);

  readonly records = input.required<readonly ManageableRecord[]>();
  readonly selected = input<readonly string[]>([]);

  /** Why the manager is open: the retention limit, or a full store. */
  readonly reason = input<string | null>(null);

  readonly selectionChanged = output<readonly string[]>();
  readonly discardRequested = output<readonly string[]>();

  readonly managerId = relationId('record-manager');

  readonly title = this.#messages.messageSignal('library.manage.title');
  readonly description = this.#messages.messageSignal('library.manage.description');
  readonly discardLabel = this.#messages.messageSignal('library.delete.confirm');
  readonly emptyLabel = this.#messages.messageSignal('library.empty.title');

  readonly choices = computed<readonly Choice[]>(() =>
    this.records().map((record) => ({
      value: record.id,
      label: record.label,
      description: record.detail,
    })),
  );

  readonly hasSelection = computed(() => this.selected().length > 0);
}
