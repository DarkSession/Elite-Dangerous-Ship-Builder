#!/usr/bin/env node
/**
 * Builds the one artifact the Help · About modal reads.
 *
 * Everything the modal states about itself is a fact about the build, and this
 * script is where those facts are taken from the files that hold them rather
 * than from a person's memory. It reads the root `package.json`, the root
 * `LICENSE` and the installed Almanac's own manifest, proves each one says what
 * it is supposed to say, and emits a TypeScript module the application imports
 * eagerly.
 *
 * The reason it is a generator rather than four imports is the disclaimer.
 * `LICENSE` is not a module, the notice inside it is a paragraph of a larger
 * document, and the alternative to extracting it is typing it out a second time
 * next to the first. Two copies of a legal notice is one copy and one liability:
 * the day they diverge, the one a Commander reads is the one nobody reviewed.
 *
 * Three modes:
 *
 *   (default)  validate everything, emit the module
 *   --check    validate everything and emit nothing; it does not compare
 *              against the artifact on disk, for the reason given below it
 *   --sync     the maintainer path: copy the installed package's legal files
 *              over the tracked mirrors in `legal/almanac/`, then emit
 *
 * Every failure names the artifact and the rule, exits non-zero and writes no
 * partial output. There is no runtime fallback for any of them, because a
 * missing legal notice is not a state to render (FR-005).
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * The one external destination the modal offers.
 *
 * Audited and committed here rather than derived from a git remote: a remote is
 * whatever the person building happened to clone from, and this URL is a
 * promise about where the complete terms are. Deriving it would make the
 * promise depend on a fork.
 */
export const REPOSITORY_LICENSE_URL =
  'https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE';

/** The package whose catalogue and calculations this application reads. */
export const ALMANAC_PACKAGE_NAME = '@elite-dangerous-almanac/core';

/** The version root `package.json` carries while nothing has been released. */
const PLACEHOLDER_VERSION = '0.0.0';

/** The heading of the section the disclaimer lives under. */
const FRONTIER_SECTION = 'Elite Dangerous game data and imagery (Frontier media-usage notice)';

/** The line immediately above the indented block to extract. */
const DISCLAIMER_MARKER = 'Under those rules:';

/** Markdown's structural indent, and the only thing extraction removes. */
const BLOCK_INDENT = '    ';

/** The package legal documents a source distribution has to carry. */
const MIRRORED_ARTIFACTS = [
  { id: 'almanacLicense', fileName: 'LICENSE' },
  { id: 'almanacNotices', fileName: 'THIRD_PARTY_NOTICES.md' },
];

/**
 * Top-level package files that would be legal obligations if they appeared.
 *
 * An Almanac upgrade that adds one of these is adding a term this repository
 * has not agreed to redistribute. Generation stops and names the file, so it
 * reaches a person instead of a diff nobody reads.
 */
const LEGAL_FILE_PATTERNS = [/^LICEN[SC]E/i, /^COPYING/i, /^NOTICE/i, /THIRD_PARTY/i];

/** The tracked mirror directory, relative to the repository root. */
const MIRROR_DIRECTORY = 'legal/almanac';

/** A build identifier that is safe to publish: no person, path, host or space. */
const SAFE_BUILD_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

/** Release tags that are placeholders rather than releases. */
const PLACEHOLDER_TAGS = new Set(['latest', 'head', 'undefined', 'null', 'v0.0.0', 'nightly']);

/** A failure that names an artifact and a rule. */
export class HelpManifestError extends Error {
  constructor(artifact, message) {
    super(`${artifact}: ${message}`);
    this.name = 'HelpManifestError';
    this.artifact = artifact;
  }
}

const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

/**
 * Reads a file as strict UTF-8.
 *
 * Strict because a legal notice that silently gained a replacement character on
 * the way in is no longer the notice. `TextDecoder` with `fatal` refuses the
 * bytes instead of repairing them.
 */
export async function readUtf8(path, artifact) {
  let bytes;
  try {
    bytes = await readFile(path);
  } catch (cause) {
    throw new HelpManifestError(artifact, `cannot be read (${cause.code ?? cause.message}).`);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new HelpManifestError(artifact, 'is not valid UTF-8.');
  }
}

const countOccurrences = (lines, needle) =>
  lines.reduce((total, line) => (line.trim() === needle ? total + 1 : total), 0);

