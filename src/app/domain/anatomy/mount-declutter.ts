/**
 * Where a plate draws its numbered marks when the hull draws its mounts closer
 * together than a mark is wide.
 *
 * The Almanac puts real mounts six CSS pixels apart on the Anaconda's underside
 * at the plate width two columns have room for, and the canvas's own mark is
 * fourteen. Drawn where the package drew them, those marks sit on top of one
 * another: the number on the one underneath cannot be read, and a pointer
 * landing between them reaches whichever is in front. Bringing the worked-with
 * mark forward — which the plate still does — answers the second half and not
 * the first.
 *
 * So a mark that would touch a mark already placed steps aside, and a hairline
 * ties it back to the point it stepped away from. Three things make that safe
 * to do without contradicting FR-003:
 *
 *   * **the anchor never moves.** What is displaced is the *mark*, which is the
 *     canvas's own square and this application's own drawing; the point it is
 *     tied to is the middle of the package's own annotation, unchanged. The
 *     leader is what keeps the mount's real position on screen rather than
 *     replacing it.
 *   * **nothing is measured.** Every number here is arithmetic over the
 *     coordinates the package published and the plate's own frame — the same
 *     arithmetic that turns the hull and centres it. There is no `getBBox`, no
 *     `getScreenCTM` and no read off anything rendered.
 *   * **the result does not depend on how big the plate is.** Separation is a
 *     fraction of the frame, not a pixel count, so one hull produces one layout
 *     at every width. A plate that re-decluttered as it resized would move
 *     marks under a Commander's finger, which is worse than the overlap it
 *     fixed.
 *
 * Pure functions over immutable inputs: no signals, no injection, no
 * `ShipLoadout` (constitution III).
 */

/**
 * A point in the plate frame's own units — the `viewBox` the plate draws in.
 *
 * The frame is always the plate's one ratio and the CSS box it is drawn in is
 * that same ratio, so a frame unit is the same length across as it is up. That
 * is what lets a square mark be compared against a square separation without
 * either axis being scaled.
 */
export interface PlatePoint {
  readonly x: number;
  readonly y: number;
}

/** The frame a plate draws in, in its own units. */
export interface PlateFrame {
  readonly width: number;
  readonly height: number;
}

/** One mount's mark: where the package put it, and where it is drawn. */
export interface MarkPlacement {
  /** The middle of the package's own annotation. Never moved. */
  readonly anchor: PlatePoint;
  /** Where the numbered square is drawn. The anchor unless it stepped aside. */
  readonly mark: PlatePoint;
  /** True when the two differ, which is when a leader is drawn between them. */
  readonly displaced: boolean;
}

/**
 * How far apart two marks must be, as a fraction of the frame's inline size.
 *
 * The mark is `clamp(0.875rem, 3.06cqw, 1.375rem)`, so on a wide plate it is
 * 3.06% of the frame and on a narrow one it stops shrinking at fourteen pixels
 * and therefore grows as a share of the plate: about 4.7% of the ~300px frame a
 * phone in portrait gives it. Separation is set at the widest share a mark ever
 * takes, plus a hairline of air, so marks that clear it here are clear at every
 * plate size rather than only at the size this was reasoned about.
 */
export const MARK_SEPARATION = 0.055;

/**
 * The steps a displaced mark may take, in mark-separations.
 *
 * Three is the whole ladder. A mount that still has nowhere to go after three
 * rings is on a hull whose mounts are packed tighter than any arrangement of
 * squares can separate, and it keeps its own position: an honest overlap the
 * front-on-hover rule still resolves, rather than a mark flung far enough from
 * its mount that the leader is the only thing saying where the mount is.
 */
const RINGS: readonly number[] = [1, 2, 3];

/**
 * The eight directions a mark may step in.
 *
 * Unit vectors under the same norm the separation test uses, so every one of
 * them lands a candidate exactly one separation away from where it started —
 * a diagonal step covers as much ground as a straight one.
 */
const DIRECTIONS: readonly PlatePoint[] = [
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
];

