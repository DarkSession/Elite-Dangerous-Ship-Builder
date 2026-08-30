import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { PowerConditionsStore } from '../../../../application/power-heat/power-conditions.store';
import { projectPowerHeat, type PowerAndHeat } from '../../../../domain/power-heat/power-heat';
import { Formatters } from '../../../../i18n/formatters/formatters';
import { MessageService } from '../../../../i18n/message.service';

/** One group the plant leaves dark: the canvas's `GRP 4 OFF`, and the sentence. */
interface ShedGroupView {
  /** Stable within one projection, for tracking only. Never translated. */
  readonly id: string;
  readonly reading: string;
  readonly label: string;
}

/** What the badge draws, and the same readings in words. */
interface BadgeView {
  /** The canvas's `PWR 95%`. */
  readonly reading: string;
  /** That reading as a sentence, for a reader who has no badge to look at. */
  readonly label: string;
  /** One line per group the plant cannot keep lit. Empty where it keeps them all. */
  readonly shed: readonly ShedGroupView[];
}

/**
 * The compact strip's power badge (FR-014).
 *
 * Canvas 1d closes its key-figure strip with a two-line plate — `PWR 95%` over
 * `GRP 4 OFF` — standing beside the six figures rather than over them. It is
 * the one power reading a Commander gets without leaving the mode they are in:
 * the sentences, the `POWER` line and the bar are all in the Status mode, and
 * this says whether it is worth going there.
 *
 * The share is the lit draw against **plant output**, not against the whole
 * demand: the artboard's `95%` is `29.64` of `31.20 MW`, and the whole demand
 * behind that build is `37.44`. So it answers "how much of the plant is spoken
 * for", which is the question a Commander fitting a module is asking, and the
 * bar in the Status mode answers the other one.
 *
 * The second line names the groups the plant leaves dark, as the canvas names
 * one. A build the plant covers draws no second line — not a `0 OFF`, which
 * would be a figure the artboard never prints and a reading nobody needs.
 *
 * Inert, like every other cell in the strip: the canvas draws no control here,
 * and what a Commander would change is a mode away.
 */
@Component({
  selector: 'edsb-power-badge',
  templateUrl: './power-badge.html',
  styleUrl: './power-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PowerBadge {
  readonly #active = inject(ActiveBuildStore);
  readonly #conditions = inject(PowerConditionsStore);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  /**
   * The projection, read with the hardpoints deployed for the reason the status
   * rail reads it that way: a group the plant sheds when the hardpoints come
   * out is shed whether or not the stowed figures happen to be on screen.
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
      : projectPowerHeat(loadout, { hardpoints: 'deployed', pips: this.#conditions.pips() });
  });

  /**
   * The badge, or nothing at all.
   *
   * Nothing is drawn without a build, and nothing is drawn where the package
   * reports no plant output: a share of zero output is not a small percentage,
   * it is a division that has no answer, and the artboard draws no state for
   * it. The Status mode still says what such a build is doing.
   */
  readonly badge = computed<BadgeView | null>(() => {
    const power = this.#projection()?.power;
    if (power === undefined || power.plantShare === null) {
      return null;
    }

    const share = this.#formatters.percent(power.plantShare);
    return {
      reading: this.#messages.message('power.badge.reading', { share }),
      label: this.#messages.message('power.badge.label', { share }),
      // One line per shed group rather than one line naming several. The canvas
      // draws a build with a single dark group and prints `GRP 4 OFF`; a build
      // with two has two things to say, and the plate stacks them the way the
      // status rail stacks its sentences.
      shed: power.bands
        .filter((band) => !band.powered)
        .map((band) => {
          const group = this.#formatters.integer(band.priority);
          return {
            id: `band-${band.priority}`,
            reading: this.#messages.message('power.badge.off', { group }),
            label: this.#messages.message('power.badge.off.label', { group }),
          };
        }),
    };
  });
}
