import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import type { ModuleMount } from '@elite-dangerous-almanac/core/ships/modules';
import {
  convergenceAt,
  TARGET_RANGE,
  type Convergence,
  type ConvergenceView,
} from '../../../../../domain/offence/convergence';
import { Formatters } from '../../../../../i18n/formatters/formatters';
import { GameTextPresenter } from '../../../../../i18n/game-text.presenter';
import { MessageService } from '../../../../../i18n/message.service';
import { RangeField } from '../../../../../ui/components/range-field/range-field';

/**
 * One mount's shot, placed on the gunsight plate.
 *
 * Two marks, as the canvas draws them: a small dot where the shot lands, and a
 * numbered badge parked at the plate's nearer edge with a leader line back to
 * the dot. The badge is off the shot rather than on it because a build that
 * converges well puts every dot in one place, and a numeral inside each of them
 * is unreadable exactly when the spread is tightest.
 */
export interface ShotView {
  readonly id: string;
  /** The canvas's badge: the mount's place in the hull's own hardpoint order. */
  readonly badge: string;
  /** Percentages from the plate's leading and top edges — where the shot lands. */
  readonly left: number;
  readonly top: number;
  /** Where the badge is parked, as percentages of the same plate. */
  readonly badgeLeft: number;
  readonly badgeTop: number;
  /** The leader from badge to dot: length as a percentage of the plate's width. */
  readonly leaderLength: number;
  /** The leader's bearing, in degrees clockwise from the plate's leading edge. */
  readonly leaderAngle: number;
  /**
   * Whether the mount is gimballed — the canvas's second dot colour.
   *
   * Gimballed against everything else, which is the one distinction the plate's
   * two inks draw: `wireConvergence` colours a mark by `mount === 'GIMBALLED'`
   * and nothing finer, so a turret takes the fixed ink here as it would there.
   * Which mount it actually is, turret included, is in the shot's own sentence,
   * where a reader who is not looking at the diagram can find it.
   */
  readonly gimballed: boolean;
  /** The whole shot in words, for a reader who is not looking at the diagram. */
  readonly statement: string;
}

/**
 * One of the canvas's four cells under the gunsight plate.
 *
 * A label and a figure, and nothing else. The canvas draws each cell as exactly
 * two lines — `APPARENT SPREAD` over `33 mrad`, and `wireConvergence` writes
 * only the figure into it — so the cell that once carried a third line naming
 * the range has none: the range field's own readout, directly above the cells,
 * already says what range the plate is drawn at.
 */
