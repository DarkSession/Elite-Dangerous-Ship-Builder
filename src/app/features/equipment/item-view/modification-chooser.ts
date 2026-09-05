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
 * canvas draws one row for both. Here the row is the recipe's name alone: the
 * canvas's picker draws `'<div …>' + m[0] + '</div>'` and nothing under it. The
 * package names the engineers who grant each recipe and no artboard draws one,
 * so neither does this (Commander request 2026-09-04, FR-010 revised).
 *
 * A recipe another slot on this item already holds is not offered. The
 * 2026-09-04 canvas revision filters it out of the picker
 * (`lib.filter(m => !(list.indexOf(m[0]) > -1 && list.indexOf(m[0]) !== st.pick))`)
 * rather than drawing it refused, so the slot it is in is where a Commander
 * finds it (FR-009).
 *
 * Clearing is a control in the chooser rather than something that appears on
 * hover: a slot is emptied by opening it and saying so, which is reachable
 * however a Commander is driving the bench (FR-012).
 */
@Component({
  selector: 'ednb-modification-chooser',
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
    return this.#presenter.modificationChoices(target, slot).map((choice) => ({
      id: choice.symbol,
      name: choice.name,
      meta: null,
      figure: null,
      current: choice.current,
    }));
  });
}
