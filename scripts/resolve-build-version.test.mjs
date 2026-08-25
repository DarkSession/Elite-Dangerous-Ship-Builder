/**
 * The build version, resolved the way CI resolves it.
 *
 * The patch a build ships under is a count of commits, so the properties worth
 * pinning are the ones a count can lose: that it is the same number for the
 * same commit however often it is resolved, that advancing the minor by hand
 * starts it again rather than carrying the old total forward, and that a
 * history too shallow to count fails loudly instead of resolving to something
 * plausible. The git walk is exercised against real repositories built here;
 * a fake runner is used only where the point is what the walk is asked.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  gitIn,
  parseDeclaredVersion,
  resolveBuildVersion,
  stampVersion,
} from './resolve-build-version.mjs';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const scriptPath = fileURLToPath(new URL('./resolve-build-version.mjs', import.meta.url));

/**
 * A manifest shaped like the real one in the way that matters here: the version
 * sits at the top and everything a commit might otherwise change sits far
 * enough below it to merge cleanly against a version bump.
 */
const manifest = (version, marker = 'ship-builder') =>
  [
    '{',
    '  "name": "elite-dangerous-ship-builder",',
    `  "version": "${version}",`,
    '  "private": true,',
    '  "license": "MIT",',
    '  "packageManager": "pnpm@10.33.0",',
    '  "dependencies": {',
    `    "a-dependency": "^${marker}"`,
    '  }',
    '}',
    '',
  ].join('\n');

