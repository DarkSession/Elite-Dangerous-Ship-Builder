import { BuildMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';
import { getShipGunsight } from '@elite-dangerous-almanac/core/ships/gunsights';
import {
  convergenceAt,
  FIELD_OF_VIEW_MILLIRADIANS,
  PLATE_MARGIN_FRACTION,
  projectConvergence,
  TARGET_RANGE,
  type Convergence,
} from './convergence';
import {
  everyStateBuild,
  innerMountsBuild,
  noWeaponsBuild,
  OFFENCE_FIXTURE_HULL,
  populatedBuild,
} from './offence.fixtures';

/**
 * The gunsight projection, against the package's own catalogue.
 *
 * Nothing here writes an offset down. The package publishes the hull's
 * hardpoint geometry and `projectGunsight` places it at a range; these
 * assertions check that every mount was placed, that the armed ones were
 * recognised, that they were placed in the right order, and that what changes
 * with range is what should.
 */
describe('projectConvergence', () => {
  const weaponsOf = (loadout = everyStateBuild()) =>
    BuildMetrics.of(loadout).weaponMetrics().weapons;

  const available = (convergence: Convergence) => {
    expect(convergence.kind).toBe('available');
    if (convergence.kind !== 'available') {
      throw new Error('expected an available convergence');
    }
    return convergence;
  };

  it('places every hardpoint the catalogue carries, at the package’s own offsets', () => {
    const weapons = weaponsOf();
    const gunsight = getShipGunsight(OFFENCE_FIXTURE_HULL);

    const convergence = available(projectConvergence(OFFENCE_FIXTURE_HULL, weapons));

    expect(convergence.mounts).toHaveLength(gunsight?.length ?? 0);
    for (const mount of convergence.mounts) {
      // The catalogue is indexed in the hull's own hardpoint order, and the
      // numeral is that place — never a number read out of the slot key.
      expect(mount.offset).toEqual(gunsight?.[mount.hardpoint - 1]);
      expect(mount.offsetMetres).toBeCloseTo(Math.hypot(mount.offset[0], mount.offset[1]), 9);
    }
  });

  it('puts each returned weapon on its own mount, and leaves the rest empty', () => {
    // Two of this hull's eight hardpoints are armed on the stock build, so the
    // list has to carry both kinds at once rather than being all of one.
    const weapons = BuildMetrics.of(populatedBuild()).weaponMetrics().weapons;

    const convergence = available(projectConvergence(OFFENCE_FIXTURE_HULL, weapons));

    const armed = convergence.mounts.filter((mount) => mount.weapon !== null);
    expect(armed).toHaveLength(weapons.length);
    expect(armed.map((mount) => mount.slot).sort()).toEqual(
      weapons.map((weapon) => weapon.slot).sort(),
    );
    for (const mount of armed) {
      const weapon = weapons.find((candidate) => candidate.slot === mount.slot);
      expect(mount.weapon?.symbol).toBe(weapon?.symbol);
      expect(mount.weapon?.name).toBe(weapon?.name);
    }

    // And the rest are the hull's other mounts, named by the same slot key the
    // ledger and the schematics use, with nothing on them.
    const empty = convergence.mounts.filter((mount) => mount.weapon === null);
    expect(empty.length).toBeGreaterThan(0);
    expect(empty.length + armed.length).toBe(convergence.mounts.length);
    for (const mount of empty) {
      expect(weapons.some((weapon) => weapon.slot === mount.slot)).toBe(false);
    }
  });

  it('names the armed mount furthest from the axis as the widest', () => {
    const convergence = available(projectConvergence(OFFENCE_FIXTURE_HULL, weaponsOf()));

    const furthest = Math.max(...convergence.mounts.map((mount) => mount.offsetMetres));
    expect(convergence.widest?.offsetMetres).toBe(furthest);
  });

  it('measures each span between the outermost two mounts', () => {
    const convergence = available(projectConvergence(OFFENCE_FIXTURE_HULL, weaponsOf()));

    const across = convergence.mounts.map((mount) => mount.offset[0]);
    const up = convergence.mounts.map((mount) => mount.offset[1]);
    expect(convergence.lateralSpanMetres).toBeCloseTo(Math.max(...across) - Math.min(...across), 9);
    expect(convergence.verticalSpanMetres).toBeCloseTo(Math.max(...up) - Math.min(...up), 9);
  });

  it('measures the spans and the widest across the armed mounts alone', () => {
    // Armed on a Large and a Medium, with the hull's two outermost mounts — its
    // Smalls — left empty. Every figure below therefore has a different answer
    // over the armed group than over the hull, which is what makes the
    // assertions discriminate: on a build that arms the outermost mount the two
    // answers coincide and the same assertions would pass either way.
    const weapons = BuildMetrics.of(innerMountsBuild()).weaponMetrics().weapons;

    const convergence = available(projectConvergence(OFFENCE_FIXTURE_HULL, weapons));

    const armed = convergence.mounts.filter((mount) => mount.weapon !== null);
    expect(armed.length).toBeGreaterThan(1);
    const across = armed.map((mount) => mount.offset[0]);
    const up = armed.map((mount) => mount.offset[1]);
    expect(convergence.lateralSpanMetres).toBeCloseTo(Math.max(...across) - Math.min(...across), 9);
    expect(convergence.verticalSpanMetres).toBeCloseTo(Math.max(...up) - Math.min(...up), 9);

    // The widest is an armed mount, and it is not the hull's own outermost one.
    const furthestArmed = Math.max(...armed.map((mount) => mount.offsetMetres));
    const furthestOfHull = Math.max(...convergence.mounts.map((mount) => mount.offsetMetres));
    expect(furthestArmed).toBeLessThan(furthestOfHull);
    expect(convergence.widest?.offsetMetres).toBe(furthestArmed);
    expect(convergence.widest?.weapon).not.toBeNull();

    // And the spans are genuinely narrower than the hull's, so they too are
    // about the armed group rather than about every mount.
    const everyMount = convergence.mounts.map((mount) => mount.offset[0]);
    expect(convergence.lateralSpanMetres).toBeLessThan(
      Math.max(...everyMount) - Math.min(...everyMount),
    );
  });

  it('is unavailable for a hull the catalogue does not carry', () => {
    expect(projectConvergence('not_a_ship', weaponsOf()).kind).toBe('unavailable');
  });

  it('is available, with every mount empty, for a hull the build has armed none of', () => {
    const weapons = BuildMetrics.of(noWeaponsBuild()).weaponMetrics().weapons;
    const gunsight = getShipGunsight(OFFENCE_FIXTURE_HULL);

    const convergence = available(projectConvergence(OFFENCE_FIXTURE_HULL, weapons));

    // The catalogue places this hull whether or not the build armed it, so
    // saying the package publishes no geometry for it would be false. Where its
    // mounts are is the hull's own geometry, and it is exactly the reading a
    // Commander with nothing fitted yet is after.
    expect(convergence.mounts).toHaveLength(gunsight?.length ?? 0);
    expect(convergence.mounts.every((mount) => mount.weapon === null)).toBe(true);
    // No armed group, so nothing to measure one across.
    expect(convergence.widest).toBeNull();
    expect(convergence.lateralSpanMetres).toBe(0);
    expect(convergence.verticalSpanMetres).toBe(0);
  });
});

describe('convergenceAt', () => {
  const convergence = () => {
    const projected = projectConvergence(
      OFFENCE_FIXTURE_HULL,
      BuildMetrics.of(everyStateBuild()).weaponMetrics().weapons,
    );
    if (projected.kind !== 'available') {
      throw new Error('expected an available convergence');
    }
    return projected;
  };

  it('keeps one point per mount, in the same order', () => {
    const geometry = convergence();

    const view = convergenceAt(geometry, TARGET_RANGE.initial);

    expect(view.points.map((point) => point.mount.slot)).toEqual(
      geometry.mounts.map((mount) => mount.slot),
    );
  });

  it('draws every mount, and measures no spread, on a plate whose build has armed nothing', () => {
    const projected = projectConvergence(
      OFFENCE_FIXTURE_HULL,
      BuildMetrics.of(noWeaponsBuild()).weaponMetrics().weapons,
    );
    if (projected.kind !== 'available') {
      throw new Error('expected an available convergence');
    }

    const view = convergenceAt(projected, TARGET_RANGE.initial);

    // Every hardpoint is placed, because where a mount is is a property of the
    // hull. None of them fires, so the one figure that reports a group is zero:
    // an apparent spread stretched across mounts that shoot nothing would be a
    // spread nobody has.
    expect(view.points).toHaveLength(projected.mounts.length);
    expect(view.points.every((point) => point.mount.weapon === null)).toBe(true);
    expect(view.apparentSpreadMilliradians).toBe(0);
    expect(view.rings).toHaveLength(2);
  });

  it('measures the apparent spread across the armed mounts alone', () => {
    const projected = projectConvergence(
      OFFENCE_FIXTURE_HULL,
      BuildMetrics.of(populatedBuild()).weaponMetrics().weapons,
    );
    if (projected.kind !== 'available') {
      throw new Error('expected an available convergence');
    }

    const view = convergenceAt(projected, TARGET_RANGE.max);

    const spreadOf = (points: readonly { horizontal: number; vertical: number }[]) => {
      const width = points.map((point) => point.horizontal);
      const height = points.map((point) => point.vertical);
      return Math.hypot(
        Math.max(...width) - Math.min(...width),
        Math.max(...height) - Math.min(...height),
      );
    };
    const armed = view.points.filter((point) => point.mount.weapon !== null);

    // Both are in half-plates rather than milliradians, so the comparison is of
    // one group against the other rather than of a figure against a constant.
    expect(spreadOf(armed)).toBeLessThan(spreadOf(view.points));
    expect(view.apparentSpreadMilliradians / FIELD_OF_VIEW_MILLIRADIANS).toBeCloseTo(
      spreadOf(armed),
      9,
    );
  });

  it('draws a distant target tighter than a near one', () => {
    const geometry = convergence();

    const near = convergenceAt(geometry, TARGET_RANGE.min);
    const far = convergenceAt(geometry, TARGET_RANGE.max);

    // The mounts have not moved; the angle between them has closed.
    expect(far.apparentSpreadMilliradians).toBeLessThan(near.apparentSpreadMilliradians);
    for (const [index, point] of far.points.entries()) {
      expect(Math.abs(point.horizontal)).toBeLessThanOrEqual(
        Math.abs(near.points[index]?.horizontal ?? 0) + Number.EPSILON,
      );
    }
  });

  it('maps both of the plate’s axes over the same field of view', () => {
    const geometry = convergence();

    // Far enough out that this hull's widest mount is well inside the field of
    // view, so every mark is where its shot is and none of them is clamped.
    const view = convergenceAt(geometry, TARGET_RANGE.max);

    // The plate is square in angle since the 2026-08-25 revision: a milliradian
    // up covers the same fraction of the plate as a milliradian across, and the
    // box's own shape is corrected for on the rings alone.
    for (const point of view.points) {
      const up = point.vertical * FIELD_OF_VIEW_MILLIRADIANS;
      const across = point.horizontal * FIELD_OF_VIEW_MILLIRADIANS;
      expect(Math.abs(point.horizontal)).toBeLessThan(PLATE_MARGIN_FRACTION);
      expect(point.milliradians).toBeCloseTo(Math.hypot(across, up), 6);
    }
  });

  it('clamps a shot outside the field of view to the frame, and keeps its true angle', () => {
    const geometry = convergence();

    // At a hundred metres this hull's widest mount stands nearly a hundred
    // milliradians off the axis, against a plate that shows forty.
    const view = convergenceAt(geometry, TARGET_RANGE.min);

    // Nothing leaves the frame, on either axis.
    for (const point of view.points) {
      expect(Math.abs(point.horizontal)).toBeLessThanOrEqual(PLATE_MARGIN_FRACTION);
      expect(Math.abs(point.vertical)).toBeLessThanOrEqual(PLATE_MARGIN_FRACTION);
    }

    // And at this range something actually had to be held there, so the margin
    // above is a clamp rather than a bound nothing reaches.
    const clamped = view.points.filter(
      (point) =>
        Math.max(Math.abs(point.horizontal), Math.abs(point.vertical)) === PLATE_MARGIN_FRACTION,
    );
    expect(clamped.length).toBeGreaterThan(0);
    for (const point of clamped) {
      // The angle it is stated at is the one it actually makes, not the one it
      // was drawn at: the sentence beside the plate reads the true offset.
      const drawn = Math.hypot(
        point.horizontal * FIELD_OF_VIEW_MILLIRADIANS,
        point.vertical * FIELD_OF_VIEW_MILLIRADIANS,
      );
      expect(point.milliradians).toBeGreaterThan(drawn);
    }
  });

  it('puts a shot and a ring at the same angle the same distance from the axis', () => {
    const geometry = convergence();

    // Far enough out that nothing is clamped, so every mark is where its shot is.
    const view = convergenceAt(geometry, TARGET_RANGE.max);

    // One scale for the whole plate. A shot's distance from the axis, measured
    // in half-plates across both axes together, is its own angle over the field
    // of view — and a ring's `width` is the same fraction for the angle it
    // stands for. So a mark landing on a ring is a mark at that ring's angle,
    // which is the only reason the caption beside the plate means anything.
    for (const point of view.points) {
      const fromAxis = Math.hypot(point.horizontal, point.vertical);
      expect(fromAxis).toBeCloseTo(point.milliradians / FIELD_OF_VIEW_MILLIRADIANS, 9);
    }
    for (const ring of view.rings) {
      expect(ring.width).toBeCloseTo(ring.milliradians / FIELD_OF_VIEW_MILLIRADIANS, 9);
      // And it fits on the plate it is drawn on, at every angle it is drawn for.
      expect(ring.width).toBeLessThanOrEqual(1);
    }
  });

  it('sizes the outer ring at two thirds of the field, and says what it spans', () => {
    const geometry = convergence();

    const view = convergenceAt(geometry, 1000);

    expect(view.rings).toHaveLength(2);
    expect(view.ringMilliradians).toBeCloseTo((FIELD_OF_VIEW_MILLIRADIANS * 2) / 3, 9);
    expect(view.rings[0]?.width).toBeCloseTo(1 / 3, 9);
    expect(view.rings[1]?.width).toBeCloseTo(2 / 3, 9);
    // A milliradian is a metre at a thousand.
    expect(view.ringMetres).toBeCloseTo(view.ringMilliradians, 6);
  });
});
