import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  LoadoutPresenter,
  type ItemView as ItemViewModel,
} from '../../../application/equipment/loadout.presenter';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../../ui/a11y/text-equivalence';
import { GameText } from '../../../ui/components/game-text/game-text';
import { MetricGroup } from '../../../ui/components/metric-group/metric-group';
import { ChoiceList, type EquipmentChoice } from '../../../ui/equipment/choice-list';
import { GradeSelector } from '../../../ui/outfitting/grade-selector';
import { ModificationSlots } from './modification-slots';

/**
 * The selected item: what it is, what grade it is at, and what it is worth.
 *
 * Canvas 1a's middle column: the name over its code line, the grade ladder on
 * the trailing edge, and the attribute grid under both. Compact, it is a
 * drill-in from a ledger row with a way back.
 *
 * The ladder is `ui/outfitting/grade-selector` and the grid is
 * `ui/components/metric-group`, both as they stand: the bench states grades and
 * figures the way the ship tool already does, and a second control for one
 * choice would be a second design (constitution VII).
 *
 * **The Flight Suit is stated honestly.** Its one grade unlocks no modification
 * slot, so the region says the suit cannot be upgraded rather than drawing four
 * locked slots with nothing to explain them (spec Edge Cases).
 */
@Component({
  selector: 'ednb-item-view',
  imports: [ChoiceList, GameText, GradeSelector, MetricGroup, ModificationSlots],
  templateUrl: './item-view.html',
  styleUrl: './item-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemView {
  readonly #messages = inject(MessageService);
  readonly #presenter = inject(LoadoutPresenter);

  /** The item to show, or nothing where the bench is empty or nothing is chosen. */
  readonly item = input<ItemViewModel | null>(null);

  /** Which modification slot has its picker open under the grid, or none. */
  readonly openSlot = input<number | null>(null);

  /** Whether the compact drill-in's way back is drawn. */
  readonly showBack = input(false);

  readonly gradeChosen = output<number>();
  /** The suit family or weapon symbol chosen from the inline alternatives. */
  readonly alternativeChosen = output<string>();
  /** Which of the item's four modification slots a Commander opened. */
  readonly slotOpened = output<number>();
  readonly closed = output<void>();

  readonly headingId = relationId('item-heading');

  readonly noSelectionLabel = this.#messages.messageSignal('equipment.item.noSelection');
  readonly backLabel = this.#messages.messageSignal('equipment.back');

  readonly attributesLabel = computed(() => this.item()?.name.text ?? '');

  /** `G1`…`G5`: how the equipment canvas writes a grade, ladder and chip alike. */
  readonly gradeLabels = computed(() =>
    (this.item()?.grades ?? []).map((grade) =>
      this.#messages.message('equipment.grade.short', { grade }),
    ),
  );

  /**
   * What else this item could be — the suits, or this mount's own weapons.
   *
   * Asked of the presenter here rather than threaded through the page, the way
   * the chooser over this view already asks. What is on the item is listed among
   * them and marked, which is what the 2026-09-04 canvas revision settled.
   */
  readonly alternatives = computed<readonly EquipmentChoice[]>(() => {
    const item = this.item();
    if (item === null) return [];
    const offered =
      item.target === 'suit'
        ? this.#presenter.suitChoices().map((choice) => ({ id: choice.family, ...choice }))
        : this.#presenter.weaponChoices(item.target).map((choice) => ({
            id: choice.symbol,
            ...choice,
          }));

    // The whole catalogue, the fitted one among them and marked. The canvas
    // filtered it out until 2026-09-04 and now lists it with the amber wash and
    // the solid edge every selected row carries (`k === curKey`): a list of
    // three when a suit is worn and four when none is reads as a catalogue that
    // changes size, and the row a Commander is comparing against is the one
    // that was missing from it.
    return offered.map((choice) => ({
      id: choice.id,
      name: choice.name,
      meta: choice.meta,
      figure: choice.figure,
      figureUnit: 'figureUnit' in choice ? choice.figureUnit : null,
      current: choice.current,
    }));
  });
}
