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
import { everyStateBuild, noWeaponsBuild, OFFENCE_FIXTURE_HULL } from './offence.fixtures';

/**
 * The gunsight projection, against the package's own catalogue.
 *
 * Nothing here writes an offset down. The package publishes the hull's
 * hardpoint geometry and `projectGunsight` places it at a range; these
 * assertions check that the right mounts were selected, that they were placed
 * in the right order, and that what changes with range is what should.
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

  it('places every armed mount, at the package’s own offsets', () => {
    const weapons = weaponsOf();
    const gunsight = getShipGunsight(OFFENCE_FIXTURE_HULL);

    const convergence = available(projectConvergence(OFFENCE_FIXTURE_HULL, weapons));

    expect(convergence.mounts).toHaveLength(weapons.length);
    for (const mount of convergence.mounts) {
      // The catalogue is indexed in the hull's own hardpoint order, and the
      // badge is that place — never a number read out of the slot key.
      expect(mount.offset).toEqual(gunsight?.[mount.hardpoint - 1]);
      expect(mount.offsetMetres).toBeCloseTo(Math.hypot(mount.offset[0], mount.offset[1]), 9);
    }
  });

  it('names the mount furthest from the axis as the widest', () => {
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

  it('is unavailable for a hull the catalogue does not carry', () => {
    expect(projectConvergence('not_a_ship', weaponsOf()).kind).toBe('unavailable');
  });

  it('is available, and empty, for a hull the build has armed none of', () => {
    const weapons = BuildMetrics.of(noWeaponsBuild()).weaponMetrics().weapons;

    const convergence = available(projectConvergence(OFFENCE_FIXTURE_HULL, weapons));

    // The catalogue places this hull whether or not the build armed it, so
    // saying the package publishes no geometry for it would be false. The plate
    // is drawn with nothing on it, which is what the canvas's own script draws
    // for a build with nothing to place.
    expect(convergence.mounts).toEqual([]);
    // No group, so nothing to measure one across.
    expect(convergence.widest).toBeNull();
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

  it('draws nothing at all on a plate whose build has armed nothing', () => {
    const projected = projectConvergence(
      OFFENCE_FIXTURE_HULL,
      BuildMetrics.of(noWeaponsBuild()).weaponMetrics().weapons,
    );
    if (projected.kind !== 'available') {
      throw new Error('expected an available convergence');
    }

    const view = convergenceAt(projected, TARGET_RANGE.initial);

    // The canvas's own script maps its marks off its armed mounts and says
    // nothing whatsoever about a hardpoint a build has not filled, so neither
    // does this: the plate keeps its axes and its rings and takes no mark
    // (`design/canvas-contract.md`, review note 8).
    expect(view.points).toEqual([]);
    expect(view.apparentSpreadMilliradians).toBe(0);
    expect(view.rings).toHaveLength(2);
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
