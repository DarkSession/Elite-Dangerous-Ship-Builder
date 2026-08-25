import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The version a build ships under, resolved from the repository itself.
 *
 * `package.json` declares the major and minor, which are advanced by hand and
 * reviewed like any other change. The patch is not written down: it is the
 * number of commits since that major.minor was declared, counted here and
 * stamped into the manifest immediately before the production build. Two
 * properties follow from counting rather than incrementing, and both matter:
 *
 * - It is a property of the commit, not of the run. Re-running CI on the same
 *   commit produces the same version, and so does the manual republish in
 *   `deploy.yml`, which re-publishes the artifact this build produced rather
 *   than building again. A run counter would make those disagree.
 * - Nothing is committed back. A workflow that pushed a bump to `main` would
 *   move the branch tip out from under the deployment job's own tip check
 *   (`ci.yml`, "Confirm this is still the main branch tip"), and the publish
 *   would skip itself. The history is the record; the stamp lives only in the
 *   bundle it was built into.
 *
 * The stamped value reaches the application through
 * `src/app/platform/build/application-metadata.ts`, which imports
 * `package.json#version` and freezes it as the `appVersion` a SLEF export is
 * attributed to. It is deliberately *not* release evidence: a release is
 * declared by `SHIP_BUILDER_RELEASE_TAG` matching the shipped version exactly
 * (`specs/012-help-and-licences/contracts/distribution-artifacts.md`), which no
 * workflow sets, so an automatically stamped patch stays a non-release build.
 */

/** The declaration a maintainer edits: `major.minor`, with a patch this script owns. */
const DECLARED_VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

/**
 * The manifest's own top-level `version` member, matched as text.
 *
 * The stamp is a substring replacement rather than a parse and re-serialise so
 * that member order, spacing and the file's Prettier formatting survive it
 * untouched. Two-space indentation anchors the match to the root object, which
 * is the only place a `version` member of this repository's manifest appears.
 */
const VERSION_MEMBER = /^ {2}"version": "(\d+\.\d+\.\d+)",$/m;

/** The same member read leniently, for manifests written by older commits. */
const HISTORICAL_VERSION_MEMBER = /"version":\s*"(\d+)\.(\d+)\.\d+"/;

/** Runs git in one repository, returning its output. */
export function gitIn(repositoryRoot) {
  return (...args) => execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' });
}

/**
 * The major and minor a manifest declares, refusing anything else.
 *
 * A committed patch other than zero is rejected rather than honoured: the patch
 * is CI's to supply, and a hand-written one would either be silently discarded
 * or silently ship — and it is also what a manifest already stamped by this
 * script looks like, so the refusal keeps a second stamp in the same job from
 * counting on top of the first.
 */
export function parseDeclaredVersion(manifestText) {
  const member = VERSION_MEMBER.exec(manifestText);
  if (!member) {
    throw new Error(
      'package.json has no top-level `"version": "major.minor.patch",` member to stamp.\n' +
        'The stamp is a text replacement so that the file’s formatting survives it; restore the\n' +
        'member, or update VERSION_MEMBER in scripts/resolve-build-version.mjs to match the file.',
    );
  }
  const [major, minor, patch] = DECLARED_VERSION.exec(member[1]).slice(1).map(Number);
  if (patch !== 0) {
    throw new Error(
      `package.json declares version ${member[1]}, but the declared patch must be 0.\n` +
        'Major and minor are advanced by hand; the patch is the commit count this script resolves\n' +
        'and stamps at build time. Declare ' +
        `${major}.${minor}.0 and let the build supply the rest.`,
    );
  }
  return { major, minor };
}

/**
 * The manifest as one commit declared it, or `null` where it carried none.
 *
 * `git show` fails for two unrelated reasons — the path did not exist at that
 * commit, and git could not read the object — and only the first is a fact
 * about the history. Telling them apart matters because both end the walk, and
 * a walk that ends early resolves a *smaller* patch: a partial clone, which the
 * shallow guard does not catch, would otherwise stamp a version an earlier
 * build already deployed and exit successfully.
 */
function declarationAt(commit, git) {
  let manifestText;
  try {
    manifestText = git('show', `${commit}:package.json`);
  } catch (error) {
    const reported = `${error.stderr ?? ''}${error.message ?? ''}`;
    if (/does not exist in|exists on disk, but not in/.test(reported)) return null;
    throw new Error(
      `Cannot read package.json at ${commit}, so the commits since this version\n` +
        `was declared cannot be counted:\n${reported.trim()}`,
    );
  }
  const declared = HISTORICAL_VERSION_MEMBER.exec(manifestText);
  return declared ? { major: Number(declared[1]), minor: Number(declared[2]) } : null;
}

