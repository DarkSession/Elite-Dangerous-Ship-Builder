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
 * How far a cluster's ring may be grown before the search gives up on it.
 *
 * Each step is a quarter wider than the last, so eight of them reach about five
 * times the ring a cluster starts with. A cluster still with nowhere to go
 * after that is on a plate too small for any arrangement, and its marks stay on
 * their mounts: a mount flung far enough that only the leader says where it is
 * has been made harder to read, not easier, and the plate's own front-on-hover
 * rule already handles the honest overlap.
 */
const GROWTH = 1.25;
const GROWTH_STEPS = 8;

/**
 * The least a mark may move, in its own widths, for moving it to be worth it.
 *
 * A displacement is only useful if a reader can *see* that it happened, and
 * what they see is the part of the leader outside the mark's own square — the
 * square covers half a mark's width of it. So a mark shifted half a width draws
 * nothing at all, and one shifted a whole width draws a stub. At one and a
 * quarter there is a real segment to follow.
 *
 * This is deliberately not the same number as the separation a crowd is
 * detected by. *Whether* two marks need help is a question about whether they
 * are touching; *how far* to move them once they do is a question about whether
 * the leader explaining it can be read. Answering both with one number is what
 * the first attempt did, and it displaced marks that had eleven pixels of air
 * between them by four pixels each — spreading pairs that did not need it, and
 * explaining none of the ones that did.
 */
const LEAST_TRAVEL = 1.25;

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
 * The groups of mounts that have to be solved together.
 *
 * Two mounts are in the same group when their marks would touch, and the
 * relation is followed transitively: a chain of three mounts each too close to
 * the next is one problem, not two, because moving the middle one changes both
 * answers. Package drawing order decides the order of the groups and of the
 * members inside them, so the same hull always produces the same grouping.
 */
