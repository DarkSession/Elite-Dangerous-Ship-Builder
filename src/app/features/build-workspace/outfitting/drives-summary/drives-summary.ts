import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { PowerConditionsStore } from '../../../../application/power-heat/power-conditions.store';
import {
  projectMobilityAndJump,
  type MobilityAndJump,
} from '../../../../domain/mobility-jump/mobility-jump';
import { Formatters } from '../../../../i18n/formatters/formatters';
import { MessageService } from '../../../../i18n/message.service';
import type { Metric } from '../../../../ui/components/metric-group/metric-group';
import { MetricGroup } from '../../../../ui/components/metric-group/metric-group';

/**
 * A jump to one decimal and a speed and a mass whole, exactly as the two cards
 * in the anatomy region set the same three figures.
 *
 * The rail cell and the card are one reading of one build seen twice, so a rail
 * that rounded differently would put two different numbers for the same
 * quantity six centimetres apart. The canvas sets its rail at those precisions
 * too — `21.4 ly`, `200 m/s`, `1,142 t`.
 */
const RANGE_DIGITS = 1;
const RATE_DIGITS = 0;
const MASS_DIGITS = 0;

/**
 * The `JUMP`, `SPEED` and `MASS` cells of canvas 1c's status rail.
 *
 * The rail closes with a metric grid of six cells — `SHIELD`, `ARMOUR`, `DPS`,
 * `JUMP`, `SPEED` and `MASS` — and features 006 to 008 own them between them.
 * These are this feature's three, drawn under feature 007's `DPS` and above the
 * cost block, exactly where canvas 1c draws them. Canvas 1d draws the same
 * three in its Status mode.
 *
 * Every one is the same figure the `DRIVES` mode of the anatomy region draws,
 * from the same projection asked the same way: `JUMP` is the laden profile the
 * drive card heads `Jump laden`, `SPEED` the top speed at the head of its speed
 * envelope, and `MASS` the thruster card's own headline. One reading of one
 * build, so the rail and the card can never disagree.
 *
 * Nothing here is interactive, as none of the rail's six cells is: the canvas
 * draws no control in that grid. The rail around it is another matter since
 * the 2026-08-25 revision, which put feature 005's pip control in it
 * (`specs/003-ship-statistics/design/status-rail.md`, item 4). At both widths
 * the two cards these figures come from are a segment away.
 *
 * A figure the package could not settle has no value, and the cell says so
 * rather than standing at zero — a zero is a number a Commander might act on
 * (constitution IV).
 */
@Component({
  selector: 'edsb-drives-summary',
  imports: [MetricGroup],
  templateUrl: './drives-summary.html',
  styleUrl: './drives-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrivesSummary {
  readonly #active = inject(ActiveBuildStore);
  readonly #conditions = inject(PowerConditionsStore);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  readonly railLabel = this.#messages.messageSignal('drives.rail.label');

  /**
   * The projection at the standing ENG allocation.
   *
   * `revision()` is read first because the loadout signal holds one mutable
   * package object: an edit changes what it contains without changing the
   * reference, so the revision is what actually says "this is different now".
   */
  readonly #projection = computed<MobilityAndJump | null>(() => {
    this.#active.revision();
    const loadout = this.#active.loadout();
    return loadout === null
      ? null
      : projectMobilityAndJump(loadout, this.#conditions.pips().engines);
  });

  /** Nothing is drawn without a build. The workspace already says why it is empty. */
  readonly shown = computed(() => this.#projection() !== null);

  readonly cells = computed<readonly Metric[]>(() => {
    const projection = this.#projection();
    if (projection === null) {
      return [];
    }
    // All three absences have one cause — a load the package could not settle —
    // so all three say the same word the cards say for it.
    const incompleteLabel = this.#messages.message('incomplete.value');
    const laden = projection.drive.profiles.find((profile) => profile.load === 'laden');
    const capacitor = projection.thrusters.capacitor;
    const total = projection.thrusters.mass?.total;

    return [
      {
        id: 'jump',
        label: this.#messages.message('drives.rail.jump'),
        value: laden ? this.#formatters.decimal(laden.range, RANGE_DIGITS) : null,
        unit: this.#messages.message('drives.rail.light-years'),
        unavailableLabel: incompleteLabel,
      },
      {
        id: 'speed',
        label: this.#messages.message('drives.rail.speed'),
        value: capacitor ? this.#formatters.decimal(capacitor.speed, RATE_DIGITS) : null,
        unit: this.#messages.message('drives.rail.metres-per-second'),
        unavailableLabel: incompleteLabel,
      },
      {
        id: 'mass',
        label: this.#messages.message('drives.rail.mass'),
        value: total === undefined ? null : this.#formatters.decimal(total, MASS_DIGITS),
        unit: this.#messages.message('drives.rail.tonnes'),
        unavailableLabel: incompleteLabel,
      },
    ];
  });
}
