import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { EditTarget } from '../../../domain/equipment/loadout/loadout-edit';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import { MessageService } from '../../../i18n/message.service';
import { Layer } from '../../../ui/components/layer/layer';
import { ChoiceList, type EquipmentChoice } from '../../../ui/equipment/choice-list';

/**
 * What may go on the selected item: the suits, or one mount's own weapons.
 *
 * It opens over the item view rather than beside it, as the canvas draws it, so
 * a narrow column never has to hold two lists. Compact, the same layer is a
 * sheet over the drill-in (013 design/equipment-bench.md).
 *
 * A mount is offered only the weapons whose `PersonalWeapon.slot` is that
 * mount's kind — never the whole catalogue, so a rifle is never a choice for a
 * sidearm mount (FR-003, FR-004).
 */
@Component({
  selector: 'edsb-weapon-chooser',
  imports: [ChoiceList, Layer],
  templateUrl: './weapon-chooser.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeaponChooser {
  readonly #presenter = inject(LoadoutPresenter);
  readonly #messages = inject(MessageService);

  readonly open = input(false);

  /** Which item the chooser is for: the suit, or the mount to fill. */
  readonly target = input<EditTarget | null>(null);

  readonly title = input('');

  /** The suit family or weapon symbol a Commander chose. */
  readonly chosen = output<string>();
  readonly dismissed = output<void>();

  readonly closeLabel = this.#messages.messageSignal('equipment.chooser.close');

  readonly choices = computed<readonly EquipmentChoice[]>(() => {
    const target = this.target();
    if (target === null) return [];
    const offered =
      target === 'suit'
        ? this.#presenter.suitChoices().map((choice) => ({ id: choice.family, ...choice }))
        : this.#presenter.weaponChoices(target).map((choice) => ({ id: choice.symbol, ...choice }));

    return offered.map((choice) => ({
      id: choice.id,
      name: choice.name,
      meta: choice.meta,
      figure: choice.figure,
      current: choice.current,
      unavailable: false,
      unavailableLabel: null,
    }));
  });
}
