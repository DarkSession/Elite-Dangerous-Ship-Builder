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
