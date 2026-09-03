import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { EditTarget } from '../../../domain/equipment/loadout/loadout-edit';
import type { LedgerRowView, LedgerView } from '../../../application/equipment/loadout.presenter';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../../ui/a11y/text-equivalence';
import { GameText } from '../../../ui/components/game-text/game-text';
import { SuitTools } from '../suit-tools/suit-tools';

/**
 * The loadout: the suit, one row per catalogue mount, and the tools it carries.
 *
 * The canvas rules three headings down the leading column — `SUIT`, `WEAPONS`,
 * `SUIT TOOLS` — each with a count at its trailing edge and rows beneath it.
 * A row carries a two-character mount code, the item's name over its code line,
 * the grade it is set to and how many of its modification slots are filled.
 *
 * **A held mount keeps its weapon's name.** The canvas replaces the name with
 * `Slot unavailable`; an unavailable row whose content is invisible would lose
 * the very thing FR-007 retains, so the weapon stays named and the code line
 * says the worn suit has no such mount. Held and unavailable read as words, not
 * as dimming (constitution V).
 *
 * A mount the suit does not carry with nothing on it is not drawn at all: there
 * is no weapon to name and no mount to fill.
 */
@Component({
  selector: 'edsb-loadout-ledger',
  imports: [GameText, NgTemplateOutlet, SuitTools],
  templateUrl: './loadout-ledger.html',
  styleUrl: './loadout-ledger.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadoutLedger {
  readonly #messages = inject(MessageService);

  readonly ledger = input.required<LedgerView>();

  /** Which item the item view is showing, so the ledger can mark its row. */
  readonly selected = input<EditTarget | null>(null);

  /** A row a Commander chose. A held row emits nothing. */
  readonly opened = output<EditTarget>();

  readonly suitHeadingId = relationId('ledger-suit');
  readonly weaponsHeadingId = relationId('ledger-weapons');

  readonly suitLabel = this.#messages.messageSignal('equipment.ledger.suit');
  readonly weaponsLabel = this.#messages.messageSignal('equipment.ledger.weapons');

  readonly suitCount = computed(() =>
    this.#messages.message('equipment.ledger.suit.count', {
      count: this.ledger().suit === null ? 0 : 1,
    }),
  );

  readonly weaponCount = computed(() =>
    this.#messages.message('equipment.ledger.weapons.count', {
      count: this.ledger().weapons.length,
    }),
  );

  choose(row: LedgerRowView): void {
    // A held mount is not a choice: the suit has no room for it, and the row is
    // there to say the weapon is still on the bench.
    if (row.held) return;
    this.opened.emit(row.target);
  }
}
