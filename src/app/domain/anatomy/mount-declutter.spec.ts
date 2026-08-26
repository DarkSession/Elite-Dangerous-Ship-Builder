import { MARK_SEPARATION, placeMarks, type PlateFrame, type PlatePoint } from './mount-declutter';

/**
 * What stepping aside is allowed to change, and what it may never change.
 *
 * The one thing this must not do is lose a mount's real position, so every
 * case below checks the anchor as well as the mark: a displaced mark reports
 * both, and the leader the plate draws is the difference between them. The rest
 * is arithmetic — separation, determinism and the frame's own edges.
 */

/** A frame the size of a real plate, at the plate's one ratio. */
const FRAME: PlateFrame = { width: 720, height: 292 };

/** How far apart two marks have to be on that frame before neither moves. */
const GAP = MARK_SEPARATION * FRAME.width;

/**
 * The same slack the placement itself allows.
 *
 * A mark that steps aside lands at exactly one gap from the one it avoided, and
 * `(y + gap) - y` is not always `gap` in binary — so a separation read back off
 * the result can sit a few parts in a quadrillion under it.
 */
const SLACK = GAP * 1e-9;

function apart(a: PlatePoint, b: PlatePoint): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

describe('placeMarks', () => {
  it('leaves a mount where the package drew it when nothing is near it', () => {
    const anchors = [
      { x: 100, y: 100 },
      { x: 400, y: 200 },
    ];

    const placed = placeMarks(anchors, FRAME);

    expect(placed.map((one) => one.displaced)).toEqual([false, false]);
    expect(placed.map((one) => one.mark)).toEqual(anchors);
    expect(placed.map((one) => one.anchor)).toEqual(anchors);
  });

  it('steps a mark aside when it would touch one already placed', () => {
    // Six units apart on a 720-unit frame: the Anaconda's pair, to scale.
    const anchors = [
      { x: 360, y: 146 },
      { x: 366, y: 146 },
    ];

    const [first, second] = placeMarks(anchors, FRAME);

    expect(first.displaced).toBe(false);
    expect(second.displaced).toBe(true);
    expect(apart(first.mark, second.mark)).toBeGreaterThanOrEqual(GAP - SLACK);
  });

  it('keeps the displaced mount pointing at the point the package published', () => {
    const anchors = [
      { x: 360, y: 146 },
      { x: 366, y: 146 },
    ];

    const [, second] = placeMarks(anchors, FRAME);

    // The mark moved; the mount did not. This difference is the leader.
    expect(second.anchor).toEqual({ x: 366, y: 146 });
    expect(second.mark).not.toEqual(second.anchor);
  });

  it('separates every mark of a tight cluster from every other', () => {
    const anchors = [
      { x: 300, y: 150 },
      { x: 303, y: 150 },
      { x: 306, y: 152 },
      { x: 300, y: 154 },
      { x: 309, y: 149 },
    ];

    const placed = placeMarks(anchors, FRAME);

    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        expect(apart(placed[i].mark, placed[j].mark)).toBeGreaterThanOrEqual(GAP - SLACK);
      }
    }
  });

  it('produces one arrangement for one hull, however often it runs', () => {
    const anchors = [
      { x: 300, y: 150 },
      { x: 303, y: 150 },
      { x: 306, y: 152 },
      { x: 300, y: 154 },
    ];

    expect(placeMarks(anchors, FRAME)).toEqual(placeMarks(anchors, FRAME));
  });

  it('scales its answer with the frame rather than with a pixel count', () => {
    // The same hull in a frame ten times the size, at the same separation
    // fraction, is the same arrangement scaled — the frame's units are the
    // package's, so nothing here depends on how many pixels a plate got. What
    // *does* move a mark between two plate sizes is the caller measuring a
    // different separation, which the case below covers.
    const anchors = [
      { x: 300, y: 150 },
      { x: 303, y: 150 },
      { x: 306, y: 152 },
    ];
    const scaled = anchors.map((one) => ({ x: one.x * 10, y: one.y * 10 }));

    const small = placeMarks(anchors, FRAME);
    const large = placeMarks(scaled, { width: FRAME.width * 10, height: FRAME.height * 10 });

    small.forEach((one, index) => {
      expect(large[index].displaced).toBe(one.displaced);
      expect(large[index].mark.x).toBeCloseTo(one.mark.x * 10, 6);
      expect(large[index].mark.y).toBeCloseTo(one.mark.y * 10, 6);
    });
  });

  it('never steps a mark off the plate', () => {
    // A cluster in the corner: every outward step leaves the frame, so the ones
    // that move have to come back inward instead of hanging off the edge.
    const anchors = [
      { x: 4, y: 4 },
      { x: 7, y: 5 },
      { x: 5, y: 8 },
    ];

    for (const placed of placeMarks(anchors, FRAME)) {
      if (placed.displaced) {
        expect(placed.mark.x).toBeGreaterThanOrEqual(GAP / 2 - SLACK);
        expect(placed.mark.y).toBeGreaterThanOrEqual(GAP / 2 - SLACK);
        expect(placed.mark.x).toBeLessThanOrEqual(FRAME.width - GAP / 2 + SLACK);
        expect(placed.mark.y).toBeLessThanOrEqual(FRAME.height - GAP / 2 + SLACK);
      }
    }
  });

  it('keeps a mount that has nowhere to go on its own position', () => {
    // Forty mounts on one point. The rings run out, and the ones left over stay
    // where the package drew them rather than being flung across the hull.
    const anchors = Array.from({ length: 40 }, () => ({ x: 360, y: 146 }));

    const placed = placeMarks(anchors, FRAME);

    expect(placed.length).toBe(40);
    // More than one of them gave up, which is what proves the ladder ended
    // rather than that forty rings were quietly walked.
    expect(placed.filter((one) => !one.displaced).length).toBeGreaterThan(1);
    for (const one of placed) {
      if (!one.displaced) {
        expect(one.mark).toEqual(one.anchor);
      }
    }
  });

  it('never parks a displaced mark on a different mount’s published position', () => {
    // The failure this rules out: mark A steps onto mount B's own position, so a
    // reader sees a numbered square exactly where B is, carrying A's number,
    // while A's leader runs off somewhere else. The candidate has to clear every
    // other mount's anchor, not just the marks already placed.
    const anchors = [
      { x: 300, y: 150 },
      { x: 305, y: 150 },
      // Where the second mark would otherwise have been pushed.
      { x: 305 - GAP, y: 150 + GAP },
    ];

    const placed = placeMarks(anchors, FRAME);

    for (const one of placed) {
      if (!one.displaced) {
        continue;
      }
      for (const anchor of anchors) {
        if (anchor === one.anchor) {
          continue;
        }
        expect(apart(one.mark, anchor)).toBeGreaterThanOrEqual(GAP - SLACK);
      }
    }
  });

  it('gives up the anchor rule rather than leaving a mark stacked', () => {
    // Twelve mounts on one point: nothing can clear every foreign anchor, so the
    // second pass drops that requirement rather than refusing to move at all.
    const anchors = Array.from({ length: 12 }, () => ({ x: 360, y: 146 }));

    const placed = placeMarks(anchors, FRAME);

    expect(placed.filter((one) => one.displaced).length).toBeGreaterThan(0);
  });

  it('takes the separation it is given rather than one of its own', () => {
    // The mark's own floor is an absolute length, so its share of the plate
    // grows as the plate narrows or the text grows. The caller measures both and
    // passes the real fraction; a pair clear at one separation can be touching
    // at another.
    const anchors = [
      { x: 300, y: 150 },
      { x: 340, y: 150 },
    ];

    expect(placeMarks(anchors, FRAME, 0.03).map((one) => one.displaced)).toEqual([false, false]);
    expect(placeMarks(anchors, FRAME, 0.12).map((one) => one.displaced)).toEqual([false, true]);
  });

  it('returns one placement per mount, in the order it was handed them', () => {
    const anchors = [
      { x: 10, y: 20 },
      { x: 300, y: 150 },
      { x: 500, y: 40 },
    ];

    expect(placeMarks(anchors, FRAME).map((one) => one.anchor)).toEqual(anchors);
  });
});
