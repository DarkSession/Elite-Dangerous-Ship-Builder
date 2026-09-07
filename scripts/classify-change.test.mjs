/**
 * Fixture tests for the lane classifier in `.github/workflows/ci.yml`.
 *
 * The classifier decides whether a pull request runs the whole gate or the
 * specification lane alone, so it is the one piece of shell that can retire
 * every other check in this repository. A wrong answer is silent: the run is
 * green, and the jobs that would have said otherwise are skipped rather than
 * failed.
 *
 * The script is read out of the workflow and run, rather than restated here. A
 * copy would be a second classifier, it would pass while the workflow's own
 * copy was broken, and the thing being tested would be the copy.
 *
 * `git` is stubbed, so a case is one fixture diff rather than one repository.
 * The stub answers the three commands the classifier calls and fails whichever
 * of them a case asks it to.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORKFLOW = fileURLToPath(new URL('../.github/workflows/ci.yml', import.meta.url));

/**
 * The `run:` block of the step named `Classify the change`.
 *
 * Located by the step's `id`, which is what the job's `outputs` refer to, so a
 * renamed step fails here rather than quietly testing nothing.
 */
export function classifierScript(workflowSource) {
  const lines = workflowSource.split('\n');
  const start = lines.findIndex((line) => line.trim() === 'id: classify');
  assert.ok(start >= 0, 'the workflow declares no step with id `classify`');

  const runAt = lines.findIndex((line, index) => index > start && line.trim() === 'run: |');
  assert.ok(runAt > start, 'the `classify` step carries no `run:` block');

  const indent = lines[runAt].length - lines[runAt].trimStart().length + 2;
  const body = [];
  for (const line of lines.slice(runAt + 1)) {
    if (line.trim() !== '' && line.length - line.trimStart().length < indent) {
      break;
    }
    body.push(line.slice(indent));
  }

  const script = body.join('\n');
  assert.match(script, /product=/, 'the extracted block is not the classifier');
  return script;
}

/** A `git` that answers the three commands the classifier calls. */
function gitStub({ fetchFails = false, mergeBaseFails = false, diffFails = false, changed = '' }) {
  return [
    '#!/bin/sh',
    'case "$1" in',
    `  fetch) exit ${fetchFails ? 1 : 0} ;;`,
    `  merge-base) ${mergeBaseFails ? 'exit 1' : 'echo abc123; exit 0'} ;;`,
    `  diff) ${diffFails ? 'exit 1' : `printf '%s' "$CHANGED_FIXTURE"; exit 0`} ;;`,
    'esac',
    'exit 0',
    '',
  ].join('\n');
}

/** Runs the real classifier over one fixture and reads back what it decided. */
function classify({ event = 'pull_request', changed = '', ...failures } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'classify-'));
  try {
    const bin = join(directory, 'bin');
    execFileSync('mkdir', ['-p', bin]);
    writeFileSync(join(bin, 'git'), gitStub({ changed, ...failures }), 'utf8');
    chmodSync(join(bin, 'git'), 0o755);

    const output = join(directory, 'output');
    const summary = join(directory, 'summary');
    writeFileSync(output, '', 'utf8');
    writeFileSync(summary, '', 'utf8');

    execFileSync('bash', ['-c', classifierScript(readFileSync(WORKFLOW, 'utf8'))], {
      env: {
        PATH: `${bin}:${process.env['PATH']}`,
        EVENT_NAME: event,
        BASE_REF: 'main',
        HEAD_SHA: 'deadbee',
        CHANGED_FIXTURE: changed,
        GITHUB_OUTPUT: output,
        GITHUB_STEP_SUMMARY: summary,
      },
    });

    return {
      product: /product=(\w+)/.exec(readFileSync(output, 'utf8'))?.[1] ?? null,
      summary: readFileSync(summary, 'utf8').trim(),
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('the lane classifier', () => {
  it('sends a pull request that changes only the record to the specification lane', () => {
    const { product, summary } = classify({
      changed: [
        'openspec/specs/platform/design-system/spec.md',
        'openspec/changes/a/proposal.md',
      ].join('\n'),
    });

    assert.equal(product, 'false');
    assert.match(summary, /^Specification lane:/);
  });

  it('sends a pull request that changes product code to the product lane', () => {
    const { product, summary } = classify({ changed: 'src/app/app.ts' });

    assert.equal(product, 'true');
    assert.match(summary, /src\/app\/app\.ts is outside openspec\//);
  });

  // The case that matters most: one product path among many record paths. A
  // classifier that stops at the first path, or never reads them at all, sends
  // the whole gate away on a change it was written to catch.
  it('sends a mixed pull request to the product lane, whichever path is last', () => {
    const record = Array.from({ length: 20 }, (_, index) => `openspec/specs/a/${index}.md`);

    for (const changed of [
      ['src/app/app.ts', ...record],
      [...record, 'src/app/app.ts'],
      [...record.slice(0, 10), 'src/app/app.ts', ...record.slice(10)],
    ]) {
      const { product } = classify({ changed: changed.join('\n') });

      assert.equal(
        product,
        'true',
        `a product path at position ${changed.indexOf('src/app/app.ts')}`,
      );
    }
  });

  it('sends a change to the workflow itself to the product lane', () => {
    assert.equal(classify({ changed: '.github/workflows/ci.yml' }).product, 'true');
  });

  it('reads a deletion from the record as a record change', () => {
    assert.equal(classify({ changed: 'openspec/changes/a/proposal.md' }).product, 'false');
  });

  // Git quotes a path holding a quotation mark, a backslash, a newline or a
  // byte outside ASCII. A quoted path cannot match the prefix, so it lands in
  // the product lane, which is the safe direction.
  it('sends a path git had to quote to the product lane', () => {
    assert.equal(classify({ changed: '"openspec/sp\\303\\251c.md"' }).product, 'true');
  });

  it('sends a push to the product lane without reading any diff', () => {
    const { product, summary } = classify({ event: 'push', changed: 'openspec/specs/a/spec.md' });

    assert.equal(product, 'true');
    assert.match(summary, /not a pull request/);
  });

  for (const [name, failure] of [
    ['the fetch', { fetchFails: true }],
    ['the merge base', { mergeBaseFails: true }],
    ['the diff', { diffFails: true }],
  ]) {
    it(`sends a pull request to the product lane when ${name} fails`, () => {
      const { product, summary } = classify({ changed: 'openspec/specs/a/spec.md', ...failure });

      assert.equal(product, 'true');
      assert.match(summary, /the diff could not be read/);
    });
  }

  it('sends an empty diff to the product lane, and says which it was', () => {
    const { product, summary } = classify({ changed: '' });

    assert.equal(product, 'true');
    assert.match(summary, /the diff is empty/);
  });
});
