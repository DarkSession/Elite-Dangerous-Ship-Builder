import {
  getShipGunsight,
  projectGunsight,
  type GunsightOffset,
} from '@elite-dangerous-almanac/core/ships/gunsights';
import { getModuleBySymbol, type ModuleMount } from '@elite-dangerous-almanac/core/ships/modules';
import { getShipSlots } from '@elite-dangerous-almanac/core/ships/ships';
import { enumerateSlots } from '@elite-dangerous-almanac/core/ships/slots';
import type { FittedWeaponMetrics } from '@elite-dangerous-almanac/core/ships/ship-loadout';

/**
 * `SHOT CONVERGENCE`: where this build's shots land on the plane a target sits
 * on, as canvas 1c draws it (@649971) and canvas 1d draws it again (@1039230).
 *
 * The geometry is the package's. `SHIP_GUNSIGHTS` publishes every player-flyable
 * hull's hardpoint offsets from the cockpit in metres, and `projectGunsight`
 * turns those offsets into angular tangents at a chosen range. This file selects
 * the mounts that carry a weapon, asks the package where their shots go, and
 * says how far apart they are; it derives no offset and models no ballistics.
 *
 * A hull the catalogue does not carry, or one whose gunsight does not line up
 * with its hardpoints, is `unavailable` rather than a partial diagram: a
 * convergence drawn from some of the mounts would be a spread nobody has.
 */