export interface FactView {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

/** Mount offsets to one place, which is the place canvas 1c's `9.8 m` sets. */
const OFFSET_DIGITS = 1;
/** Half the plate, as a percentage — the middle, from which a shot is offset. */
const HALF_PLATE_PERCENT = 50;

/**
 * The canvas's own plate-space, in which its badge placement is written.
 *
 * `wireConvergence` lays the plate out as 1600 by 600 units, parks a badge 62
 * units in from the edge it belongs to and stacks the badges on that edge 92
 * units apart. Working in those units and converting to percentages at the end
 * is what keeps the leader lines true: a line whose length is a percentage of
 * the plate's *width* only meets its dot if the space it was measured in has
 * the plate's own proportions.
 */
const PLATE_UNITS_WIDE = 1600;
const PLATE_UNITS_HIGH = 600;
const BADGE_INSET_UNITS = 62;
const BADGE_STEP_UNITS = 92;
const DEGREES_PER_RADIAN = 180 / Math.PI;
const PERCENT = 100;

/**
 * `SHOT CONVERGENCE`: where this build's shots land at a chosen range.
 *
 * Canvas 1c runs it across the full width beneath the `WEAPONS` and
 * `DAMAGE PROFILE` pair: a `16 / 6` gunsight plate, a range slider under it and
 * four cells reporting the spread. It is its own component because it is its
 * own block — the plate, its marks and its cells share nothing with the two
 * blocks above but the panel ground they sit on, and the range the plate is
 * drawn at is state neither of them has any part in.
 *
 * The geometry arrives already projected: `src/app/domain/offence/convergence.ts`
 * is the only place that asks the package where a hull's hardpoints are and
 * where they point at a distance. This component places those answers on a
 * plate, names them and does no arithmetic of its own beyond the plate-space
 * layout, which moves no reading.
 */
@Component({
  selector: 'edsb-shot-convergence',
  imports: [RangeField],
  templateUrl: './shot-convergence.html',
  styleUrl: './shot-convergence.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShotConvergence {
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);
  readonly #gameText = inject(GameTextPresenter);

  /**
   * The hull's placed hardpoints, as the projection returned them.
   *
   * Only the available case reaches here: a hull the catalogue does not place
   * is stated in words by the block above rather than drawn as a plate with
   * nothing on it, which would read as a build whose shots all converge.
   */
  readonly geometry = input.required<Extract<Convergence, { kind: 'available' }>>();

  readonly plateLabel = this.#messages.messageSignal('offence.convergence.plate');
  readonly rangeLabel = this.#messages.messageSignal('offence.convergence.range');
  readonly impactPlaneLabel = this.#messages.messageSignal('offence.convergence.impact-plane');

  /**
   * The range the gunsight is drawn at, in metres.
   *
   * Component state and nothing more: it never reaches the build, storage, the
   * route, a link or SLEF. It is a question a Commander asks of a fixed
   * loadout — "where do these land at six hundred metres" — not a property of
   * the build, and the canvas starts it where the canvas's own script does.
   */
  readonly targetRange = signal<number>(TARGET_RANGE.initial);

  readonly rangeBounds = TARGET_RANGE;

  /** The projection at the range the slider is set to. */
  readonly convergence = computed<ConvergenceView>(() =>
    convergenceAt(this.geometry(), this.targetRange()),
  );

  /**
   * Each mount's shot, as a position on the plate and as a sentence.
   *
   * The plate is decorative: every shot on it is also stated in words below,
   * because a dot and a leader line are a picture, and a picture is not a
   * reading (011 FR-022). A shot that falls outside the plate's field of view
   * is drawn all the same and clipped by the plate's own `overflow`, which is
   * what the canvas's own script does; it keeps its sentence either way, and
   * the spread figure beside the diagram is what actually says how far apart
   * the mounts are.
   */
  readonly shots = computed<readonly ShotView[]>(() => {
    const view = this.convergence();

    // The canvas's own badge column: the shots on each side of the axis, sorted
    // down the plate and stacked at that edge. Layout and nothing else — no
    // package figure is combined here, and moving a badge moves no reading.
    const placed = view.points.map((point) => ({
      point,
      x: (PLATE_UNITS_WIDE / 2) * (1 + point.horizontal),
      y: (PLATE_UNITS_HIGH / 2) * (1 - point.vertical),
    }));
    const leading = placed.filter(
      ({ point }) => point.horizontal < 0 || (point.horizontal === 0 && point.hardpoint % 2 === 1),
    );
    const trailing = placed.filter((entry) => !leading.includes(entry));
    const badges = new Map<string, { x: number; y: number }>();
    for (const [column, x] of [
      [leading, BADGE_INSET_UNITS],
      [trailing, PLATE_UNITS_WIDE - BADGE_INSET_UNITS],
    ] as const) {
      [...column]
        .sort((one, other) => one.y - other.y)
        .forEach((entry, index) => {
          badges.set(entry.point.mount.slot, {
            x,
            y: PLATE_UNITS_HIGH / 2 + (index - (column.length - 1) / 2) * BADGE_STEP_UNITS,
          });
        });
    }

    return placed.map(({ point, x, y }) => {
      const mount = point.mount;
      const badge = badges.get(mount.slot) ?? { x, y };
      return {
        id: mount.slot,
        badge: this.#formatters.integer(point.hardpoint),
        left: (1 + point.horizontal) * HALF_PLATE_PERCENT,
        top: (1 - point.vertical) * HALF_PLATE_PERCENT,
        badgeLeft: (badge.x / PLATE_UNITS_WIDE) * PERCENT,
        badgeTop: (badge.y / PLATE_UNITS_HIGH) * PERCENT,
        leaderLength: (Math.hypot(x - badge.x, y - badge.y) / PLATE_UNITS_WIDE) * PERCENT,
        leaderAngle: Math.atan2(y - badge.y, x - badge.x) * DEGREES_PER_RADIAN,
        gimballed: mount.mount === 'Gimballed',
        statement: this.#messages.message('offence.convergence.shot', {
          hardpoint: this.#formatters.integer(point.hardpoint),
          weapon: this.#gameText.moduleName(mount.symbol).text ?? mount.name,
          mount: this.#mountName(mount.mount),
          offset: this.#formatters.metres(mount.offsetMetres, OFFSET_DIGITS),
          angle: this.#milliradians(point.milliradians),
        }),
      };
    });
  });

  /** The canvas's two dashed rings, as fractions of the plate they are drawn on. */
  readonly rings = computed(() => this.convergence().rings);

  /**
   * The canvas's caption under the plate: what the second ring spans here.
   *
   * `Ring 2` is the canvas's own name for it — `wireConvergence` sets
   * `'RING 2 · ' + mrad + ' MRAD · ' + metres + ' m AT THIS RANGE'` — and the
   * plate draws two, so the number names which one without describing it.
   */
  readonly ringCaption = computed(() => {
    const view = this.convergence();
    return this.#messages.message('offence.convergence.ring', {
      angle: this.#milliradians(view.ringMilliradians),
      distance: this.#formatters.metres(view.ringMetres, OFFSET_DIGITS),
    });
  });

  /** The range the plate is drawn at, as a Commander reads it. */
  readonly targetRangeText = computed(() => this.#formatters.metres(this.targetRange()));

  readonly rangeMinText = computed(() => this.#formatters.metres(TARGET_RANGE.min));
  readonly rangeMaxText = computed(() => this.#formatters.metres(TARGET_RANGE.max));

  /**
   * The canvas's four facts under the plate.
   *
   * The two spans are the mounts' own separation in metres and do not move with
   * the range; the spread is what that separation subtends at the range the
   * slider is set to, and does. The widest mount names the hardpoint it is,
   * because "9.8 m" without it says how far but not from where.
   *
   * All four are about a group of armed mounts, so a build that has armed none
   * gets none of them: a span of zero metres between no mounts, and a widest of
   * nothing, are figures about nothing. The plate itself is still drawn, with
   * its axes and its rings and no marks on it, which is what the canvas's own
   * script draws for a build with nothing to place.
   */
  readonly facts = computed<readonly FactView[]>(() => {
    const geometry = this.geometry();
    const view = this.convergence();
    const widest = geometry.widest;
    if (widest === null) {
      return [];
    }

    return [
      {
        id: 'lateral',
        label: this.#messages.message('offence.convergence.lateral'),
        value: this.#formatters.metres(geometry.lateralSpanMetres, OFFSET_DIGITS),
      },
      {
        id: 'vertical',
        label: this.#messages.message('offence.convergence.vertical'),
        value: this.#formatters.metres(geometry.verticalSpanMetres, OFFSET_DIGITS),
      },
      {
        id: 'spread',
        label: this.#messages.message('offence.convergence.spread'),
        value: this.#milliradians(view.apparentSpreadMilliradians),
      },
      {
        id: 'widest',
        label: this.#messages.message('offence.convergence.widest'),
        value: this.#messages.message('offence.convergence.widest.value', {
          hardpoint: this.#formatters.integer(widest.hardpoint),
          distance: this.#formatters.metres(widest.offsetMetres, OFFSET_DIGITS),
        }),
      },
    ];
  });

  /** Moves the plate to a new target range. Nothing about it leaves this component. */
  setTargetRange(metres: number): void {
    this.targetRange.set(metres);
  }

  /**
   * How the weapon is aimed, in a word.
   *
   * The canvas draws a fixed mount and an aimed one in different colours and
   * says nothing else about either. A colour is not a reading, so the word goes
   * into the shot's own sentence and the colour is left as the reinforcement it
   * is (011 FR-022). An unrecorded mount is named as unstated rather than
   * guessed from the module's symbol.
   */
  #mountName(mount: ModuleMount | null): string {
    switch (mount) {
      case 'Fixed':
        return this.#messages.message('offence.convergence.mount.fixed');
      case 'Gimballed':
        return this.#messages.message('offence.convergence.mount.gimballed');
      case 'Turreted':
        return this.#messages.message('offence.convergence.mount.turreted');
      default:
        return this.#messages.message('offence.detail.not-stated');
    }
  }

  #milliradians(value: number): string {
    return this.#messages.message('offence.format.milliradians', {
      value: this.#formatters.integer(value),
    });
  }
}
