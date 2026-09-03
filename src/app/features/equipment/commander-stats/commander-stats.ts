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
 * of cells, the four resistances as signed bars beneath them, and one firepower
 * row per weapon that counts.
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

  readonly shieldsHeadingId = relationId('commander-shields');
  readonly firepowerHeadingId = relationId('commander-firepower');

  readonly shieldsLabel = this.#messages.messageSignal('equipment.stats.shields');
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
