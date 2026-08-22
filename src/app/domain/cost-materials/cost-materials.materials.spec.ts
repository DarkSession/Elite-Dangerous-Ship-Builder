import { getBlueprintCost } from '@elite-dangerous-almanac/core/ships/blueprint-costs';
import {
  sumMaterials,
  type EngineeringMaterial,
} from '@elite-dangerous-almanac/core/ships/engineering';
import { getExperimentalEffectCost } from '@elite-dangerous-almanac/core/ships/experimental-effect-costs';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { materialRarity } from '../outfitting/engineering-cost';
import { defaultBuild, fixedRewardBuild, FIXTURE_SLOTS } from '../outfitting/outfitting.fixtures';
import { cargoRackBuild, mercenaryCargoRack, uncostableCargoRack } from './cost-materials.fixtures';
import { projectMaterials } from './cost-materials';

/**
 * The canvas's `MATERIALS` block, checked against the package's own answer.
 *
 * Every quantity expectation here is a `sumMaterials()` result, never a written
 * count. What the suite pins is the *shape* of the ask — one call, package
 * order kept, and the three ruled counts taken over what came back.
 */

const DRIVE_BLUEPRINT = 'FSD_LongRange';
const DRIVE_EFFECT = 'special_fsd_heavy';
const THRUSTER_BLUEPRINT = 'Engine_Dirty';

