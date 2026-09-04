import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { CommanderStatsView } from '../../../application/equipment/loadout.presenter';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../../ui/a11y/text-equivalence';
import { GameText } from '../../../ui/components/game-text/game-text';
import { MetricGroup, type Metric } from '../../../ui/components/metric-group/metric-group';
import { ResistanceBar } from '../../../ui/equipment/resistance-bar';

/**
 * What the assembled Commander is worth.
 *
 * Canvas 1a's trailing column: the shield strength and regeneration as a pair
 * of cells, the four resistances as signed bars in a group of their own, and one
 * firepower row per weapon that counts.
 *
 * The canvas draws two resistance groups, `ARMOUR` over `SHIELDS`. The library
 * publishes one set — `SuitGrade.kinetic/thermal/plasma/explosiveResistance` —
 * and the canvas's `ARMOUR` bars are a flat `0.2` whenever `Damage Resistance`
 * is fitted, which is the mock's own arithmetic and is already folded into the
 * published four. So one group of bars, in a block of its own: they are the
 * suit's resistances rather than the shield's, and under the `SHIELDS` heading
 * they read as the latter (013 design/reference-review.md).
 *
 * A held mount contributes no row: its weapon is on the bench and in no figure
 * until a suit carrying its mount is worn again (FR-007). The canvas works out
 * a total across the primaries and does not draw one, so neither does this.
 */
@Component({
  selector: 'edsb-commander-stats',
  imports: [GameText, MetricGroup, ResistanceBar],
  templateUrl: './commander-stats.html',
  styleUrl: './commander-stats.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommanderStats {
  readonly #messages = inject(MessageService);

  readonly stats = input<CommanderStatsView | null>(null);

  /**
   * Canvas 1b's arrangement, where the tab strip above already says `STATS`.
   *
   * The words stay for anyone reading the region aloud, which is what names it
   * — the same thing the gate does with its own heading on canvas 2b.
   */
  readonly compact = input(false);

  readonly shieldsHeadingId = relationId('commander-shields');
  readonly resistancesHeadingId = relationId('commander-resistances');
  readonly firepowerHeadingId = relationId('commander-firepower');

  /** The column's own name, which canvas 1a and 2a draw over its first rule. */
  readonly regionLabel = this.#messages.messageSignal('equipment.region.stats');
  readonly shieldsLabel = this.#messages.messageSignal('equipment.stats.shields');
  readonly resistancesLabel = this.#messages.messageSignal('equipment.stats.resistances');
  readonly firepowerLabel = this.#messages.messageSignal('equipment.stats.firepower');

  /** The strength-and-regeneration pair, as the design system's metric cells. */
  readonly shieldFigures = computed<readonly Metric[]>(() => {
    const stats = this.stats();
    if (stats === null) return [];
    return [
      {
        id: 'strength',
        label: this.#messages.message('equipment.stats.strength'),
        value: stats.shieldStrength,
      },
      {
        id: 'regen',
        label: this.#messages.message('equipment.stats.regen'),
        value: stats.shieldRegeneration,
      },
    ];
  });
}
