import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';

/** Summed attempt time measures work; elapsed time measures the run's duration. */
export function summarize(report) {
  if (!report.stats || !Array.isArray(report.suites)) {
    throw new Error('Expected a Playwright JSON report with stats and suites.');
  }
  const tests = [];
  function visit(suite, parents = []) {
    const path = suite.title ? [...parents, suite.title] : parents;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        tests.push({
          file: spec.file,
          title: [...path, spec.title].join(' > '),
          project: test.projectName,
          status: test.status,
          results: test.results ?? [],
        });
      }
    }
    for (const child of suite.suites ?? []) visit(child, path);
  }
  visit(report);
  const attempts = tests.flatMap((test) => test.results);
  const sum = (rows) => rows.reduce((total, row) => total + (row.duration ?? 0), 0);
  const timed = { axe: { count: 0, duration: 0 }, setup: { count: 0, duration: 0 } };
  function steps(rows, inside = new Set()) {
    for (const step of rows ?? []) {
      const category = Object.keys(timed).find((key) => step.title.startsWith(`${key}: `));
      const nested = new Set(inside);
      if (category && !inside.has(category)) {
        timed[category].count += 1;
        timed[category].duration += step.duration ?? 0;
        nested.add(category);
      }
      steps(step.steps, nested);
    }
  }
  for (const attempt of attempts) steps(attempt.steps);
  const groups = new Map();
  for (const test of tests) {
    const key = `${test.project} / ${test.file}`;
    groups.set(key, (groups.get(key) ?? 0) + sum(test.results));
  }
  const failures = tests.filter(
    (test) =>
      ['unexpected', 'flaky'].includes(test.status) ||
      test.results.some((result) => result.status === 'interrupted'),
  );
  const starts = attempts.map((attempt) => Date.parse(attempt.startTime)).filter(Number.isFinite);
  const runStart = Date.parse(report.stats.startTime);
  return {
    selected: tests.length,
    completed: tests.filter((test) =>
      test.results.some((result) => ['passed', 'failed', 'timedOut'].includes(result.status)),
    ).length,
    workers: report.config?.workers,
    shard: report.config?.shard,
    stats: report.stats,
    errors: report.errors ?? [],
    attemptMs: sum(attempts),
    beforeFirstAttemptMs:
      starts.length && Number.isFinite(runStart) ? Math.min(...starts) - runStart : null,
    retryMs: sum(attempts.filter((attempt) => attempt.retry > 0)),
    attempts: attempts.length,
    timed,
    slowest: [...tests]
      .sort((a, b) => sum(b.results) - sum(a.results))
      .slice(0, 15)
      .map(({ results, ...test }) => ({ ...test, duration: sum(results) })),
    groups: [...groups].sort((a, b) => b[1] - a[1]).slice(0, 15),
    failures: failures.map((test) => ({
      project: test.project,
      title: test.title,
      status: test.status,
      attempts: test.results.map((result) => ({
        retry: result.retry,
        status: result.status,
        error: stripVTControlCharacters(result.error?.message ?? result.errors?.[0]?.message ?? '')
          .split('\n')
          .slice(0, 8)
          .join('\n'),
      })),
    })),
  };
}

const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;

export function formatSummary(summary) {
  const { stats, timed } = summary;
  const causes = new Map();
  for (const failure of summary.failures) {
    for (const attempt of failure.attempts) {
      if (!attempt.error) continue;
      const cause = attempt.error.split('\n').find((line) => line.trim()) ?? attempt.status;
      causes.set(cause, (causes.get(cause) ?? 0) + 1);
    }
  }
  const lines = [
    `Completed: ${summary.completed}/${summary.selected} selected executions; attempts: ${summary.attempts}`,
    `Expected: ${stats.expected}; unexpected: ${stats.unexpected}; flaky: ${stats.flaky}; skipped: ${stats.skipped}`,
    `Workers: ${summary.workers}; shard: ${summary.shard ? JSON.stringify(summary.shard) : 'none'}`,
    `Elapsed: ${seconds(stats.duration)}; summed attempt time: ${seconds(summary.attemptMs)}; retry time: ${seconds(summary.retryMs)}`,
    `Before first attempt: ${summary.beforeFirstAttemptMs === null ? 'unavailable' : seconds(summary.beforeFirstAttemptMs)} (includes runner and server preparation)`,
    `Named setup steps: ${timed.setup.count}, ${seconds(timed.setup.duration)}; axe scans: ${timed.axe.count}, ${seconds(timed.axe.duration)}`,
    'Named setup steps cover instrumented helpers only. Step times are part of attempt time.',
    'Completeness describes the selected tests, not whether the selection covers the full gate.',
    '',
    'Slowest executions:',
    ...summary.slowest.map((test) => `${seconds(test.duration)} [${test.project}] ${test.title}`),
    '',
    'Most work by project and file:',
    ...summary.groups.map(([key, duration]) => `${seconds(duration)} ${key}`),
    '',
    'Most frequent failure messages (attempts):',
    ...[...causes]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cause, count]) => `${count}: ${cause}`),
    '',
    `Failures and flakes: ${summary.failures.length} (first 5 shown; full details remain in the JSON report)`,
    ...summary.failures
      .slice(0, 5)
      .flatMap((test) => [
        `[${test.project}] ${test.title} (${test.status})`,
        ...test.attempts.map(
          (attempt) => `  Attempt ${attempt.retry + 1}: ${attempt.status}\n${attempt.error}`,
        ),
      ]),
    ...summary.errors.map((error) => `Run error: ${error.message ?? JSON.stringify(error)}`),
  ];
  return lines.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const paths = process.argv.slice(2);
    if (paths.length === 0) throw new Error('Usage: pnpm run e2e:summary <report.json> [...]');
    for (const path of paths) {
      const summary = summarize(JSON.parse(readFileSync(path, 'utf8')));
      console.log(`${path}\n${formatSummary(summary)}`);
      if (
        summary.completed !== summary.selected ||
        summary.selected === 0 ||
        summary.stats.unexpected > 0 ||
        summary.stats.flaky > 0 ||
        summary.errors.length > 0
      ) {
        process.exitCode = 1;
      }
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