/**
 * The commit that last introduced this major.minor, walking the manifest's history.
 *
 * The walk follows `main`'s first parents, in topological order, and visits only
 * the commits that changed `package.json` there. Both qualifiers earn their
 * keep. Plain `git log` is ordered by commit *date* and traverses every branch,
 * so a pull request forked before a version bump and merged after it puts an
 * older declaration in front of the newer one and the walk stops on the wrong
 * commit — a merge would then resolve a patch of 0 and re-deploy a version
 * string an earlier build already shipped. Following first parents also means
 * only declarations that actually landed on `main` are considered: a bump made
 * and reverted inside a pull request never enters the count.
 *
 * A declaration older than the current one ends the walk, which is the ordinary
 * case. A *higher* one is refused rather than walked past, because it says the
 * declared version moved backwards over commits that have already been built
 * and deployed under it, and no patch count can make those two builds
 * distinguishable again.
 *
 * A tree whose declaration is not committed anywhere — a local edit advancing
 * the minor before it lands — has no baseline, and is introducing that
 * major.minor now: the patch is 0, exactly as the commit declaring it will
 * resolve.
 */
export function findVersionBaseline({ major, minor }, git) {
  const shallow = git('rev-parse', '--is-shallow-repository').trim();
  if (shallow !== 'false') {
    throw new Error(
      'The repository is a shallow clone, so the commits since this version was declared cannot\n' +
        'be counted. Check out with the full history (`fetch-depth: 0` in actions/checkout).',
    );
  }

  const commits = git('log', '--first-parent', '--topo-order', '--format=%H', '--', 'package.json')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let baseline = null;
  for (const commit of commits) {
    const declared = declarationAt(commit, git);
    if (!declared) break;
    if (declared.major === major && declared.minor === minor) {
      baseline = commit;
      continue;
    }
    if (declared.major > major || (declared.major === major && declared.minor > minor)) {
      throw new Error(
        `package.json declares version ${major}.${minor}.0, but ${commit.slice(0, 12)} already\n` +
          `declared ${declared.major}.${declared.minor}, and builds of it were deployed under\n` +
          `${declared.major}.${declared.minor}.x. Counting from here would re-issue version strings\n` +
          'those builds already carry. Advance the version past what has shipped rather than\n' +
          'returning to a lower one.',
      );
    }
    break;
  }
  return baseline;
}

/** The version this working tree builds under, and the evidence behind its patch. */
export function resolveBuildVersion(manifestText, git) {
  const { major, minor } = parseDeclaredVersion(manifestText);
  const baseline = findVersionBaseline({ major, minor }, git);
  const patch = baseline
    ? Number(git('rev-list', '--count', `${baseline}..HEAD`).trim())
    : /* the declaration is not committed yet, so this tree introduces it */ 0;

  if (!Number.isInteger(patch) || patch < 0) {
    throw new Error(`git counted ${patch} commits since ${baseline}, which is not a patch number.`);
  }
  return { version: `${major}.${minor}.${patch}`, major, minor, patch, baseline };
}

/** The manifest text with its declared version replaced by the resolved one. */
export function stampVersion(manifestText, version) {
  return manifestText.replace(VERSION_MEMBER, `  "version": "${version}",`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

/**
 * Print the resolved version, and with `--write` stamp it into `package.json`.
 *
 * Only the version reaches stdout, so a workflow step can capture it; anything
 * said about it goes to stderr. The write is left in the runner's working tree
 * and never committed.
 */
if (isMain) {
  const repositoryRoot =
    process.env.SHIP_BUILDER_REPOSITORY_ROOT ?? fileURLToPath(new URL('..', import.meta.url));
  const manifestPath = resolve(repositoryRoot, 'package.json');
  const manifestText = await readFile(manifestPath, 'utf8');
  const resolved = resolveBuildVersion(manifestText, gitIn(repositoryRoot));

  if (process.argv.includes('--write')) {
    await writeFile(manifestPath, stampVersion(manifestText, resolved.version));
    process.stderr.write(
      `Stamped package.json with version ${resolved.version}: ${resolved.patch} commit` +
        `${resolved.patch === 1 ? '' : 's'} since ${resolved.major}.${resolved.minor} was declared` +
        `${resolved.baseline ? ` in ${resolved.baseline.slice(0, 12)}` : ''}.\n`,
    );
  }
  process.stdout.write(`${resolved.version}\n`);
}