function crowds(anchors: readonly PlatePoint[], gap: number): readonly (readonly number[])[] {
  const owner = anchors.map((_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (owner[root] !== root) {
      root = owner[root];
    }
    return root;
  };

  for (let i = 0; i < anchors.length; i += 1) {
    for (let j = i + 1; j < anchors.length; j += 1) {
      if (separation(anchors[i], anchors[j]) < gap) {
        owner[find(i)] = find(j);
      }
    }
  }

  const groups = new Map<number, number[]>();
  anchors.forEach((_, index) => {
    const root = find(index);
    groups.set(root, [...(groups.get(root) ?? []), index]);
  });
  return [...groups.values()];
}

/** The middle of what a group of mounts occupies. */
function middleOf(points: readonly PlatePoint[]): PlatePoint {
  const sum = points.reduce((into, one) => ({ x: into.x + one.x, y: into.y + one.y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/**
 * Where a crowd's marks go: a ring around the middle of the mounts themselves.
 *
 * **Every member moves, and every member moves the same distance.** That is the
 * point of doing it this way rather than pinning the first mount and pushing
 * the others off it. Pinning one is arbitrary — it makes the answer depend on
 * the order the package happened to draw them in — and it leaves the pinned
 * mount as the only one in the crowd with no leader, which reads as though that
 * mount alone were exactly where its mark is and the others had been guessed.
 * A ring says what is true: these mounts are too close together to draw apart,
 * so here they all are, each tied back to its own point.
 *
 * Each member keeps its own side of the crowd. The ring's slots are handed out
 * in the members' own angular order and the ring is then turned to the offset
 * that best matches the directions the mounts actually lie in, so a mount on
 * the crowd's left stays on the left and no two leaders cross.
 */
function ringOf(members: readonly PlatePoint[], radius: number): readonly PlatePoint[] {
  const middle = middleOf(members);
  const step = (2 * Math.PI) / members.length;

  // Each mount's own direction from the middle of the crowd. Two mounts on the
  // same point have no direction to keep, and take their slot's own angle.
  const bearings = members.map((one, index) => {
    const away = { x: one.x - middle.x, y: one.y - middle.y };
    return away.x === 0 && away.y === 0 ? index * step : Math.atan2(away.y, away.x);
  });

  const order = members.map((_, index) => index).sort((a, b) => bearings[a] - bearings[b] || a - b);

  // The turn that lines the ring up with the mounts: the mean of each mount's
  // own bearing less the slot it is about to take, averaged as a direction so
  // the wrap from -pi to pi does not pull it to the opposite side.
  let sin = 0;
  let cos = 0;
  order.forEach((member, slot) => {
    const difference = bearings[member] - slot * step;
    sin += Math.sin(difference);
    cos += Math.cos(difference);
  });
  const turn = Math.atan2(sin, cos);

  const placed: PlatePoint[] = new Array<PlatePoint>(members.length);
  order.forEach((member, slot) => {
    const angle = turn + slot * step;
    placed[member] = {
      x: middle.x + radius * Math.cos(angle),
      y: middle.y + radius * Math.sin(angle),
    };
  });
  return placed;
}

/**
 * The smallest ring that puts a crowd's own marks far enough apart.
 *
 * Neighbours on a ring of `n` sit `2r sin(pi/n)` apart, so the radius that
 * separates them is `gap / (2 sin(pi/n))` — half a gap for a pair, a gap over
 * root three for a trio, and so on. Squares are compared by their widest axis
 * rather than by straight-line distance, so this is a floor and the search
 * above it does the rest.
 */
function ringFor(count: number, gap: number): number {
  return count < 2 ? 0 : gap / (2 * Math.sin(Math.PI / count));
}

/**
 * One attempt at an arrangement, at one separation.
 *
 * Mounts far enough from everything keep their own position and draw no leader.
 * Every mount in a crowd moves: its whole crowd is spread onto a ring around
 * the middle of those mounts, each member the same distance from that middle
 * and on its own side of it, and each tied back to its own point by a leader.
 *
 * The ring starts at the smallest radius that separates the crowd's own members
 * and grows a quarter at a time until the whole crowd also clears three other
 * things: the marks of crowds already placed, the published position of every
 * mount that is not in this crowd — a mark parked on a *different* mount reads
 * as that mount's number, which is the one thing the leader exists to prevent —
 * and the edges of the frame, because a mark half off the plate cannot be
 * pressed. A crowd that never clears all three keeps its mounts' own positions.
 *
 * Crowds are taken largest first, so the arrangement that needs the most room
 * chooses before the plate is filled with smaller ones. Ties keep package
 * drawing order, so one hull at one plate size is one arrangement.
 */
function arrange(
  anchors: readonly PlatePoint[],
  frame: PlateFrame,
  gap: number,
  mark: number,
): readonly MarkPlacement[] {
  const inset = gap / 2;
  // Every step lands marks at exactly one gap from each other, so the test they
  // then have to pass is the one case binary arithmetic cannot answer:
  // `(y + gap) - y` is not always `gap`, and a mark placed at exactly one
  // separation must not then read as being under it.
  const tolerance = gap * 1e-9;

  const inside = (point: PlatePoint): boolean =>
    point.x >= inset &&
    point.x <= frame.width - inset &&
    point.y >= inset &&
    point.y <= frame.height - inset;

  const clearOf = (point: PlatePoint, others: readonly PlatePoint[]): boolean =>
    others.every((other) => separation(point, other) >= gap - tolerance);

  const placed: PlatePoint[] = [];
  const marks: PlatePoint[] = new Array<PlatePoint>(anchors.length);
  const displaced = new Array<boolean>(anchors.length).fill(false);

  const groups = [...crowds(anchors, gap)].sort((a, b) => b.length - a.length || a[0] - b[0]);

  for (const group of groups) {
    const members = group.map((index) => anchors[index]);

    if (members.length === 1) {
      marks[group[0]] = members[0];
      placed.push(members[0]);
      continue;
    }

    const foreign = anchors.filter((_, index) => !group.includes(index));

    // How far the ring has to be from the middle of the crowd, which is two
    // separate demands and neither implies the other.
    //
    // The first is that the crowd's own marks clear each other, which is what
    // the ring's own geometry gives.
    //
    // The second is that each member visibly *moved*. A ring is measured from
    // the middle of the crowd, but a member's own mount is not at that middle —
    // it is up to half the crowd's own width away from it, and in the direction
    // its mark is about to go. So a radius that looks generous can leave the
    // outermost member travelling almost nowhere, and its leader is then
    // entirely inside its own square. Pushing the ring out past the furthest
    // mount, and then past it by the distance a leader needs, is what makes the
    // guarantee hold for every member rather than for the average one.
    const middle = middleOf(members);
    const reach = Math.max(...members.map((one) => Math.hypot(one.x - middle.x, one.y - middle.y)));
    const smallest = Math.max(ringFor(members.length, gap), reach + mark * LEAST_TRAVEL);
    let settled: readonly PlatePoint[] | null = null;

    for (let step = 0; step < GROWTH_STEPS && settled === null; step += 1) {
      const ring = ringOf(members, smallest * GROWTH ** step);
      const room = ring.every(
        (one, index) =>
          inside(one) &&
          clearOf(one, placed) &&
          clearOf(one, foreign) &&
          clearOf(
            one,
            ring.filter((_, other) => other !== index),
          ),
      );
      if (room) {
        settled = ring;
      }
    }

    group.forEach((index, member) => {
      const mark = settled?.[member] ?? members[member];
      marks[index] = mark;
      displaced[index] = settled !== null;
      placed.push(mark);
    });
  }

  return anchors.map((anchor, index) => ({
    anchor,
    mark: marks[index],
    displaced: displaced[index],
  }));
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
  markFraction: number = separationFraction / 2,
): readonly MarkPlacement[] {
  let best: readonly MarkPlacement[] | null = null;
  let bestSpread = -Infinity;

  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const placements = arrange(
      anchors,
      frame,
      separationFraction * RETREAT ** attempt * frame.width,
      markFraction * frame.width,
    );
    const spread = tightest(placements);
    if (spread > bestSpread) {
      best = placements;
      bestSpread = spread;
    }
  }

  return best ?? [];
}
