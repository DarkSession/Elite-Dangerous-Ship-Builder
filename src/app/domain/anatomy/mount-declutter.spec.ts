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

  it('moves every mount of a crowd, not just the ones after the first', () => {
    // Six units apart on a 720-unit frame: the Anaconda's pair, to scale.
    //
    // Both move. Pinning the first would make the answer depend on the order
    // the package happened to draw them in, and would leave the pinned mount as
    // the only one in the crowd with no leader — which reads as though that one
    // were exactly where its mark is and the other had been guessed.
    const anchors = [
      { x: 360, y: 146 },
      { x: 366, y: 146 },
    ];

    const [first, second] = placeMarks(anchors, FRAME);

    expect(first.displaced).toBe(true);
    expect(second.displaced).toBe(true);
    expect(apart(first.mark, second.mark)).toBeGreaterThanOrEqual(GAP - SLACK);
  });

  it('moves a crowd’s mounts the same distance, around the middle of them', () => {
    const anchors = [
      { x: 360, y: 146 },
      { x: 366, y: 146 },
      { x: 363, y: 152 },
    ];

    const placed = placeMarks(anchors, FRAME);
    const middle = {
      x: anchors.reduce((sum, one) => sum + one.x, 0) / anchors.length,
      y: anchors.reduce((sum, one) => sum + one.y, 0) / anchors.length,
    };

    const radii = placed.map((one) => Math.hypot(one.mark.x - middle.x, one.mark.y - middle.y));
    for (const radius of radii) {
      expect(radius).toBeCloseTo(radii[0], 6);
    }
  });

  it('keeps each mount on its own side of the crowd, so no two leaders cross', () => {
    // Four mounts at the compass points of a tight square. Each mark should end
    // up in the direction its own mount lies from the middle.
    const anchors = [
      { x: 360, y: 140 },
      { x: 366, y: 146 },
      { x: 360, y: 152 },
      { x: 354, y: 146 },
    ];

    const placed = placeMarks(anchors, FRAME);
    const middle = { x: 360, y: 146 };

    placed.forEach((one) => {
      const mount = Math.atan2(one.anchor.y - middle.y, one.anchor.x - middle.x);
      const mark = Math.atan2(one.mark.y - middle.y, one.mark.x - middle.x);
      const between = Math.abs(Math.atan2(Math.sin(mark - mount), Math.cos(mark - mount)));
      expect(between).toBeLessThan(Math.PI / 4);
    });
  });

  it('leaves a lone mount where the package drew it, with no leader', () => {
    const anchors = [
      { x: 360, y: 146 },
      { x: 366, y: 146 },
      // Far from the pair, and from everything else.
      { x: 120, y: 60 },
    ];

    const placed = placeMarks(anchors, FRAME);

    expect(placed[2].displaced).toBe(false);
    expect(placed[2].mark).toEqual(placed[2].anchor);
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

  it('never puts a mark outside the plate, however crowded the hull', () => {
    // Forty mounts on one point — past anything the package ships. Whatever the
    // search settles on, every mark it reports has to be somewhere a Commander
    // can press: on the plate, and either spread onto a ring or left on its own
    // mount. Nothing may hang off the edge.
    const anchors = Array.from({ length: 40 }, () => ({ x: 360, y: 146 }));

    const placed = placeMarks(anchors, FRAME);

    expect(placed.length).toBe(40);
    for (const one of placed) {
      expect(one.mark.x).toBeGreaterThanOrEqual(0);
      expect(one.mark.y).toBeGreaterThanOrEqual(0);
      expect(one.mark.x).toBeLessThanOrEqual(FRAME.width);
      expect(one.mark.y).toBeLessThanOrEqual(FRAME.height);
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
    // A pair that has to spread, and a third mount well clear of it — clear
    // enough that it is not part of the crowd, so the pair's marks have to keep
    // off its position rather than being arranged around it.
    const anchors = [
      { x: 300, y: 150 },
      { x: 305, y: 150 },
      { x: 300, y: 150 + GAP * 1.6 },
    ];

    const placed = placeMarks(anchors, FRAME);
    const outsider = anchors[2];

    // Only the mount outside the crowd. Inside one, the mounts are by
    // definition piled together and the marks are arranged around them, so a
    // mark near a fellow member's point is the arrangement rather than a defect
    // — which is what each member's own leader is there to tell apart.
    for (const one of placed.slice(0, 2)) {
      expect(apart(one.mark, outsider)).toBeGreaterThanOrEqual(GAP - SLACK);
    }
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
    expect(placeMarks(anchors, FRAME, 0.12).map((one) => one.displaced)).toEqual([true, true]);
  });

  it('moves a mark far enough that the leader explaining it can be seen', () => {
    // A mark's own square covers half its width of its leader, so a mark that
    // shifts less than that draws nothing at all. Every mark that moves has to
    // move far enough to leave a segment behind — including the outermost
    // member of a crowd, whose mount is already displaced from the middle the
    // ring is measured from and which therefore travels least.
    const mark = 0.04 * FRAME.width;
    const anchors = [
      { x: 300, y: 150 },
      { x: 306, y: 150 },
      { x: 303, y: 158 },
    ];

    for (const one of placeMarks(anchors, FRAME, 0.05, 0.04)) {
      if (one.displaced) {
        const travel = Math.hypot(one.mark.x - one.anchor.x, one.mark.y - one.anchor.y);
        expect(travel).toBeGreaterThan(mark / 2);
      }
    }
  });

  it('leaves marks alone when they are already a comfortable distance apart', () => {
    // Twice the separation asked for. Nothing here is touching, so nothing
    // should be shuffled: a plate that spread mounts the package had already
    // drawn apart would be inventing a problem to solve.
    const anchors = [
      { x: 200, y: 150 },
      { x: 200 + GAP * 2, y: 150 },
      { x: 200 + GAP * 4, y: 150 },
    ];

    const placed = placeMarks(anchors, FRAME);

    expect(placed.map((one) => one.displaced)).toEqual([false, false, false]);
    expect(placed.map((one) => one.mark)).toEqual(anchors);
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
