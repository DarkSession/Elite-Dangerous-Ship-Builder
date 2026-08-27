/**
 * The feature 008 boundary rules, proven against fixtures.
 *
 * Every rule in `scripts/policy/mobility-jump-ownership.mjs` is about a line
 * that must not appear, so a rule that quietly stopped matching would report
 * "no violations" for exactly the same reason a correct repository does. These
 * fixtures make the difference visible: each rule is shown a source it must
 * reject and a source it must accept.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_SUBPATHS,
  FORBIDDEN_CALLS,
  PACKAGE_CALLS,
  WITHDRAWN_AGGREGATES,
  almanacImports,
  check,
  combinedFigures,
  forbiddenCalls,
  inferredOvercharge,
  packageCalls,
  scan,
  withdrawnReads,
} from './policy/mobility-jump-ownership.mjs';

/** Just what each sited match found, for an assertion that does not need lines. */
const hits = (found) => found.map(({ hit }) => hit);

describe('mobility and jump ownership policy', () => {
  it('passes against the repository as it stands', async () => {
    assert.deepEqual(await check(), []);
  });

  describe('Almanac leaf rule', () => {
    it('rejects the barrel', () => {
      const [found] = almanacImports("import { x } from '@elite-dangerous-almanac/core';");
      assert.equal(found, '@elite-dangerous-almanac/core');
      assert.ok(!ALLOWED_SUBPATHS.includes(found));
    });

    it('rejects a subject this capability does not read', () => {
      // The module catalogue is the one worth naming: resolving a module by
      // symbol here is the first step of inferring a capability from a name.
      const [found] = almanacImports(
        "import { getModuleBySymbol } from '@elite-dangerous-almanac/core/ships/modules';",
      );
      assert.ok(!ALLOWED_SUBPATHS.includes(found));
    });

    it('reads each named leaf back exactly, so none is accepted by a near miss', () => {
      for (const leaf of ALLOWED_SUBPATHS) {
        const [found] = almanacImports(`import { x } from '${leaf}';`);
        assert.equal(found, leaf);
        assert.equal(almanacImports(`import { x } from '${leaf}/deeper';`)[0], `${leaf}/deeper`);
        assert.ok(!ALLOWED_SUBPATHS.includes(`${leaf}/deeper`));
      }
    });
  });

  describe('single call-site rule', () => {
    it('rejects each package call', () => {
      for (const call of PACKAGE_CALLS) {
        assert.deepEqual(packageCalls(`const result = metrics.${call}(load);`), [call]);
      }
    });

    it('rejects a call written with a space before its bracket', () => {
      assert.deepEqual(packageCalls('const summary = metrics.jumpRangeSummary ();'), [
        'jumpRangeSummary',
      ]);
    });

    it('accepts a surface reading the projection instead', () => {
      assert.deepEqual(packageCalls('const jump = this.view().jump.laden.range;'), []);
    });

    it('accepts prose naming the call a figure comes from', () => {
      // These files explain themselves by naming their source, and a sentence
      // is not a second opinion. The leading dot is what separates the two.
      assert.deepEqual(
        packageCalls('// it is the fuel part of the one buildMass(load) answer'),
        [],
      );
      assert.deepEqual(packageCalls('<!-- The package’s buildMass(load).total -->'), []);
    });
  });

  describe('forbidden-call rule', () => {
    it('rejects each call this capability may never make', () => {
      for (const call of FORBIDDEN_CALLS) {
        assert.deepEqual(forbiddenCalls(`const x = metrics.${call}(load);`), [call]);
      }
    });

    it('accepts the diagnostic form each nullable one is named after', () => {
      // `mobilityMetricsResult(` contains `mobilityMetrics(` as a prefix only
      // if the bracket is ignored, which is the near miss this rule has to
      // survive: the result form is what this feature reads on every build.
      assert.deepEqual(forbiddenCalls('const x = metrics.mobilityMetricsResult(load);'), []);
      assert.deepEqual(
        forbiddenCalls('const x = metrics.mobilityCapacitorMetricsResult(load);'),
        [],
      );
    });
  });

  describe('withdrawn-aggregate rule', () => {
    it('rejects each aggregate no canvas draws', () => {
      for (const aggregate of WITHDRAWN_AGGREGATES) {
        assert.deepEqual(hits(withdrawnReads(`const value = loadout.${aggregate};`)), [aggregate]);
      }
    });

    it('rejects the reserve tank coming back through the fuel row', () => {
      const source =
        "detail: this.messages.message('x', { reserve: loadout.fuelCapacity.reserve })";
      assert.deepEqual(hits(withdrawnReads(source)), ['fuelCapacity']);
    });

    it('accepts the fuel figure the legend does draw', () => {
      // The row's figure is the fuel part of one `buildMass(load)` answer, not
      // a tank capacity, so the rule must leave it alone.
      assert.deepEqual(withdrawnReads('value: mass ? this.tonnes(mass.fuel) : null,'), []);
    });

    it('accepts the word where it is not a reading', () => {
      assert.deepEqual(withdrawnReads("this.messages.message('drives.thrusters.fuel.tank');"), []);
      assert.deepEqual(withdrawnReads('FuelCapacity: { Main: 7, Reserve: 8 },'), []);
    });
  });

  describe('combined-figure rule', () => {
    it('rejects a headroom subtracted out of two package masses', () => {
      // Still rejected, and deliberately so. FR-008 rules that the canvas's own
      // headroom may be drawn, and the way a ruled crossing is recorded here is
      // a `policy-allow:` marker at the line that makes it — not a rule that
      // stops seeing the shape. A rule that could not see it would also not see
      // the next one nobody ruled on.
      const source = 'const headroom = curve.maxMass - mass.total;';
      assert.equal(combinedFigures(source).length, 1);
    });

    it('rejects a fuel per jump divided out of two package figures', () => {
      const source = 'const perJump = summary.totalUnladen.range / summary.totalUnladen.jumps;';
      assert.equal(combinedFigures(source).length, 1);
    });

    it('rejects an unladen mass summed from the parts beside it', () => {
      const source = 'const unladen = mass.hull + mass.modules;';
      assert.equal(combinedFigures(source).length, 1);
    });

    it('rejects a figure that reached the arithmetic through a destructure', () => {
      // The dot is gone by the time the subtraction is written, and this file
      // already destructures — so a rule that only saw `.maxMass` would let a
      // combination through unseen on the idiom the code actually uses. It is
      // the package's words that are watched for, which is why the code that
      // draws FR-008's headroom names its locals `optMass` and `total`: a
      // crossing this rule cannot see is a crossing nobody recorded.
      assert.equal(combinedFigures('const spare = maxMass - total;').length, 1);
      assert.equal(combinedFigures('const position = loadedMass / optMass;').length, 1);
    });

    it('accepts arithmetic between two things that are not package figures', () => {
      assert.deepEqual(combinedFigures('const inset = width - padding;'), []);
    });

    it('accepts a package figure read and shown as it stands', () => {
      const source = 'protected readonly headline = computed(() => this.mass().total);';
      assert.deepEqual(combinedFigures(source), []);
    });

    it('accepts a kebab-cased message key that contains a hyphen', () => {
      const source = "this.messages.message('drives.thrusters.optimal-mass');";
      assert.deepEqual(combinedFigures(source), []);
    });
  });

  describe('Overcharge rule', () => {
    it('rejects a capability decided from an identity', () => {
      assert.equal(inferredOvercharge("if (module.symbol.includes('overcharge')) {").length, 1);
      assert.equal(inferredOvercharge('if (/sco/i.test(fitted.name)) {').length, 1);
    });

    it('accepts the catalogue flag the badge is drawn from', () => {
      const source = 'return stats ? (stats.supercruiseOvercharge ?? false) : null;';
      assert.deepEqual(inferredOvercharge(source), []);
    });

    it('accepts the badge’s own message key', () => {
      assert.deepEqual(inferredOvercharge("this.messages.message('drives.fsd.sco');"), []);
    });

    it('accepts an unrelated module whose name merely contains the letters', () => {
      // A fuel scoop is squarely in this feature's subject matter, and failing
      // it with "Overcharge decided from a symbol" would be a diagnosis that is
      // simply wrong — and one a marker could only silence by silencing every
      // other rule on the same line.
      assert.deepEqual(inferredOvercharge("if (module.symbol.includes('FuelScoop')) {"), []);
      assert.deepEqual(inferredOvercharge("if (row.name.startsWith('Discovery Scanner')) {"), []);
    });

    it('still rejects the letters where the game’s own symbols delimit them', () => {
      assert.equal(inferredOvercharge("if (symbol.includes('_SCO')) {").length, 1);
    });
  });

  describe('scanner', () => {
    it('skips block documentation, so a rule the prose names is not a violation', () => {
      const source = ['/**', ' * Nothing here computes curve.maxMass - mass.total.', ' */'].join(
        '\n',
      );
      assert.deepEqual(combinedFigures(source), []);
    });

    it('honours an explicit allowance', () => {
      const source = 'size: mass.hull / track, // policy-allow: SC-002 bar length';
      assert.deepEqual(combinedFigures(source), []);
    });

    it('reports the one-based line a violation is on', () => {
      const source = ['const a = 1;', 'const b = mass.hull + mass.fuel;'].join('\n');
      assert.deepEqual(
        scan(source, (text) => text.includes('mass.hull')).map(({ line }) => line),
        [2],
      );
    });
  });
});
