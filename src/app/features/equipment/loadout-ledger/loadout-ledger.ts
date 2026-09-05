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
  selector: 'ednb-loadout-ledger',
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

  /**
   * Whether the ledger is drawn as canvas 1b draws it, in a column of its own.
   *
   * The rows are read at arm's length there rather than beside the item they
   * name, so the canvas steps their names up; wide keeps them at the size the
   * three columns share.
   */
  readonly compact = input(false);

  /**
   * Whether there is a suit on the bench.
   *
   * Canvas 2a and 2b draw the whole ledger back at a third of its ink while
   * there is not: every row is a mount that cannot be filled yet, and the one
   * live thing on the screen is the chooser beside them. The words say `Locked`
   * either way — the dimming is the second carrier, not the only one
   * (constitution V).
   */
  readonly worn = input(true);

  /**
   * Whether a row opens a screen of its own instead of selecting in place.
   *
   * Canvas 1b draws a `›` on the rows that open one and marks none of them:
   * compact replaces the ledger with the item view, so there is no selected row
   * to see. Canvas 1a keeps the item beside the ledger and marks the row it is
   * about, and draws no chevron. An empty bench drills into nothing at either
   * width — canvas 2b keeps the gate under the rows.
   */
  readonly drillsIn = computed(() => this.compact() && this.worn());

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
