import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../a11y/text-equivalence';
import { ActionButton } from '../action/action-button';
import { ChoiceGroup, type Choice } from '../choice-group/choice-group';
import { SelectField, type SelectOption } from '../select-field/select-field';
import { TextField } from '../text-field/text-field';

/** One constraint currently narrowing the collection, and how to take it off. */
export interface ToolbarConstraint {
  readonly id: string;
  readonly label: string;
  /** The removing action's own words, naming the constraint it removes. */
  readonly removeLabel: string;
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
 * Search, facets, order and what is currently narrowing a collection.
 *
 * The reference design puts the search first and the facets beside it; this
 * keeps that hierarchy and adds the two things the mock has no room for: the
 * active constraints as individually removable items, and the match count as
 * text before the results.
 *
 * Both of those exist for the same reason. A Commander who cannot see the
 * highlighted state of six controls at a glance has no way to tell why a list
 * is short, and no way to undo one constraint without clearing them all.
 */
@Component({
  selector: 'edsb-collection-toolbar',
  imports: [ActionButton, ChoiceGroup, SelectField, TextField],
  templateUrl: './collection-toolbar.html',
  styleUrl: './collection-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionToolbar {
  readonly #messages = inject(MessageService);

  readonly search = input('');
  readonly sizeChoices = input.required<readonly Choice[]>();
  readonly selectedSizes = input<readonly string[]>([]);
  readonly manufacturerOptions = input.required<readonly SelectOption[]>();
  readonly selectedManufacturer = input<string | null>(null);
  readonly hardpointOptions = input.required<readonly SelectOption[]>();
  readonly selectedHardpointClass = input<string | null>(null);
  readonly priceMin = input<string>('');
  readonly priceMax = input<string>('');
  readonly sortOptions = input.required<readonly SelectOption[]>();
  readonly sort = input.required<ToolbarSort>();
  readonly constraints = input<readonly ToolbarConstraint[]>([]);
  /** The match count, already a sentence. Announced politely by the screen. */
  readonly countText = input.required<string>();

  readonly searchChanged = output<string>();
  readonly sizesChanged = output<readonly string[]>();
  readonly manufacturerChanged = output<string>();
  readonly hardpointClassChanged = output<string>();
  readonly priceMinChanged = output<string>();
  readonly priceMaxChanged = output<string>();
  readonly sortFieldChanged = output<string>();
  readonly sortDirectionToggled = output<void>();
  readonly constraintRemoved = output<string>();
  readonly cleared = output<void>();

  readonly constraintsId = relationId('toolbar-constraints');

  readonly searchLabel = this.#messages.messageSignal('catalogue.search.label');
  readonly searchDescription = this.#messages.messageSignal('catalogue.search.description');
  readonly sizeLegend = this.#messages.messageSignal('catalogue.filter.size.legend');
  readonly manufacturerLabel = this.#messages.messageSignal('catalogue.filter.manufacturer.label');
  readonly hardpointLabel = this.#messages.messageSignal('catalogue.filter.hardpoint.label');
  readonly priceMinLabel = this.#messages.messageSignal('catalogue.filter.price.min.label');
  readonly priceMaxLabel = this.#messages.messageSignal('catalogue.filter.price.max.label');
  readonly priceDescription = this.#messages.messageSignal('catalogue.filter.price.description');
  readonly sortLabel = this.#messages.messageSignal('catalogue.sort.label');
  readonly constraintsLabel = this.#messages.messageSignal('catalogue.constraints.label');
  readonly noConstraintsLabel = this.#messages.messageSignal('catalogue.constraints.none');
  readonly clearLabel = this.#messages.messageSignal('catalogue.constraints.clear');

  readonly hasConstraints = computed(() => this.constraints().length > 0);
}
