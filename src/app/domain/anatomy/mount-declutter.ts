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
 * So a mark that would cover a mark beside it steps aside, and a hairline ties
 * it back to the point it stepped away from. Three things make that safe to do
 * without contradicting FR-003:
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
 *     bound.
 *
 * The whole placement is one rule, applied until it stops changing anything:
 * marks that would cover each other push apart, and every mark is drawn back
 * towards its own mount. Nothing is sent anywhere, so nothing has a distance or
 * a direction to choose — which is where the three properties this is here for
 * come from. A mark moves as little as the plate allows, mounts the hull
 * mirrors get marks the plate mirrors, and no leader is ever long enough to run
 * across a number that is not its own
 * (`specs/010-hull-anatomy/design/hull-anatomy.md`, "Marks that would touch").
 */

/**
 * A point in the plate's own drawing units, after the hull has been turned.
 *
 * Not CSS pixels: the plate draws in the frame it computed from the package's
 * own coordinates, and the marks are placed in the same space.
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
 * How many rounds of settling a plate is given, and how much each one moves.
 *
 * A round pushes apart every pair of marks that would cover each other and then
 * draws every mark back towards its own mount. `EASE` is the share of a push
 * that is applied — half, so two marks meeting each other's push do not swap
 * places over it — and `HOME` is the share of the way back a mark is drawn each
 * round, which is what keeps the arrangement the nearest one to the hull rather
 * than the first one that happened to work.
 *
 * Every shipped plate is settled by the twentieth round; forty is twice that,
 * and forty rounds of a dozen marks is nothing to compute.
 */
const ROUNDS = 40;
const EASE = 0.5;
const HOME = 0.12;

/**
 * The rounds at the end that push apart and do not draw back.
 *
 * The two halves of a round pull against each other, so a mark left touching a
 * neighbour by the last home step would be drawn a hair inside the separation
 * it had just been given. These rounds are what make the separation the last
 * word: they are the same push with the homeward half left out, run until the
 * furthest any mark moves in a round is under `STILL` — a millionth of a
 * mark, which is far below anything a plate can draw — or until `CLEARING`
 * rounds have been spent on a pile that cannot be separated at all. Both ends
 * are arithmetic on the same inputs, so one hull at one plate size is still one
 * arrangement.
 */
const CLEARING = 200;
const STILL = 1e-6;

/**
 * How much of a push a mark takes from a mount's published point.
 *
 * Half of what it takes from another mark. A square standing where a different
 * mount is, carrying that mount's neighbour's number, is the misreading the
 * leader exists to prevent — but a pile has more points in it than it has room
 * for, and where the two cannot both be had it is the squares covering each
 * other that a reader cannot read past.
 */
const ANCHOR_SHARE = 0.5;

/**
 * How far a mark may sit from its mount and still be drawn on it.
 *
 * A twentieth of a mark, which is under a pixel at every plate size. What it
 * catches is the tail of the homeward pull: a mark pushed aside early and freed
 * later approaches its own point without ever quite arriving, and a leader
 * drawn for that is a line nobody can see reporting a move nobody made.
 */
const AT_HOME = 0.05;

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
 * The cheapest push that takes `a` clear of `b`, or nothing if it already is.
 *
 * Squares miss each other as soon as *one* axis has the whole gap in it, so
 * there are two ways to separate a pair and this takes the shorter: the axis
 * they are already further apart on. That is what keeps the arrangement near
 * the hull — a pair the package drew one above the other steps further apart up
 * the plate rather than sliding along it, which is also the way a reader
 * expects them to move.
 *
 * Two mounts on the same point have no axis to prefer and no direction on it,
 * so they take the first of each. It is arbitrary and it is deterministic,
 * which is what the case needs: the package draws no two mounts on one point,
 * and a plate handed them anyway has to answer something.
 */
function pushApart(a: PlatePoint, b: PlatePoint, gap: number): PlatePoint | null {
  const across = a.x - b.x;
  const up = a.y - b.y;
  if (Math.abs(across) >= gap || Math.abs(up) >= gap) {
    return null;
  }

  const alongX = gap - Math.abs(across);
  const alongY = gap - Math.abs(up);
  return alongX <= alongY
    ? { x: (across === 0 ? 1 : Math.sign(across)) * alongX, y: 0 }
    : { x: 0, y: (up === 0 ? 1 : Math.sign(up)) * alongY };
}

