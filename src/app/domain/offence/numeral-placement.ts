/**
 * Where a hardpoint numeral goes on the gunsight plate, so that no two of them
 * are ever drawn on top of each other.
 *
 * The canvas offers four corners around a dot and takes whichever stands
 * furthest from every *other dot*. That rule reads the wrong thing. Two dots
 * far enough apart both score their inward corner well, and each aims its
 * numeral straight at the other's — the dots stay apart and the numerals
 * collide. The Caspian Explorer at 1,000 m is the case that shows it:
 * hardpoint 1 sits on the centreline between the mirrored pair 6 and 7, its
 * four corners tie to within a five-thousandth of a pixel, and whichever way
 * the tie falls the numeral lands on one of them.
 *
 * So this measures what actually overlaps: the numeral's own ink box against
 * every dot on the plate and against every numeral already placed. A corner
 * that clears them all is taken.
 *
 * **When one numeral cannot be placed, none of them stays.** The whole plate
 * moves to a ring just inside its frame, every numeral on it, each tied back to
 * its own dot by a leader. Pushing out only the numeral that failed was the
 * earlier rule, and it produced a plate read two ways at once: most numerals
 * beside their dots, one of them out on its own with a line, and no way to see
 * that the odd one out is the same kind of mark as the rest. A ring is one
 * rule applied once — every numeral the same distance out, every one with a
 * leader, and the crowded middle of the plate left to the dots, which are the
 * reading (Commander request 2026-08-26).
 *
 * **The dot never moves.** On a hull schematic the mark *is* the mount and may
 * be walked to where there is room; here the dot is the reading — it is where
 * the shot lands — so only the numeral beside it travels. That is why this is
 * its own placement rule and not feature 010's ring.
 *
 * Everything is in plate pixels, at the reference width the caller hands in.
 * Nothing here reads the DOM and nothing here touches a package figure: moving
 * a numeral moves no reading, because every mark on the plate is also written
 * out in words beside it (FR-011).
 */

/** A dot to be labelled, in plate pixels, with the numeral that belongs to it. */
export interface NumeralAnchor {
  /** Stable identity, and the order ties are broken in. */
  readonly id: string;
  /** Sort key — the hardpoint number, so one plate is placed the same way twice. */
  readonly order: number;
  readonly x: number;
  readonly y: number;
}

/** Where one numeral is drawn, relative to its own dot. */
export interface NumeralPlacement {
  readonly id: string;
  /**
   * Pixels from the dot to the numeral's ink box, on each axis.
   *
   * The whole offset, ready to draw with. It used to be the offset *minus* the
   * anchor's own `3, 4`, which every caller then had to add back and none did:
   * the numeral was drawn three pixels left and four above the box this
   * function had checked for collisions, and the leader that ties a displaced
   * numeral to its dot ended at the same wrong point (reported 2026-08-26).
   */
  readonly left: number;
  readonly top: number;
  /**
   * Whether the numeral had to leave its four corners to find room.
   *
   * A displaced numeral is drawn with a leader back to its dot, because a mark
   * that has moved has to say which dot it belongs to.
   */
  readonly displaced: boolean;
}

/** The sizes the placement is measured against, all in plate pixels. */
export interface NumeralMetrics {
  /** The plate's width. It is square, so this is its height too. */
  readonly plate: number;
  /** The numeral's ink box. */
  readonly width: number;
  readonly height: number;
  /** A dot's drawn radius, including the halo that separates it from the ground. */
  readonly dotRadius: number;
  /** The air a numeral keeps around every other mark. */
  readonly clearance: number;
}

/**
 * The canvas's four corners, as offsets from a dot to the numeral's ink box.
 *
 * Kept in the canvas's own order, so a plate with room everywhere is drawn the
 * way the canvas draws it and this rule only shows itself where marks collide.
 */
const CORNERS: readonly (readonly [number, number])[] = [
  [7, -14],
  [7, 5],
  [-13, -14],
  [-13, 5],
];

