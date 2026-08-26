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
import { placeNumerals } from '../../../../../domain/offence/numeral-placement';

/**
 * One of the hull's hardpoints, placed on the gunsight plate.
 *
 * Two marks, as the 2026-08-25 canvas revision draws them: a small dot where the
 * shot lands, and the mount's hardpoint numeral set just beside it. The numeral
 * used to be a badge parked at the plate's edge on a leader line; the revision
 * withdrew both, and it is placed clear of the neighbouring dots instead.
 *
 * Every hardpoint gets one, armed or not. What each mark carries — whether a
 * weapon is on it, and whether it is the mount the workspace currently has
 * selected — is drawn as three inks and written out in the mark's own sentence,
 * because a colour is not a reading (011 FR-022). How the weapon aims is in that
 * sentence and nowhere else: the canvas's own second ink is spent on selection
 * here (`design/canvas-contract.md`, review note 17).
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
   * Whether the numeral had to leave the canvas's four corners to find room.
   *
   * A crowded plate is the case the canvas's own rule could not settle: two
   * mounts far enough apart both score their inward corner well and each aims
   * its numeral at the other's. A numeral that has moved is tied back to its
   * dot by a leader, so it still says which shot it counts.
   */
  readonly displaced: boolean;
  /** The leader back to the dot, in plate percentages, or `null` when it stayed. */
  readonly leader: ShotLeader | null;
  /**
   * Whether a weapon is fitted here.
   *
   * An empty hardpoint is drawn as the mount it is — the offset is the hull's,
   * not the weapon's — in the quiet ink the schematics already give an empty
   * mount, and its sentence says it is empty rather than naming a weapon.
   */
  readonly armed: boolean;
  /**
   * Whether this is the mount the outfitting workspace currently has selected.
   *
   * The same selection the hull schematics mark and the ledger row carries, so
   * a Commander working on one hardpoint can see which mark on the plate is
   * theirs. It takes the plate's other ink and a ring in the same one; whether
   * the mount is armed stays with the fill against the outline, so a selected
   * empty hardpoint is still visibly empty.
   */
  readonly selected: boolean;
  /** The whole mark in words, for a reader who is not looking at the diagram. */
  readonly statement: string;
}

/** A leader line from a dot to a numeral that could not sit beside it. */
export interface ShotLeader {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** Mount offsets to one place, which is the place canvas 1c's `9.8 m` sets. */
const OFFSET_DIGITS = 1;
/** Half the plate, as a percentage — the middle, from which a shot is offset. */
const HALF_PLATE_PERCENT = 50;

/**
 * The plate width the numeral placement is measured in, in pixels.
 *
 * The canvas's corner offsets are pixels and the dots are fractions of the
 * plate, so choosing between them means fixing the size the plate is drawn at.
 * Canvas 1c draws it 172px wide and this is the `10.75rem` plate the
 * application draws in its place, so the two agree; it has to be kept in step
 * with `--edsb-measure-gunsight-plate`.
 *
 * Reading the built plate's real width instead would mean measuring the DOM to
 * place a numeral, and a numeral carries no reading — every mark on this plate
 * is stated in words beside it, so which corner it takes changes nothing a
 * Commander is told (FR-011). The clearance below is what keeps that
 * approximation safe: the placement leaves air around every mark rather than
 * fitting them edge to edge, so a plate drawn a little larger or smaller than
 * the reference still has no two numerals touching.
 */
const PLATE_REFERENCE_WIDTH = 172;

/**
 * The marks the placement measures, in the same pixels.
 *
 * The numeral's box is the widest a hardpoint numeral gets — two digits of the
 * canvas's 8px monospace with its own tracking — so a one-digit numeral is
 * placed with room to spare rather than a two-digit one being placed short.
 * The dot's reach is its drawn radius plus the halo that lifts it off the
 * ground, and the clearance is the air kept around everything.
 */
const NUMERAL_METRICS = {
  plate: PLATE_REFERENCE_WIDTH,
  width: 11,
  height: 9,
  dotRadius: 5,
  clearance: 1.5,
} as const;

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

