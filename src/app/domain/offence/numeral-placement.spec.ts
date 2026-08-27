import { describe, expect, it } from 'vitest';

import { type NumeralAnchor, type NumeralMetrics, placeNumerals } from './numeral-placement';

/** The plate the application draws, at canvas 1c's own 172px width. */
const METRICS: NumeralMetrics = {
  plate: 172,
  width: 11,
  height: 9,
  dotRadius: 5,
  clearance: 1.5,
};

interface Box {
  readonly id: string;
  readonly left: number;
  readonly top: number;
}

/** Where each numeral's ink box actually lands, in plate pixels. */
function boxes(anchors: readonly NumeralAnchor[], metrics = METRICS): readonly Box[] {
  const placed = placeNumerals(anchors, metrics);
  return placed.map((placement, index) => {
    const anchor = anchors[index]!;
    // The placement is the whole offset from the dot, so the ink box is the dot
    // plus it — no anchor inset to add back.
    return {
      id: placement.id,
      left: anchor.x + placement.left,
      top: anchor.y + placement.top,
    };
  });
}

/** The clear air between two boxes on their roomiest axis. Negative means overlap. */
function gap(one: Box, other: Box, metrics = METRICS): number {
  return Math.max(
    Math.max(one.left - (other.left + metrics.width), other.left - (one.left + metrics.width)),
    Math.max(one.top - (other.top + metrics.height), other.top - (one.top + metrics.height)),
  );
}

/** The tightest pair on the plate. */
function tightest(drawn: readonly Box[], metrics = METRICS): number {
  let least = Number.POSITIVE_INFINITY;
  for (let index = 0; index < drawn.length; index += 1) {
    for (let other = index + 1; other < drawn.length; other += 1) {
      least = Math.min(least, gap(drawn[index]!, drawn[other]!, metrics));
    }
  }
  return least;
}

/**
 * Project a hull's published hardpoint offsets onto the plate, the way the
 * component does: metres across and up, over the range, into milliradians, and
 * then as a fraction of the plate's half field of view.
 */
function project(
  mounts: readonly (readonly [number, number])[],
  range: number,
  metrics = METRICS,
): readonly NumeralAnchor[] {
  const fieldOfView = 40;
  return mounts.map(([across, up], index) => {
    const horizontal = Math.max(-1, Math.min(1, ((across / range) * 1000) / fieldOfView));
    const vertical = Math.max(-1, Math.min(1, ((up / range) * 1000) / fieldOfView));
    return {
      id: `hp${index + 1}`,
      order: index + 1,
      x: ((1 + horizontal) / 2) * metrics.plate,
      y: ((1 - vertical) / 2) * metrics.plate,
    };
  });
}

/**
 * The Caspian Explorer's seven hardpoints, as `ships/gunsights` publishes them.
 *
 * Named here because this hull is the reported case: hardpoint 1 sits on the
 * centreline (its offset is a thousandth of a metre off it) between the
 * mirrored pair 6 and 7, which is exactly the shape that defeated the canvas's
 * own rule.
 */
const CASPIAN_EXPLORER: readonly (readonly [number, number])[] = [
  [-0.0009805651, 7.4557856917],
  [22.3390128736, 5.1527962089],
  [-22.3404877062, 5.1527962089],
  [-4.1629874583, -4.175993979],
  [4.1610129003, -4.1762040257],
  [-14.1689875002, 7.1313461661],
  [14.1670129423, 7.1317958236],
];

