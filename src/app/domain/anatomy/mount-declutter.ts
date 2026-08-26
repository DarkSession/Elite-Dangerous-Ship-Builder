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
 *   * **no mount position is measured.** Every coordinate here is the
 *     package's own, or arithmetic over it — the same arithmetic that turns the
 *     hull and centres it in the frame. There is no `getBBox`, no
 *     `getScreenCTM`, and nothing about where a mount *is* comes from the
 *     rendered document.
 *   * **what is measured is this application's own layout.** How wide the plate
 *     is drawn, and how wide a mark is drawn on it, are CSS decisions rather
 *     than facts about the hull, and the caller reports them as the
 *     `separation` fraction below. They have to be measured, because the mark's
 *     size is `clamp(0.875rem, 3.06cqw, 1.375rem)`: its floor is an absolute
 *     length, so at a narrow plate or enlarged text a mark keeps its pixels
 *     while the plate loses them, and its share of the frame grows without
 *     bound. A fixed fraction was the first attempt and it silently stopped
 *     separating anything below about 255 CSS pixels of plate — which 320px
 *     reflow and 200% text both reach.
 *
 * The cost of measuring is that one hull is no longer one arrangement: a plate
 * that crosses a size threshold re-settles its marks. That is the trade the
 * alternative forces — marks that stay put and overlap at the sizes an
 * accessibility requirement names are worse than marks that move when the
 * window does.
 *
 * Pure functions over immutable inputs: no signals, no injection, no
 * `ShipLoadout`, and nothing here touches a DOM (constitution III).
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
 * How far apart two marks must be, as a fraction of the frame's inline size,
 * before anything has been measured.
 *
 * A fallback, and only that. The mark is `clamp(0.875rem, 3.06cqw, 1.375rem)`:
 * its middle term is a share of the plate, but its floor is an absolute length,
 * so on a narrow plate — or at enlarged text — a mark stops shrinking while the
 * plate keeps going and its share of the frame grows without bound. No constant
 * can be right at every size, which is why the caller measures the plate and
 * the mark and passes the real fraction in. This value is what a plate uses for
 * the first frame, before the measurement arrives: it is the mark's share of a
 * ~255px plate, which is about the narrowest a plate gets at the default text
 * size.
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
 * One attempt at an arrangement, at one separation.
 *
 * Greedy and in one pass: the first mount keeps its own position, and each one
 * after it keeps its own position unless that would touch a mark already
 * placed, in which case it takes the first clear step it can find. Package
 * drawing order is what decides who moves, and it is the same order on every
 * render, so one hull at one plate size is one arrangement — there is nothing
 * here that could settle differently on a second pass.
 *
 * A step is chosen in two passes over the same ladder, and the first pass is
 * what stops a displaced mark from lying about which mount it belongs to. A
 * mark that steps onto *another mount's* published position sits on top of that
 * mount while its own leader runs off somewhere else — the reader sees a
 * numbered square exactly where mount B is, labelled with mount A's number,
 * which is worse than the overlap being fixed. So the first pass requires a
 * candidate to be clear of every other mount's anchor as well as of every mark
 * already placed; only if the whole ladder fails that test does the second pass
 * drop the anchor requirement. Dropping it is a real loss and it is taken last.
 *
 * A displaced mark must also land inside the frame, because a mark half off the
 * plate is not a mark a Commander can press. The anchor itself is exempt from
 * that test: a mount the package drew near the edge is where the mount is, and
 * moving it to satisfy a rule about displacement would be this function
 * inventing geometry for a mount that never collided with anything.
 *
 */
