import { readFile } from 'node:fs/promises';

/** The widest bounded symbol the packed writer accepts, and so the codec's structural ceiling. */
export const CODEC_SYMBOL_BITS = 31;

/**
 * The growth each codec-table dimension is budgeted for.
 *
 * No dimension is capped by the codec itself: every width is derived from the table it is
 * generated with, and the binary layout keeps working until a bounded symbol would need more
 * than 31 bits — around 2^31 entries everywhere. What a larger table does change is the size
 * of every link, and links are bounded by the 500-character envelope. These limits are the
 * table sizes the string budget in `docs/build-link-codec.md` is sized against, so exceeding
 * one is a deliberate re-budgeting decision rather than a routine regeneration: raise the
 * limit, re-check the budget, and mint the next table version.
 */
export const CODEC_TABLE_CAPACITY = Object.freeze({
  /** Hull index and the combined representation tag, `ceil(log2(h + 1))` bits: eight at 128. */
  SHIPS: 128,
  /** Global module index, used only where a module is absent from its slot's candidates. */
  MODULES: 2_048,
  /** Global blueprint index, used only where a blueprint is absent from its module's set. */
  BLUEPRINTS: 256,
  /** Global experimental-effect index, on the same fallback path as blueprints. */
  EXPERIMENTAL_EFFECTS: 256,
  /** Outfittable mounts on one hull; every index set over a loadout is this wide. */
  SLOTS_PER_SHIP: 64,
  /** Largest per-slot module candidate list: one contextual index per fitted module. */
  MODULE_CANDIDATE_SET: 1_024,
  /** Largest per-module blueprint candidate list: one index per engineered module. */
  BLUEPRINT_CANDIDATE_SET: 32,
  /** Largest per-module experimental candidate list: one index per engineered module. */
  EXPERIMENTAL_CANDIDATE_SET: 32,
  /** Largest per-module pre-engineered variant list. */
  PRE_ENGINEERED_CANDIDATE_SET: 16,
});

const maximumLength = (values) => values.reduce((largest, value) => Math.max(largest, value), 0);

/** Every dimension of a generated table, measured the way the link budget counts them. */
export function codecTableDimensions(table) {
  return {
    SHIPS: table.SHIPS.length,
    MODULES: table.MODULES.length,
    BLUEPRINTS: table.BLUEPRINTS.length,
    EXPERIMENTAL_EFFECTS: table.EXPERIMENTAL_EFFECTS.length,
    SLOTS_PER_SHIP: maximumLength(Object.values(table.SLOTS_BY_SHIP).map((slots) => slots.length)),
    MODULE_CANDIDATE_SET: maximumLength(table.MODULE_SETS.map((set) => set.length)),
    BLUEPRINT_CANDIDATE_SET: maximumLength(table.BLUEPRINT_SETS.map((set) => set.length)),
    EXPERIMENTAL_CANDIDATE_SET: maximumLength(table.EXPERIMENTAL_SETS.map((set) => set.length)),
    PRE_ENGINEERED_CANDIDATE_SET: maximumLength(
      table.PRE_ENGINEERED_SET_BY_MODULE.map((set) => set.length),
    ),
  };
}

/** Refuse a table whose growth invalidates the link-size and string budget. */
export function assertTableWithinCapacity(table) {
  const dimensions = codecTableDimensions(table);
  const exceeded = Object.entries(dimensions).filter(
    ([dimension, actual]) => actual > CODEC_TABLE_CAPACITY[dimension],
  );
  if (exceeded.length === 0) return dimensions;
  throw new Error(
    `Codec table growth exceeds the capacity its link budget is sized for:\n${exceeded
      .map(
        ([dimension, actual]) =>
          `  ${dimension}: ${actual}, budgeted for ${CODEC_TABLE_CAPACITY[dimension]}`,
      )
      .join(
        '\n',
      )}\nWidths derive from the table, so this is a link-size decision, not a codec failure:\n` +
      `re-check the budget in docs/build-link-codec.md — including MAX_STRING_UNITS — raise the\n` +
      `limit deliberately, and mint the next table version.`,
  );
}

/** Every budgeted limit must still be a table the binary layout can address at all. */
export function assertCapacityWithinCodecLimits() {
  const ceiling = 2 ** CODEC_SYMBOL_BITS;
  // A hull count also feeds the `ceil(log2(h + 1))` representation tag, and an index set writes
  // its selected count against `slots + 1`, so both stop one entry short of the symbol ceiling.
  const ceilingFor = (dimension) =>
    dimension === 'SHIPS' || dimension === 'SLOTS_PER_SHIP' ? ceiling - 1 : ceiling;
  const exceeded = Object.entries(CODEC_TABLE_CAPACITY).filter(
    ([dimension, budgeted]) => budgeted > ceilingFor(dimension),
  );
  if (exceeded.length > 0) {
    throw new Error(
      `Budgeted capacity exceeds what a ${CODEC_SYMBOL_BITS}-bit bounded symbol can address:\n` +
        exceeded.map(([dimension, budgeted]) => `  ${dimension}: ${budgeted}`).join('\n'),
    );
  }
}

