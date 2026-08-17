import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CODEC_TABLE_CAPACITY,
  assertTableWithinCapacity,
  codecTableDimensions,
} from './build-link-codec-capacity.mjs';

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

test('the committed table stays within the capacity its link budget is sized for', async () => {
  const table = JSON.parse(await readFile(committedTablePath, 'utf8'));

  assert.doesNotThrow(() => assertTableWithinCapacity(table));
  for (const [dimension, actual] of Object.entries(codecTableDimensions(table))) {
    assert.ok(
      actual <= CODEC_TABLE_CAPACITY[dimension],
      `${dimension} is ${actual}, beyond its budgeted ${CODEC_TABLE_CAPACITY[dimension]}`,
    );
  }
});

test('refuses a table whose growth outruns the link budget', async () => {
  const table = JSON.parse(await readFile(committedTablePath, 'utf8'));
  const filler = (count, value) => Array.from({ length: count }, (_entry, index) => value(index));
  const overgrown = {
    ...table,
    SHIPS: [...table.SHIPS, ...filler(CODEC_TABLE_CAPACITY.SHIPS, (index) => `Hull${index}`)],
    BLUEPRINTS: [
      ...table.BLUEPRINTS,
      ...filler(CODEC_TABLE_CAPACITY.BLUEPRINTS, (index) => `Blueprint${index}`),
    ],
  };

  assert.throws(
    () => assertTableWithinCapacity(overgrown),
    (error) =>
      /SHIPS: \d+, budgeted for 128/.test(error.message) &&
      /BLUEPRINTS: \d+, budgeted for 256/.test(error.message) &&
      /MAX_STRING_UNITS/.test(error.message),
  );
});