/** The numeral's ink box, which the canvas offsets from its top-left corner. */
const ANCHOR_LEFT = 3;
const ANCHOR_TOP = 4;

/**
 * The air the ring keeps between itself and the edge of the plate.
 *
 * A numeral drawn hard against the frame reads as clipped even when every
 * pixel of it is inside, so the ring stands one clearance in from the edge the
 * corner rule already measures against.
 */
const RING_INSET = 1;

interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

function boxAt(x: number, y: number, metrics: NumeralMetrics): Box {
  return { left: x, top: y, right: x + metrics.width, bottom: y + metrics.height };
}

/** Whether two boxes share any area once the clearance is allowed for. */
function overlaps(one: Box, other: Box, clearance: number): boolean {
  return (
    one.left < other.right + clearance &&
    other.left < one.right + clearance &&
    one.top < other.bottom + clearance &&
    other.top < one.bottom + clearance
  );
}

/** Whether a numeral's box reaches a dot, treating the dot as its own square. */
function touchesDot(box: Box, dot: NumeralAnchor, metrics: NumeralMetrics): boolean {
  const reach = metrics.dotRadius;
  return overlaps(
    box,
    { left: dot.x - reach, top: dot.y - reach, right: dot.x + reach, bottom: dot.y + reach },
    metrics.clearance,
  );
}

/** Whether a numeral's box is wholly on the plate. */
function inside(box: Box, metrics: NumeralMetrics): boolean {
  return box.left >= 0 && box.top >= 0 && box.right <= metrics.plate && box.bottom <= metrics.plate;
}

/**
 * How much room a box has: the distance to the nearest thing it must clear.
 *
 * Used only to choose between corners that all fit, so a numeral takes the
 * roomiest of them rather than the first. Ties keep the canvas's own order.
 */
function room(box: Box, dots: readonly NumeralAnchor[], placed: readonly Box[]): number {
  let least = Number.POSITIVE_INFINITY;
  const centreX = (box.left + box.right) / 2;
  const centreY = (box.top + box.bottom) / 2;
  for (const dot of dots) {
    least = Math.min(least, Math.hypot(centreX - dot.x, centreY - dot.y));
  }
  for (const other of placed) {
    const otherX = (other.left + other.right) / 2;
    const otherY = (other.top + other.bottom) / 2;
    least = Math.min(least, Math.hypot(centreX - otherX, centreY - otherY));
  }
  return least;
}

