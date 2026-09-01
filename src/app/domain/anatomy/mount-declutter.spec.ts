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

/** How wide one of those marks is, at the fraction the placement defaults to. */
const MARK = GAP / 2;

/**
 * The same slack the placement itself allows.
 *
 * A mark that steps aside lands at exactly one gap from the one it avoided, and
 * `(y + gap) - y` is not always `gap` in binary — so a separation read back off
 * the result can sit a few parts in a quadrillion under it.
 */
const SLACK = GAP * 1e-9;

/**
 * How far short of the whole separation a settled pair is allowed to be.
 *
 * The placement is not a construction that lands on the gap and stops; it is
 * one rule run until it stops changing anything, and it stops when no mark has
 * moved more than a millionth of a mark. A pair approaching its separation from
 * inside therefore ends a few hundred-thousandths of a unit short of it — under
 * a thousandth of a screen pixel at every plate size, and far below anything the
 * squares themselves can show. What the cases below hold to is that no two
 * squares overlap, which this tolerance is wide enough to read and still far
 * narrower than a mark.
 */
const SETTLED = GAP * 1e-4;

function apart(a: PlatePoint, b: PlatePoint): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/** Whether two segments properly cross, by the turn each end makes about the other. */
function cross(a1: PlatePoint, a2: PlatePoint, b1: PlatePoint, b2: PlatePoint): boolean {
  const turn = (p: PlatePoint, q: PlatePoint, r: PlatePoint): number =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return (
    turn(a1, a2, b1) > 0 !== turn(a1, a2, b2) > 0 && turn(b1, b2, a1) > 0 !== turn(b1, b2, a2) > 0
  );
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
    expect(apart(first.mark, second.mark)).toBeGreaterThanOrEqual(GAP - SETTLED);
  });

  it('moves a mark no further than it takes to clear the one it would cover', () => {
    // Nothing is sent anywhere, so nothing has a distance to choose: a pair
    // pushes apart until neither square covers the other and stops. Half a
    // separation each is the whole of the answer for a pair on one point, and
    // less than that for a pair already partly apart.
    const anchors = [
      { x: 360, y: 146 },
      { x: 366, y: 146 },
    ];

    for (const one of placeMarks(anchors, FRAME)) {
      expect(apart(one.mark, one.anchor)).toBeLessThanOrEqual(GAP / 2 + SLACK);
    }
  });

  it('draws mirrored mounts as mirrored marks', () => {
    // The Mandalay's case: two mounts above the hull's centreline and their
    // twins below. Every push is symmetric and they are all applied at once, so
    // nothing is placed against what was placed already and the two sides of a
    // hull cannot be answered differently (design/hull-anatomy.md, "Marks that
    // would touch").
    const middle = FRAME.height / 2;
    const anchors = [
      { x: 300, y: middle - 4 },
      { x: 300, y: middle + 4 },
      { x: 300 + GAP * 0.6, y: middle - 10 },
      { x: 300 + GAP * 0.6, y: middle + 10 },
    ];

    const placed = placeMarks(anchors, FRAME);

    for (const [above, below] of [
      [0, 1],
      [2, 3],
    ]) {
      expect(placed[above].mark.x).toBeCloseTo(placed[below].mark.x, 6);
      expect(placed[above].mark.y - middle).toBeCloseTo(middle - placed[below].mark.y, 6);
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
        expect(apart(placed[i].mark, placed[j].mark)).toBeGreaterThanOrEqual(GAP - SETTLED);
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

  it('draws a mark on the plate\u2019s own edge just inside it, and no further', () => {
    // The package puts a few mounts within half a mark of the hull's nose or
    // tail — `MediumTransport01`'s two medium hardpoints, at every plate size.
    // Nothing is beside them, so nothing pushes them; what moves them is that
    // the square drawn about their point would hang off the plate. They come in
    // exactly as far as it takes for the square to be whole, and no further.
    const share = 0.0306;
    const mark = share * FRAME.width;
    const anchors = [
      { x: mark / 4, y: FRAME.height / 2 },
      // Far from it, and comfortably inside the frame.
      { x: FRAME.width / 2, y: FRAME.height / 2 },
    ];

    const [edge, inside] = placeMarks(anchors, FRAME, share * 1.25, share);

    expect(edge.displaced).toBe(true);
    expect(edge.mark.x).toBeCloseTo(mark / 2, 6);
    expect(edge.mark.y).toBeCloseTo(anchors[0].y, 6);
    expect(inside.displaced).toBe(false);
  });

  it('leaves a mount the plate can draw whole exactly where the package put it', () => {
    // Half a *separation* in from each edge would be a quarter of a mark further
    // than a square needs, and a mark is moved as far as it is asked to be — so
    // that quarter drew a leader on mounts with nothing beside them (FR-012, "a
    // mark that covers neither another mark nor another mount's published
    // position, and that the plate can draw whole where the package put it").
    const share = 0.0306;
    const mark = share * FRAME.width;
    const anchors = [
      { x: mark * 0.55, y: FRAME.height / 2 },
      { x: FRAME.width - mark * 0.55, y: FRAME.height / 2 },
    ];

    for (const placed of placeMarks(anchors, FRAME, share * 1.25, share)) {
      expect(placed.displaced).toBe(false);
      expect(placed.mark).toEqual(placed.anchor);
    }
  });

  it('never steps a mark off the plate', () => {
    // A cluster in the corner: every outward step leaves the frame, so the ones
    // that move have to come back inward instead of hanging off the edge. Half a
    // mark is where a square stops hanging off, and a mark is drawn about its
    // point, so that is how far in the frame holds them.
    const anchors = [
      { x: 4, y: 4 },
      { x: 7, y: 5 },
      { x: 5, y: 8 },
    ];
    const inset = MARK / 2;

    for (const placed of placeMarks(anchors, FRAME)) {
      if (placed.displaced) {
        expect(placed.mark.x).toBeGreaterThanOrEqual(inset - SLACK);
        expect(placed.mark.y).toBeGreaterThanOrEqual(inset - SLACK);
        expect(placed.mark.x).toBeLessThanOrEqual(FRAME.width - inset + SLACK);
        expect(placed.mark.y).toBeLessThanOrEqual(FRAME.height - inset + SLACK);
      }
    }
  });

  it('never puts a mark outside the plate, however crowded the hull', () => {
    // Forty mounts on one point — past anything the package ships. Wherever the
    // settling stops, every mark it reports has to be somewhere a Commander can
    // press: on the plate, whether it was pushed clear or left on its own mount.
    // Nothing may hang off the edge.
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
      expect(apart(one.mark, outsider)).toBeGreaterThanOrEqual(GAP - SETTLED);
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

  it('leaves a mark on its own mount where its neighbours push it equally', () => {
    // The Corsair's foremost large hardpoint in miniature: a mount on the
    // centreline with one neighbour above it and one below. The two pushes
    // cancel, so that mark does not move at all and the pair steps apart around
    // it. A rule that instead sent it a quarter of the hull forward, to earn a
    // leader long enough to see, is what a Commander reported on 2026-08-31.
    const anchors = [
      { x: 300, y: 150 },
      { x: 306, y: 150 - GAP * 0.6 },
      { x: 306, y: 150 + GAP * 0.6 },
    ];

    const placed = placeMarks(anchors, FRAME);

    expect(placed[0].displaced).toBe(false);
    expect(placed[0].mark).toEqual(anchors[0]);
    expect(placed[1].displaced).toBe(true);
    expect(placed[2].displaced).toBe(true);
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

  it('keeps a crowded pair away from the mounts standing beside it', () => {
    // A pair that has to spread, with a wall of mounts close on one side and
    // open plate on the other. Neither of the two may end up on the wall: a
    // mark travels only as far as its own neighbour makes it, and every mount's
    // published point pushes back.
    const anchors = [
      { x: 360, y: 146 },
      { x: 366, y: 146 },
      { x: 250, y: 100 },
      { x: 250, y: 146 },
      { x: 250, y: 192 },
    ];

    const placed = placeMarks(anchors, FRAME);

    for (const one of placed.slice(0, 2)) {
      expect(one.mark.x).toBeGreaterThan(300);
    }
  });

  it('takes a short leader over a mark left stacked', () => {
    // A plate with no room for a leader anyone could see: refusing to move the
    // crowd keeps the overlap this exists to remove, for the sake of a line
    // nobody could have read. Separating them is the lesser evil and is what
    // happens.
    const tight: PlateFrame = { width: 120, height: 49 };
    const anchors = [
      { x: 60, y: 24 },
      { x: 63, y: 24 },
    ];

    const placed = placeMarks(anchors, tight, 0.12, 0.1);

    expect(placed.every((one) => one.displaced)).toBe(true);
    expect(apart(placed[0].mark, placed[1].mark)).toBeGreaterThan(apart(anchors[0], anchors[1]));
  });

  it('never lets two leaders cross each other', () => {
    // A crowd against a wall, which is where a rule that arranges its marks
    // around the crowd's own middle breaks: turned far enough to find room, a
    // pair swaps sides, each mark ends up across the crowd from its own mount
    // and the two lines make an X. Here a mark moves only away from what it
    // covers, so a leader is as short as the overlap and there is nothing to
    // cross.
    const anchors = [
      { x: 360, y: 140 },
      { x: 360, y: 152 },
      // A wall on one side, so every mark of the pair is pushed the same way.
      { x: 300, y: 100 },
      { x: 300, y: 146 },
      { x: 300, y: 192 },
    ];

    const placed = placeMarks(anchors, FRAME).filter((one) => one.displaced);

    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        expect(
          cross(placed[i].anchor, placed[i].mark, placed[j].anchor, placed[j].mark),
          `${i} and ${j}`,
        ).toBe(false);
      }
    }
  });

  it('returns one placement per mount, in the order it was handed them', () => {
    const anchors = [
      { x: 10, y: 20 },
      { x: 300, y: 150 },
      { x: 500, y: 40 },
    ];

    expect(placeMarks(anchors, FRAME).map((one) => one.anchor)).toEqual(anchors);
  });

  it('leaves the Corsair\u2019s foremost hardpoint on its own mount', () => {
    // The reported case, at the anchors the shipped extract produces for the
    // Corsair's top plate (`public/assets/ships/Corsair/schematic-top.json`,
    // turned a quarter and padded to the plate's own ratio). Node 1 sits on the
    // centreline just ahead of the mirrored pair 4 and 5, with 2 and 3 further
    // forward again.
    //
    // A rule that sent node 1 forward along the hull's own axis until it cleared
    // 2 and 3 left the mark a quarter of a ship from its mount, with its leader
    // threaded between two other numbers, which is what a Commander reported on
    // 2026-08-31. Pushed equally by 4 above it and 5 below, it does not move at
    // all: the pair steps apart around it.
    const frame = { width: 1423.2329, height: 577.2 };
    const anchors = [
      { x: 659.555, y: 288.6 }, // node 1
      { x: 565.054, y: 320.569 }, // node 2
      { x: 565.054, y: 256.633 }, // node 3
      { x: 670.62, y: 321.575 }, // node 5
      { x: 670.619, y: 255.628 }, // node 4
      { x: 788.334, y: 546.449 }, // utility
      { x: 788.334, y: 30.75 }, // utility
    ];

    const placed = placeMarks(anchors, frame, 0.03825, 0.0306);

    expect(placed[0].displaced).toBe(false);
    expect(placed[1].displaced).toBe(false);
    expect(placed[2].displaced).toBe(false);

    // Nodes 4 and 5 keep their own sides: the upper one goes up, the lower one
    // goes down, and neither crosses the centreline the other sits on.
    expect(placed[4].mark.y - anchors[4].y).toBeLessThan(0);
    expect(placed[3].mark.y - anchors[3].y).toBeGreaterThan(0);
    expect(placed[4].mark.x).toBeCloseTo(anchors[4].x, 6);
    expect(placed[3].mark.x).toBeCloseTo(anchors[3].x, 6);
  });

  it('holds the Corsair\u2019s marks still as the plate is resized', () => {
    // A plate is not one width. It is drawn at whatever the column leaves it,
    // and the mark's own size is `clamp(0.875rem, 3.06cqw, 1.375rem)`, so the
    // separation asked for changes with every few pixels. A mark that answered
    // that by crossing the whole ship — forward of the nose at one width, aft of
    // the mounts behind it at the next — is the reshuffling this holds still.
    const frame = { width: 1423.2329, height: 577.2 };
    const anchors = [
      { x: 659.555, y: 288.6 },
      { x: 565.054, y: 320.569 },
      { x: 565.054, y: 256.633 },
      { x: 670.62, y: 321.575 },
      { x: 670.619, y: 255.628 },
      { x: 788.334, y: 546.449 },
      { x: 788.334, y: 30.75 },
    ];

    // The stylesheet's own two numbers, as the plate measures them: a mark of
    // `clamp(14px, 3.06%, 22px)` on a plate of `plate` CSS pixels, and the
    // separation the component asks for from that.
    for (let plate = 240; plate <= 900; plate += 5) {
      const mark = Math.min(22, Math.max(14, plate * 0.0306));
      const share = mark / plate;
      const placed = placeMarks(anchors, frame, Math.min(0.2, share * 1.25), share);

      // It stays on the hull's own centreline, because the mounts above and
      // below it push it equally, and it never travels a mark's width from the
      // mount it belongs to — let alone forward of the two ahead of it.
      const width = share * frame.width;
      expect(placed[0].mark.y, `${plate}px`).toBeCloseTo(anchors[0].y, 1);
      expect(apart(placed[0].mark, anchors[0]), `${plate}px`).toBeLessThan(width);
      expect(placed[0].mark.x, `${plate}px`).toBeGreaterThan(anchors[1].x);
      expect(placed[4].mark.y, `${plate}px`).toBeLessThan(anchors[4].y);
      expect(placed[3].mark.y, `${plate}px`).toBeGreaterThan(anchors[3].y);

      // The two utility mounts have nothing near them, so the only thing that
      // can move them is the plate's own edge: both sit 30.75 frame units in
      // from a long edge. While the plate can draw their squares whole they stay
      // exactly where the package put them, and where it cannot they come in to
      // half a mark and no further — which is the whole of what the frame is
      // allowed to do to a mark nothing is beside (FR-012).
      for (const index of [5, 6]) {
        const one = placed[index];
        if (width / 2 <= 30.75) {
          expect(one.displaced, `${plate}px #${index}`).toBe(false);
          expect(one.mark, `${plate}px #${index}`).toEqual(anchors[index]);
        } else {
          expect(one.mark.x, `${plate}px #${index}`).toBeCloseTo(anchors[index].x, 6);
          expect(
            Math.abs(one.mark.y - anchors[index].y),
            `${plate}px #${index}`,
          ).toBeLessThanOrEqual(width / 2 - 30.75 + 1e-6);
        }
      }
    }
  });
});