/**
 * Lifts the project's Frontier media-usage disclaimer out of root `LICENSE`.
 *
 * The notice is a Markdown-indented block under a marker line inside one named
 * section. Extraction removes exactly the four spaces Markdown uses to mark the
 * block as a block, and touches nothing else: no trimming, no re-wrapping, no
 * whitespace collapse, no trailing newline. Every remaining byte is Frontier's
 * wording and stays as it was written (FR-006).
 *
 * Ambiguity fails rather than guessing. Two matching sections or two markers
 * mean the document has been restructured, and picking one of them would be
 * this script deciding which legal text a Commander reads.
 */
export function extractFrontierDisclaimer(licenseText) {
  const lines = licenseText.split('\n');

  const sectionCount = countOccurrences(lines, FRONTIER_SECTION);
  if (sectionCount === 0) {
    throw new HelpManifestError('LICENSE', `has no "${FRONTIER_SECTION}" section.`);
  }
  if (sectionCount > 1) {
    throw new HelpManifestError(
      'LICENSE',
      `has ${sectionCount} "${FRONTIER_SECTION}" sections; exactly one is required.`,
    );
  }

  const markerCount = countOccurrences(lines, DISCLAIMER_MARKER);
  if (markerCount === 0) {
    throw new HelpManifestError('LICENSE', `has no "${DISCLAIMER_MARKER}" marker.`);
  }
  if (markerCount > 1) {
    throw new HelpManifestError(
      'LICENSE',
      `has ${markerCount} "${DISCLAIMER_MARKER}" markers; exactly one is required.`,
    );
  }

  const sectionIndex = lines.findIndex((line) => line.trim() === FRONTIER_SECTION);
  const markerIndex = lines.findIndex((line) => line.trim() === DISCLAIMER_MARKER);
  if (markerIndex < sectionIndex) {
    throw new HelpManifestError(
      'LICENSE',
      `places "${DISCLAIMER_MARKER}" outside the "${FRONTIER_SECTION}" section.`,
    );
  }

  let start = markerIndex + 1;
  while (start < lines.length && lines[start].trim() === '') {
    start += 1;
  }

  const block = [];
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '') {
      break;
    }
    // Exactly four spaces, then something that is not a space. A deeper indent
    // is a nested construct, and stripping four from it would publish a block
    // that still carries indentation it never had in the source.
    if (!/^ {4}[^ ]/.test(line)) {
      if (block.length === 0) {
        throw new HelpManifestError(
          'LICENSE',
          `has no four-space indented block after "${DISCLAIMER_MARKER}".`,
        );
      }
      break;
    }
    block.push(line.slice(BLOCK_INDENT.length));
  }

  if (block.length === 0) {
    throw new HelpManifestError('LICENSE', `has an empty block after "${DISCLAIMER_MARKER}".`);
  }

  const exactText = block.join('\n');
  if (exactText.trim().length === 0) {
    throw new HelpManifestError('LICENSE', 'yields an empty Frontier disclaimer.');
  }

  return {
    documentId: 'frontierDisclaimer',
    source: 'LICENSE',
    language: 'en',
    exactText,
    byteLength: Buffer.byteLength(exactText, 'utf8'),
    sha256: sha256(exactText),
  };
}

/**
 * Confirms root `LICENSE` still separates this project's MIT grant from the
 * rights it cannot grant.
 *
 * FR-004's obligation is on the document, not on the modal: the modal can only
 * repeat a boundary the licence actually draws. A `LICENSE` that has lost the
 * paragraph would make the modal's framing an unsupported claim, so it fails
 * here rather than being rendered.
 */
export function assertLicenceBoundary(licenseText) {
  const flattened = licenseText.replace(/\s+/g, ' ');
  const required = [
    'does not cover, and does not relicense, the Elite Dangerous game data and imagery',
    'Third-party data and its terms',
  ];
  for (const phrase of required) {
    if (!flattened.includes(phrase)) {
      throw new HelpManifestError(
        'LICENSE',
        `no longer distinguishes the MIT grant from package artwork and game data: "${phrase}" is missing.`,
      );
    }
  }
}

/**
 * Decides whether this build is a release, and refuses to guess.
 *
 * One variable declares the intent. `SHIP_BUILDER_RELEASE_TAG` set to anything
 * non-empty means a release workflow is running, and from there the only two
 * outcomes are "this is that release" and "this is broken". There is no third
 * outcome where a declared release quietly becomes a development build, because
 * that would ship a release labelled as something else and nobody would look.
 *
 * Nothing else is consulted. Production optimisation is not evidence of a
 * release — it is evidence of a production build, which is what the deploy
 * workflow makes of every commit on `main`.
 */