function arrange(
  anchors: readonly PlatePoint[],
  frame: PlateFrame,
  gap: number,
): readonly MarkPlacement[] {
  const inset = gap / 2;
  const placed: PlatePoint[] = [];

  // Every step below lands a candidate at exactly one gap from where it
  // started, so the test it then has to pass is the one case binary arithmetic
  // cannot answer: `(y + gap) - y` is not always `gap`, and a candidate placed
  // at exactly one separation must not then read as being under it.
  const tolerance = gap * 1e-9;

  const clearOf = (point: PlatePoint, others: readonly PlatePoint[]): boolean =>
    others.every((other) => separation(point, other) >= gap - tolerance);

  const inside = (point: PlatePoint): boolean =>
    point.x >= inset &&
    point.x <= frame.width - inset &&
    point.y >= inset &&
    point.y <= frame.height - inset;

  const keep = (anchor: PlatePoint, mark: PlatePoint, displaced: boolean): MarkPlacement => {
    placed.push(mark);
    return { anchor, mark, displaced };
  };

  return anchors.map((anchor, index) => {
    if (clearOf(anchor, placed)) {
      return keep(anchor, anchor, false);
    }

    // Every mount's published position except this one's. A mark that came to
    // rest on one of these would be sitting exactly where a different mount is.
    const foreign = anchors.filter((_, other) => other !== index);
    const directions = outwardFirst(anchor, frame);

    for (const alsoClearOfMounts of [true, false]) {
      for (const ring of RINGS) {
        for (const direction of directions) {
          const candidate = {
            x: anchor.x + direction.x * ring * gap,
            y: anchor.y + direction.y * ring * gap,
          };
          if (
            inside(candidate) &&
            clearOf(candidate, placed) &&
            (!alsoClearOfMounts || clearOf(candidate, foreign))
          ) {
            return keep(anchor, candidate, true);
          }
        }
      }
    }

    // Nowhere to stand. The mark stays on its mount and overlaps, which is what
    // the plate's own front-on-hover rule is for.
    return keep(anchor, anchor, false);
  });
}

/** The smallest pairwise distance in an arrangement; `Infinity` for one mark. */
function tightest(placements: readonly MarkPlacement[]): number {
  let closest = Infinity;
  for (let i = 0; i < placements.length; i += 1) {
    for (let j = i + 1; j < placements.length; j += 1) {
      closest = Math.min(closest, separation(placements[i].mark, placements[j].mark));
    }
  }
  return closest;
}

/**
 * How far the search will climb down from the separation it was asked for.
 *
 * Each step is four fifths of the one before, which reaches about a quarter of
 * the asked-for distance in eight tries. Eight arrangements of a dozen marks is
 * nothing to compute, and the alternative is the failure below.
 */
const RETREAT = 0.8;
const ATTEMPTS = 8;

/**
 * Every mark's drawn position: the best arrangement this search can find.
 *
 * `separationFraction` is how far apart two marks should ideally be, as a share
 * of the frame's inline size — the caller's measurement of how wide a mark came
 * out on this plate, plus a little air. But *asking* for a distance is not the
 * same as there being room for it, and asking for more than a plate can give is
 * worse than asking for less: the greedy search runs out of candidates that are
 * both clear and inside the frame, more marks give up and stay stacked on their
 * mounts, and the arrangement comes out **tighter than a smaller request would
 * have produced**. Measured on the Anaconda's underside at 200% text on a phone:
 * asking for 13.1% of the plate left two marks six pixels apart, where asking
 * for 9% left them twenty-five apart. A bigger number made a worse picture.
 *
 * So the request is a ceiling rather than a promise. The search tries it, then
 * retreats in eighths-of-a-fifth until it has eight arrangements, and returns
 * whichever actually separated its marks best. Ties go to the roomier request,
 * which is the earlier attempt, and then to the one that moved fewer marks —
 * both deterministic, so one hull at one plate size is still one arrangement.
 *
 * On a plate with room the first attempt wins and the ladder costs nothing. On
 * a plate without room this is the difference between marks that are as far
 * apart as the plate allows and marks that gave up where they stood.
 */
export function placeMarks(
  anchors: readonly PlatePoint[],
  frame: PlateFrame,
  separationFraction: number = MARK_SEPARATION,
): readonly MarkPlacement[] {
  let best: readonly MarkPlacement[] | null = null;
  let bestSpread = -Infinity;
  let bestMoved = Infinity;

  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const placements = arrange(
      anchors,
      frame,
      separationFraction * RETREAT ** attempt * frame.width,
    );
    const spread = tightest(placements);
    const moved = placements.filter((one) => one.displaced).length;
    if (spread > bestSpread || (spread === bestSpread && moved < bestMoved)) {
      best = placements;
      bestSpread = spread;
      bestMoved = moved;
    }
  }

  return best ?? [];
}
