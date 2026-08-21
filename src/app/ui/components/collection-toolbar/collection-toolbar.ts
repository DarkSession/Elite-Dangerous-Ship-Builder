import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../a11y/text-equivalence';
import { ChoiceGroup, type Choice } from '../choice-group/choice-group';
import { TextField } from '../text-field/text-field';

/** One field the collection can be ordered by, and what choosing it would do. */
export interface ToolbarSortOption {
  readonly value: string;
  /** The field's own name, as the chip shows it. */
  readonly label: string;
  /** "Sort by retail price, ascending" — the whole action, in words. */
  readonly actionLabel: string;
}

/** The current order, in the words the control shows. */
export interface ToolbarSort {
  readonly field: string;
  readonly direction: 'ascending' | 'descending';
  /** "Sorted by retail price, descending" — the state, as a sentence. */
  readonly text: string;
  /** "Sort by retail price, ascending" — what activating the toggle does. */
  readonly toggleLabel: string;
}

/**
 * Search, size and order for a collection.
 *
 * Exactly what the reference draws and nothing else: a search field, the size
 * choices as an abutted segmented strip, and — in the compact composition
 * only — a row of sort chips carrying the active field and its direction
 * (canvas 1a, canvas 1b). The wide manifest sorts from its own column headers,
 * so the chip row is removed there rather than repeating them.
 */
@Component({
  selector: 'edsb-collection-toolbar',
  imports: [ChoiceGroup, TextField],
  templateUrl: './collection-toolbar.html',
  styleUrl: './collection-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionToolbar {
  readonly #messages = inject(MessageService);

  readonly search = input('');
  readonly sizeChoices = input.required<readonly Choice[]>();
  readonly selectedSizes = input<readonly string[]>([]);
  readonly sortOptions = input.required<readonly ToolbarSortOption[]>();
  readonly sort = input.required<ToolbarSort>();

  readonly searchChanged = output<string>();
  readonly sizesChanged = output<readonly string[]>();
  /** The field a chip asks for. Re-choosing the active field flips it. */
  readonly sortFieldChanged = output<string>();

  readonly sortId = relationId('toolbar-sort');

  readonly searchLabel = this.#messages.messageSignal('catalogue.search.label');
  readonly sizeLegend = this.#messages.messageSignal('catalogue.filter.size.legend');
  readonly sortLabel = this.#messages.messageSignal('catalogue.sort.label');

  /**
   * The direction marker the reference puts on the active chip. It is decorative
   * — `aria-pressed` and the chip's own accessible name carry the same state.
   */
  readonly caret = computed(() => (this.sort().direction === 'ascending' ? '↑' : '↓'));
}