describe('gunsight numeral placement', () => {
  it('keeps a lone numeral in the canvas’s first corner', () => {
    const [placement] = placeNumerals([{ id: 'one', order: 1, x: 86, y: 86 }], METRICS);

    // Nothing to stand clear of, so the plate is drawn the way the canvas
    // draws it and this rule does not show itself at all. The canvas's corner
    // is `7, -14` from the dot and its anchor inset is `3, 4`; the offset
    // handed back is the sum, because it is the offset the caller draws with.
    expect(placement).toEqual({ id: 'one', left: 10, top: -10, displaced: false });
  });

  it('never draws two numerals over each other on the reported hull', () => {
    // The Caspian Explorer at 1,000 m is the case the canvas's rule could not
    // settle: it put "1" and "6" 2.72px apart, which at this text size is one
    // numeral on top of another.
    const drawn = boxes(project(CASPIAN_EXPLORER, 1000));

    expect(drawn).toHaveLength(7);
    expect(tightest(drawn)).toBeGreaterThanOrEqual(0);
  });

  it('never draws two numerals over each other at any range the track reaches', () => {
    for (let range = 500; range <= 5000; range += 50) {
      const drawn = boxes(project(CASPIAN_EXPLORER, range));
      expect(tightest(drawn), `overlap at ${range} m`).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps every numeral clear of every dot, not only of the other numerals', () => {
    const anchors = project(CASPIAN_EXPLORER, 900);
    const drawn = boxes(anchors);

    for (const box of drawn) {
      for (const dot of anchors) {
        if (dot.id === box.id) {
          continue;
        }
        const reachesX =
          box.left < dot.x + METRICS.dotRadius &&
          dot.x - METRICS.dotRadius < box.left + METRICS.width;
        const reachesY =
          box.top < dot.y + METRICS.dotRadius &&
          dot.y - METRICS.dotRadius < box.top + METRICS.height;
        expect(reachesX && reachesY, `${box.id} covers ${dot.id}`).toBe(false);
      }
    }
  });

  it('ties a numeral back to its own dot when it had to leave its corners', () => {
    // Four mounts within a couple of pixels of each other: no corner can hold
    // all four, so some of them step out and earn a leader.
    const anchors: readonly NumeralAnchor[] = [
      { id: 'a', order: 1, x: 86, y: 86 },
      { id: 'b', order: 2, x: 88, y: 87 },
      { id: 'c', order: 3, x: 87, y: 89 },
      { id: 'd', order: 4, x: 85, y: 88 },
    ];
    const placed = placeNumerals(anchors, METRICS);

    expect(placed.some((placement) => placement.displaced)).toBe(true);
    expect(tightest(boxes(anchors))).toBeGreaterThanOrEqual(0);
  });

  it('moves every numeral to the ring, or none of them', () => {
    // The whole plate is in one arrangement. A reader who meets a numeral out
    // on a leader must not also meet one tucked against its dot, or the two
    // read as different kinds of mark (Commander request 2026-08-26).
    for (let range = 500; range <= 3000; range += 50) {
      const placed = placeNumerals(project(CASPIAN_EXPLORER, range), METRICS);
      const moved = placed.filter((placement) => placement.displaced).length;
      expect([0, placed.length]).toContain(moved);
    }
  });

  it('keeps a ringed numeral on its own side of the plate', () => {
    // Six mounts crowded into the middle: no corner can hold them, so the ring
    // takes over. Each numeral must still stand in the direction its own dot
    // lies in, or its leader crosses the plate to reach it.
    const middle = METRICS.plate / 2;
    const anchors: readonly NumeralAnchor[] = [
      { id: 'a', order: 1, x: middle - 6, y: middle - 6 },
      { id: 'b', order: 2, x: middle + 6, y: middle - 6 },
      { id: 'c', order: 3, x: middle + 6, y: middle + 6 },
      { id: 'd', order: 4, x: middle - 6, y: middle + 6 },
      { id: 'e', order: 5, x: middle, y: middle - 9 },
      { id: 'f', order: 6, x: middle, y: middle + 9 },
    ];

    const placed = placeNumerals(anchors, METRICS);
    expect(placed.every((placement) => placement.displaced)).toBe(true);

    placed.forEach((placement, index) => {
      const anchor = anchors[index]!;
      const centreX = anchor.x + placement.left + METRICS.width / 2;
      const centreY = anchor.y + placement.top + METRICS.height / 2;
      // The numeral lies in the same quadrant of the plate as its own dot.
      expect(Math.sign(centreX - middle)).toBe(
        Math.sign(anchor.x - middle) || Math.sign(centreX - middle),
      );
      expect(Math.sign(centreY - middle)).toBe(
        Math.sign(anchor.y - middle) || Math.sign(centreY - middle),
      );
    });
  });

  it('never steps a numeral off the plate', () => {
    for (const range of [500, 1000, 2000, 5000]) {
      for (const box of boxes(project(CASPIAN_EXPLORER, range))) {
        expect(box.left, `${box.id} at ${range} m`).toBeGreaterThanOrEqual(0);
        expect(box.top, `${box.id} at ${range} m`).toBeGreaterThanOrEqual(0);
        expect(box.left + METRICS.width).toBeLessThanOrEqual(METRICS.plate);
        expect(box.top + METRICS.height).toBeLessThanOrEqual(METRICS.plate);
      }
    }
  });

  it('produces one answer for one plate, however often it runs', () => {
    const anchors = project(CASPIAN_EXPLORER, 1400);
    const once = placeNumerals(anchors, METRICS);
    const again = placeNumerals(anchors, METRICS);

    expect(again).toEqual(once);
  });

  it('hands its answers back in the order it was given them', () => {
    const anchors: readonly NumeralAnchor[] = [
      { id: 'third', order: 3, x: 40, y: 40 },
      { id: 'first', order: 1, x: 120, y: 40 },
      { id: 'second', order: 2, x: 80, y: 120 },
    ];

    expect(placeNumerals(anchors, METRICS).map((placement) => placement.id)).toEqual([
      'third',
      'first',
      'second',
    ]);
  });
});
