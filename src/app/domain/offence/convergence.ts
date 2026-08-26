import {
  getShipGunsight,
  projectGunsight,
  type GunsightOffset,
} from '@elite-dangerous-almanac/core/ships/gunsights';
import { getModuleBySymbol, type ModuleMount } from '@elite-dangerous-almanac/core/ships/modules';
import { getShipSlots } from '@elite-dangerous-almanac/core/ships/ships';
import { enumerateSlots } from '@elite-dangerous-almanac/core/ships/slots';
import type { FittedWeaponMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';

/**
 * `SHOT CONVERGENCE`: where this build's shots land on the plane a target sits
 * on, as canvas 1c draws it (@649971) and canvas 1d draws it again (@1039230).
 *
 * The geometry is the package's. `SHIP_GUNSIGHTS` publishes every player-flyable
 * hull's hardpoint offsets from the cockpit in metres, and `projectGunsight`
 * turns those offsets into angular tangents at a chosen range. This file places
 * every one of the hull's hardpoints, armed or empty, asks the package where
 * their shots go, and says how far apart the armed ones are; it derives no
 * offset and models no ballistics.
 *
 * Every hardpoint and not only the armed ones, because the plate is a picture
 * of the *hull*: an offset is a property of the mount, which the package
 * publishes whether or not a Commander has filled it, and a Commander choosing
 * what to fit is asking where a shot from that mount would go. The empty ones
 * are drawn as the mounts they are and are named as empty in words, and no
 * figure about the group is measured across them — nothing is fired from an
 * empty hardpoint, so a spread that counted one would be a spread nobody has.
 *
 * A hull the catalogue does not carry, or one whose gunsight does not line up
 * with its hardpoints, is `unavailable` rather than a partial diagram: a
 * convergence drawn from some of the mounts would be a spread nobody has.
 */
export type Convergence =
  | { readonly kind: 'unavailable' }
  | {
      readonly kind: 'available';
      /** Every hardpoint the catalogue places, armed or empty, in the hull's own order. */
      readonly mounts: readonly ConvergenceMount[];
      /** Widest horizontal separation between two armed mounts, in metres. */
      readonly lateralSpanMetres: number;
      /** Widest vertical separation between two armed mounts, in metres. */
      readonly verticalSpanMetres: number;
      /**
       * The armed mount furthest from the cockpit's axis.
       *
       * `null` where the build has armed none of them. The hull is still
       * placed — the plate is drawn, with its axes and its rings — but there is
       * no group to measure, and a span of zero metres between no mounts is a
       * figure about nothing.
       */
      readonly widest: ConvergenceMount | null;
    };

/** One of the hull's hardpoints, at the offset the package publishes for it. */
export interface ConvergenceMount {
  /** The hull's own slot key. It names the mount, so an empty one has it too. */
  readonly slot: string;
  /** The mount's 1-based place in the hull's own hardpoint order — the canvas's numeral. */
  readonly hardpoint: number;
  /** The package's own offset pair, in metres. */
  readonly offset: GunsightOffset;
  /** Distance from the cockpit's axis, in metres. */
  readonly offsetMetres: number;
  /**
   * The weapon fitted here, or `null` where the hardpoint is empty.
   *
   * Nested rather than flattened, because the three fields under it exist
   * together or not at all: a mount with a name and no symbol is not a state
   * this hull can be in, and an optional field each would let a surface read
   * one of them off an empty mount and print it.
   */
  readonly weapon: ConvergenceWeapon | null;
}

/** The weapon on an armed hardpoint, as the package records it. */
export interface ConvergenceWeapon {
  /** The weapon's display name, as the package returns it. */
  readonly name: string;
  /** The weapon's internal symbol, so a surface can name it in the Commander's language. */
  readonly symbol: string;
  /** How the weapon is aimed, or `null` where the module record states no mount. */
  readonly mount: ModuleMount | null;
}

/**
 * The half field of view the canvas's plate spans, in milliradians.
 *
 * The canvas's own script fixes it (`wireConvergence`, `FOV = 40`) and draws
 * both rings and every dot against it. It is a property of the drawing, not of
 * the build: it decides how much sky the plate shows, and nothing else — a
 * build never widens it to fit, which is why a shot outside it is clamped
 * rather than accommodated.
 *
 * The 2026-08-25 canvas revision cut it from `115`, so the same offsets now
 * subtend nearly three times as much of the plate.
 */
export const FIELD_OF_VIEW_MILLIRADIANS = 40;

/**
 * How far from the plate's centre a mark may be drawn, as a fraction of the
 * half plate.
 *
 * The canvas clamps every dot to `4%`–`96%` of the plate — `clamp(50 ± mrad /
 * FOV * 50, 4, 96)` — which is this fraction either side of the middle. A shot
 * further off-axis than the plate shows stops at the frame's own margin instead
 * of leaving it, so nothing disappears; its sentence beside the plate still
 * states the offset and the angle it actually has (FR-011).
 */
export const PLATE_MARGIN_FRACTION = 0.92;

/**
 * The target ranges the `RANGE` track runs between, its step, and where it opens.
 *
 * The canvas's own track is `100`–`2000` on a `25` step, opening at `600`. These
 * are the maintainer's, set on 2026-08-26: `500`–`5000` on a `100` step, opening
 * at `1000`. The reason is what the track is for — a weapon's own maximum range
 * reaches 3,000 m and beyond on this hull, so a track stopping at 2,000 m could
 * not be moved to the distance a Commander is actually asking about, and a 25 m
 * step over that span is finer than a gunsight can be read at.
 *
 * It is a property of the drawing like the field of view, and a departure from
 * the canvas recorded as one (`design/canvas-contract.md`, review note 18). It
 * changes no figure: every reading the block gives is the package's answer at
 * whatever distance the track is set to.
 */
export const TARGET_RANGE = { min: 500, max: 5000, step: 100, initial: 1000 } as const;

/** Radians to milliradians, so the conversion is named rather than a loose 1000. */
const MILLIRADIANS_PER_RADIAN = 1000;

/** Where the shots land at one range, and how far apart they are there. */
export interface ConvergenceView {
  readonly targetRangeMetres: number;
  /** Every placed hardpoint, armed or empty, in the hull's own order. */
  readonly points: readonly ConvergencePoint[];
  /** The diagonal of the spread, in milliradians — the canvas's `APPARENT SPREAD`. */
  readonly apparentSpreadMilliradians: number;
  /** The canvas's two dashed rings, inner first. */
  readonly rings: readonly ConvergenceRing[];
  /** The outer ring's angular radius, and what it spans on the plane at this range. */
  readonly ringMilliradians: number;
  readonly ringMetres: number;
}

/**
 * One dashed ring, as a fraction of the plate it is drawn on.
 *
 * Only a width, since the 2026-08-25 canvas revision: the script sizes a ring's
 * height as `mrad / FOV * 100 * aspect` where `aspect` is the box's own
 * `offsetWidth / offsetHeight`, and a height that is a fraction of the box's
 * height multiplied by the box's width over its height is the same number of
 * pixels as the width. The ring is a pixel circle, so the plate draws it as one
 * and no second fraction is needed here.
 */
export interface ConvergenceRing {
  readonly milliradians: number;
  /** Diameter over the plate's width, in `[0, 1]`. */
  readonly width: number;
}

/** One hardpoint, placed on the plate. */
export interface ConvergencePoint {
  /** The hull's own 1-based hardpoint place — the plate's numeral. */
  readonly hardpoint: number;
  /** The mount this mark stands for. Its `weapon` is `null` where it is empty. */
  readonly mount: ConvergenceMount;
  /**
   * Fraction of the plate's half width, `-1` to `1`; positive points right.
   *
   * Where the mark is *drawn*, not where the shot is: a shot beyond the plate's
   * field of view is clamped to `PLATE_MARGIN_FRACTION` rather than left off the
   * frame. What the shot actually does is `milliradians`, which is never
   * clamped, and the sentence beside the plate is drawn from that.
   */
  readonly horizontal: number;
  /** Fraction of the plate's half height, `-1` to `1`; positive points up. Clamped alike. */
  readonly vertical: number;
  /** How far off the axis this shot lands, in milliradians. The true angle, never clamped. */
  readonly milliradians: number;
}

/**
 * Place every one of a hull's hardpoints on its gunsight, and say which are armed.
 *
 * The gunsight is indexed in the hull's own hardpoint order, so the enumerated
 * slots are walked in that order and a weapon is matched onto one by its journal
 * slot key rather than by reading a number out of that key — the package
 * documents ten hulls where those two disagree.
 *
 * The list is the hull's, not the build's: every placed hardpoint is returned,
 * and the ones a Commander has not filled come back with no weapon on them. The
 * three figures beside the list are measured across the armed ones alone,
 * because they are figures about where shots go.
 */
export function projectConvergence(
  shipSymbol: string,
  weapons: readonly FittedWeaponMetrics[],
): Convergence {
  const gunsight = getShipGunsight(shipSymbol);
  const layout = getShipSlots(shipSymbol);
  if (gunsight === null || layout === null) {
    return { kind: 'unavailable' };
  }

  const hardpoints = enumerateSlots(layout).filter((slot) => slot.kind === 'hardpoint');
  if (hardpoints.length !== gunsight.length) {
    return { kind: 'unavailable' };
  }

  const fitted = new Map(weapons.map((weapon) => [weapon.slot.toLowerCase(), weapon]));
  const mounts = hardpoints.flatMap((slot, index) => {
    const offset = gunsight[index];
    if (offset === undefined) {
      return [];
    }
    const weapon = fitted.get(slot.key.toLowerCase());
    return [
      {
        slot: slot.key,
        hardpoint: index + 1,
        offset,
        offsetMetres: Math.hypot(offset[0], offset[1]),
        weapon:
          weapon === undefined
            ? null
            : {
                name: weapon.name,
                symbol: weapon.symbol,
                mount: getModuleBySymbol(weapon.symbol)?.mount ?? null,
              },
      },
    ];
  });

  // The three figures are about a group of *armed* mounts. An empty hardpoint
  // is drawn, because its offset is a property of the hull, but it fires
  // nothing: a lateral span stretched to reach one would be a separation
  // between a shot and no shot.
  const armed = mounts.filter((mount) => mount.weapon !== null);

  // `null` on a build that has armed nothing. Not `unavailable`: the two are
  // different answers, and the unavailable sentence says the package publishes
  // no geometry for this hull, which for a placed hull whose hardpoints are
  // merely empty is untrue.
  const widest = armed.reduce<ConvergenceMount | null>(
    (furthest, mount) =>
      furthest === null || mount.offsetMetres > furthest.offsetMetres ? mount : furthest,
    null,
  );

  return {
    kind: 'available',
    mounts,
    lateralSpanMetres: span(armed.map((mount) => mount.offset[0])),
    verticalSpanMetres: span(armed.map((mount) => mount.offset[1])),
    widest,
  };
}

/**
 * Ask the package where those mounts' shots land at one range.
 *
 * Every mount is placed, the empty ones included: `projectGunsight` is being
 * asked where a mount points, which it answers from the offset alone. Only the
 * `APPARENT SPREAD` is narrowed to the armed ones, because that is the one
 * figure here that reports a group rather than a mark.
 *
 * The plate is the canvas's, and since the 2026-08-25 revision it is square in
 * *angle*: half a field of view either side of the axis on both axes, whatever
 * shape the box itself is. Only the rings are corrected for the box's pixel
 * aspect, and the plate draws that correction rather than this function.
 *
 * Both coordinates come back as a fraction of the half plate, so the template
 * positions a dot without knowing the plate's size — clamped to the frame's own
 * margin, because the field of view is a property of the drawing and never
 * moves to accommodate a build.
 */
export function convergenceAt(
  convergence: Extract<Convergence, { kind: 'available' }>,
  targetRangeMetres: number,
): ConvergenceView {
  // One call for the whole plate: the package is asked where a set of offsets
  // lands, and asking it twice for one drawing would be two projections of the
  // same plate.
  const projected = projectGunsight(
    convergence.mounts.map((mount) => mount.offset),
    targetRangeMetres,
  );

  const angles = convergence.mounts.map((mount, index) => {
    const point = projected[index];
    return {
      hardpoint: mount.hardpoint,
      mount,
      across: (point?.horizontalTangent ?? 0) * MILLIRADIANS_PER_RADIAN,
      up: (point?.verticalTangent ?? 0) * MILLIRADIANS_PER_RADIAN,
    };
  });

  const ringMilliradians = (FIELD_OF_VIEW_MILLIRADIANS * 2) / 3;
  const ring = (milliradians: number): ConvergenceRing => ({
    milliradians,
    width: milliradians / FIELD_OF_VIEW_MILLIRADIANS,
  });

  const place = ({ hardpoint, mount, across, up }: (typeof angles)[number]): ConvergencePoint => ({
    hardpoint,
    mount,
    horizontal: clampToPlate(across / FIELD_OF_VIEW_MILLIRADIANS),
    vertical: clampToPlate(up / FIELD_OF_VIEW_MILLIRADIANS),
    milliradians: Math.hypot(across, up),
  });

  const armed = angles.filter((angle) => angle.mount.weapon !== null);

  return {
    targetRangeMetres,
    points: angles.map(place),
    apparentSpreadMilliradians: Math.hypot(
      span(armed.map((angle) => angle.across)),
      span(armed.map((angle) => angle.up)),
    ),
    rings: [ring(FIELD_OF_VIEW_MILLIRADIANS / 3), ring(ringMilliradians)],
    ringMilliradians,
    ringMetres: (ringMilliradians / MILLIRADIANS_PER_RADIAN) * targetRangeMetres,
  };
}

/**
 * Hold a mark inside the plate's frame.
 *
 * The canvas's own `clamp(50 ± mrad / FOV * 50, 4, 96)`, written as the fraction
 * of the half plate it works out to. It moves a dot and nothing else: the angle
 * the shot actually makes is carried separately and stated in words beside the
 * plate, which is the reading either way (FR-011).
 */
function clampToPlate(fraction: number): number {
  return Math.min(PLATE_MARGIN_FRACTION, Math.max(-PLATE_MARGIN_FRACTION, fraction));
}

/** The distance between the outermost two of a set. Zero for a single mount. */
function span(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values) - Math.min(...values);
}
