import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import {
  PowerConditionsStore,
  TOTAL_PIPS,
} from '../../../../application/power-heat/power-conditions.store';
import {
  CAPACITOR_KINDS,
  projectPowerHeat,
  type CapacitorKind,
  type PowerAndHeat,
} from '../../../../domain/power-heat/power-heat';
import { Formatters } from '../../../../i18n/formatters/formatters';
import type { MessageKey } from '../../../../i18n/locale-registry';
import { MessageService } from '../../../../i18n/message.service';
import { relationId } from '../../../../ui/a11y/text-equivalence';

/** The bar under the figures, as three lengths and the reading it carries. */
interface BarView {
  readonly powered: number;
  readonly unpowered: number;
  readonly plant: number;
  readonly label: string;
}

/** One bank of the rail's pip control: its name, its reading and its blocks. */
interface PipSetView {
  readonly kind: CapacitorKind;
  readonly name: string;
  /** The allocation the blocks are drawn from: the package's, wherever it gave one. */
  readonly pips: number;
  /** The bank's allocation, said in words for a reader who cannot see the blocks. */
  readonly label: string;
  readonly steps: readonly PipStepView[];
}

/** One of the four blocks a bank's pips are drawn and set with. */
interface PipStepView {
  readonly id: string;
  /** The pip count pressing it asks for. */
  readonly value: number;
  /** How much of this block the bank's allocation fills, in `[0, 1]`. */
  readonly fill: number;
  readonly label: string;
}

/** The bank names, written out rather than composed: `MessageKey` is a union. */
const BANK_LABELS = {
  systems: 'power.distributor.bank.systems',
  engines: 'power.distributor.bank.engines',
  weapons: 'power.distributor.bank.weapons',
} as const satisfies Record<CapacitorKind, MessageKey>;

/** The four blocks the canvas draws each bank's allocation across. */
const PIP_STEPS = [1, 2, 3, 4] as const;

/** Megawatts to two places, as the canvas sets every power figure. */
const MW_DIGITS = 2;

/** Pips to one place, because a bank paying for another lands on the half. */
const PIP_DIGITS = 1;

/**
 * What the plant is doing, in the outfitting status rail.
 *
 * Two readings and one control, above the metric cells features 006, 007, 008
 * and 003 own: the `POWER` line — `29.64 / 31.20 MW · 7.80 OFF` over a bar of
 * the same four figures — and, since the 2026-08-25 revision, the
 * `SYS` / `ENG` / `WEP` pip control. The pips were this feature's open T074 and
 * landed here, because the allocation is one viewing condition and this is the
 * rail's half of it (`design/power-and-heat-detail.md`, "The rail's pip
 * control"). Canvas 1d draws the readings in its Status mode and no pip control
 * at all; the application builds one DOM at both widths, and withdrawing the
 * control at one of them would be the capability going missing there
 * (constitution V).
 *
 * The sentence about a group the plant cannot keep lit is not here. It is drawn
 * a block higher, in `edsb-power-shed-statements`, beneath feature 003's
 * validation issues in the block that opens the rail (Commander request
 * 2026-08-31). No heat sentence is drawn anywhere: canvas 1d does print
 * `Sustained fire peaks at 131% heat` in its `BUILD STATUS` block, and this
 * feature's wave-13 ruling withdrew that tier entirely
 * (`specs/005-power-and-heat/design/reference-review.md`, "Tier 2 is withdrawn
 * entirely").
 *
 * The bar's `79%`, `21%` and `83.3%` are the artboard's own figures over the
 * whole demand — `29.64`, `7.80` and `31.20` against `37.44` — so it is drawn
 * from the projection rather than reverse-engineered, and the projection is
 * where the division is done.
 *
 * The `POWER` line and the bar are read-only by ruling, exactly as feature
 * 003's issue list above them is: the canvas draws no control in either, and at
 * both widths the dashboard they describe is a segment away. The pips under
 * them are this block's one control.
 *
 * They edit the **same** viewing condition the distributor table's cell edits,
 * through the same store action: one allocation, shown in two places, never a
 * second state and never a draft. The rail is on screen in every anatomy mode
 * while that table is only in `POWER`, and features 006 and 007 both read
 * figures at an allocation — so this is where a Commander can move the pips
 * without leaving the region whose figures move with them.
 *
 * Every string here is this application's own, not a package diagnostic, so it
 * is translated like every other string it owns and does not go through
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
  readonly pipsLabel = this.#messages.messageSignal('power.rail.pips');

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

  /**
   * `SYS`, `ENG` and `WEP`, each over the four blocks the canvas draws.
   *
   * The pips drawn are **the ones the package returned**, exactly as the
   * distributor cell draws them (FR-013): the projection reads them back out of
   * `distributorMetricsResult()` rather than echoing the request, so if the package
   * ever normalises an allocation both surfaces show what it actually answered
   * for rather than what was pressed.
   *
   * The standing condition stands in only where the package returned nothing to
   * read — a build with no distributor fitted, switched off, unresolvable or
   * shed by the retracted budget. The rail is on screen for those builds and
   * the pips are still a question worth asking about them, so the control keeps
   * working; what an allocation *does* to a recharge is the distributor table's
   * reading, and that is where the unavailability is stated. Nothing is
   * fabricated either way: this is the condition being asked about, not a
   * capacitor figure standing in for one the package declined to give.
   */
  readonly pipSets = computed<readonly PipSetView[]>(() => {
    const projection = this.#projection();
    if (projection === null) {
      return [];
    }

    const returned = projection.distributor?.capacitors ?? null;
    const asked = this.#conditions.pips();

    return CAPACITOR_KINDS.map((kind) => {
      const name = this.#messages.message(BANK_LABELS[kind]);
      const pips = returned?.find((capacitor) => capacitor.kind === kind)?.pips ?? asked[kind];

      return {
        kind,
        name,
        pips,
        // The blocks carry the allocation as a picture; this carries it as a
        // reading, which is what a reader who cannot see four rectangles gets.
        label: this.#messages.message('power.distributor.pips.label', {
          bank: name,
          pips: this.#formatters.decimal(pips, PIP_DIGITS),
          total: this.#formatters.integer(TOTAL_PIPS),
        }),
        steps: PIP_STEPS.map((step) => ({
          id: String(step),
          value: step,
          // A block is full once the allocation reaches it and empty until it
          // does; a bank paying for another lands on a half and fills half of
          // one. There is no half-pip block: four blocks, filled from the
          // leading edge, exactly as the distributor's cell draws them.
          fill: Math.min(1, Math.max(0, pips - (step - 1))),
          label: this.#messages.message('power.distributor.pips.set', {
            bank: name,
            pips: this.#formatters.integer(step),
          }),
        })),
      };
    });
  });

  /**
   * Asks for that many pips in that bank. The store moves the other two.
   *
   * The same action the distributor cell calls, so the two surfaces cannot
   * drift: there is one allocation, and both of them draw it. Pressing the
   * block a bank already stands on steps it back one, which is the only way
   * down to none through four blocks that each name a count.
   *
   * "Already stands on" is measured against the pips being *drawn*, which is
   * what a Commander is pressing against — the package's own figure wherever it
   * gave one.
   */
  setPips(bank: CapacitorKind, step: number): void {
    const standing = this.pipSets().find((set) => set.kind === bank)?.pips ?? null;
    this.#conditions.setPips(bank, standing === step ? step - 1 : step);
  }

  #megawatts(value: number): string {
    return this.#messages.message('power.format.megawatts', {
      value: this.#formatters.decimal(value, MW_DIGITS),
    });
  }
}
