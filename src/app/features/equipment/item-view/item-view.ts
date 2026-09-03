import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { ItemView as ItemViewModel } from '../../../application/equipment/loadout.presenter';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../../ui/a11y/text-equivalence';
import { GameText } from '../../../ui/components/game-text/game-text';
import { MetricGroup } from '../../../ui/components/metric-group/metric-group';
import { GradeSelector } from '../../../ui/outfitting/grade-selector';

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
  selector: 'edsb-item-view',
  imports: [GameText, GradeSelector, MetricGroup],
  templateUrl: './item-view.html',
  styleUrl: './item-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemView {
  readonly #messages = inject(MessageService);

  /** The item to show, or nothing where the bench is empty or nothing is chosen. */
  readonly item = input<ItemViewModel | null>(null);

  /** Whether the compact drill-in's way back is drawn. */
  readonly showBack = input(false);

  readonly gradeChosen = output<number>();
  readonly chooserOpened = output<void>();
  readonly closed = output<void>();

  readonly headingId = relationId('item-heading');

  readonly noSelectionLabel = this.#messages.messageSignal('equipment.item.noSelection');
  readonly backLabel = this.#messages.messageSignal('equipment.back');

  readonly attributesLabel = computed(() => this.item()?.name.text ?? '');
}