export function classifyBuildIdentity({ applicationVersion, env, resolveCommit }) {
  if (typeof applicationVersion !== 'string' || applicationVersion.trim().length === 0) {
    throw new HelpManifestError('package.json', 'has no version.');
  }

  const declared = (env.SHIP_BUILDER_RELEASE_TAG ?? '').trim();

  if (declared.length > 0) {
    if (applicationVersion === PLACEHOLDER_VERSION) {
      throw new HelpManifestError(
        'SHIP_BUILDER_RELEASE_TAG',
        `declares release "${declared}" while package.json#version is the placeholder ${PLACEHOLDER_VERSION}.`,
      );
    }
    if (PLACEHOLDER_TAGS.has(declared.toLowerCase())) {
      throw new HelpManifestError(
        'SHIP_BUILDER_RELEASE_TAG',
        `is the placeholder "${declared}" rather than a version tag.`,
      );
    }
    if (declared !== `v${applicationVersion}`) {
      throw new HelpManifestError(
        'SHIP_BUILDER_RELEASE_TAG',
        `is "${declared}" but package.json#version is "${applicationVersion}"; expected "v${applicationVersion}".`,
      );
    }
    return { kind: 'release', applicationVersion };
  }

  const runId = (env.GITHUB_RUN_ID ?? '').trim();
  const buildId = runId.length > 0 ? runId : resolveCommit();

  if (typeof buildId !== 'string' || !SAFE_BUILD_ID.test(buildId)) {
    throw new HelpManifestError(
      'build identity',
      `cannot publish "${buildId ?? ''}" as a build id: it must be a short alphanumeric marker ` +
        'with no whitespace, path, URL, branch, person, machine name or timestamp. ' +
        'Set GITHUB_RUN_ID, or build inside a git working tree.',
    );
  }

  return { kind: 'nonRelease', applicationVersion, buildId };
}

/**
 * The abbreviated commit this working tree is on, marked when it is dirty.
 *
 * A commit is the smallest thing that identifies a build without identifying a
 * person: it names no author, no branch, no machine and no clock.
 */
export function resolveCommitId(cwd = ROOT) {
  let commit;
  try {
    commit = execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
  if (commit.length === 0) {
    return null;
  }
  try {
    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return status.trim().length > 0 ? `${commit}-dirty` : commit;
  } catch {
    return commit;
  }
}

/** Confirms the installed package is the one this application reads. */
export function validateAlmanacIdentity(packageManifest) {
  const { name, version } = packageManifest ?? {};
  if (name !== ALMANAC_PACKAGE_NAME) {
    throw new HelpManifestError(
      'installed package.json',
      `is "${name ?? 'unnamed'}", not ${ALMANAC_PACKAGE_NAME}.`,
    );
  }
  if (typeof version !== 'string' || version.trim().length === 0) {
    throw new HelpManifestError('installed package.json', 'has no version.');
  }
  return { packageName: name, version };
}

/**
 * Validates the one URL the modal will offer.
 *
 * Parsed rather than pattern-matched, so a credential, a port or a query cannot
 * hide inside something that looks right. A query string in particular is how
 * application state would leak into an outbound navigation, and the rule is
 * that it never does (FR-003).
 */
export function validateLicenceDestination(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new HelpManifestError('licence destination', `"${url}" is not a URL.`);
  }
  if (parsed.protocol !== 'https:') {
    throw new HelpManifestError('licence destination', `"${url}" is not HTTPS.`);
  }
  if (parsed.username !== '' || parsed.password !== '') {
    throw new HelpManifestError('licence destination', `"${url}" carries credentials.`);
  }
  if (parsed.port !== '') {
    throw new HelpManifestError('licence destination', `"${url}" carries a port.`);
  }
  if (parsed.search !== '' || parsed.hash !== '') {
    throw new HelpManifestError('licence destination', `"${url}" carries a query or fragment.`);
  }
  if (parsed.host !== 'github.com') {
    throw new HelpManifestError('licence destination', `"${url}" is not on github.com.`);
  }
  if (parsed.pathname !== '/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE') {
    throw new HelpManifestError(
      'licence destination',
      `"${url}" is not this repository's LICENSE on main.`,
    );
  }
  return {
    id: 'repositoryLicense',
    url,
    purpose: 'completeLegalTerms',
    leavesApplication: true,
    mayRequireNetwork: true,
  };
}

