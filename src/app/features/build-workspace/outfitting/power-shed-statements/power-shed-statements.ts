import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { PowerConditionsStore } from '../../../../application/power-heat/power-conditions.store';
import { projectPowerHeat, type PowerAndHeat } from '../../../../domain/power-heat/power-heat';
import { Formatters } from '../../../../i18n/formatters/formatters';
import { MessageService } from '../../../../i18n/message.service';

/** One statement: a group the plant cannot keep lit, said in a sentence. */
interface StatementView {
  /** Stable within one projection, for tracking only. Never translated. */
  readonly id: string;
  readonly text: string;
}

/** Megawatts to two places, as the canvas sets every power figure. */
const MW_DIGITS = 2;

/**
 * The groups the plant leaves dark, drawn in the rail's `BUILD STATUS` block.
 *
 * Feature 005 owns the sentence — what it says, what it reads and when it is
 * drawn at all — and feature 003's rail places it, beneath the package's own
 * validation issues. That is the same arrangement feature 004's
 * import-completion notice already sits under: both are what there is to say
 * about the build that is now open, and the block that opens the rail is where
 * a Commander looks for it (003 spec, "Scope"; 005/FR-013).
 *
 * Before that it was drawn a block lower, over the `POWER` line, where a
 * Commander reading the status block had to look past the metric cells to find
 * out that part of their ship was dark (Commander request 2026-08-31).
 *
 * A build the plant covers draws nothing at all — not an all-clear line, not a
 * zero count. Neither canvas draws such a state, and silence claims strictly
 * less than an all-clear would.
 *
 * The sentence is this application's own rather than a package diagnostic, so
 * it is translated like every other string it owns and does not go through
 * `edsb-game-text`. It carries no severity word beside it and no control: at
 * both widths the dashboard it describes is a segment away (005/FR-013).
 */
@Component({
  selector: 'edsb-power-shed-statements',
  templateUrl: './power-shed-statements.html',
  styleUrl: './power-shed-statements.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PowerShedStatements {
  readonly #active = inject(ActiveBuildStore);
  readonly #conditions = inject(PowerConditionsStore);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

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

  /** One sentence per group the plant leaves dark, and nothing else. */
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

  #megawatts(value: number): string {
    return this.#messages.message('power.format.megawatts', {
      value: this.#formatters.decimal(value, MW_DIGITS),
    });
  }
}