  /**
   * The slot key the outfitting workspace currently has selected, if any.
   *
   * Read in rather than reached for: the plate is handed everything it draws,
   * and the selection belongs to the workspace, not to this diagram. It is a
   * slot key and not a hardpoint number because a key is the identity the
   * package publishes and the ledger, the schematics and this plate all use —
   * the hull's own hardpoint order and the number inside a slot key disagree on
   * ten hulls, so matching on the number would mark the wrong mount on those.
   */
  readonly selectedSlot = input<string | null>(null);

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
   * Each hardpoint, as a position on the plate and as a sentence.
   *
   * The plate is decorative: every mark on it is also stated in words below,
   * because a dot and a numeral are a picture, and a picture is not a reading
   * (011 FR-022). That is what carries the two things the inks separate — armed
   * against empty, and the selected mount against the rest — neither of which
   * may rest on a colour alone, and it is the only place how a weapon aims is
   * said at all. Since the 2026-08-25
   * canvas revision a shot outside the plate's field of view is held at the
   * frame's own margin rather than clipped out of it, so a moved dot is exactly
   * the case where its sentence — which carries the offset and the angle it
   * actually has — is the true reading.
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

    // Every numeral placed against every other mark on the plate, so no two of
    // them are ever drawn on top of each other. The dots themselves do not
    // move: a dot is where the shot lands, and that is the reading.
    const numerals = placeNumerals(
      dots.map((dot, index) => ({
        id: dot.point.mount.slot,
        order: dot.point.hardpoint || index + 1,
        x: dot.x,
        y: dot.y,
      })),
      NUMERAL_METRICS,
    );

    const selectedSlot = this.selectedSlot();

    return dots.map((dot, index) => {
      const mount = dot.point.mount;
      const weapon = mount.weapon;
      const placement = numerals[index] ?? { left: 0, top: 0, displaced: false };
      const selected = mount.slot === selectedSlot;
      const place = {
        hardpoint: this.#formatters.integer(dot.point.hardpoint),
        offset: this.#formatters.metres(mount.offsetMetres, OFFSET_DIGITS),
        angle: this.#milliradians(dot.point.milliradians),
      };
      return {
        id: mount.slot,
        badge: place.hardpoint,
        left: (1 + dot.point.horizontal) * HALF_PLATE_PERCENT,
        top: (1 - dot.point.vertical) * HALF_PLATE_PERCENT,
        numeralLeft: placement.left,
        numeralTop: placement.top,
        // A numeral that could not stay in one of the canvas's four corners is
        // tied back to its own dot by a leader, the way feature 010's
        // schematics explain a mark that has moved.
        displaced: placement.displaced,
        leader: placement.displaced
          ? {
              x1: (dot.x / PLATE_REFERENCE_WIDTH) * 100,
              y1: (dot.y / PLATE_REFERENCE_WIDTH) * 100,
              x2:
                ((dot.x + placement.left + NUMERAL_METRICS.width / 2) / PLATE_REFERENCE_WIDTH) *
                100,
              y2:
                ((dot.y + placement.top + NUMERAL_METRICS.height / 2) / PLATE_REFERENCE_WIDTH) *
                100,
            }
          : null,
        armed: weapon !== null,
        selected,
        // Four whole sentences rather than one with a state appended to it.
        // Which weapon, whether the mount is empty and whether it is the
        // selected one land in different places in different languages, and a
        // sentence assembled from fragments here would fix English word order
        // into the catalogue.
        statement:
          weapon === null
            ? this.#messages.message(
                selected ? 'offence.convergence.empty.selected' : 'offence.convergence.empty',
                place,
              )
            : this.#messages.message(
                selected ? 'offence.convergence.shot.selected' : 'offence.convergence.shot',
                {
                  ...place,
                  weapon: this.#gameText.moduleName(weapon.symbol).text ?? weapon.name,
                  mount: this.#mountName(weapon.mount),
                },
              ),
      };
    });
  });

  /** The canvas's two dashed rings, as fractions of the plate they are drawn on. */
  readonly rings = computed(() => this.convergence().rings);

  /** The range the plate is drawn at, as a Commander reads it. */
  readonly targetRangeText = computed(() => this.#formatters.metres(this.targetRange()));

  readonly rangeMinText = computed(() => this.#formatters.metres(TARGET_RANGE.min));
  readonly rangeMaxText = computed(() => this.#formatters.metres(TARGET_RANGE.max));

  /** Moves the plate to a new target range. Nothing about it leaves this component. */
  setTargetRange(metres: number): void {
    this.targetRange.set(metres);
  }

  /**
   * How the weapon is aimed, in a word.
   *
   * The canvas draws a fixed mount and an aimed one in different colours and
   * says nothing else about either. This plate spends that second ink on the
   * selected mount instead, so the word here is not a reinforcement of a colour
   * but the only place the mount is stated — which is where it belonged
   * anyway, a colour never having been a reading (011 FR-022). An unrecorded
   * mount is named as unstated rather than guessed from the module's symbol.
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
