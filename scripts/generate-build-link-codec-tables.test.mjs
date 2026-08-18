import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CODEC_TABLE_CAPACITY,
  assertCapacityFitsEnvelope,
  assertCapacityWithinCodecLimits,
  assertTableFitsEnvelope,
  assertTableWithinCapacity,
  codecTableDimensions,
  envelopeBodyBytes,
  readCodecConstants,
  worstCaseBodyBits,
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

test('the committed table pins a symbol-model block the generator validates', async () => {
  const { MODELS: models } = JSON.parse(await readFile(committedTablePath, 'utf8'));

  assert.ok(models, 'the committed table must pin a MODELS block');
  // Shape mirrors the codec's own validation; the unit specs run the authoritative validator.
  assert.equal(models.GRADE_IS_MAX.length, 2);
  assert.equal(models.POWER_ON.length, 3);
  assert.equal(models.POWER_PRIORITY.length, 6);
  assert.equal(models.NAME_CHARACTERS.length, 64);
  assert.equal(models.IDENT_CHARACTERS.length, 64);
  assert.equal(models.CONTEXT_INDEX_DECAY.length, 2);
  assert.ok(Number.isSafeInteger(models.CONTEXT_ADAPTATION) && models.CONTEXT_ADAPTATION >= 0);
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

test('every budgeted limit stays inside the codec, and the envelope is measured exactly', () => {
  assert.doesNotThrow(() => assertCapacityWithinCodecLimits());
  // A 500-character codec value spends two on `b.`, leaving 498 digits: 381 payload, 377 of body.
  assert.equal(envelopeBodyBytes(500), 377);
  // Seven payload bytes fit in twelve characters, so three of body survive the checksum.
  assert.equal(envelopeBodyBytes(12), 3);
});

test('a table grown to the budgeted capacity still fits a link', async () => {
  const constants = await readCodecConstants();

  // The promise the capacity table makes, priced as though a table had already grown into it.
  const { bytes, limit } = assertCapacityFitsEnvelope(constants);

  assert.ok(bytes <= limit, `capacity prices at ${bytes} bytes against ${limit}`);
  // Slots are much the most expensive dimension, and the reason capacity cannot simply be raised:
  // the 64 first advertised here prices at 427 bytes, well beyond a link, at this label bound.
  const sixtyFourMounts = Math.ceil(
    worstCaseBodyBits({ ...CODEC_TABLE_CAPACITY, SLOTS_PER_SHIP: 64 }, constants.maxStringUnits) /
      8,
  );

  assert.equal(sixtyFourMounts, 427);
  assert.ok(sixtyFourMounts > limit);
});

test('the committed table cannot express a build too large to share', async () => {
  const table = JSON.parse(await readFile(committedTablePath, 'utf8'));
  const constants = await readCodecConstants();

  const { bytes, limit } = assertTableFitsEnvelope(table, constants);

  assert.equal(constants.maxLinkCharacters, 500);
  assert.equal(limit, 377);
  assert.ok(bytes <= limit, `worst case ${bytes} bytes exceeds the ${limit} a link carries`);
});

test('refuses a table whose worst case outgrows the link, metadata included', async () => {
  const table = JSON.parse(await readFile(committedTablePath, 'utf8'));
  const constants = await readCodecConstants();

  // The bound the codec carried before this budget existed: two labels alone outrun the envelope.
  assert.throws(
    () => assertTableFitsEnvelope(table, { ...constants, maxStringUnits: 2_048 }),
    /beyond the 377 a\n500-character codec value carries/,
  );
  // So does an ordinary table given hulls twice today's size at the current label bound.
  const doubled = {
    ...table,
    SLOTS_BY_SHIP: Object.fromEntries(
      Object.entries(table.SLOTS_BY_SHIP).map(([ship, slots]) => [
        ship,
        [...slots, ...slots.map((slot) => `${slot}_b`)],
      ]),
    ),
  };
  assert.throws(() => assertTableFitsEnvelope(doubled, constants), /too large to share|beyond the/);
});
