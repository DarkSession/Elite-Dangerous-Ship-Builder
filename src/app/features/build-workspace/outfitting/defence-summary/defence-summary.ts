import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { PowerConditionsStore } from '../../../../application/power-heat/power-conditions.store';
import { projectDefence, type Defence } from '../../../../domain/defence/defence';
import { Formatters } from '../../../../i18n/formatters/formatters';
import { MessageService } from '../../../../i18n/message.service';
import type { Metric } from '../../../../ui/components/metric-group/metric-group';
import { MetricGroup } from '../../../../ui/components/metric-group/metric-group';

/** Megajoules and hull points whole, as the canvas sets every rail figure. */
const POOL_DIGITS = 0;

/**
 * The `SHIELD` and `ARMOUR` cells of canvas 1c's status rail.
 *
 * The rail closes with a metric grid of six cells — `SHIELD`, `ARMOUR`, `DPS`,
 * `JUMP`, `SPEED` and `MASS` — and features 006 to 008 own two apiece. These
 * are this feature's two, drawn under feature 005's `POWER` line and above the
 * cost block, exactly where canvas 1c draws them. Canvas 1d draws the same two
 * in its Status mode.
 *
 * Nothing here is interactive, as nothing else in the rail is: the canvas draws
 * no control in it, and at both widths the analysis these two figures come from
 * is a segment away.
 *
 * A shield the package could not read has no figure, and the cell says so
 * rather than standing at zero — a zero is a number a Commander might act on
 * (constitution IV). The hull is never in that state: `armourMetrics()` answers
 * for every build, so its cell always carries a figure.
 */
@Component({
  selector: 'edsb-defence-summary',
  imports: [MetricGroup],
  templateUrl: './defence-summary.html',
  styleUrl: './defence-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefenceSummary {
  readonly #active = inject(ActiveBuildStore);
  readonly #conditions = inject(PowerConditionsStore);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  readonly railLabel = this.#messages.messageSignal('defence.rail.label');

  /**
   * The projection at the standing SYS allocation.
   *
   * `revision()` is read first because the loadout signal holds one mutable
   * package object: an edit changes what it contains without changing the
   * reference, so the revision is what actually says "this is different now".
   */
  readonly #projection = computed<Defence | null>(() => {
    this.#active.revision();
    const loadout = this.#active.loadout();
    return loadout === null
      ? null
      : projectDefence(loadout, { systemsPips: this.#conditions.pips().systems });
  });

  /** Nothing is drawn without a build. The workspace already says why it is empty. */
  readonly shown = computed(() => this.#projection() !== null);

  readonly cells = computed<readonly Metric[]>(() => {
    const projection = this.#projection();
    if (projection === null) {
      return [];
    }

    const shield = projection.shield;
    return [
      {
        id: 'shield',
        label: this.#messages.message('defence.rail.shield'),
        value:
          shield.kind === 'complete'
            ? this.#formatters.decimal(shield.value.strength, POOL_DIGITS)
            : null,
        unit: this.#messages.message('defence.rail.megajoules'),
        unavailableLabel: this.#messages.message('unavailable.value'),
      },
      {
        id: 'armour',
        label: this.#messages.message('defence.rail.armour'),
        value: this.#formatters.decimal(projection.armour.hitPoints, POOL_DIGITS),
      },
    ];
  });
}