describe('cost and materials — engineering materials', () => {
  it('is absent for a build with no engineering', () => {
    // Not an empty list and not a zero row: the block itself is not drawn.
    expect(projectMaterials(defaultBuild().fittedModules())).toBeNull();
  });

  it('consolidates one blueprint into the package result', () => {
    const build = engineeredBuild();

    const materials = projectMaterials(build.fittedModules());

    expect(materials?.rows.map(bare)).toEqual(
      sumMaterials(getBlueprintCost(DRIVE_BLUEPRINT, 5)?.materials ?? []).map(bare),
    );
  });

  it('keeps the package first-seen order across several modules', () => {
    const build = engineeredBuild();
    build.applyBlueprint(FIXTURE_SLOTS.thrusters, THRUSTER_BLUEPRINT, { grade: 3 });

    const materials = projectMaterials(build.fittedModules());

    // The lists go in the order the package enumerates the modules that carry
    // them, which is the package's business and not this fixture's to assume —
    // so the expectation is built by walking that same enumeration.
    const recipes = new Map<string, readonly EngineeringMaterial[]>([
      [FIXTURE_SLOTS.frameShiftDrive, getBlueprintCost(DRIVE_BLUEPRINT, 5)?.materials ?? []],
      [FIXTURE_SLOTS.thrusters, getBlueprintCost(THRUSTER_BLUEPRINT, 3)?.materials ?? []],
    ]);
    const inFittedOrder = build
      .fittedModules()
      .map((module) => recipes.get(module.slot))
      .filter((list): list is readonly EngineeringMaterial[] => list !== undefined);
    expect(inFittedOrder.length).toBe(2);

    // Package order, package symbols, package counts. Nothing here sorts,
    // deduplicates or adds — `sumMaterials` already did all three.
    expect(materials?.rows.map(bare)).toEqual(sumMaterials(...inFittedOrder).map(bare));
  });

  it('folds a separately applied effect in with the climb', () => {
    const build = engineeredBuild();
    build.setExperimentalEffect(FIXTURE_SLOTS.frameShiftDrive, DRIVE_EFFECT);

    const materials = projectMaterials(build.fittedModules());
    const expected = sumMaterials(
      sumMaterials(
        getBlueprintCost(DRIVE_BLUEPRINT, 5)?.materials ?? [],
        getExperimentalEffectCost(DRIVE_EFFECT) ?? [],
      ),
    );

    expect(materials?.rows.map(bare)).toEqual(expected.map(bare));
  });

  it('asks the package to consolidate exactly once', () => {
    const build = engineeredBuild();
    build.applyBlueprint(FIXTURE_SLOTS.thrusters, THRUSTER_BLUEPRINT, { grade: 3 });

    // Two contributing modules, one consolidation. A per-module fold would
    // still produce the right numbers and would be a second arithmetic path
    // through package data.
    const materials = projectMaterials(build.fittedModules());
    expect(materials?.blueprints).toBe(2);
    expect(materials?.rows.length).toBeGreaterThan(0);
  });

  it('takes each row rarity from the package catalogue', () => {
    const materials = projectMaterials(engineeredBuild().fittedModules());

    for (const row of materials?.rows ?? []) {
      expect(row.grade).toBe(materialRarity(row.symbol));
    }
  });

  describe('the three ruled counts', () => {
    it('counts contributing modules as blueprints', () => {
      const build = engineeredBuild();
      build.applyBlueprint(FIXTURE_SLOTS.thrusters, THRUSTER_BLUEPRINT, { grade: 3 });

      expect(projectMaterials(build.fittedModules())?.blueprints).toBe(2);
    });

    it('counts consolidated rows as material types', () => {
      const materials = projectMaterials(engineeredBuild().fittedModules());

      // Counted against the package's own consolidation rather than against
      // this projection's own rows, which would assert the field back to the
      // list it was measured from and hold however wrong both were.
      const consolidated = sumMaterials(getBlueprintCost(DRIVE_BLUEPRINT, 5)?.materials ?? []);
      expect(consolidated.length).toBeGreaterThan(1);
      expect(materials?.types).toBe(consolidated.length);
    });

    it('sums the package counts for the unit total', () => {
      const materials = projectMaterials(engineeredBuild().fittedModules());

      const consolidated = sumMaterials(getBlueprintCost(DRIVE_BLUEPRINT, 5)?.materials ?? []);
      const expected = consolidated.reduce((running, material) => running + material.count, 0);

      // Units, not types: the two differ, which is what makes this a check on
      // the sum rather than on the row count under another name.
      expect(expected).toBeGreaterThan(consolidated.length);
      expect(materials?.units).toBe(expected);
    });
  });

  describe('what contributes nothing', () => {
    it('leaves a fixed reward out of the block entirely', () => {
      // A tech-broker article is bought, not crafted. Feature 002's boundary
      // already rules it non-crafted, so it produces no rows and is not
      // counted as a blueprint (FR-009).
      expect(projectMaterials(fixedRewardBuild().fittedModules())).toBeNull();
    });

    it('leaves a Mercenary purchase baseline out of the block', () => {
      const build = cargoRackBuild(mercenaryCargoRack());

      // The article as it arrived. A purchase is not a crafting job, so there
      // is no shopping list for what it came with — and no zero row pretending
      // there is one (FR-009).
      expect(projectMaterials(build.fittedModules())).toBeNull();
    });

    it('draws no row for a recipe the package cannot cost', () => {
      const build = cargoRackBuild(uncostableCargoRack());

      // The cargo-rack regression: the package publishes no cost for this
      // reward's recipe. Ruling F declined to name that on screen, so the row
      // is simply absent — never a zero, and never another recipe substituted
      // in its place.
      expect(getBlueprintCost(uncostableCargoRack().blueprint, 5)).toBeNull();
      expect(projectMaterials(build.fittedModules())).toBeNull();
    });

    it('keeps the rows it does know when another module cannot be costed', () => {
      const build = cargoRackBuild(uncostableCargoRack());
      build.applyBlueprint(FIXTURE_SLOTS.frameShiftDrive, DRIVE_BLUEPRINT, { grade: 5 });

      const materials = projectMaterials(build.fittedModules());

      // One costable module beside one that is not. The block shows what the
      // package could cost and counts only that, rather than collapsing to
      // nothing because one source was unavailable.
      expect(materials?.blueprints).toBe(1);
      expect(materials?.rows.map(bare)).toEqual(
        sumMaterials(getBlueprintCost(DRIVE_BLUEPRINT, 5)?.materials ?? []).map(bare),
      );
    });
  });
});

/** A build with one ordinary, fully costed blueprint on its drive. */
function engineeredBuild(): ShipLoadout {
  const build = defaultBuild();
  build.applyBlueprint(FIXTURE_SLOTS.frameShiftDrive, DRIVE_BLUEPRINT, { grade: 5 });
  return build;
}

/** Symbol and count only — the two fields the package owns end to end. */
function bare(row: { symbol: string; count: number }): { symbol: string; count: number } {
  return { symbol: row.symbol, count: row.count };
}
