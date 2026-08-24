/**
 * The feature 004 boundary rules, proven against fixtures.
 *
 * Every rule in `scripts/policy/slef-ownership.mjs` is about a line that must
 * not appear, so a rule that quietly stopped matching would report "no
 * violations" for exactly the same reason a correct repository does. These
 * fixtures make the difference visible: each rule is shown a source it must
 * reject and a source it must accept.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_ALMANAC_LEAVES,
  PERSISTENCE,
  PRIVATE_PARSER,
  SURFACE_FORBIDDEN,
  almanacImports,
  check,
  featureImports,
  lines,
} from './policy/slef-ownership.mjs';

describe('slef ownership policy', () => {
  it('passes against the repository as it stands', async () => {
    assert.deepEqual(await check(), []);
  });

  describe('upstream import rule', () => {
    it('rejects a feature 001 file importing feature 004', () => {
      const source = "import { SlefStore } from '../slef/slef.store';";
      assert.equal(featureImports(source).length, 1);
    });

    it('accepts a feature 004 file importing feature 001', () => {
      const source = "import { ActiveBuildStore } from '../active-build/active-build.store';";
      assert.deepEqual(featureImports(source), []);
    });
  });

  describe('Almanac leaf rule', () => {
    it('rejects the barrel', () => {
      const [found] = almanacImports("import { x } from '@elite-dangerous-almanac/core';");
      assert.equal(found.specifier, '@elite-dangerous-almanac/core');
      assert.ok(!ALLOWED_ALMANAC_LEAVES.includes(found.specifier));
    });

    it('rejects a calculation leaf this boundary does not compose', () => {
      const [found] = almanacImports(
        "import { x } from '@elite-dangerous-almanac/core/ships/jump-range';",
      );
      assert.ok(!ALLOWED_ALMANAC_LEAVES.includes(found.specifier));
    });

    it('accepts each named leaf', () => {
      for (const leaf of ALLOWED_ALMANAC_LEAVES) {
        const [found] = almanacImports(`import { x } from '${leaf}';`);
        assert.ok(ALLOWED_ALMANAC_LEAVES.includes(found.specifier));
      }
    });
  });

  describe('surface reach rule', () => {
    it('rejects a component measuring bytes or reaching the browser', () => {
      const source = 'const size = new TextEncoder().encode(text).byteLength;';
      assert.equal(lines(source, SURFACE_FORBIDDEN).length, 1);
    });

    it('accepts a component that only emits an intent', () => {
      const source = 'submit(): void { this.submitted.emit(); }';
      assert.deepEqual(lines(source, SURFACE_FORBIDDEN), []);
    });

    it('does not read a rule out of block documentation', () => {
      const source = ' * It never touches navigator, Blob or localStorage.';
      assert.deepEqual(lines(source, SURFACE_FORBIDDEN), []);
    });
  });

  describe('persistence rule', () => {
    it('rejects a storage write', () => {
      assert.equal(lines("localStorage.setItem('slef', text);", PERSISTENCE).length, 1);
    });

    it('accepts a signal', () => {
      assert.deepEqual(lines("readonly draft = signal('');", PERSISTENCE), []);
    });
  });

  describe('private parser rule', () => {
    it('rejects a second reader of the format', () => {
      assert.equal(lines('const parsed = JSON.parse(draft);', PRIVATE_PARSER).length, 1);
    });

    it('accepts handing the exact string to the package', () => {
      assert.deepEqual(lines('const inspected = inspectSlef(text);', PRIVATE_PARSER), []);
    });
  });
});
