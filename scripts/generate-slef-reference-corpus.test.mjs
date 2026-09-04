import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const generatorPath = fileURLToPath(
  new URL('./generate-slef-reference-corpus.mjs', import.meta.url),
);

async function generate(t) {
  const directory = await mkdtemp(join(tmpdir(), 'ednb-slef-corpus-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const result = spawnSync(process.execPath, [generatorPath], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, SLEF_CORPUS_OUTPUT_PATH: directory },
  });
  assert.equal(result.status, 0, result.stderr);

  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  return { directory, manifest, stdout: result.stdout };
}

test('writes one file per artifact, plus the manifest', async (t) => {
  const { directory, manifest } = await generate(t);

  const files = await readdir(directory);
  assert.equal(files.length, manifest.artifacts.length + 1);
  for (const artifact of manifest.artifacts) {
    assert.ok(files.includes(artifact.filename), `${artifact.filename} was not written`);
  }
});

test('names the exact bytes it produced, artifact by artifact and as a set', async (t) => {
  const { directory, manifest } = await generate(t);

  const digests = [];
  for (const artifact of manifest.artifacts) {
    const payload = (await readFile(join(directory, artifact.filename), 'utf8')).replace(/\n$/, '');
    const digest = createHash('sha256').update(payload).digest('hex');
    assert.equal(digest, artifact.sha256, `${artifact.id} does not match its stated hash`);
    assert.equal(Buffer.byteLength(payload, 'utf8'), artifact.utf8Bytes);
    digests.push(digest);
  }

  assert.equal(manifest.corpusHash, createHash('sha256').update(digests.join('\n')).digest('hex'));
});

test('produces the same corpus twice from the same installed package', async (t) => {
  const first = await generate(t);
  const second = await generate(t);

  // A corpus whose hash moved on its own could never evidence a consumer's
  // result: the record would name bytes nobody could reproduce.
  assert.equal(second.manifest.corpusHash, first.manifest.corpusHash);
});

test('every artifact is exactly one SLEF entry', async (t) => {
  const { directory, manifest } = await generate(t);
  const { inspectSlef } = await import('@elite-dangerous-almanac/core/ships/slef');

  for (const artifact of manifest.artifacts) {
    const payload = await readFile(join(directory, artifact.filename), 'utf8');
    const inspection = inspectSlef(payload);

    assert.equal(inspection.entries.length, 1, `${artifact.id} is not one entry`);
    assert.deepEqual(inspection.diagnostics, [], `${artifact.id} raised diagnostics`);
    assert.equal(inspection.entries[0].header.appName, manifest.producer.appName);
  }
});

test('carries no personal datum and names no other origin', async (t) => {
  const { directory, manifest } = await generate(t);

  const everything = [
    JSON.stringify(manifest),
    ...(await Promise.all(
      manifest.artifacts.map((artifact) => readFile(join(directory, artifact.filename), 'utf8')),
    )),
  ].join('\n');

  assert.doesNotMatch(everything, /@[a-z0-9-]+\.[a-z]{2,}/i, 'an address-shaped string is present');
  assert.doesNotMatch(everything, /https?:\/\//i, 'a URL is present');
  assert.doesNotMatch(everything, new RegExp(process.env.USER ?? 'no-such-user', 'i'));
});

test('covers the properties a consumer has to get right', async (t) => {
  const { manifest } = await generate(t);

  const ids = manifest.artifacts.map((artifact) => artifact.id);
  for (const expected of [
    'stock-small-hull',
    'stock-large-hull',
    'named-and-identified',
    'disabled-and-prioritised',
    'engineered-grade-five',
    'emptied-optional-mounts',
  ]) {
    assert.ok(ids.includes(expected), `${expected} is missing from the corpus`);
  }

  // The set spans a full hull and an emptied one, so a consumer's slot handling
  // is exercised in both directions.
  const counts = manifest.artifacts.map((artifact) => artifact.modules);
  assert.ok(Math.max(...counts) > Math.min(...counts));
});
