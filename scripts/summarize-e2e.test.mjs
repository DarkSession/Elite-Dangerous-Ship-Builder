import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarize, formatSummary } from './summarize-e2e.mjs';

function report(tests) {
  return {
    config: { workers: 2, shard: null },
    stats: { duration: 1200, expected: 1, unexpected: 0, flaky: 1, skipped: 0 },
    suites: [
      {
        title: 'fixture.spec.ts',
        specs: [{ file: 'fixture.spec.ts', title: 'opens a view', tests }],
      },
    ],
  };
}

test('separates elapsed, attempts, retries and nested named steps', () => {
  const summary = summarize(
    report([
      {
        projectName: 'chromium-desktop',
        status: 'flaky',
        results: [
          {
            retry: 0,
            status: 'failed',
            duration: 1000,
            error: { message: 'Expected a visible view' },
            steps: [
              {
                title: 'setup: view',
                duration: 300,
                steps: [{ title: 'setup: stock hull', duration: 200 }],
              },
              {
                title: 'assertions',
                duration: 500,
                steps: [{ title: 'axe: view', duration: 400 }],
              },
            ],
          },
          { retry: 1, status: 'passed', duration: 800 },
        ],
      },
      {
        projectName: 'firefox-desktop',
        status: 'expected',
        results: [{ retry: 0, status: 'passed', duration: 700 }],
      },
    ]),
  );
  assert.equal(summary.completed, 2);
  assert.equal(summary.attempts, 3);
  assert.equal(summary.attemptMs, 2500);
  assert.equal(summary.retryMs, 800);
  assert.deepEqual(summary.timed, {
    setup: { count: 1, duration: 300 },
    axe: { count: 1, duration: 400 },
  });
  assert.equal(summary.slowest[0].duration, 1800);
  assert.equal(summary.failures.length, 1);
  assert.match(
    formatSummary(summary),
    /Elapsed: 1.2s; summed attempt time: 2.5s; retry time: 0.8s/,
  );
  assert.match(formatSummary(summary), /Expected a visible view/);
});

test('does not report unstarted, interrupted or skipped executions as complete', () => {
  const summary = summarize(
    report([
      { status: 'skipped', results: [] },
      { status: 'unexpected', results: [{ status: 'interrupted', duration: 200 }] },
      { status: 'skipped', results: [{ status: 'skipped', duration: 0 }] },
      { status: 'unexpected', results: [{ status: 'timedOut', duration: 1000 }] },
    ]),
  );
  assert.equal(summary.selected, 4);
  assert.equal(summary.completed, 1);
});

test('rejects a document that is not a test report', () => {
  assert.throws(() => summarize({}), /Expected a Playwright JSON report/);
});

test('the command rejects incomplete reports and preserves failure across multiple reports', () => {
  const directory = mkdtempSync(join(tmpdir(), 'e2e-summary-'));
  try {
    const complete = report([
      { status: 'expected', results: [{ retry: 0, status: 'passed', duration: 100 }] },
    ]);
    complete.stats.flaky = 0;
    const incomplete = report([{ status: 'skipped', results: [] }]);
    const completePath = join(directory, 'complete.json');
    const incompletePath = join(directory, 'incomplete.json');
    writeFileSync(completePath, JSON.stringify(complete));
    writeFileSync(incompletePath, JSON.stringify(incomplete));
    const command = fileURLToPath(new URL('./summarize-e2e.mjs', import.meta.url));
    assert.equal(spawnSync(process.execPath, [command, completePath]).status, 0);
    assert.equal(spawnSync(process.execPath, [command, incompletePath, completePath]).status, 1);
    assert.equal(spawnSync(process.execPath, [command]).status, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
