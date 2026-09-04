import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import type { EditTarget } from '../../../domain/equipment/loadout/loadout-edit';
import { MessageService } from '../../../i18n/message.service';
import { Layer } from '../../../ui/components/layer/layer';
import { ChoiceList, type EquipmentChoice } from '../../../ui/equipment/choice-list';

/**
 * What may go in one modification slot.
 *
 * The same layer and the same row shape as the weapon chooser, because the
 * canvas draws one row for both: a name over a code line. Here the code line is
 * the engineers who grant the recipe — the canvas's own recipe list carries
 * them and its render drops them, and a Commander choosing a modification is
 * choosing an errand as much as a figure (FR-010).
 *
 * A recipe another slot on this item already holds stays in the list, marked
 * and refused. Dropping it would answer "where is the one I wanted" with
 * silence (FR-009).
 *
 * Clearing is a control in the chooser rather than something that appears on
 * hover: a slot is emptied by opening it and saying so, which is reachable
 * however a Commander is driving the bench (FR-012).
 */
@Component({
  selector: 'edsb-modification-chooser',
  imports: [ChoiceList, Layer, NgTemplateOutlet],
  templateUrl: './modification-chooser.html',
  styleUrl: './modification-chooser.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModificationChooser {
  readonly #presenter = inject(LoadoutPresenter);
  readonly #messages = inject(MessageService);

  readonly open = input(false);

  /**
   * Canvas 1a's arrangement: the picker expanded in the item column.
   *
   * Not a layer at all there. `#pe-pick` carries no `position`, no `inset` and
   * no `z-index` — it is a sibling of the slot grid that goes from `display:
   * none` to `display: flex`, and the block under it moves down. Compact, where
   * there is no column to expand into, canvas 1b takes the screen instead.
   */
  readonly inline = input(false);

  /** The item the slot belongs to: the suit, or one mount's weapon. */
  readonly target = input<EditTarget | null>(null);

  /** Which of the item's four slots is being filled, zero-based. */
  readonly slot = input<number | null>(null);

  readonly chosen = output<string>();
  readonly cleared = output<void>();
  readonly dismissed = output<void>();

  readonly closeLabel = this.#messages.messageSignal('equipment.chooser.close');
  readonly clearLabel = this.#messages.messageSignal('equipment.chooser.clear');

  readonly title = computed(() => {
    const slot = this.slot();
    return slot === null ? '' : this.#presenter.modificationChooserTitle(slot);
  });

  readonly choices = computed<readonly EquipmentChoice[]>(() => {
    const target = this.target();
    const slot = this.slot();
    if (target === null || slot === null) return [];
    const fittedLabel = this.#messages.message('equipment.chooser.fitted');

    return this.#presenter.modificationChoices(target, slot).map((choice) => ({
      id: choice.symbol,
      name: choice.name,
      meta: choice.engineers,
      figure: null,
      current: choice.current,
      // Held elsewhere on this item, which is not the same as being in this
      // slot: the one in this slot is the current choice, not a refusal.
      unavailable: choice.fitted && !choice.current,
      unavailableLabel: choice.fitted && !choice.current ? fittedLabel : null,
    }));
  });
}
