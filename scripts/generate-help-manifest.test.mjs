import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, describe, it } from 'node:test';
import {
  ALMANAC_LICENSE_URL,
  ALMANAC_PACKAGE_NAME,
  OUTPUT_PATH,
  REPOSITORY_LICENSE_URL,
  classifyBuildIdentity,
  extractFrontierDisclaimer,
  generateHelpManifest,
  validateAlmanacIdentity,
  validateLicenceDestination,
} from './generate-help-manifest.mjs';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const PACKAGE_ROOT = join(REPO, 'node_modules', ALMANAC_PACKAGE_NAME);

/** A commit id the fixtures can rely on, so no test depends on the real tree. */
const FIXED_COMMIT = 'abc1234';

const temporaryRoots = [];

/**
 * A throwaway repository: the real `LICENSE` and legal mirrors, a version we
 * control, and no git history. Every fixture mutates its own copy, so a test
 * that corrupts a licence cannot reach the repository it is running in.
 */
async function fixtureRepo({ version = '1.4.0', license } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'help-manifest-'));
  temporaryRoots.push(root);

  await writeFile(
    join(root, 'package.json'),
    `${JSON.stringify({ name: 'elite-dangerous-ship-builder', version }, null, 2)}\n`,
    'utf8',
  );
  await writeFile(
    join(root, 'LICENSE'),
    license ?? (await readFile(join(REPO, 'LICENSE'), 'utf8')),
    'utf8',
  );
  await mkdir(join(root, 'legal/almanac'), { recursive: true });
  await cp(join(PACKAGE_ROOT, 'LICENSE'), join(root, 'legal/almanac/LICENSE'));
  await cp(
    join(PACKAGE_ROOT, 'THIRD_PARTY_NOTICES.md'),
    join(root, 'legal/almanac/THIRD_PARTY_NOTICES.md'),
  );

  return root;
}

/** Runs the generator against a fixture with a controlled environment. */
const run = (repoRoot, { env = {}, mode = 'emit', commit = FIXED_COMMIT } = {}) =>
  generateHelpManifest({
    repoRoot,
    packageRoot: PACKAGE_ROOT,
    env,
    mode,
    resolveCommit: () => commit,
  });

/** The section heading and marker the extraction is anchored to. */
const FRONTIER_SECTION = 'Elite Dangerous game data and imagery (Frontier media-usage notice)';
const DISCLAIMER_MARKER = 'Under those rules:';

/**
 * Asserts a run fails by name and leaves nothing behind.
 *
 * Both halves matter. A generator that names the offending artifact but has
 * already written half a manifest hands the build a file that passes `--check`
 * on the next run, and the failure disappears into a cache.
 */
async function refuses(repoRoot, pattern, { mode = 'emit' } = {}) {
  await assert.rejects(run(repoRoot, { mode }), pattern);
  assert.equal(
    existsSync(join(repoRoot, OUTPUT_PATH)),
    false,
    'a refused generation must emit nothing',
  );
}

after(async () => {
  await Promise.all(temporaryRoots.map((root) => rm(root, { recursive: true, force: true })));
});