/**
 * Every mark's drawn position: the nearest arrangement to the hull's own that
 * does not cover one number with another.
 *
 * `separationFraction` is how far apart two marks should be, as a share of the
 * frame's inline size — the caller's measurement of how wide a mark came out on
 * this plate, plus a little air. `markFraction` is the mark's own share, which
 * is what keeps a square inside the frame and off a mount that is not its own.
 *
 * Every mark starts on its mount and moves only under a push, so a plate whose
 * mounts are comfortably apart is returned exactly as the package drew it. What
 * a plate with no room for the separation gets is the same rule stopping short:
 * its marks end as far apart as the plate can hold them, none of them thrown
 * clear of the pile to buy room for the rest, and the complete slot ledger is
 * the equivalent that does not degrade at all.
 */
export function placeMarks(
  anchors: readonly PlatePoint[],
  frame: PlateFrame,
  separationFraction: number = MARK_SEPARATION,
  markFraction: number = separationFraction / 2,
): readonly MarkPlacement[] {
  const gap = separationFraction * frame.width;
  const mark = markFraction * frame.width;
  // Half a separation in from each edge, which is where a mark's neighbour
  // would have stood: the plate's own edge is one more thing a mark keeps clear
  // of, and a square a Commander presses is drawn whole rather than hanging off
  // the plate.
  const inset = gap / 2;

  const marks: PlatePoint[] = anchors.map((anchor) => anchor);

  /**
   * One push apart for every pair that would cover each other, applied at once.
   *
   * Gathered before any of it is applied, so no mark is answered against a
   * neighbour that has already moved this round. That is what makes the
   * arrangement independent of the order the package drew the mounts in — and
   * it is what mirrors it: a hull drawn symmetrically about its own axis pushes
   * symmetrically, and stays symmetric through every round.
   */
  const clear = (fromAnchors: boolean): number => {
    const push = marks.map(() => ({ x: 0, y: 0 }));

    for (let i = 0; i < marks.length; i += 1) {
      for (let j = i + 1; j < marks.length; j += 1) {
        const away = pushApart(marks[i], marks[j], gap);
        if (away === null) {
          continue;
        }
        push[i].x += away.x / 2;
        push[i].y += away.y / 2;
        push[j].x -= away.x / 2;
        push[j].y -= away.y / 2;
      }

      if (!fromAnchors) {
        continue;
      }
      for (let j = 0; j < anchors.length; j += 1) {
        if (j === i) {
          continue;
        }
        const off = pushApart(marks[i], anchors[j], mark);
        if (off === null) {
          continue;
        }
        push[i].x += off.x * ANCHOR_SHARE;
        push[i].y += off.y * ANCHOR_SHARE;
      }
    }

    let furthest = 0;
    for (let i = 0; i < marks.length; i += 1) {
      const moved = {
        x: Math.min(frame.width - inset, Math.max(inset, marks[i].x + push[i].x * EASE)),
        y: Math.min(frame.height - inset, Math.max(inset, marks[i].y + push[i].y * EASE)),
      };
      furthest = Math.max(furthest, separation(marks[i], moved));
      marks[i] = moved;
    }
    return furthest;
  };

  /** Every mark, a share of the way back to the mount it belongs to. */
  const home = (): void => {
    for (let i = 0; i < marks.length; i += 1) {
      marks[i] = {
        x: marks[i].x + (anchors[i].x - marks[i].x) * HOME,
        y: marks[i].y + (anchors[i].y - marks[i].y) * HOME,
      };
    }
  };

  for (let round = 0; round < ROUNDS; round += 1) {
    home();
    clear(true);
  }
  for (let round = 0; round < CLEARING; round += 1) {
    // The published points are kept clear of for the first stretch and then let
    // go, so what has the last word is the separation between the squares.
    if (clear(round < ROUNDS) < mark * STILL) {
      break;
    }
  }

  return anchors.map((anchor, index) => {
    const settled = marks[index];
    const displaced = separation(anchor, settled) > mark * AT_HOME;
    return { anchor, mark: displaced ? settled : anchor, displaced };
  });
}
