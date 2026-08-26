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
 * that clears them all is taken. When no corner does, the numeral is pushed
 * out along the line from the plate's centre through its dot until it is
 * clear, and reports that it moved — which is what earns it the leader line
 * back to the dot, the way feature 010's schematics explain a displaced mark.
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

/** How far each push moves a numeral that no corner could place, in pixels. */
const PUSH_STEP = 3;

/** How many times it may be pushed before the plate is simply too full. */
const PUSH_LIMIT = 24;

/**
 * The bearings tried at each distance, as turns from the outward one.
 *
 * Nearest-first and alternating side to side, so a numeral leaves along the
 * line from the plate's centre through its dot wherever that line is free, and
 * swings only as far aside as it must. Sixteen of them close the circle.
 */
const BEARINGS: readonly number[] = (() => {
  const step = (2 * Math.PI) / 16;
  const turns: number[] = [0];
  for (let index = 1; index <= 8; index += 1) {
    turns.push(index * step, -index * step);
  }
  return turns;
})();

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

/**
 * The direction a numeral is pushed when no corner will hold it.
 *
 * Outward from the plate's centre through the dot, which is away from the
 * crowd on a plate whose mounts straddle the axis. A dot sitting exactly on
 * the centre has no such line, and is pushed straight up — the one direction
 * the four corners between them leave least covered.
 */
function pushDirection(dot: NumeralAnchor, metrics: NumeralMetrics): readonly [number, number] {
  const middle = metrics.plate / 2;
  const dx = dot.x - middle;
  const dy = dot.y - middle;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) {
    return [0, -1];
  }
  return [dx / length, dy / length];
}

/**
 * Place every numeral so that none is drawn over a dot or over another numeral.
 *
 * Deterministic: the same plate produces the same answer every time, because
 * the mounts are placed in hardpoint order and every choice below is decided by
 * arithmetic on their published positions.
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

    if (chosen !== null) {
      placements.set(anchor.id, {
        id: anchor.id,
        left: chosen.offset[0] + ANCHOR_LEFT,
        top: chosen.offset[1] + ANCHOR_TOP,
        displaced: false,
      });
      placed.push(chosen.box);
      continue;
    }

    // No corner had room. Walk the numeral out around its own dot: each step
    // further out, and at each distance the bearings nearest the outward one
    // first, so it leaves along the line from the plate's centre through this
    // dot whenever that line is free and only swings aside when it is not.
    const [dx, dy] = pushDirection(anchor, metrics);
    const outward = Math.atan2(dy, dx);
    // Far enough out that the numeral clears its *own* dot. The distance is
    // measured centre to centre, so the dot's radius and the clearance alone
    // put the box's near edge half a numeral inside the mark its leader points
    // back to — at the built metrics, an 11px numeral spanning 1px to 12px from
    // the centre of a 5px dot. `others` excludes the anchor deliberately, so
    // nothing downstream rejects it (reported 2026-08-26).
    const start = Math.max(
      metrics.dotRadius + metrics.clearance + Math.max(metrics.width, metrics.height) / 2,
      PUSH_STEP,
    );
    let fallback: { left: number; top: number; box: Box } | null = null;
    let settled = false;
    for (let step = 0; step < PUSH_LIMIT && !settled; step += 1) {
      const distance = start + step * PUSH_STEP;
      for (const bearing of BEARINGS) {
        const angle = outward + bearing;
        const centreX = anchor.x + Math.cos(angle) * distance;
        const centreY = anchor.y + Math.sin(angle) * distance;
        const left = centreX - metrics.width / 2;
        const top = centreY - metrics.height / 2;
        const box = boxAt(left, top, metrics);
        if (!inside(box, metrics)) {
          continue;
        }
        // Remembered so a plate with no clear position anywhere still draws the
        // numeral somewhere on the plate rather than off it.
        fallback ??= { left, top, box };
        if (others.some((dot) => touchesDot(box, dot, metrics))) {
          continue;
        }
        if (placed.some((other) => overlaps(box, other, metrics.clearance))) {
          continue;
        }
        fallback = { left, top, box };
        settled = true;
        break;
      }
    }

    // A plate with no room at all keeps the numeral against its dot rather than
    // dropping it: the mark is still stated in words beside the plate, and a
    // numeral drawn nowhere would be the one mark with no reading.
    const resting = fallback ?? {
      left: anchor.x + ANCHOR_LEFT,
      top: anchor.y + ANCHOR_TOP,
      box: boxAt(anchor.x + ANCHOR_LEFT, anchor.y + ANCHOR_TOP, metrics),
    };
    placements.set(anchor.id, {
      id: anchor.id,
      left: resting.left - anchor.x,
      top: resting.top - anchor.y,
      displaced: true,
    });
    placed.push(resting.box);
  }

  // Handed back in the order they arrived, so the caller's list still lines up.
  return anchors.map(
    (anchor) => placements.get(anchor.id) ?? { id: anchor.id, left: 0, top: 0, displaced: false },
  );
}
