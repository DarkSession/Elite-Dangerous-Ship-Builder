import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { PowerConditionsStore } from '../../../../application/power-heat/power-conditions.store';
import {
  projectPowerHeat,
  type PowerAndHeat,
} from '../../../../domain/ships/power-heat/power-heat';
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
  /**
   * The canvas's `PWR 95%`, and that reading as a sentence for a reader who has
   * no badge to look at.
   *
   * `null` together where the plant generates nothing: a share of no output is
   * a division with no answer, and a `0%` there would be a figure standing in
   * for one that does not exist (constitution IV). The plate is still drawn,
   * because a plant generating nothing is the build this warning most needs to
   * be on — it is every group that is dark, not one.
   */
  readonly reading: string | null;
  readonly label: string | null;
  /** One line per group the plant cannot keep lit. Never empty: see `badge`. */
  readonly shed: readonly ShedGroupView[];
}

/**
 * The compact strip's power badge (FR-014).
 *
 * Canvas 1d closes its key-figure strip with a two-line plate — `PWR 95%` over
 * `GRP 4 OFF` — standing beside the six figures rather than over them.
 *
 * It is drawn where the plant leaves a group dark, and not otherwise. The
 * artboard's build sheds a group, so its plate is hot; a plate drawn on every
 * build to say that nothing is wrong is a warning a Commander stops reading
 * (Commander request 2026-08-30). The share itself is not lost with it: the
 * `POWER` line in the Status mode states the whole budget in figures on every
 * build, which is more than this ever said.
 *
 * The share is the lit draw against **plant output**, not against the whole
 * demand: the artboard's `95%` is `29.64` of `31.20 MW`, and the whole demand
 * behind that build is `37.44`. So it says how much of the plant is spoken for
 * by the load that is still lit, which is what a group going dark is measured
 * against.
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
   * A dark group is the whole condition. Nothing is drawn without a build and
   * nothing is drawn where the plant covers every band: there is then no group
   * to name, and the share on its own is a reading the Status mode states in
   * full a segment away (FR-014).
   *
   * A plant generating nothing draws the plate too, and its share has no
   * answer: every group on such a build is dark, which is the condition above
   * at its widest, so the plate carries the group lines alone. A badge
   * conditioned on the share instead would warn about a build with one dark
   * group and say nothing about a build with no power at all.
   */
  readonly badge = computed<BadgeView | null>(() => {
    const power = this.#projection()?.power;
    if (power === undefined) {
      return null;
    }

    // One line per shed group rather than one line naming several. The canvas
    // draws a build with a single dark group and prints `GRP 4 OFF`; a build
    // with two has two things to say, and the plate stacks them the way the
    // status rail stacks its sentences.
    const shed = power.bands
      .filter((band) => !band.powered)
      .map((band) => {
        const group = this.#formatters.integer(band.priority);
        return {
          id: `band-${band.priority}`,
          reading: this.#messages.message('power.badge.off', { group }),
          label: this.#messages.message('power.badge.off.label', { group }),
        };
      });
    if (shed.length === 0) {
      return null;
    }

    if (power.plantShare === null) {
      return { reading: null, label: null, shed };
    }

    const share = this.#formatters.percent(power.plantShare);
    return {
      reading: this.#messages.message('power.badge.reading', { share }),
      label: this.#messages.message('power.badge.label', { share }),
      shed,
    };
  });
}