/**
 * Proves the tracked mirrors are still the package's own bytes.
 *
 * Byte equality rather than "looks the same": a mirror that has been reflowed,
 * re-encoded or had a trailing newline tidied away is no longer the document
 * the package published, and a source distribution carrying it is carrying
 * something this project wrote.
 */
export async function verifySourceDistribution({ packageRoot, repoRoot, sync }) {
  const artifacts = [];

  for (const { id, fileName } of MIRRORED_ARTIFACTS) {
    const installedPath = join(packageRoot, fileName);
    const mirrorPath = join(repoRoot, MIRROR_DIRECTORY, fileName);
    const relativeMirror = `${MIRROR_DIRECTORY}/${fileName}`;

    const installed = await readUtf8(installedPath, `installed ${fileName}`);
    if (installed.trim().length === 0) {
      throw new HelpManifestError(`installed ${fileName}`, 'is empty.');
    }

    if (sync) {
      await mkdir(join(repoRoot, MIRROR_DIRECTORY), { recursive: true });
      await writeFile(mirrorPath, installed, 'utf8');
    }

    const mirrored = await readUtf8(mirrorPath, relativeMirror);
    if (mirrored !== installed) {
      throw new HelpManifestError(
        relativeMirror,
        `is not byte-identical to the installed package's ${fileName}. ` +
          'It is a mirror, not a document this project edits: run `pnpm run legal:sync` ' +
          'as part of the dependency change and review the result.',
      );
    }

    artifacts.push({
      id,
      mirrorPath: relativeMirror,
      byteLength: Buffer.byteLength(mirrored, 'utf8'),
      sha256: sha256(mirrored),
    });
  }

  const mirroredNames = new Set(MIRRORED_ARTIFACTS.map(({ fileName }) => fileName));
  const packageEntries = await readdir(packageRoot, { withFileTypes: true });
  for (const entry of packageEntries) {
    if (!entry.isFile() || mirroredNames.has(entry.name)) {
      continue;
    }
    if (LEGAL_FILE_PATTERNS.some((pattern) => pattern.test(entry.name))) {
      throw new HelpManifestError(
        `installed ${entry.name}`,
        'is a package legal document with no tracked mirror. An upgrade has added a term ' +
          'this repository has not agreed to redistribute; mirror it under legal/almanac/ ' +
          'and review it before continuing.',
      );
    }
  }

  return artifacts;
}

/**
 * Renders the manifest as a TypeScript module.
 *
 * `JSON.stringify` does the escaping, so re-encoding `exactText` reproduces the
 * bytes that were extracted — the property the emission test proves by hashing
 * the round trip rather than by trusting this comment.
 */
export function renderManifestModule(manifest) {
  const literal = (value) => JSON.stringify(value);
  const build =
    manifest.build.kind === 'release'
      ? `{ kind: 'release', applicationVersion: ${literal(manifest.build.applicationVersion)} }`
      : `{\n    kind: 'nonRelease',\n    applicationVersion: ${literal(
          manifest.build.applicationVersion,
        )},\n    buildId: ${literal(manifest.build.buildId)},\n  }`;

  const mirrors = manifest.sourceDistribution
    .map(
      (artifact) =>
        `    {\n      id: ${literal(artifact.id)},\n      mirrorPath: ${literal(
          artifact.mirrorPath,
        )},\n      byteLength: ${artifact.byteLength},\n      sha256: ${literal(artifact.sha256)},\n    },`,
    )
    .join('\n');

  return `// Generated by scripts/generate-help-manifest.mjs. Do not edit.
//
// Rebuilt ahead of every Angular, Playwright and typecheck command, and ignored
// by git: the repository tracks the sources it is made from, not the artifact.
import {
  assertHelpManifest,
  type HelpManifestV1,
} from '../../domain/distribution/help-manifest';

export const HELP_MANIFEST: HelpManifestV1 = assertHelpManifest({
  schemaVersion: 1,
  build: ${build},
  almanac: {
    packageName: ${literal(manifest.almanac.packageName)},
    version: ${literal(manifest.almanac.version)},
  },
  disclaimer: {
    documentId: 'frontierDisclaimer',
    source: 'LICENSE',
    language: 'en',
    exactText: ${literal(manifest.disclaimer.exactText)},
    byteLength: ${manifest.disclaimer.byteLength},
    sha256: ${literal(manifest.disclaimer.sha256)},
  },
  destinations: {
    repositoryLicense: {
      id: 'repositoryLicense',
      url: ${literal(manifest.destinations.repositoryLicense.url)},
      purpose: 'completeLegalTerms',
      leavesApplication: true,
      mayRequireNetwork: true,
    },
  },
  sourceDistribution: [
${mirrors}
  ],
});
`;
}