/** An angle brought back into `-pi` to `pi`, so two of them can be compared. */
function wrapped(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/**
 * Angles as near the ones asked for as a minimum spacing allows.
 *
 * The crowd's own directions are what a leader is read against, so a ring that
 * spaces its numerals evenly throws away the only thing that ties a numeral to
 * its dot at a glance. What is wanted instead is the nearest arrangement that
 * is still legible: minimise how far each numeral moves from its own bearing,
 * subject to consecutive ones standing at least `step` apart.
 *
 * Substituting `q(i) = angle(i) - i * step` turns "at least one step apart"
 * into "not decreasing", which is isotonic regression — and the pool-adjacent-
 * violators algorithm below solves it exactly in one pass: each new value is
 * merged with the block before it for as long as that block sits above it, and
 * a merged block takes the mean of what went into it.
 */
function spread(wanted: readonly number[], step: number): readonly number[] {
  const levels: number[] = [];
  const counts: number[] = [];

  wanted.forEach((angle, index) => {
    let level = angle - index * step;
    let weight = 1;
    while (levels.length > 0 && levels[levels.length - 1]! > level) {
      const previousWeight = counts.pop()!;
      const previousLevel = levels.pop()!;
      level = (level * weight + previousLevel * previousWeight) / (weight + previousWeight);
      weight += previousWeight;
    }
    levels.push(level);
    counts.push(weight);
  });

  const angles: number[] = [];
  levels.forEach((level, block) => {
    for (let member = 0; member < counts[block]!; member += 1) {
      angles.push(level);
    }
  });
  return angles.map((level, index) => level + index * step);
}

/**
 * The fallback: every numeral an equal share of the circle.
 *
 * Reached only when the nearest arrangement would run right round the ring and
 * meet itself. Turned to wherever best matches the bearings asked for, which
 * has a closed form — the circular mean of each bearing less the slot it takes.
 */
function even(wanted: readonly number[], step: number): readonly number[] {
  let sin = 0;
  let cos = 0;
  wanted.forEach((angle, index) => {
    sin += Math.sin(angle - index * step);
    cos += Math.cos(angle - index * step);
  });
  const rotation = Math.atan2(sin, cos);
  return wanted.map((_, index) => rotation + index * step);
}

/**
 * Every numeral out on a ring just inside the plate, each keeping its own side.
 *
 * The arrangement a crowded plate takes as a whole. Three things decide it, in
 * this order:
 *
 *   * **the radius** is the largest that still draws every numeral wholly on
 *     the plate — as far from the dots as there is room for, because the middle
 *     of a crowded plate is exactly what the ring is clearing.
 *   * **the order** is the numerals' own angular order about the plate's
 *     centre, so a mount on the left of the plate keeps a numeral on the left
 *     and no two leaders cross.
 *   * **the spacing** is the smallest turn that keeps two boxes apart on that
 *     radius, or an even share of the circle where even that will not fit. A
 *     numeral is then no further from its own bearing than the crowd forces it
 *     to be.
 *
 * The one remaining freedom is where the whole ring is turned to, and that is
 * closed in the loop below: every rotation is scored by how far it moves each
 * numeral from the direction its own dot actually lies in, and the best is
 * taken. The optimum for a given cut has a closed form — the circular mean of
 * each bearing less the slot it would take — so the search is over the `n`
 * places the ring can be cut and nothing more.
 */
function ringPlacements(
  anchors: readonly NumeralAnchor[],
  metrics: NumeralMetrics,
): readonly NumeralPlacement[] {
  const middle = metrics.plate / 2;
  const halfBox = Math.max(metrics.width, metrics.height) / 2;
  // Never smaller than the box itself: a plate too small to hold a ring still
  // draws one rather than stacking every numeral on the centre.
  const radius = Math.max(middle - halfBox - metrics.clearance - RING_INSET, halfBox);

  const bearingOf = (anchor: NumeralAnchor): number => {
    const dx = anchor.x - middle;
    const dy = anchor.y - middle;
    // A dot on the plate's own centre lies in no direction, and takes the one
    // the four corners leave least covered.
    return Math.hypot(dx, dy) < 1e-6 ? -Math.PI / 2 : Math.atan2(dy, dx);
  };

  const round = [...anchors].sort(
    (one, other) =>
      bearingOf(one) - bearingOf(other) ||
      one.order - other.order ||
      one.id.localeCompare(other.id),
  );
  const count = round.length;

  // The turn that holds two boxes apart on this radius, as the chord between
  // them: `chord = 2r sin(step / 2)`.
  //
  // The chord is the box's *diagonal* rather than its widest side. Two boxes
  // miss each other when they are clear on either axis, so the shapes that
  // still overlap at a given distance are the ones inside a rectangle of the
  // box's own width and height — and the longest line that fits in that
  // rectangle is its diagonal. A chord measured on the widest side alone
  // separates a pair standing square to each other and fails the pair standing
  // corner to corner, which at sixteen numerals on a ring is most of them.
  const chord = Math.hypot(metrics.width, metrics.height) + metrics.clearance;
  const required = 2 * Math.asin(Math.min(1, chord / (2 * radius)));
  const step = Math.min(required, (2 * Math.PI) / count);

  let best: { cut: number; angles: readonly number[]; cost: number } | null = null;
  for (let cut = 0; cut < count; cut += 1) {
    // The bearings unrolled from this cut, so they increase rather than jumping
    // at the wrap from pi to -pi.
    const wanted: number[] = [];
    let previous = bearingOf(round[cut]!);
    wanted.push(previous);
    for (let index = 1; index < count; index += 1) {
      let bearing = bearingOf(round[(cut + index) % count]!);
      while (bearing < previous) {
        bearing += 2 * Math.PI;
      }
      wanted.push(bearing);
      previous = bearing;
    }

    const angles = spread(wanted, step);

    // The one constraint the run above cannot see: the last numeral on the arc
    // and the first are neighbours too, around the back of the ring. An arc
    // that has grown too long for that is given up on and spaced evenly.
    const span = angles[count - 1]! - angles[0]!;
    const settled = span <= 2 * Math.PI - step + 1e-9 ? angles : even(wanted, step);

    let cost = 0;
    settled.forEach((angle, index) => {
      const away = wrapped(angle - wanted[index]!);
      cost += away * away;
    });

    // Ties keep the earliest cut, so one plate is one arrangement.
    if (best === null || cost < best.cost - 1e-12) {
      best = { cut, angles: settled, cost };
    }
  }

  const settled = best ?? { cut: 0, angles: [-Math.PI / 2], cost: 0 };
  const placements = new Map<string, NumeralPlacement>();
  for (let index = 0; index < count; index += 1) {
    const anchor = round[(settled.cut + index) % count]!;
    const angle = settled.angles[index] ?? 0;
    const centreX = middle + radius * Math.cos(angle);
    const centreY = middle + radius * Math.sin(angle);
    placements.set(anchor.id, {
      id: anchor.id,
      left: centreX - metrics.width / 2 - anchor.x,
      top: centreY - metrics.height / 2 - anchor.y,
      displaced: true,
    });
  }

  return anchors.map(
    (anchor) => placements.get(anchor.id) ?? { id: anchor.id, left: 0, top: 0, displaced: false },
  );
}

/**
 * Place every numeral so that none is drawn over a dot or over another numeral.
 *
 * Two arrangements, and the plate is wholly in one of them. Every numeral takes
 * one of its dot's four corners, or — the moment one of them cannot — every
 * numeral goes out to the ring. Deterministic either way: the same plate
 * produces the same answer every time, because the mounts are considered in
 * hardpoint order and every choice below is decided by arithmetic on their
 * published positions.
 */
export function placeNumerals(
  anchors: readonly NumeralAnchor[],
  metrics: NumeralMetrics,
): readonly NumeralPlacement[] {
  const ordered = [...anchors].sort((one, other) =>
    one.order === other.order ? one.id.localeCompare(other.id) : one.order - other.order,
  );

  const placements = new Map<string, NumeralPlacement>();
  const placed: Box[] = [];

  for (const anchor of ordered) {
    const others = anchors.filter((dot) => dot.id !== anchor.id);

    // The four corners, best room first, among those that clear everything.
    let chosen: { offset: readonly [number, number]; box: Box; room: number } | null = null;
    for (const corner of CORNERS) {
      const left = anchor.x + corner[0] + ANCHOR_LEFT;
      const top = anchor.y + corner[1] + ANCHOR_TOP;
      const box = boxAt(left, top, metrics);
      if (!inside(box, metrics)) {
        continue;
      }
      if (others.some((dot) => touchesDot(box, dot, metrics))) {
        continue;
      }
      if (placed.some((other) => overlaps(box, other, metrics.clearance))) {
        continue;
      }
      const space = room(box, others, placed);
      if (chosen === null || space > chosen.room) {
        chosen = { offset: corner, box, room: space };
      }
    }

    // One numeral with nowhere to stand settles the whole plate: it goes to the
    // ring, and so does every other, so a reader meets one kind of mark rather
    // than two (Commander request 2026-08-26).
    if (chosen === null) {
      return ringPlacements(anchors, metrics);
    }

    placements.set(anchor.id, {
      id: anchor.id,
      left: chosen.offset[0] + ANCHOR_LEFT,
      top: chosen.offset[1] + ANCHOR_TOP,
      displaced: false,
    });
    placed.push(chosen.box);
  }

  // Handed back in the order they arrived, so the caller's list still lines up.
  return anchors.map(
    (anchor) => placements.get(anchor.id) ?? { id: anchor.id, left: 0, top: 0, displaced: false },
  );
}