export type Convergence =
  | { readonly kind: 'unavailable' }
  | {
      readonly kind: 'available';
      /** One entry per returned weapon whose mount the catalogue places. */
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

/** One armed hardpoint, at the offset the package publishes for it. */
export interface ConvergenceMount {
  /** The weapon's exact package slot key. */
  readonly slot: string;
  /** The weapon's display name, as the package returns it. */
  readonly name: string;
  /** The weapon's internal symbol, so a surface can name it in the Commander's language. */
  readonly symbol: string;
  /** The mount's 1-based place in the hull's own hardpoint order — the canvas's badge. */
  readonly hardpoint: number;
  /** How the weapon is aimed, or `null` where the module record states no mount. */
  readonly mount: ModuleMount | null;
  /** The package's own offset pair, in metres. */
  readonly offset: GunsightOffset;
  /** Distance from the cockpit's axis, in metres. */
  readonly offsetMetres: number;
}

/**
 * The half field of view the canvas's plate spans, in milliradians.
 *
 * The canvas's own script fixes it (`wireConvergence`, `FOV = 115`) and draws
 * both rings and every dot against it. It is a property of the drawing, not of
 * the build: it decides how much sky the plate shows, and nothing else.
 */
export const FIELD_OF_VIEW_MILLIRADIANS = 115;

/**
 * The plate's height over its width. The canvas draws the box `16 / 6`, so
 * this is its reciprocal.
 *
 * The canvas keeps milliradians-per-unit the same on both axes, so the plate
 * shows a *narrower* angle vertically than horizontally in exactly this
 * proportion. Dividing the two axes by the same angle instead would stretch
 * every shot's height by nearly three, which is a spread no build has.
 */
export const PLATE_ASPECT = 6 / 16;

/** The target ranges the canvas's `RANGE` track runs between, and its step. */
export const TARGET_RANGE = { min: 100, max: 2000, step: 25, initial: 600 } as const;

/** Radians to milliradians, so the conversion is named rather than a loose 1000. */
const MILLIRADIANS_PER_RADIAN = 1000;

/** Where the shots land at one range, and how far apart they are there. */
export interface ConvergenceView {
  readonly targetRangeMetres: number;
  /** The armed mounts, in package order. */
  readonly points: readonly ConvergencePoint[];
  /** The diagonal of the spread, in milliradians — the canvas's `APPARENT SPREAD`. */
  readonly apparentSpreadMilliradians: number;
  /** The canvas's two dashed rings, inner first. */
  readonly rings: readonly ConvergenceRing[];
  /** The outer ring's angular radius, and what it spans on the plane at this range. */
  readonly ringMilliradians: number;
  readonly ringMetres: number;
}

/** One dashed ring, as a fraction of the plate it is drawn on. */
export interface ConvergenceRing {
  readonly milliradians: number;
  /** Diameter over the plate's width, in `[0, 1]`. */
  readonly width: number;
  /** Diameter over the plate's height, in `[0, 1]`. */
  readonly height: number;
}

/** One armed hardpoint, placed on the plate. */
export interface ConvergencePoint {
  /** The hull's own 1-based hardpoint place — the plate's badge. */
  readonly hardpoint: number;
  /** The weapon whose shot lands here. */
  readonly mount: ConvergenceMount;
  /** Fraction of the plate's half width, `-1` to `1`; positive points right. */
  readonly horizontal: number;
  /** Fraction of the plate's half height, `-1` to `1`; positive points up. */
  readonly vertical: number;
  /** How far off the axis this shot lands, in milliradians. */
  readonly milliradians: number;
}

/**
 * Place every armed mount of a build on its hull's gunsight.
 *
 * The gunsight is indexed in the hull's own hardpoint order, so a weapon's
 * journal slot key is resolved through `enumerateSlots` rather than by reading
 * the number out of the key — the package documents ten hulls where those two
 * disagree.
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

  const places = new Map(hardpoints.map((slot, index) => [slot.key.toLowerCase(), index]));
  const mounts = weapons.flatMap((weapon) => {
    const index = places.get(weapon.slot.toLowerCase());
    const offset = index === undefined ? undefined : gunsight[index];
    if (index === undefined || offset === undefined) {
      return [];
    }
    return [
      {
        slot: weapon.slot,
        name: weapon.name,
        symbol: weapon.symbol,
        hardpoint: index + 1,
        mount: getModuleBySymbol(weapon.symbol)?.mount ?? null,
        offset,
        offsetMetres: Math.hypot(offset[0], offset[1]),
      },
    ];
  });

  // `null` on a build that has armed nothing. Not `unavailable`: the two are
  // different answers, and the unavailable sentence says the package publishes
  // no geometry for this hull, which for a placed hull whose hardpoints are
  // merely empty is untrue.
  const widest = mounts.reduce<ConvergenceMount | null>(
    (furthest, mount) =>
      furthest === null || mount.offsetMetres > furthest.offsetMetres ? mount : furthest,
    null,
  );

  return {
    kind: 'available',
    mounts,
    lateralSpanMetres: span(mounts.map((mount) => mount.offset[0])),
    verticalSpanMetres: span(mounts.map((mount) => mount.offset[1])),
    widest,
  };
}

/**
 * Ask the package where those mounts' shots land at one range.
 *
 * The plate is the canvas's: half a field of view wide either side of the axis,
 * and — because the canvas gives it a `16 / 6` box — that same angle compressed
 * into its height. Both coordinates come back as a fraction of the half plate,
 * so the template positions a dot without knowing the plate's size.
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

  const halfHeight = FIELD_OF_VIEW_MILLIRADIANS * PLATE_ASPECT;
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
    height: milliradians / halfHeight,
  });

  const place = ({ hardpoint, mount, across, up }: (typeof angles)[number]): ConvergencePoint => ({
    hardpoint,
    mount,
    horizontal: across / FIELD_OF_VIEW_MILLIRADIANS,
    vertical: up / halfHeight,
    milliradians: Math.hypot(across, up),
  });

  return {
    targetRangeMetres,
    points: angles.map(place),
    apparentSpreadMilliradians: Math.hypot(
      span(angles.map((angle) => angle.across)),
      span(angles.map((angle) => angle.up)),
    ),
    rings: [ring(FIELD_OF_VIEW_MILLIRADIANS / 3), ring(ringMilliradians)],
    ringMilliradians,
    ringMetres: (ringMilliradians / MILLIRADIANS_PER_RADIAN) * targetRangeMetres,
  };
}

/** The distance between the outermost two of a set. Zero for a single mount. */
function span(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values) - Math.min(...values);
}
