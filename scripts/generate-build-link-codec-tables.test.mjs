import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const generatorPath = fileURLToPath(
  new URL('./generate-build-link-codec-tables.mjs', import.meta.url),
);
const committedTablePath = fileURLToPath(
  new URL('../src/app/domain/build-link/codec-table-1.json', import.meta.url),
);

test('refuses to overwrite a table whose payload does not match its declared hash', async (t) => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'edsb-codec-table-'));
  t.after(() => rm(temporaryDirectory, { recursive: true, force: true }));

  const tamperedTablePath = join(temporaryDirectory, 'codec-table-1.json');
  const table = JSON.parse(await readFile(committedTablePath, 'utf8'));
  table.SHIPS = [...table.SHIPS, 'TamperedHull'];
  const tamperedContent = `${JSON.stringify(table, null, 2)}\n`;
  await writeFile(tamperedTablePath, tamperedContent);

  const result = spawnSync(process.execPath, [generatorPath], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, CODEC_TABLE_OUTPUT_PATH: tamperedTablePath },
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /content does not match its declared hash/);
  assert.equal(await readFile(tamperedTablePath, 'utf8'), tamperedContent);
});
