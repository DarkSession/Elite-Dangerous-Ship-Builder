import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { hardpointCoverage } from '../../../../application/outfitting/hardpoint-coverage.adapter';
import { OutfittingStore } from '../../../../application/outfitting/outfitting.store';
import { PowerConditionsStore } from '../../../../application/power-heat/power-conditions.store';
import { projectOffence, type Offence } from '../../../../domain/offence/offence';
import { Formatters } from '../../../../i18n/formatters/formatters';
import { MessageService } from '../../../../i18n/message.service';
import type { Metric } from '../../../../ui/components/metric-group/metric-group';
import { MetricGroup } from '../../../../ui/components/metric-group/metric-group';

/** Damage rates to one place, as the canvas sets every figure in the rail. */
const DAMAGE_DIGITS = 1;

/**
 * The `DPS` cell of the outfitting status rail.
 *
 * Canvas 1c draws six metric cells under feature 005's `POWER` line — `SHIELD`,
 * `ARMOUR`, `DPS`, `JUMP`, `SPEED` and `MASS` — and canvas 1d draws the same
 * six. `DPS` is this feature's and the only one it may add.
 *
 * The canvas draws those six as one grid of cells on a hairline ground, each a
 * tracked micro label stacked over a mono figure — which is exactly what the
 * design system's metric group already draws, and what feature 006 composes for
 * `SHIELD` and `ARMOUR` two cells to the left. This composes the same one
 * rather than setting a second version of it here (constitution VII).
 *
 * A label and a bare figure, and nothing else: the canvas gives the cell no
 * unit, no second figure and no condition, so none is added. The figure is
 * sustained damage per second, which is what the specification settles and what
 * the canvas cannot — its own two panels call the same number burst on one and
 * sustained on the other (`design/canvas-contract.md`, review note 2).
 *
 * Unavailable hardpoint coverage qualifies the cell once, as the cell's own
 * description, because a rail figure that might be missing a weapon is a figure
 * a Commander would otherwise read as complete — and a qualification a screen
 * reader reaches separately from the value it qualifies is not one. An exact
 * zero is not qualified: zero is an answer.
 */
@Component({
  selector: 'edsb-offence-summary',
  imports: [MetricGroup],
  templateUrl: './offence-summary.html',
  styleUrl: './offence-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OffenceSummary {
  readonly #active = inject(ActiveBuildStore);
  readonly #outfitting = inject(OutfittingStore);
  readonly #conditions = inject(PowerConditionsStore);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  readonly railLabel = this.#messages.messageSignal('offence.rail.group');

  readonly label = this.#messages.messageSignal('offence.rail.label');
  readonly qualification = this.#messages.messageSignal('offence.rail.unavailable');

  /**
   * The projection for the active build.
   *
   * `revision()` is read first because the loadout signal holds one mutable
   * package object: an edit changes what it contains without changing the
   * reference, so the revision is what actually says "this is different now".
   */
  readonly #projection = computed<Offence | null>(() => {
    this.#active.revision();
    const loadout = this.#active.loadout();
    if (loadout === null) {
      return null;
    }
    return projectOffence(
      loadout,
      hardpointCoverage(this.#outfitting.slots()),
      this.#conditions.pips().weapons,
    );
  });

  /** Nothing is drawn without a build. The workspace already says why it is empty. */
  readonly shown = computed(() => this.#projection() !== null);

  readonly figure = computed(() => {
    const offence = this.#projection();
    return offence === null
      ? null
      : this.#formatters.decimal(offence.build.total.sustainedDamagePerSecond, DAMAGE_DIGITS);
  });

  readonly qualified = computed(() => this.#projection()?.collection === 'coverageUnavailable');

  /** The canvas's one cell, in the shape the canvas's other five take. */
  readonly cells = computed<readonly Metric[]>(() => {
    const value = this.figure();
    if (value === null) {
      return [];
    }

    return [
      {
        id: 'dps',
        label: this.label(),
        value,
        ...(this.qualified() ? { description: this.qualification() } : {}),
      },
    ];
  });
}
