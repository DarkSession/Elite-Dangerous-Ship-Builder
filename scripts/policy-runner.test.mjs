/**
 * That every ownership checker still runs when it is run.
 *
 * The seven share one epilogue now, and it decides whether to report by
 * comparing `process.argv[1]` against the `import.meta.url` its caller passed
 * in. A checker handed the wrong one would exit 0 with no output — it would
 * stop being a gate without failing, which is the one failure mode a policy
 * script must not have. `pnpm run policy` chains them with `&&`, so a silent
 * success is indistinguishable from a real one.
 *
 * This asserts the observable half: run as a command, each prints its own label
 * and exits 0 against the clean tree; imported instead, none of them prints or
 * exits. It runs in `pnpm run test:scripts`.
 */
import { strict as assert } from 'node:assert';
import { execFile } from 'node:child_process';
import { describe, it } from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const scriptPath = (name) =>
  fileURLToPath(new URL(`./policy/${name}-ownership.mjs`, import.meta.url));

/** Each checker and the label its epilogue is supposed to print. */
const CHECKERS = [
  ['anatomy', 'anatomy ownership policy'],
  ['defence', 'defence ownership policy'],
  ['mobility-jump', 'mobility and jump ownership policy'],
  ['offence', 'offence ownership policy'],
  ['outfitting', 'outfitting ownership policy'],
  ['power-heat', 'power and heat ownership policy'],
  ['slef', 'slef ownership policy'],
];

describe('every ownership checker reports when it is invoked', () => {
  for (const [name, label] of CHECKERS) {
    it(`${name} prints its verdict and exits 0`, async () => {
      const { stdout } = await run(process.execPath, [scriptPath(name)]);
      assert.equal(stdout.trim(), `${label}: no violations`);
    });
  }

  it('stays silent when a suite imports it instead of running it', async () => {
    const { stdout } = await run(process.execPath, [
      '--input-type=module',
      '--eval',
      CHECKERS.map(([name]) => `await import(${JSON.stringify(scriptPath(name))});`).join('\n'),
    ]);
    assert.equal(stdout, '');
  });
});
