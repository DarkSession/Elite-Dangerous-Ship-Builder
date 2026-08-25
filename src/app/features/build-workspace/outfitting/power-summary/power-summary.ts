import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { PowerConditionsStore } from '../../../../application/power-heat/power-conditions.store';
import { projectPowerHeat, type PowerAndHeat } from '../../../../domain/power-heat/power-heat';
import { Formatters } from '../../../../i18n/formatters/formatters';
import { MessageService } from '../../../../i18n/message.service';
import { relationId } from '../../../../ui/a11y/text-equivalence';

/** One rail statement: a group the plant cannot keep lit, said in a sentence. */
interface StatementView {
  /** Stable within one projection, for tracking only. Never translated. */
  readonly id: string;
  readonly text: string;
}

/** The bar under the figures, as three lengths and the reading it carries. */
interface BarView {
  readonly powered: number;
  readonly unpowered: number;
  readonly plant: number;
  readonly label: string;
}

/** Megawatts to two places, as the canvas sets every power figure. */
const MW_DIGITS = 2;

/**
 * What the plant is doing, in the outfitting status rail.
 *
 * Canvas 1c draws three things here, between feature 003's validation issues
 * and the six metric cells features 006 to 008 own: the sentence about a group
 * the plant cannot keep lit, the `POWER` line — `29.64 / 31.20 MW · 7.80 OFF`
 * over a bar of the same four figures — and, since the 2026-08-25 revision, the
 * `SYS` / `ENG` / `WEP` pip control. **Two of the three are built.** The pips
 * are this feature's own open task (`specs/005-power-and-heat/tasks.md`, T074;
 * `design/power-and-heat-detail.md`, "The rail's pip control"), and they belong
 * in this component when they land, because the allocation is one viewing
 * condition and this is the rail's half of it. Canvas 1d draws the first two in
 * its Status mode and no pip control at all.
 *
 * No severity word and no all-clear line, because neither canvas draws either.
 * And no heat sentence — but that one is absent by ruling rather than for want
 * of a drawing: canvas 1d does print `Sustained fire peaks at 131% heat` in its
 * `BUILD STATUS` block, and this feature's wave-13 ruling withdrew that tier
 * entirely (`specs/005-power-and-heat/design/reference-review.md`, "Tier 2 is
 * withdrawn entirely").
 *
 * The bar's `79%`, `21%` and `83.3%` are the artboard's own figures over the
 * whole demand — `29.64`, `7.80` and `31.20` against `37.44` — so it is drawn
 * from the projection rather than reverse-engineered, and the projection is
 * where the division is done.
 *
 * Nothing **built** here is interactive yet. That is the pip control being
 * absent rather than a rule: feature 003's issue list above it is not
 * interactive by ruling, but this block's third contribution is a control, and
 * the tests asserting the block holds none hold only until T074. At both widths
 * the dashboard these sentences describe is a segment away.
 *
 * The sentence is this application's own, not a package diagnostic, so it is
 * translated like every other string it owns and does not go through
 * `edsb-game-text`.
 */
@Component({
  selector: 'edsb-power-summary',
  templateUrl: './power-summary.html',
  styleUrl: './power-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PowerSummary {
  readonly #active = inject(ActiveBuildStore);
  readonly #conditions = inject(PowerConditionsStore);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  readonly powerLabelId = relationId('rail-power');

  readonly powerLabel = this.#messages.messageSignal('power.rail.label');

  /**
   * The projection, always read with the hardpoints deployed.
   *
   * The rail states what this build does, not what the dashboard is currently
   * showing: a group the plant sheds when the hardpoints come out is shed
   * whether or not a Commander happens to be reading the stowed figures at the
   * time, and it is the deployed state the package publishes a verdict for.
   *
   * `revision()` is read first because the loadout signal holds one mutable
   * package object: an edit changes what it contains without changing the
   * reference, so the revision is what actually says "this is different now".
   */
  readonly #projection = computed<PowerAndHeat | null>(() => {
    this.#active.revision();
    const loadout = this.#active.loadout();
    return loadout === null
      ? null
      : projectPowerHeat(loadout, {
          hardpoints: 'deployed',
          // The allocation changes the distributor and nothing this block
          // reads; it is passed through rather than invented so the package is
          // asked about one ship rather than two.
          pips: this.#conditions.pips(),
        });
  });

  /** Nothing is drawn without a build. The workspace already says why it is empty. */
  readonly shown = computed(() => this.#projection() !== null);

  /**
   * One sentence per group the plant leaves dark, and nothing else.
   *
   * A build the plant covers draws no sentence at all — not an all-clear line,
   * not a zero count. Neither canvas draws such a state, and silence claims
   * strictly less than an all-clear would.
   */
  readonly statements = computed<readonly StatementView[]>(() => {
    const projection = this.#projection();
    if (projection === null) {
      return [];
    }

    return projection.power.bands
      .filter((band) => !band.powered)
      .map((band) => ({
        id: `band-${band.priority}`,
        text: this.#messages.message('power.rail.shed', {
          group: this.#formatters.integer(band.priority),
          draw: this.#megawatts(band.draw),
        }),
      }));
  });

  /**
   * The canvas's `29.64 / 31.20 MW · 7.80 OFF`.
   *
   * The first figure is the draw the plant keeps lit, not the whole demand: the
   * artboard sets `29.64` here against a module list that totals `37.44`, and
   * the `7.80` after the plant's output is the difference. A build with nothing
   * dark has no remainder to state and drops the suffix rather than printing a
   * zero the artboard never draws.
   */
  readonly figures = computed(() => {
    const power = this.#projection()?.power;
    if (power === undefined) {
      return null;
    }

    const figures = {
      draw: this.#formatters.decimal(power.poweredDraw, MW_DIGITS),
      available: this.#megawatts(power.available),
    };

    return power.unpowered > 0
      ? this.#messages.message('power.rail.figures.shed', {
          ...figures,
          off: this.#formatters.decimal(power.unpowered, MW_DIGITS),
        })
      : this.#messages.message('power.rail.figures', figures);
  });

  /**
   * The bar under them, and the one reading it carries in words.
   *
   * The lengths are decoration on top of the figures beside them: a reader who
   * cannot see the amber against the hatch has already been told what is lit and
   * what is not, in the line above and in the sentence above that.
   */
  readonly bar = computed<BarView | null>(() => {
    const power = this.#projection()?.power;
    return power === undefined
      ? null
      : {
          ...power.bar,
          label: this.#messages.message('power.rail.bar', {
            powered: this.#formatters.percent(power.bar.powered),
          }),
        };
  });

  #megawatts(value: number): string {
    return this.#messages.message('power.format.megawatts', {
      value: this.#formatters.decimal(value, MW_DIGITS),
    });
  }
}