/** Where the emitted module goes. */
export const OUTPUT_PATH = 'src/app/platform/build/help-manifest.generated.ts';

/**
 * Runs the whole thing.
 *
 * Validation happens before anything is written, so a failure leaves the
 * previous artifact exactly as it was rather than half-replaced.
 */
export async function generateHelpManifest({
  repoRoot = ROOT,
  packageRoot,
  env = process.env,
  mode = 'emit',
  resolveCommit = () => resolveCommitId(repoRoot),
} = {}) {
  const applicationManifestPath = join(repoRoot, 'package.json');
  const applicationManifest = JSON.parse(await readUtf8(applicationManifestPath, 'package.json'));

  const resolvedPackageRoot =
    packageRoot ??
    fileURLToPath(new URL('../../', import.meta.resolve(`${ALMANAC_PACKAGE_NAME}/ships/ships`)));

  const almanacManifest = JSON.parse(
    await readUtf8(join(resolvedPackageRoot, 'package.json'), 'installed package.json'),
  );

  const licenseText = await readUtf8(join(repoRoot, 'LICENSE'), 'LICENSE');
  assertLicenceBoundary(licenseText);

  const manifest = {
    schemaVersion: 1,
    build: classifyBuildIdentity({
      applicationVersion: applicationManifest.version,
      env,
      resolveCommit,
    }),
    almanac: validateAlmanacIdentity(almanacManifest),
    disclaimer: extractFrontierDisclaimer(licenseText),
    destinations: {
      repositoryLicense: validateLicenceDestination(REPOSITORY_LICENSE_URL),
    },
    sourceDistribution: await verifySourceDistribution({
      packageRoot: resolvedPackageRoot,
      repoRoot,
      sync: mode === 'sync',
    }),
  };

  // Independent re-derivation: the numbers that travel with the text are
  // recomputed from the text itself, so an emitted payload whose bytes, count
  // or hash drifted from the source cannot reach the browser.
  const roundTrip = Buffer.byteLength(manifest.disclaimer.exactText, 'utf8');
  if (roundTrip !== manifest.disclaimer.byteLength) {
    throw new HelpManifestError('LICENSE', 'disclaimer byte count does not match its text.');
  }
  if (sha256(manifest.disclaimer.exactText) !== manifest.disclaimer.sha256) {
    throw new HelpManifestError('LICENSE', 'disclaimer digest does not match its text.');
  }

  const module = renderManifestModule(manifest);
  const outputPath = join(repoRoot, OUTPUT_PATH);

  // `--check` asks whether the sources this manifest is derived from are still
  // in a state that can produce one, and answers by getting all the way here
  // without throwing. It deliberately does not compare what it rendered against
  // whatever is on disk.
  //
  // Two reasons. The emitted module carries `buildId`, which is the abbreviated
  // commit and whether the tree is dirty — so the same sources render different
  // bytes after any commit, and a comparison would report the artifact stale for
  // a change nobody made. And the comparison could not catch staleness anyway:
  // the artifact is git-ignored and every command that reads it regenerates it
  // first, so on a fresh checkout there is nothing to compare against and on a
  // working tree there is nothing that could have gone stale.
  //
  // What the gate is worth is the validation above it: a `LICENSE` whose
  // disclaimer moved, a mirror that drifted by a byte, a package that is no
  // longer the one this application reads. Those fail here, before a build.
  if (mode === 'check') {
    return { manifest, module, written: false };
  }

  await mkdir(join(repoRoot, 'src/app/platform/build'), { recursive: true });
  await writeFile(outputPath, module, 'utf8');
  return { manifest, module, written: true };
}

const invokedDirectly =
  process.argv[1] !== undefined && relative(fileURLToPath(import.meta.url), process.argv[1]) === '';

if (invokedDirectly) {
  const mode = process.argv.includes('--check')
    ? 'check'
    : process.argv.includes('--sync')
      ? 'sync'
      : 'emit';
  try {
    const { manifest, written } = await generateHelpManifest({ mode });
    if (written) {
      process.stdout.write(
        `help manifest: ${manifest.build.kind} ${manifest.build.applicationVersion}, ` +
          `Almanac ${manifest.almanac.version}, disclaimer ${manifest.disclaimer.byteLength} bytes\n`,
      );
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
