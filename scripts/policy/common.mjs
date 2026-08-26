/**
 * What every repository-policy checker in this directory is built from.
 *
 * Each `*-ownership.mjs` fences one capability, and the rules differ entirely
 * from one to the next — that is the point of having seven of them. What did
 * not differ was the machinery underneath: the same directory walk, the same
 * "every file under these paths, minus the suites" list, the same line reader
 * that skips block documentation, and the same seven-line epilogue. Those live
 * here once, so a fix to one is a fix to all seven rather than to whichever
 * copies somebody remembered.
 *
 * A checker keeps anything it does differently. Feature 002's walker reads the
 * TypeScript AST and skips a third suffix; feature 004 skips test doubles under
 * `testing/` rather than fixtures. Those are behaviours their rules depend on,
 * so they pass their own `skip` list or keep their own walker.
 */
import { readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The repository root. Every path a rule reports is relative to it. */
export const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

/**
 * Arithmetic between two things, rather than a sign, a hyphen or a comment.
 *
 * The operator has to be spaced on both sides, which is how the formatter sets
 * every expression in this repository and is never how a kebab-cased class,
 * message key or data attribute is written.
 */
export const ARITHMETIC = /[a-zA-Z0-9_$)\]] [+\-*/%] [a-zA-Z0-9_$(]/;

/** What a rule skips unless it names its own list: the suites and the fixtures. */
const DEFAULT_SKIP = ['.spec.', '.fixtures.'];

async function* walk(target) {
  const info = await stat(target).catch(() => null);
  if (info === null) {
    return;
  }
  if (!info.isDirectory()) {
    yield target;
    return;
  }
  for (const entry of await readdir(target)) {
    yield* walk(join(target, entry));
  }
}

/**
 * Every file under a set of paths, excluding suites and fixtures.
 *
 * A suite asks the package the same question this application asks, for the
 * same build, and compares the two answers — which is the whole point of the
 * contract suite and of every component suite that refuses to write a megajoule
 * down. Holding them to the call-site rule would forbid the only test that can
 * prove the rule is being kept.
 *
 * `skip` is what a checker overrides when its feature keeps its exclusions
 * somewhere else — under `testing/` rather than in a `.fixtures.` file — or
 * when one rule deliberately wants the suites in scope. An empty list reads
 * everything.
 */
export async function filesUnder(paths, extensions, { skip = DEFAULT_SKIP } = {}) {
  const files = [];
  for (const path of paths) {
    for await (const found of walk(resolve(ROOT, path))) {
      const name = relative(ROOT, found);
      if (skip.some((fragment) => name.includes(fragment))) {
        continue;
      }
      if (extensions.includes(extname(found))) {
        files.push(name);
      }
    }
  }
  return [...new Set(files)].sort();
}

/** Whether a line is prose or is excused, and so is not read by a rule. */
function skipped(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('*') || trimmed.startsWith('/**') || line.includes('policy-allow:');
}

/**
 * Reads a file line by line, skipping block documentation.
 *
 * A `/** … *\/` comment explains the code, and these files explain themselves
 * largely by naming what they refuse to do — a rule that read them would report
 * the sentence "nothing here divides one figure by another" as a division. A
 * `//` line beside code is not that: it is usually code somebody turned off,
 * which is exactly what these rules are for. `policy-allow:` covers the rest.
 */
export function scan(source, test) {
  const found = [];
  source.split('\n').forEach((line, index) => {
    if (skipped(line)) {
      return;
    }
    const hit = test(line);
    if (hit !== null && hit !== false && hit !== undefined) {
      found.push({ line: index + 1, hit });
    }
  });
  return found;
}

/**
 * Finds every line carrying one of a set of forbidden strings or patterns.
 *
 * The same reading as `scan`, for the common case where the test is a list of
 * things that must not appear rather than a predicate.
 */
export function lines(source, matches) {
  const found = [];
  source.split('\n').forEach((line, index) => {
    if (skipped(line)) {
      return;
    }
    for (const match of matches) {
      const hit = typeof match === 'string' ? line.includes(match) : match.test(line);
      if (hit) {
        found.push({ line: index + 1, match: typeof match === 'string' ? match : String(match) });
      }
    }
  });
  return found;
}

/** Runs every rule against the repository and collects what they found. */
export async function runRules(rules) {
  const violations = [];
  for (const rule of rules) {
    await rule.run(violations);
  }
  return violations;
}

/**
 * Reports a checker's findings and sets the exit code, when it was run as a
 * command rather than imported by a test.
 *
 * Exit code 0 means every rule passed; a violation prints its file, line and
 * reason. `moduleUrl` is the caller's `import.meta.url`, which is how a checker
 * tells "somebody ran me" from "a suite imported my rules".
 */
export async function runPolicy(label, check, moduleUrl) {
  if (process.argv[1] !== fileURLToPath(moduleUrl)) {
    return;
  }
  const violations = await check();
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.line}: ${violation.reason}`);
  }
  console.log(
    violations.length === 0
      ? `${label}: no violations`
      : `${label}: ${violations.length} violation(s)`,
  );
  process.exit(violations.length === 0 ? 0 : 1);
}
