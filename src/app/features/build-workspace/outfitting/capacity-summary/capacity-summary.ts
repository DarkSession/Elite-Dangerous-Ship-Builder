import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import {
  projectCapacity,
  type BuildCapacity,
} from '../../../../domain/ships/build-capacity/build-capacity';
import { Formatters } from '../../../../i18n/formatters/formatters';
import { MessageService } from '../../../../i18n/message.service';
import type { Metric } from '../../../../ui/components/metric-group/metric-group';
import { MetricGroup } from '../../../../ui/components/metric-group/metric-group';

/**
 * The `CARGO` and `PASSENGERS` cells of the status rail.
 *
 * The rail's band closes with these two, after the six results features 006 to
 * 008 own. Neither is a result: they are what the fitted racks and cabins add up
 * to on the build itself, and the package carries both on the build rather than
 * on `BuildMetrics` (003/FR-023).
 *
 * Both always answer, so both always draw a figure. A build with no rack and no
 * cabin reads `0` in each, which is what the package says it carries — the rule
 * against substituting a zero is about a figure the package could not give, and
 * these two are never in that state.
 *
 * Nothing here is interactive, as no cell in that band is: the canvas draws no
 * control in the grid.
 */
@Component({
  selector: 'ednb-capacity-summary',
  imports: [MetricGroup],
  templateUrl: './capacity-summary.html',
  styleUrl: './capacity-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapacitySummary {
  readonly #active = inject(ActiveBuildStore);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  readonly railLabel = this.#messages.messageSignal('capacity.rail.label');

  /**
   * What the build carries.
   *
   * `revision()` is read first because the loadout signal holds one mutable
   * package object: an edit changes what it contains without changing the
   * reference, so the revision is what actually says "this is different now".
   */
  readonly #projection = computed<BuildCapacity | null>(() => {
    this.#active.revision();
    const loadout = this.#active.loadout();
    return loadout === null ? null : projectCapacity(loadout);
  });

  /** Nothing is drawn without a build. The workspace already says why it is empty. */
  readonly shown = computed(() => this.#projection() !== null);

  readonly cells = computed<readonly Metric[]>(() => {
    const capacity = this.#projection();
    if (capacity === null) {
      return [];
    }

    return [
      {
        id: 'cargo',
        label: this.#messages.message('capacity.rail.cargo'),
        value: this.#formatters.integer(capacity.cargoTonnes),
        unit: this.#messages.message('capacity.rail.tonnes'),
      },
      {
        id: 'passengers',
        label: this.#messages.message('capacity.rail.passengers'),
        value: this.#formatters.integer(capacity.passengerBerths),
      },
    ];
  });
}
