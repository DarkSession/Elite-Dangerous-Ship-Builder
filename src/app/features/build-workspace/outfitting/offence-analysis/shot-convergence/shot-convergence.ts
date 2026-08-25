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
 * Two marks, as the 2026-08-25 canvas revision draws them: a small dot where the
 * shot lands, and the mount's hardpoint numeral set just beside it. The numeral
 * used to be a badge parked at the plate's edge on a leader line; the revision
 * withdrew both, and it is placed clear of the neighbouring dots instead.
 */
export interface ShotView {
  readonly id: string;
  /** The canvas's numeral: the mount's place in the hull's own hardpoint order. */
  readonly badge: string;
  /** Percentages from the plate's leading and top edges — where the shot lands. */
  readonly left: number;
  readonly top: number;
  /** Where the numeral sits relative to its own dot, in pixels. */
  readonly numeralLeft: number;
  readonly numeralTop: number;
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
 * Where the canvas puts a hardpoint numeral relative to its own dot, in pixels.
 *
 * `wireConvergence` offers four corners — `[7, -14]`, `[7, 5]`, `[-13, -14]`,
 * `[-13, 5]` — and takes whichever stands furthest from every *other* dot, so a
 * numeral lands in whatever gap its neighbours leave. They are pixel offsets in
 * the drawing and stay pixel offsets here: a numeral is a fixed-size mark, and
 * scaling its distance from its dot with the plate would leave it detached on a
 * wide one and on top of it on a narrow one.
 */
const NUMERAL_OFFSETS: readonly (readonly [number, number])[] = [
  [7, -14],
  [7, 5],
  [-13, -14],
  [-13, 5],
];

/**
 * The plate width the numeral placement is chosen against, in pixels.
 *
 * The four offsets above are pixels and the dots are fractions of the plate, so
 * choosing between them means fixing the size the plate is being drawn at.
 * `wireConvergence` reads its own (`dots.offsetWidth || 173`) against the 172px
 * plate canvas 1c draws; this is that plate. Reading the built plate's real
 * width instead would mean measuring the DOM to place a numeral, and a numeral
 * carries no reading — every mark on this plate is stated in words beside it,
 * so which corner it takes changes nothing a Commander is told (FR-011).
 */
const PLATE_REFERENCE_WIDTH = 172;

/** The numeral's own ink box, which the canvas offsets from its top-left corner. */
const NUMERAL_ANCHOR_LEFT = 3;
const NUMERAL_ANCHOR_TOP = 4;

/**
 * `SHOT CONVERGENCE`: where this build's shots land at a chosen range.
 *
 * Canvas 1c runs it across the full width beneath the `WEAPONS` and
 * `DAMAGE PROFILE` pair: a gunsight plate, the range it is drawn at and four
 * cells reporting the spread. It is its own component because it is its own
 * block — the plate, its marks and its cells share nothing with the two blocks
 * above but the panel ground they sit on, and the range the plate is drawn at
 * is state neither of them has any part in.
 *
 * The geometry arrives already projected: `src/app/domain/offence/convergence.ts`
 * is the only place that asks the package where a hull's hardpoints are and
 * where they point at a distance. This component places those answers on a
 * plate, names them and does no arithmetic of its own beyond choosing which
 * corner a numeral takes, which moves no reading.
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
   * because a dot and a numeral are a picture, and a picture is not a reading
   * (011 FR-022). Since the 2026-08-25 canvas revision a shot outside the
   * plate's field of view is held at the frame's own margin rather than clipped
   * out of it, so a moved dot is exactly the case where its sentence — which
   * carries the offset and the angle it actually has — is the true reading.
   */
  readonly shots = computed<readonly ShotView[]>(() => {
    const view = this.convergence();

    // Where each dot sits on the plate, in the pixels the numeral offsets are
    // written in. Layout and nothing else: no package figure is combined here,
    // and moving a numeral moves no reading.
    const dots = view.points.map((point) => ({
      point,
      x: ((1 + point.horizontal) / 2) * PLATE_REFERENCE_WIDTH,
      y: ((1 - point.vertical) / 2) * PLATE_REFERENCE_WIDTH,
    }));

    return dots.map((dot) => {
      const mount = dot.point.mount;
      const numeral = this.#numeralOffset(dot, dots);
      return {
        id: mount.slot,
        badge: this.#formatters.integer(dot.point.hardpoint),
        left: (1 + dot.point.horizontal) * HALF_PLATE_PERCENT,
        top: (1 - dot.point.vertical) * HALF_PLATE_PERCENT,
        numeralLeft: numeral[0],
        numeralTop: numeral[1],
        gimballed: mount.mount === 'Gimballed',
        statement: this.#messages.message('offence.convergence.shot', {
          hardpoint: this.#formatters.integer(dot.point.hardpoint),
          weapon: this.#gameText.moduleName(mount.symbol).text ?? mount.name,
          mount: this.#mountName(mount.mount),
          offset: this.#formatters.metres(mount.offsetMetres, OFFSET_DIGITS),
          angle: this.#milliradians(dot.point.milliradians),
        }),
      };
    });
  });

  /**
   * Which of the canvas's four corners this mount's numeral takes.
   *
   * `wireConvergence`'s own rule: the corner whose ink box stands furthest from
   * the nearest *other* dot, so a numeral falls into whatever gap its
   * neighbours leave rather than over one of them. A single mount has no other
   * dot to stand clear of and takes the first corner, as the script does.
   */
  #numeralOffset(
    dot: { readonly x: number; readonly y: number },
    dots: readonly { readonly x: number; readonly y: number }[],
  ): readonly [number, number] {
    const others = dots.filter((other) => other !== dot);
    let best: readonly [number, number] = NUMERAL_OFFSETS[0] ?? [0, 0];
    let bestDistance = -1;
    for (const offset of NUMERAL_OFFSETS) {
      const left = dot.x + offset[0] + NUMERAL_ANCHOR_LEFT;
      const top = dot.y + offset[1] + NUMERAL_ANCHOR_TOP;
      // Zero where there is no other dot to stand clear of, so every corner
      // scores alike and the first one wins — which is the single-mount plate,
      // and is what the script's own unbeaten starting distance does there.
      const nearest =
        others.length === 0
          ? 0
          : Math.min(...others.map((other) => Math.hypot(left - other.x, top - other.y)));
      if (nearest > bestDistance) {
        bestDistance = nearest;
        best = offset;
      }
    }
    return best;
  }

  /** The canvas's two dashed rings, as fractions of the plate they are drawn on. */
  readonly rings = computed(() => this.convergence().rings);

  /**
   * The canvas's caption for the plate: what the second ring spans here.
   *
   * `Ring 2` is the canvas's own name for it — `wireConvergence` sets
   * `'RING 2 · ' + mrad + ' MRAD · ' + metres + ' m'` — and the plate draws two,
   * so the number names which one without describing it. The 2026-08-25 canvas
   * revision moved it out of the plate and onto the block's heading line, and
   * dropped the `AT THIS RANGE` it used to end on; the panel above reads it from
   * here to draw it there, and it stays in the shot sentences besides, because
   * it is still the one plate figure the four cells do not repeat.
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
