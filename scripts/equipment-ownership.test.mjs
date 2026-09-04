/**
 * The feature 013 boundary rules, proven against fixtures.
 *
 * Every rule in `scripts/policy/equipment-ownership.mjs` is about a line that
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
} from './policy/equipment-ownership.mjs';

describe('equipment ownership policy', () => {
  it('passes against the repository as it stands', async () => {
    assert.deepEqual(await check(), []);
  });

  describe('Almanac leaf rule', () => {
    it('rejects the barrel', () => {
      const [found] = almanacImports("import { x } from '@elite-dangerous-almanac/core';");
      assert.equal(found, '@elite-dangerous-almanac/core');
      assert.ok(!ALLOWED_SUBPATHS.includes(found));
    });

    it('rejects a subject the bench does not read', () => {
      const [found] = almanacImports(
        "import type { x } from '@elite-dangerous-almanac/core/ships/shields';",
      );
      assert.ok(!ALLOWED_SUBPATHS.includes(found));
    });

    it('reads each named leaf back exactly, so none is accepted by a near miss', () => {
      for (const leaf of ALLOWED_SUBPATHS) {
        const [found] = almanacImports(`import { x } from '${leaf}';`);
        assert.equal(found, leaf);
        assert.ok(!ALLOWED_SUBPATHS.includes(`${leaf}/deeper`));
      }
    });
  });

  describe('single call-site rule', () => {
    it('rejects each package call', () => {
      for (const call of PACKAGE_CALLS) {
        assert.deepEqual(packageCalls(`const answer = ${call}suit, 5);`), [call]);
      }
    });

    it('accepts an identity lookup, which every chooser and codec has to make', () => {
      assert.deepEqual(packageCalls("const suit = getSuitByFamily('tacticalsuit');"), []);
      assert.deepEqual(packageCalls('const weapon = getPersonalWeaponBySymbol(symbol);'), []);
      assert.deepEqual(packageCalls('const recipe = getPersonalModification(symbol);'), []);
    });

    it('accepts a surface reading the projection instead', () => {
      assert.deepEqual(packageCalls('const readings = suitReadings(loadout);'), []);
    });
  });

  describe('combined-figure rule', () => {
    it('rejects a total summed from two weapons’ output', () => {
      const source = 'const total = first.damagePerSecond + second.damagePerSecond;';
      assert.equal(combinedFigures(source).length, 1);
    });

    it('rejects an effective pool worked out from a figure and a resistance', () => {
      const source = 'const effective = readings.shieldStrength / (1 - grade.kineticResistance);';
      assert.equal(combinedFigures(source).length, 1);
    });

    it('accepts a package figure read and shown as it stands', () => {
      const source = 'readonly strength = computed(() => this.readings().shieldStrength);';
      assert.deepEqual(combinedFigures(source), []);
    });

    it('accepts a kebab-cased message key that contains a hyphen', () => {
      const source = "this.messages.message('equipment.fireMode.semi-automatic');";
      assert.deepEqual(combinedFigures(source), []);
    });
  });

  describe('scanner', () => {
    it('skips block documentation, so a rule the prose names is not a violation', () => {
      const source = [
        '/**',
        ' * Nothing here adds first.damagePerSecond + second.damagePerSecond.',
        ' */',
      ].join('\n');
      assert.deepEqual(combinedFigures(source), []);
    });

    it('reports the one-based line a violation is on', () => {
      const source = ['const a = 1;', 'const b = one.shieldStrength + two.shieldStrength;'].join(
        '\n',
      );
      assert.deepEqual(
        scan(source, (text) => text.includes('shieldStrength')).map(({ line }) => line),
        [2],
      );
    });
  });
});