describe('the help manifest generator', () => {
  let root;

  before(async () => {
    root = await fixtureRepo();
  });

  it('emits a complete manifest from the repository’s own artifacts', async () => {
    const { manifest, written } = await run(root);

    assert.equal(written, true);
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.build.applicationVersion, '1.4.0');
    assert.equal(manifest.almanac.packageName, ALMANAC_PACKAGE_NAME);
    assert.match(manifest.almanac.version, /^\d+\.\d+\.\d+/);
    assert.equal(manifest.destinations.repositoryLicense.url, REPOSITORY_LICENSE_URL);
    assert.equal(manifest.sourceDistribution.length, 2);
    assert.ok(existsSync(join(root, OUTPUT_PATH)));
  });

  it('writes the same bytes on every run, so a rebuild is not a diff', async () => {
    const first = await run(root);
    const second = await run(root);
    assert.equal(first.module, second.module);
  });

  it('passes its own --check against what it just wrote', async () => {
    await run(root);
    const { written } = await run(root, { mode: 'check' });
    assert.equal(written, false);
  });

  it('fails --check on a source defect, before anything is built', async () => {
    // What the gate is for, and the only reason it is worth a step of its own
    // in `pnpm run check`. `--check` emits nothing, so the way it earns that
    // step is by refusing here — a mirror that drifted by a byte, a disclaimer
    // that moved, a package that is no longer the one this application reads —
    // rather than letting a build discover it.
    const drifted = await fixtureRepo();
    const mirror = join(drifted, 'legal/almanac/LICENSE');
    await writeFile(mirror, `${await readFile(mirror, 'utf8')} `, 'utf8');

    await refuses(drifted, /is not byte-identical to the installed package/, { mode: 'check' });
  });

  it('passes --check against a module that was emitted at another commit', async () => {
    // The gate asks whether the sources can still produce a manifest, and
    // nothing else. It once compared its render against the file on disk, and
    // that comparison could only ever be wrong: `buildId` is the abbreviated
    // commit and whether the tree is dirty, so the same sources render
    // different bytes after any commit, and the check pipeline failed for a
    // change nobody had made until something regenerated.
    await run(root, { commit: 'aaaaaaa' });
    const { written } = await run(root, { mode: 'check', commit: 'bbbbbbb' });

    assert.equal(written, false);
  });

  it('passes --check in a clean tree that has not generated yet', async () => {
    const fresh = await fixtureRepo();
    const { written } = await run(fresh, { mode: 'check' });
    assert.equal(written, false);
    assert.equal(existsSync(join(fresh, OUTPUT_PATH)), false);
  });

  describe('the disclaimer that reaches the browser', () => {
    it('is byte-identical to a fresh independent extraction of root LICENSE', async () => {
      const { manifest } = await run(root);
      const fresh = extractFrontierDisclaimer(await readFile(join(root, 'LICENSE'), 'utf8'));

      assert.equal(manifest.disclaimer.exactText, fresh.exactText);
      assert.equal(manifest.disclaimer.byteLength, fresh.byteLength);
      assert.equal(manifest.disclaimer.sha256, fresh.sha256);
    });

    it('reports the byte count and digest of its own text, recomputed here', async () => {
      const { manifest } = await run(root);
      const text = manifest.disclaimer.exactText;

      assert.equal(manifest.disclaimer.byteLength, Buffer.byteLength(text, 'utf8'));
      assert.equal(
        manifest.disclaimer.sha256,
        createHash('sha256').update(text, 'utf8').digest('hex'),
      );
    });

    it('survives the trip through the emitted TypeScript unchanged', async () => {
      const { manifest, module } = await run(root);
      const literal = module.match(/exactText: (".*?"),\n/s);
      assert.ok(literal, 'the emitted module carries an exactText literal');

      assert.equal(JSON.parse(literal[1]), manifest.disclaimer.exactText);
    });

    it('keeps Frontier’s own wording, without the Markdown indent', async () => {
      const { manifest } = await run(root);
      const text = manifest.disclaimer.exactText;

      assert.ok(text.startsWith('Elite Dangerous Ship Builder was created using assets'));
      assert.ok(text.endsWith('was involved in the making of it.'));
      assert.equal(text.includes('\n    '), false);
      assert.equal(text.startsWith(' '), false);
    });
  });

  describe('a LICENSE that no longer says what it said', () => {
    /** The real document, so each fixture edits one thing and keeps the rest. */
    const licence = () => readFile(join(REPO, 'LICENSE'), 'utf8');

    it('refuses a LICENSE with no Frontier section', async () => {
      const text = (await licence()).replace(FRONTIER_SECTION, 'Some other heading entirely');
      await refuses(await fixtureRepo({ license: text }), /has no "Elite Dangerous game data/);
    });

    it('refuses a LICENSE carrying the Frontier section twice', async () => {
      const text = `${await licence()}\n\n${FRONTIER_SECTION}\n${'-'.repeat(FRONTIER_SECTION.length)}\n`;
      await refuses(
        await fixtureRepo({ license: text }),
        /has 2 .* sections; exactly one is required/,
      );
    });

    it('refuses a LICENSE with no marker above the block', async () => {
      const text = (await licence()).replace(DISCLAIMER_MARKER, 'Under those terms:');
      await refuses(await fixtureRepo({ license: text }), /has no "Under those rules:" marker/);
    });

    it('refuses a LICENSE carrying the marker twice', async () => {
      const text = (await licence()).replace(
        `${DISCLAIMER_MARKER}\n`,
        `${DISCLAIMER_MARKER}\n\n${DISCLAIMER_MARKER}\n`,
      );
      await refuses(
        await fixtureRepo({ license: text }),
        /has 2 .* markers; exactly one is required/,
      );
    });

    it('refuses a marker that sits outside the section it belongs to', async () => {
      const text = `${DISCLAIMER_MARKER}\n\n${(await licence()).replace(`${DISCLAIMER_MARKER}\n`, '')}`;
      await refuses(await fixtureRepo({ license: text }), /places .* outside the .* section/);
    });

    it('refuses a block that is not indented as a block', async () => {
      const text = (await licence()).replace(
        /Under those rules:\n\n {4}/,
        `${DISCLAIMER_MARKER}\n\n`,
      );
      await refuses(await fixtureRepo({ license: text }), /has no four-space indented block/);
    });

    it('refuses a block indented deeper than a block, which would publish the indent', async () => {
      const text = (await licence()).replace(/^ {4}(?=[^ ])/gm, '        ');
      await refuses(await fixtureRepo({ license: text }), /has no four-space indented block/);
    });

    it('refuses a marker with nothing under it at all', async () => {
      // The marker moved to the end of the document, so it is still inside the
      // section that opened above it and still the only one — and there is
      // nothing at all beneath it to extract.
      const text = `${(await licence()).replace(`${DISCLAIMER_MARKER}\n`, 'As follows:\n')}\n${DISCLAIMER_MARKER}\n\n\n`;
      await refuses(await fixtureRepo({ license: text }), /has an empty block after/);
    });

    it('refuses a LICENSE that is not valid UTF-8', async () => {
      const root = await fixtureRepo();
      await writeFile(join(root, 'LICENSE'), Buffer.from([0xff, 0xfe, 0x41, 0x42]));
      await refuses(root, /LICENSE: is not valid UTF-8/);
    });

    it('stops at the blank line, so no later section can join the excerpt', async () => {
      const { exactText } = extractFrontierDisclaimer(await licence());

      assert.equal(exactText.includes('\n\n'), false);
      assert.equal(exactText.includes('Third-party data and its terms'), false);
      assert.equal(exactText.includes('This is the same notice'), false);
    });

    it('replaces an emitted payload whose disclaimer no longer matches the source', async () => {
      // Nothing here can be stale for longer than one run. The artifact is
      // git-ignored and every command that reads it regenerates it first, so a
      // module whose disclaimer has drifted — edited by hand, or left behind by
      // a `LICENSE` that moved under it — is overwritten rather than trusted.
      const root = await fixtureRepo();
      await run(root);
      const path = join(root, OUTPUT_PATH);
      const drifted = (await readFile(path, 'utf8')).replace(
        'Frontier Developments plc',
        'Frontier Developments PLC',
      );
      await writeFile(path, drifted, 'utf8');

      const { module } = await run(root);

      assert.equal(await readFile(path, 'utf8'), module);
      assert.equal(module.includes('Frontier Developments PLC'), false);
    });
  });

  describe('the boundary between what this project grants and what it does not', () => {
    it('refuses a mirror that has drifted by a single byte', async () => {
      const root = await fixtureRepo();
      const path = join(root, 'legal/almanac/LICENSE');
      await writeFile(path, `${await readFile(path, 'utf8')} `, 'utf8');

      await refuses(root, /is not byte-identical to the installed package/);
    });

    it('refuses a mirror that is not there to compare', async () => {
      const root = await fixtureRepo();
      await rm(join(root, 'legal/almanac/THIRD_PARTY_NOTICES.md'));

      await refuses(root, /THIRD_PARTY_NOTICES\.md: cannot be read/);
    });

    it('refuses a LICENSE that no longer separates the MIT grant from what it cannot grant', async () => {
      const text = (await readFile(join(REPO, 'LICENSE'), 'utf8')).replace(
        'not cover, and does not relicense, the Elite Dangerous game data and imagery',
        'cover everything',
      );

      await refuses(
        await fixtureRepo({ license: text }),
        /no longer distinguishes the MIT grant from package artwork and game data/,
      );
    });

    // Every one of these is a way application state, a fork or a redirect could
    // ride out of the modal on the one navigation it offers.
    const REJECTED_DESTINATIONS = [
      [
        'is not HTTPS',
        'http://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE',
      ],
      [
        'carries credentials',
        'https://someone:secret@github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE',
      ],
      [
        'carries a port',
        'https://github.com:8443/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE',
      ],
      ['carries a query or fragment', `${REPOSITORY_LICENSE_URL}?utm_source=help`],
      ['carries a query or fragment', `${REPOSITORY_LICENSE_URL}#L1`],
      [
        'is not on github.com',
        'https://github.example.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE',
      ],
      [
        "is not this repository's LICENSE on main",
        'https://github.com/someone-else/Elite-Dangerous-Ship-Builder/blob/main/LICENSE',
      ],
      [
        "is not this repository's LICENSE on main",
        'https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/next/LICENSE',
      ],
      [
        "is not this repository's LICENSE on main",
        'https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/README.md',
      ],
    ];

    /** The same shape rules, asserted against the Almanac's own audited path. */
    const REJECTED_ALMANAC_DESTINATIONS = [
      ['is not HTTPS', ALMANAC_LICENSE_URL.replace('https:', 'http:')],
      ['carries a query or fragment', `${ALMANAC_LICENSE_URL}?utm_source=help`],
      [
        "is not the Almanac repository's LICENSE on main",
        'https://github.com/someone-else/Elite-Dangerous-Almanac/blob/main/LICENSE',
      ],
      [
        "is not the Almanac repository's LICENSE on main",
        'https://github.com/DarkSession/Elite-Dangerous-Almanac/blob/main/README.md',
      ],
    ];

    for (const [reason, url] of REJECTED_ALMANAC_DESTINATIONS) {
      it(`refuses an Almanac destination that ${reason}: ${url}`, () => {
        assert.throws(
          () => validateLicenceDestination(url, 'almanacLicense'),
          (error) => error instanceof Error && error.message.includes(reason),
        );
      });
    }

    for (const [reason, url] of REJECTED_DESTINATIONS) {
      it(`refuses a destination that ${reason}: ${url}`, () => {
        // The reason is prose, so it is matched as prose. Compiled as a
        // pattern it would read `github.com`'s dot as "any character", which
        // is a test that passes on a message it was never meant to accept —
        // and a reason that ever gained a bracket or a plus would fail to
        // compile at all.
        assert.throws(
          () => validateLicenceDestination(url),
          (error) => error instanceof Error && error.message.includes(reason),
        );
      });
    }

    it('emits exactly the two audited destinations, and nothing else', async () => {
      const { manifest, module } = await run(await fixtureRepo());

      assert.deepEqual(Object.keys(manifest.destinations), ['repositoryLicense', 'almanacLicense']);
      assert.equal(manifest.destinations.repositoryLicense.url, REPOSITORY_LICENSE_URL);
      assert.equal(manifest.destinations.almanacLicense.url, ALMANAC_LICENSE_URL);

      for (const id of ['repositoryLicense', 'almanacLicense']) {
        assert.equal(manifest.destinations[id].id, id);
        assert.equal(manifest.destinations[id].purpose, 'completeLegalTerms');
        assert.equal(manifest.destinations[id].leavesApplication, true);
        assert.equal(manifest.destinations[id].mayRequireNetwork, true);
      }

      // Two, and only two. Both are complete legal terms; a third purpose in
      // the emitted module would be a destination that reached the browser
      // without being audited for one.
      assert.equal(module.split('completeLegalTerms').length - 1, 2);
    });

    it('refuses to audit a destination it does not know', () => {
      // The path an id is checked against is looked up, never passed in: a
      // caller that could name its own path could audit a URL against itself.
      assert.throws(
        () => validateLicenceDestination(REPOSITORY_LICENSE_URL, 'somewhereElse'),
        (error) => error instanceof Error && error.message.includes('not an audited destination'),
      );
    });

    it('refuses each audited URL under the other one’s id', () => {
      // The two are not interchangeable. Pointing the library's line at this
      // repository's terms, or the reverse, is a wrong claim about which
      // document covers which code, and it fails the build rather than
      // shipping.
      assert.throws(
        () => validateLicenceDestination(ALMANAC_LICENSE_URL, 'repositoryLicense'),
        (error) => error instanceof Error && error.message.includes("this repository's LICENSE"),
      );
      assert.throws(
        () => validateLicenceDestination(REPOSITORY_LICENSE_URL, 'almanacLicense'),
        (error) => error instanceof Error && error.message.includes("Almanac repository's LICENSE"),
      );
    });
  });

  describe('which artifact a Commander is looking at', () => {
    /** The declaration, and nothing else, decides. */
    const classify = (env, { version = '1.4.0', commit = FIXED_COMMIT } = {}) =>
      classifyBuildIdentity({
        applicationVersion: version,
        env,
        resolveCommit: () => commit,
      });

    it('is a non-release build when nothing declares a release', () => {
      for (const env of [
        {},
        { SHIP_BUILDER_RELEASE_TAG: '' },
        { SHIP_BUILDER_RELEASE_TAG: '  ' },
      ]) {
        assert.deepEqual(classify(env), {
          kind: 'nonRelease',
          applicationVersion: '1.4.0',
          buildId: FIXED_COMMIT,
        });
      }
    });

    it('is a release only when the tag is this version’s own', () => {
      assert.deepEqual(classify({ SHIP_BUILDER_RELEASE_TAG: 'v1.4.0' }), {
        kind: 'release',
        applicationVersion: '1.4.0',
      });
    });

    it('prefers the workflow’s run number over the commit as a build id', () => {
      assert.deepEqual(classify({ GITHUB_RUN_ID: '4821' }), {
        kind: 'nonRelease',
        applicationVersion: '1.4.0',
        buildId: '4821',
      });
    });

    // A declared release that does not add up is a broken build, never a
    // development one: the third outcome would ship a release labelled as
    // something else and nobody would look.
    const REFUSED_TAGS = [
      ['is not this version', 'v1.5.0'],
      ['is the placeholder version', 'v0.0.0'],
      ['is a moving name', 'latest'],
      ['is a git symbol', 'HEAD'],
      ['is a missing value that got stringified', 'undefined'],
      ['is another missing value', 'null'],
      ['is a channel rather than a version', 'nightly'],
      ['is missing its v', '1.4.0'],
    ];

    for (const [reason, tag] of REFUSED_TAGS) {
      it(`refuses a release tag that ${reason}: ${tag}`, () => {
        assert.throws(
          () => classify({ SHIP_BUILDER_RELEASE_TAG: tag }),
          /SHIP_BUILDER_RELEASE_TAG/,
        );
      });
    }

    it('refuses a declared release over the placeholder version', () => {
      assert.throws(
        () => classify({ SHIP_BUILDER_RELEASE_TAG: 'v0.0.1' }, { version: '0.0.0' }),
        /placeholder 0\.0\.0/,
      );
    });

    it('does not read production optimisation as evidence of a release', () => {
      // A production build is what the deploy workflow makes of every commit on
      // main. It says nothing about whether anyone released it.
      for (const env of [
        { NODE_ENV: 'production' },
        { CI: 'true' },
        { GITHUB_REF: 'refs/tags/v1.4.0' },
      ]) {
        assert.equal(classify(env).kind, 'nonRelease');
      }
    });

    // Everything a build id must never be. The pattern is the whole rule: one
    // alphanumeric marker, no whitespace, no path, no URL, no clock.
    const REFUSED_BUILD_IDS = [
      ['carries whitespace', 'run 4821'],
      ['is a URL', 'https://ci.example.test/runs/4821'],
      ['is a branch ref', 'refs/heads/feature/help'],
      ['is a timestamp', '2026-08-25T09:00:00Z'],
      ['is empty', ''],
      ['starts with punctuation', '-4821'],
    ];

    for (const [reason, id] of REFUSED_BUILD_IDS) {
      it(`refuses a build id that ${reason}: ${JSON.stringify(id)}`, () => {
        assert.throws(() => classify({ GITHUB_RUN_ID: id }, { commit: id }), /build identity/);
      });
    }

    it('refuses a build with no version at all', () => {
      for (const version of ['', '   ']) {
        assert.throws(() => classify({}, { version }), /package\.json: has no version/);
      }
      assert.throws(
        () =>
          classifyBuildIdentity({
            applicationVersion: undefined,
            env: {},
            resolveCommit: () => FIXED_COMMIT,
          }),
        /package\.json: has no version/,
      );
    });

    it('refuses an installed package that is not the Almanac this application reads', () => {
      assert.throws(
        () => validateAlmanacIdentity({ name: 'some-other-package', version: '1.0.0' }),
        /not @elite-dangerous-almanac\/core/,
      );
      assert.throws(() => validateAlmanacIdentity({}), /unnamed/);
    });

    it('refuses an installed package with no version', () => {
      for (const version of ['', '  ', undefined]) {
        assert.throws(
          () => validateAlmanacIdentity({ name: ALMANAC_PACKAGE_NAME, version }),
          /installed package\.json: has no version/,
        );
      }
    });

    it('emits the two versions as separate facts, each from its own manifest', async () => {
      const root = await fixtureRepo({ version: '2.7.1' });
      const { manifest } = await run(root);
      const installed = JSON.parse(await readFile(join(PACKAGE_ROOT, 'package.json'), 'utf8'));

      assert.equal(manifest.build.applicationVersion, '2.7.1');
      assert.equal(manifest.almanac.version, installed.version);
      assert.equal(manifest.almanac.packageName, ALMANAC_PACKAGE_NAME);
    });

    it('always publishes a build id for a non-release emission', async () => {
      const { manifest } = await run(await fixtureRepo());

      assert.equal(manifest.build.kind, 'nonRelease');
      assert.match(manifest.build.buildId, /^[A-Za-z0-9][A-Za-z0-9._-]*$/);
    });
  });

  describe('what the emitted module is allowed to contain', () => {
    /**
     * The module a browser downloads, emitted from a fixture whose environment
     * is deliberately full of things that must not survive into it.
     */
    async function emitted() {
      const root = await fixtureRepo({ version: '3.1.4' });
      const { module } = await run(root, {
        env: {
          GITHUB_RUN_ID: '9876543',
          // None of these are read by the classification, and that is exactly
          // why they are set: a generator that widened its inputs later would
          // start leaking one of them into a public artifact.
          USER: 'commander',
          USERNAME: 'commander',
          HOME: '/home/commander',
          HOSTNAME: 'workstation-7',
          GITHUB_ACTOR: 'commander',
          GITHUB_REF_NAME: 'feature/some-branch',
          CI_COMMIT_AUTHOR: 'A Person <person@example.test>',
        },
      });
      return { module, root };
    }

    it('carries no absolute path from the machine that built it', async () => {
      const { module, root } = await emitted();

      assert.equal(module.includes(root), false);
      assert.equal(module.includes(REPO), false);
      assert.equal(/(^|[^.\w])\/(home|Users|root|tmp|var)\//.test(module), false);
    });

    it('carries no person, account, machine or branch', async () => {
      const { module } = await emitted();

      for (const leak of [
        'commander',
        'workstation-7',
        'feature/some-branch',
        'person@example.test',
      ]) {
        assert.equal(module.toLowerCase().includes(leak.toLowerCase()), false, leak);
      }
      // Nothing shaped like an address, either, however it got there.
      assert.equal(/[\w.+-]+@[\w-]+\.[\w.-]+/.test(module), false);
    });

    it('carries no timestamp and nothing that changes between identical runs', async () => {
      const root = await fixtureRepo({ version: '3.1.4' });
      const first = await run(root, { env: { GITHUB_RUN_ID: '9876543' } });
      const second = await run(root, { env: { GITHUB_RUN_ID: '9876543' } });

      assert.equal(first.module, second.module);
      // An ISO date, a bare year, or an epoch in seconds or milliseconds.
      assert.equal(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(first.module), false);
      assert.equal(/\b(19|20)\d{2}\b/.test(first.module.replace(/"[^"]*"/g, '""')), false);
      assert.equal(/\b1[0-9]{9,12}\b/.test(first.module), false);
    });

    it('carries no build payload, hull, module or stored value', async () => {
      const { module } = await emitted();

      // The manifest describes the artifact, never anything a Commander made
      // with it. There is no field it could arrive in, and this is the test
      // that fails if one is added.
      for (const foreign of ['slef', 'loadout', 'hull', 'slot', 'blueprint', 'localStorage']) {
        assert.equal(module.toLowerCase().includes(foreign), false, foreign);
      }
    });

    it('carries exactly one legal body, and it is the disclaimer', async () => {
      const root = await fixtureRepo({ version: '3.1.4' });
      const { module, manifest } = await run(root);

      // The MIT grant and the package's own notices are mirrored, hashed and
      // pointed at. Their bodies are a redistribution obligation, not something
      // to ship to a reader (FR-004).
      assert.equal(module.includes('Permission is hereby granted'), false);
      assert.equal(module.includes('THIRD_PARTY_NOTICES.md'), true);
      const notices = await readFile(join(PACKAGE_ROOT, 'THIRD_PARTY_NOTICES.md'), 'utf8');
      assert.equal(module.includes(notices.trim().split('\n')[0]), false);

      const occurrences = module.split(JSON.stringify(manifest.disclaimer.exactText)).length - 1;
      assert.equal(occurrences, 1);
    });
  });
});