/** An empty repository, with git configured enough to commit in it. */
async function repository(t) {
  const root = await mkdtemp(join(tmpdir(), 'edsb-build-version-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const git = gitIn(root);
  git('init', '--quiet', '--initial-branch=main');
  git('config', 'user.email', 'test@example.test');
  git('config', 'user.name', 'Test');
  return { root, git };
}

/**
 * One commit, changing the manifest where a version is given.
 *
 * Every commit touches a file of its own as well, so that a commit re-declaring
 * the version it already carried is still a commit that touched `package.json`
 * — which is what a dependency bump looks like to the walk.
 */
async function commit(root, git, label, manifestText = null, date = null) {
  await writeFile(join(root, `change-${label}.txt`), `${label}\n`);
  if (manifestText !== null) {
    await writeFile(join(root, 'package.json'), manifestText);
  }
  git('add', '--all');
  // Commit timestamps are what `git log` sorts by, and a fixture that leaves
  // them to the clock writes every commit in the same second — which hides the
  // ordering the walk has to survive. Where the order matters, the test says so.
  const committer = date
    ? (...args) =>
        execFileSync('git', args, {
          cwd: root,
          encoding: 'utf8',
          env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
        })
    : git;
  committer('commit', '--quiet', '--message', `commit ${label}`);
  return git('rev-parse', 'HEAD').trim();
}

/** A repository whose `package.json` declared each of these versions in turn. */
async function repositoryDeclaring(t, versions) {
  const { root, git } = await repository(t);
  for (const [index, version] of versions.entries()) {
    // The dependency line varies per commit, so a commit re-declaring the
    // version it already carried still counts as one that touched the file.
    await commit(root, git, index, version === null ? null : manifest(version, `commit ${index}`));
  }
  return { root, git };
}

const run = (root, ...args) =>
  execFileSync(process.execPath, [scriptPath, ...args], {
    encoding: 'utf8',
    env: { ...process.env, SHIP_BUILDER_REPOSITORY_ROOT: root },
  });

describe('the declared version', () => {
  it('is the major and minor a maintainer wrote', () => {
    assert.deepEqual(parseDeclaredVersion(manifest('2.7.0')), { major: 2, minor: 7 });
  });

  it('refuses a hand-written patch, which is CI’s to supply', () => {
    assert.throws(() => parseDeclaredVersion(manifest('1.4.9')), /declared patch must be 0/);
  });

  it('refuses a manifest with no version member to stamp', () => {
    assert.throws(() => parseDeclaredVersion('{\n  "name": "x"\n}\n'), /no top-level/);
  });

  it('is stamped without disturbing the rest of the file', () => {
    const stamped = stampVersion(manifest('0.3.0'), '0.3.12');

    assert.equal(stamped, manifest('0.3.12'));
  });
});

describe('the resolved patch', () => {
  it('counts the commits since the declaration, and the declaring commit is zero', async (t) => {
    const { root, git } = await repositoryDeclaring(t, ['0.1.0', null, null]);

    assert.equal(resolveBuildVersion(manifest('0.1.0'), gitIn(root)).version, '0.1.2');
    git('checkout', '--quiet', 'HEAD~2');
    assert.equal(resolveBuildVersion(manifest('0.1.0'), gitIn(root)).version, '0.1.0');
  });

  it('is the same number when an older commit is built again later', async (t) => {
    // What a CI re-run and the manual republish both depend on: the version is
    // a property of the commit, so commits landing afterwards cannot change it.
    const { root, git } = await repositoryDeclaring(t, ['0.1.0', null, null]);
    const resolvedThen = resolveBuildVersion(manifest('0.1.0'), gitIn(root));

    await commit(root, git, 'later');
    await commit(root, git, 'later-still');
    git('checkout', '--quiet', resolvedThen.baseline === null ? 'HEAD' : 'HEAD~2');

    assert.equal(resolvedThen.version, '0.1.2');
    assert.equal(resolveBuildVersion(manifest('0.1.0'), gitIn(root)).version, '0.1.2');
  });

  it('starts again where the minor was advanced by hand', async (t) => {
    const { root } = await repositoryDeclaring(t, ['0.1.0', null, null, '0.2.0', null]);

    assert.equal(resolveBuildVersion(manifest('0.2.0'), gitIn(root)).version, '0.2.1');
  });

  it('counts from the commit that first declared the current major.minor', async (t) => {
    // A commit that touches package.json without moving the version — a
    // dependency bump, say — is not where the version began.
    const { root, git } = await repositoryDeclaring(t, ['0.1.0', null, '0.1.0', null]);
    const first = git('rev-list', '--max-parents=0', 'HEAD').trim();

    assert.deepEqual(resolveBuildVersion(manifest('0.1.0'), gitIn(root)), {
      version: '0.1.3',
      major: 0,
      minor: 1,
      patch: 3,
      baseline: first,
    });
  });

  it('counts from the bump that landed on main, across a pull request forked before it', async (t) => {
    // `git log -- package.json` is ordered by commit date and walks every
    // branch, so a branch cut before the bump and merged after it puts the
    // older declaration first. Counting main's own line is what keeps the merge
    // from resolving a patch of 0 and re-issuing the bump commit's version.
    const { root, git } = await repositoryDeclaring(t, ['0.1.0', null]);
    // A branch cut from main before the bump, left for later.
    git('branch', 'feature');
    // Only the version line moves, exactly as a hand-made bump does.
    const bumped = await commit(
      root,
      git,
      'bump',
      manifest('0.2.0', 'commit 0'),
      '2026-01-02T00:00:00Z',
    );
    await commit(root, git, 'after-bump', null, '2026-01-03T00:00:00Z');

    git('checkout', '--quiet', 'feature');
    // The branch changes a dependency and leaves the version alone, so the
    // merge really does change package.json on main — the side of the history
    // git would otherwise simplify away — and the branch's commit is the newest
    // change to the file by date, which is where a date-ordered walk stops.
    await commit(
      root,
      git,
      'branch-dependency',
      manifest('0.1.0', 'a-later-dependency'),
      '2026-01-04T00:00:00Z',
    );
    git('checkout', '--quiet', 'main');
    git('merge', '--quiet', '--no-ff', '--no-edit', 'feature');

    const resolved = resolveBuildVersion(manifest('0.2.0'), gitIn(root));
    assert.equal(resolved.baseline, bumped);
    assert.equal(resolved.version, '0.2.3');
  });

  it('ignores a bump that was reverted inside a pull request', async (t) => {
    const { root, git } = await repositoryDeclaring(t, ['0.1.0', null]);
    git('checkout', '--quiet', '-b', 'feature');
    await commit(root, git, 'speculative-bump', manifest('0.2.0', 'commit 0'));
    await commit(root, git, 'thought-better-of-it', manifest('0.1.0', 'commit 0'));
    git('checkout', '--quiet', 'main');
    git('merge', '--quiet', '--no-ff', '--no-edit', 'feature');

    // Only what landed on main's own line counts, so the abandoned 0.2.0 is
    // neither a baseline nor a version this tree is accused of going back from.
    assert.equal(resolveBuildVersion(manifest('0.1.0'), gitIn(root)).version, '0.1.4');
  });

  it('refuses a declaration lower than one main already deployed under', async (t) => {
    const { root } = await repositoryDeclaring(t, ['0.1.0', null, '0.2.0', null]);

    // Reverting to 0.1.0 would resolve 0.1.0 again, a string the commit that
    // declared it has already been deployed under.
    assert.throws(() => resolveBuildVersion(manifest('0.1.0'), gitIn(root)), /already/);
  });

  it('refuses a history it cannot read, rather than counting less of it', async (t) => {
    const { root, git } = await repositoryDeclaring(t, ['0.1.0', null, null]);
    const unreadable = (...args) => {
      if (args[0] === 'show') {
        const error = new Error('Command failed: git show');
        error.stderr = 'fatal: bad object HEAD:package.json\n';
        throw error;
      }
      return git(...args);
    };

    assert.throws(
      () => resolveBuildVersion(manifest('0.1.0'), unreadable),
      /Cannot read package.json/,
    );
  });

  it('is zero for a declaration that is not committed yet', async (t) => {
    const { root } = await repositoryDeclaring(t, ['0.1.0', null]);

    assert.equal(resolveBuildVersion(manifest('0.9.0'), gitIn(root)).version, '0.9.0');
  });

  it('refuses a history too shallow to count', () => {
    const shallow = (...args) =>
      args[0] === 'rev-parse'
        ? 'true\n'
        : assert.fail(`git ${args.join(' ')} after a shallow repository`);

    assert.throws(() => resolveBuildVersion(manifest('0.1.0'), shallow), /shallow clone/);
  });
});

describe('the command', () => {
  it('writes only the version to stdout, so a workflow can capture it', async (t) => {
    const { root } = await repositoryDeclaring(t, ['1.0.0', null]);

    assert.equal(run(root), '1.0.1\n');
  });

  it('stamps the manifest in place with --write, and leaves it alone otherwise', async (t) => {
    const { root } = await repositoryDeclaring(t, ['1.0.0', null, null]);
    const manifestPath = join(root, 'package.json');

    run(root);
    assert.equal(await readFile(manifestPath, 'utf8'), manifest('1.0.0', 'commit 0'));

    assert.equal(run(root, '--write'), '1.0.2\n');
    assert.equal(await readFile(manifestPath, 'utf8'), manifest('1.0.2', 'commit 0'));
  });

  it('refuses to stamp a manifest a previous run already stamped', async (t) => {
    const { root } = await repositoryDeclaring(t, ['1.0.0', null]);

    run(root, '--write');
    assert.throws(() => run(root, '--write'), /declared patch must be 0/);
  });

  it('resolves this repository’s own version from its own history', () => {
    assert.match(run(repositoryRoot).trim(), /^\d+\.\d+\.\d+$/);
  });
});