/**
 * How far apart two square marks are, measured the way squares overlap.
 *
 * Two axis-aligned squares of the same size miss each other exactly when the
 * larger of their two axis distances is at least their width, which is what
 * makes this the right distance rather than the straight-line one: a pair a
 * quarter of a mark apart across and a whole mark apart up the plate do not
 * touch, and Euclid says they nearly do.
 */
function separation(a: PlatePoint, b: PlatePoint): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/**
 * The eight directions, ordered by how far each points away from the middle of
 * the plate.
 *
 * A mount is on the hull and the hull is centred in the frame, so stepping
 * outward moves a mark off the drawing into the air around it, where a
 * fourteen-pixel square with a number in it is legible and covers nothing.
 * Stepping inward would push it deeper onto the structure and, on a dense
 * hull, straight into the next mount.
 *
 * Ties keep the fixed order above — `sort` is stable — so two mounts the same
 * distance out on opposite sides of the nose are answered the same way every
 * time this runs.
 */
function outwardFirst(anchor: PlatePoint, frame: PlateFrame): readonly PlatePoint[] {
  const outward = { x: anchor.x - frame.width / 2, y: anchor.y - frame.height / 2 };
  return [...DIRECTIONS].sort(
    (a, b) => b.x * outward.x + b.y * outward.y - (a.x * outward.x + a.y * outward.y),
  );
}

/**
 * Every mark's drawn position, in the order the mounts were handed over.
 *
 * Greedy and in one pass: the first mount keeps its own position, and each one
 * after it keeps its own position unless that would touch a mark already
 * placed, in which case it takes the first clear step outward. Package drawing
 * order is what decides who moves, and it is the same order on every render, so
 * one hull's plate is one arrangement — there is nothing here that could settle
 * differently on a second pass.
 *
 * A displaced mark must also land inside the frame, because a mark half off the
 * plate is not a mark a Commander can press. The anchor itself is exempt from
 * that test: a mount the package drew near the edge is where the mount is, and
 * moving it to satisfy a rule about displacement would be this function
 * inventing geometry for a mount that never collided with anything.
 */
export function placeMarks(
  anchors: readonly PlatePoint[],
  frame: PlateFrame,
): readonly MarkPlacement[] {
  const gap = MARK_SEPARATION * frame.width;
  const inset = gap / 2;
  const placed: PlatePoint[] = [];

  // Every step below lands a candidate at exactly one gap from where it
  // started, so the test it then has to pass is the one case binary arithmetic
  // cannot answer: `(y + gap) - y` is not always `gap`. Without the slack, the
  // same hull drawn into a frame ten times the size picks a different direction
  // for the same mount, because the rounding fell the other way — a plate whose
  // arrangement depends on the window's size, which is the one thing this was
  // written not to be.
  const tolerance = gap * 1e-9;

  const touches = (point: PlatePoint): boolean =>
    placed.some((other) => separation(point, other) < gap - tolerance);

  const inside = (point: PlatePoint): boolean =>
    point.x >= inset &&
    point.x <= frame.width - inset &&
    point.y >= inset &&
    point.y <= frame.height - inset;

  const keep = (anchor: PlatePoint, mark: PlatePoint, displaced: boolean): MarkPlacement => {
    placed.push(mark);
    return { anchor, mark, displaced };
  };

  return anchors.map((anchor) => {
    if (!touches(anchor)) {
      return keep(anchor, anchor, false);
    }

    const directions = outwardFirst(anchor, frame);
    for (const ring of RINGS) {
      for (const direction of directions) {
        const candidate = {
          x: anchor.x + direction.x * ring * gap,
          y: anchor.y + direction.y * ring * gap,
        };
        if (inside(candidate) && !touches(candidate)) {
          return keep(anchor, candidate, true);
        }
      }
    }

    // Nowhere to stand. The mark stays on its mount and overlaps, which is what
    // the plate's own front-on-hover rule is for.
    return keep(anchor, anchor, false);
  });
}