const bitsRequired = (valueCount) => {
  let width = 1;
  let capacity = 2;
  while (capacity < valueCount) {
    width += 1;
    capacity *= 2;
  }
  return width;
};
const contextualIndexBits = (valueCount) => (valueCount <= 1 ? 0 : bitsRequired(valueCount));
const varUintBits = (value) => 8 * Math.max(1, Math.ceil(bitsRequired(value + 1) / 7));

/**
 * An upper bound, in bits, on the largest body this table can produce.
 *
 * Two properties of the writer make a bound this simple sound. Every adaptive structure is
 * written in whichever mode costs least, so pricing one arbitrary mode — here the bitmap index
 * set, the sparse power form, and literal identities — can only over-count. And the canonical
 * body is the shorter of the packed and arithmetic renderings, so the packed cost bounds both.
 * The build priced is the worst one the table admits: every mount filled and engineered, every
 * identity reached through its widest index, both labels at their unit bound in UTF-8.
 */
export function worstCaseBodyBits(table, maxStringUnits) {
  const dimensions = codecTableDimensions(table);
  const slots = dimensions.SLOTS_PER_SHIP;
  const fixed = Math.max(
    ...Object.values(table.FIXED_MODULES_BY_SHIP).map((modules) => modules.length),
  );
  const grades = Math.max(...table.BLUEPRINT_GRADES.map((blueprint) => blueprint.length));

  // Default-match bit, contextual-membership bit, then the wider of the contextual and global index.
  const identity =
    2 +
    Math.max(
      contextualIndexBits(dimensions.MODULE_CANDIDATE_SET),
      bitsRequired(dimensions.MODULES),
    );
  const experimental =
    2 +
    Math.max(
      contextualIndexBits(dimensions.EXPERIMENTAL_CANDIDATE_SET),
      bitsRequired(dimensions.EXPERIMENTAL_EFFECTS),
    );
  const ordinary =
    1 +
    Math.max(
      contextualIndexBits(dimensions.BLUEPRINT_CANDIDATE_SET),
      bitsRequired(dimensions.BLUEPRINTS),
    ) +
    1 +
    (grades > 2 ? bitsRequired(grades - 1) : 0) +
    experimental;
  const preEngineered =
    contextualIndexBits(dimensions.PRE_ENGINEERED_CANDIDATE_SET) + 1 + experimental;
  const engineering = 1 + Math.max(ordinary, preEngineered);
  const label = varUintBits(2 * maxStringUnits) + 8 * maxStringUnits;

  return (
    10 + // table version
    bitsRequired(dimensions.SHIPS + 1) + // representation tag
    2 + // label presence
    2 * label +
    1 + // pristine marker
    1 +
    (2 + slots) +
    1 +
    slots * identity + // layout mode, occupancy bitmap, reference mode, identities
    1 +
    2 +
    (2 + slots + fixed) +
    (slots + fixed) * 5 + // power: marker, mode, sparse set, values
    1 +
    1 +
    (2 + slots) +
    1 +
    slots * engineering + // engineering: presence, subset, reference mode, records
    7 // final byte padding
  );
}

/** Bytes of body a fully used encoded envelope holds, after its four-byte CRC-32. */
export function envelopeBodyBytes(maxEncodedLength) {
  // The terminal digit is Base62 and every other digit Base70; leading zero bytes are literal.
  const capacity = 62n * 70n ** BigInt(maxEncodedLength - 1);
  let bytes = 0n;
  for (let value = 1n; value * 256n <= capacity; value *= 256n) bytes += 1n;
  return Number(bytes) - 4;
}

/** The codec's own bounds, read from source so this budget cannot drift away from them. */
export async function readCodecConstants() {
  const read = async (file, name) => {
    const source = await readFile(
      new URL(`../src/app/domain/build-link/${file}`, import.meta.url),
      'utf8',
    );
    const match = new RegExp(`const ${name} = ([\\d_]+)`).exec(source);
    if (!match) throw new Error(`Cannot read ${name} from ${file}; the codec bound moved.`);
    return Number(match[1].replaceAll('_', ''));
  };
  return {
    maxStringUnits: await read('build-link-codec.ts', 'MAX_STRING_UNITS'),
    maxEncodedLength: await read('build-link-payload.ts', 'MAX_ENCODED_LENGTH'),
  };
}

/** Refuse a table that could express a build too large to share. */
export function assertTableFitsEnvelope(table, { maxStringUnits, maxEncodedLength }) {
  const bytes = Math.ceil(worstCaseBodyBits(table, maxStringUnits) / 8);
  const limit = envelopeBodyBytes(maxEncodedLength);
  if (bytes > limit) {
    throw new Error(
      `The largest build this table can express needs up to ${bytes} bytes, beyond the ${limit} a\n` +
        `${maxEncodedLength}-character link carries. Every encodable build has to be shareable, so\n` +
        `lower MAX_STRING_UNITS (currently ${maxStringUnits}, worth ${maxStringUnits} bytes per label),\n` +
        `raise the envelope, or narrow what the table admits — then mint the next table version.`,
    );
  }
  return { bytes, limit };
}
