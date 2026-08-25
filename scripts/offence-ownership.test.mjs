/**
 * The feature 007 boundary rules, proven against fixtures.
 *
 * Every rule in `scripts/policy/offence-ownership.mjs` is about a line that
 * must not appear, so a rule that quietly stopped matching would report "no
 * violations" for exactly the same reason a correct repository does. These
 * fixtures make the difference visible: each rule is shown a source it must
 * reject and a source it must accept.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_SUBPATHS,
  PACKAGE_CALLS,
  almanacImports,
  check,
  combinedFigures,
  packageCalls,
  scan,
  sentinelReads,
} from './policy/offence-ownership.mjs';

describe('offence ownership policy', () => {
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
      const [found] = almanacImports(
        "import type { x } from '@elite-dangerous-almanac/core/ships/distributor';",
      );
      assert.ok(!ALLOWED_SUBPATHS.includes(found));
    });

    it('reads each named leaf back exactly, so none is accepted by a near miss', () => {
      // The rule's own predicate is `ALLOWED_SUBPATHS.includes(found)`, which is
      // trivially true for a member of that list — what is worth proving is that
      // the scanner returns the specifier character for character, since a
      // regex that dropped or added one would let a neighbouring subject in.
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
        assert.deepEqual(packageCalls(`const result = loadout.${call});`), [call]);
      }
    });

    it('accepts a surface reading the projection instead', () => {
      assert.deepEqual(packageCalls('const total = this.offence().build.total;'), []);
    });
  });

  describe('combined-figure rule', () => {
    it('rejects a share divided out of two package amounts', () => {
      const source = 'const share = split.kinetic / total.damagePerSecond;';
      assert.equal(combinedFigures(source).length, 1);
    });

    it('rejects an alpha strike summed from two package fields', () => {
      const source = 'const alpha = metrics.damagePerShot * weapon.metrics.rateOfFire;';
      assert.equal(combinedFigures(source).length, 1);
    });

    it('accepts a package figure read and shown as it stands', () => {
      const source = 'protected readonly burst = computed(() => this.total().damagePerSecond);';
      assert.deepEqual(combinedFigures(source), []);
    });

    it('accepts a kebab-cased message key that contains a hyphen', () => {
      const source = "this.messages.get('offence.damage.type.anti-xeno');";
      assert.deepEqual(combinedFigures(source), []);
    });
  });

  describe('sentinel rule', () => {
    it('rejects a surface testing for an infinity itself', () => {
      assert.equal(sentinelReads('if (metrics.timeToDrain === Infinity) {').length, 1);
      assert.equal(sentinelReads('if (drain === Number.POSITIVE_INFINITY) {').length, 1);
    });

    it('accepts a surface reading the state the projection decided', () => {
      assert.deepEqual(sentinelReads("@if (endurance().kind === 'sustained') {"), []);
    });

    it('accepts a word that merely ends in the sentinel spelling', () => {
      assert.deepEqual(sentinelReads('const label = this.notInfinity;'), []);
    });
  });

  describe('scanner', () => {
    it('skips block documentation, so a rule the prose names is not a violation', () => {
      const source = [
        '/**',
        ' * Nothing here divides split.kinetic / total.damagePerSecond.',
        ' */',
      ].join('\n');
      assert.deepEqual(combinedFigures(source), []);
    });

    it('honours an explicit allowance', () => {
      const source = 'const x = a.kinetic / b.thermal; // policy-allow: proven elsewhere';
      assert.deepEqual(combinedFigures(source), []);
    });

    it('reports the one-based line a violation is on', () => {
      const source = ['const a = 1;', 'const b = split.kinetic / split.thermal;'].join('\n');
      assert.deepEqual(
        scan(source, (text) => text.includes('split.kinetic')).map(({ line }) => line),
        [2],
      );
    });
  });
});
