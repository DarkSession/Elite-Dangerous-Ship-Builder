import { BLUEPRINTS } from '@elite-dangerous-almanac/core/ships/blueprints';
import {
  getBlueprintsForModule,
  getExperimentalsForModule,
} from '@elite-dangerous-almanac/core/ships/engineering-options';
import { EXPERIMENTAL_EFFECTS } from '@elite-dangerous-almanac/core/ships/experimental-effects';
import { ALL_MODULES } from '@elite-dangerous-almanac/core/ships/modules-all';
import { PRE_ENGINEERED_MODULES } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  assertCapacityFitsEnvelope,
  assertCapacityWithinCodecLimits,
  assertTableFitsEnvelope,
  assertTableWithinCapacity,
  readCodecConstants,
} from './build-link-codec-capacity.mjs';

const TABLE_VERSION = 1;
const defaultOutputPath = fileURLToPath(
  new URL('../src/app/domain/build-link/codec-table-1.json', import.meta.url),
);
const outputPath = process.env.CODEC_TABLE_OUTPUT_PATH ?? defaultOutputPath;
const almanacPackageUrl = new URL(
  '../../package.json',
  import.meta.resolve('@elite-dangerous-almanac/core/ships/ships'),
);
const almanacPackage = JSON.parse(await readFile(almanacPackageUrl, 'utf8'));
const almanacVersion = almanacPackage.version;
const overwrite = process.argv.includes('--overwrite');

/**
 * A table's identity is its content, not the Almanac release it came from. Upgrading the
 * package is expected to reproduce the same table; only a table whose content moved is a
 * new encoding, because every published link is decoded with the table its payload names.
 * Hashing the payload — everything but `$generated`, which holds the table's label and the
 * hash itself rather than any encoded value — is what tells those two cases apart.
 */
const canonicalise = (value) => {
  if (Array.isArray(value)) return value.map(canonicalise);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalise(value[key])]),
    );
  }
  return value;
};
const contentHashOf = (payload) =>
  createHash('sha256')
    .update(JSON.stringify(canonicalise(payload)))
    .digest('hex');

const assertUniqueIdentities = (values, kind) => {
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`${kind} contains an empty or non-string identity.`);
    }
    const key = value.toLowerCase();
    if (seen.has(key)) throw new Error(`${kind} contains duplicate identity ${value}.`);
    seen.add(key);
  }
};
const assertIndexes = (values, valueCount, kind) => {
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value >= valueCount)) {
    throw new Error(`${kind} contains an out-of-range index.`);
  }
};

const ships = SHIPS.map(({ symbol }) => symbol);
const stockLoadouts = Object.fromEntries(ships.map((ship) => [ship, ShipLoadout.default(ship)]));
const modules = ALL_MODULES.map(({ symbol }) => symbol);
const knownModules = new Set(modules.map((symbol) => symbol.toLowerCase()));
const moduleStatsBySymbol = new Map(
  ALL_MODULES.map((module) => [module.symbol.toLowerCase(), module]),
);
for (const ship of ships) {
  for (const module of stockLoadouts[ship].fittedModules()) {
    const { symbol } = module;
    if (knownModules.has(symbol.toLowerCase())) continue;
    if (module.stats === null) {
      throw new Error(`Stock module ${symbol} has no catalogue statistics.`);
    }
    knownModules.add(symbol.toLowerCase());
    modules.push(symbol);
    moduleStatsBySymbol.set(symbol.toLowerCase(), module.stats);
  }
}
const poweredModules = modules.flatMap((symbol, index) => {
  const powerDraw = moduleStatsBySymbol.get(symbol.toLowerCase())?.powerDraw;
  return powerDraw !== undefined && powerDraw > 0 ? [index] : [];
});
const blueprints = [
  ...new Set([
    ...Object.keys(BLUEPRINTS),
    ...PRE_ENGINEERED_MODULES.map(({ blueprint }) => blueprint),
  ]),
].sort();
const blueprintGrades = blueprints.map((fdname) => {
  const blueprint = BLUEPRINTS[fdname];
  if (!blueprint) return [];
  const grades = Object.keys(blueprint.grades).map(Number);
  if (
    grades.length === 0 ||
    grades.some(
      (grade, index) =>
        !Number.isInteger(grade) || grade < 1 || grade > 5 || grade <= (grades[index - 1] ?? 0),
    )
  ) {
    throw new Error(`Engineering blueprint ${fdname} has unsupported grades.`);
  }
  return grades;
});
const experimentalEffects = Object.keys(EXPERIMENTAL_EFFECTS).sort();
assertUniqueIdentities(ships, 'Ship table');
assertUniqueIdentities(modules, 'Module table');
assertUniqueIdentities(blueprints, 'Blueprint table');
assertUniqueIdentities(experimentalEffects, 'Experimental-effect table');
const moduleIndex = new Map(modules.map((symbol, index) => [symbol.toLowerCase(), index]));
const blueprintIndex = new Map(blueprints.map((fdname, index) => [fdname.toLowerCase(), index]));
const experimentalIndex = new Map(
  experimentalEffects.map((fdname, index) => [fdname.toLowerCase(), index]),
);
/**
 * The codec encodes the mounts whose module the commander chooses, and carries the rest as
 * stock. That split is about what can be *fitted*, not what can be *emptied*: a hull's
 * armour and seven core internals cannot be left empty, yet every one of them takes a
 * choice of module. Only the built-in cargo hatch offers no choice at all.
 */
const isEncodableSlot = ({ kind }) => kind !== 'cargoHatch';
const slotsByShip = Object.fromEntries(
  ships.map((ship) => [
    ship,
    ShipLoadout.empty(ship)
      .slots()
      .filter(isEncodableSlot)
      .map(({ key }) => key),
  ]),
);
for (const ship of ships) assertUniqueIdentities(slotsByShip[ship], `${ship} slot table`);
const indexOf = (index, identity, kind) => {
  const value = index.get(identity.toLowerCase());
  if (value === undefined) throw new Error(`Missing ${kind} identity ${identity}.`);
  return value;
};

const fixedModulesByShip = Object.fromEntries(
  ships.map((ship) => {
    const stock = stockLoadouts[ship];
    return [
      ship,
      ShipLoadout.empty(ship)
        .slots()
        .filter((slot) => !isEncodableSlot(slot))
        .map(({ key }) => {
          const module = stock.fittedModuleAt(key);
          if (!module) throw new Error(`Fixed slot ${ship}:${key} has no stock module.`);
          return { slot: key, module: indexOf(moduleIndex, module.symbol, 'fixed module') };
        }),
    ];
  }),
);

const preEngineeredVariants = PRE_ENGINEERED_MODULES.map(
  ({ symbol, blueprint, grade, acquisition, experimental }) => ({
    module: indexOf(moduleIndex, symbol, 'pre-engineered module'),
    blueprint: indexOf(blueprintIndex, blueprint, 'pre-engineered blueprint'),
    grade,
    acquisition,
    experimental:
      experimental === undefined
        ? null
        : indexOf(experimentalIndex, experimental, 'pre-engineered experimental effect'),
  }),
);
const preEngineeredKeys = preEngineeredVariants.map(
  ({ module, blueprint, grade, acquisition }) => `${module}:${blueprint}:${grade}:${acquisition}`,
);
if (new Set(preEngineeredKeys).size !== preEngineeredKeys.length) {
  throw new Error('Pre-engineered codec identities are not unique.');
}

const internSets = () => {
  const unique = [];
  const indexes = new Map();
  return {
    intern(values) {
      const key = values.join(',');
      const existing = indexes.get(key);
      if (existing !== undefined) return existing;
      const index = unique.length;
      unique.push(values);
      indexes.set(key, index);
      return index;
    },
    unique,
  };
};

const moduleSets = internSets();
const moduleSetByShip = {};
const defaultModulesByShip = {};
for (const ship of ships) {
  const empty = ShipLoadout.empty(ship);
  const stock = stockLoadouts[ship];
  const slots = slotsByShip[ship];
  moduleSetByShip[ship] = slots.map((slot) => {
    let candidates = [];
    try {
      candidates = empty
        .modulesForSlot(slot)
        .map(({ symbol }) => indexOf(moduleIndex, symbol, 'module'));
    } catch {
      // Immutable built-ins have no editor candidate list; global fallback remains available.
    }
    return moduleSets.intern(candidates);
  });
  defaultModulesByShip[ship] = slots.map((slot) => {
    const module = stock.fittedModuleAt(slot);
    return module ? indexOf(moduleIndex, module.symbol, 'module') : null;
  });
}

const blueprintSets = internSets();
const experimentalSets = internSets();
const blueprintSetByModule = modules.map((symbol) =>
  blueprintSets.intern(
    getBlueprintsForModule(symbol).map((fdname) =>
      indexOf(blueprintIndex, fdname, 'engineering blueprint'),
    ),
  ),
);
const experimentalSetByModule = modules.map((symbol) =>
  experimentalSets.intern(
    getExperimentalsForModule(symbol).map((fdname) =>
      indexOf(experimentalIndex, fdname, 'experimental effect'),
    ),
  ),
);
const preEngineeredSetByModule = modules.map((symbol) =>
  preEngineeredVariants.flatMap(({ module }, index) =>
    modules[module].toLowerCase() === symbol.toLowerCase() ? [index] : [],
  ),
);

assertIndexes(poweredModules, modules.length, 'Powered-module table');
for (const ship of ships) {
  const slots = slotsByShip[ship];
  if (
    moduleSetByShip[ship].length !== slots.length ||
    defaultModulesByShip[ship].length !== slots.length
  ) {
    throw new Error(`${ship} has inconsistent parallel slot tables.`);
  }
  assertIndexes(moduleSetByShip[ship], moduleSets.unique.length, `${ship} module-set table`);
  assertIndexes(
    defaultModulesByShip[ship].filter((value) => value !== null),
    modules.length,
    `${ship} default-module table`,
  );
  assertIndexes(
    fixedModulesByShip[ship].map(({ module }) => module),
    modules.length,
    `${ship} fixed-module table`,
  );
  assertUniqueIdentities(
    fixedModulesByShip[ship].map(({ slot }) => slot),
    `${ship} fixed-slot table`,
  );
}
for (const [index, set] of moduleSets.unique.entries()) {
  assertIndexes(set, modules.length, `Module candidate set ${index}`);
}
for (const [index, set] of blueprintSets.unique.entries()) {
  assertIndexes(set, blueprints.length, `Blueprint candidate set ${index}`);
}
for (const [index, set] of experimentalSets.unique.entries()) {
  assertIndexes(set, experimentalEffects.length, `Experimental candidate set ${index}`);
}
if (
  blueprintGrades.length !== blueprints.length ||
  blueprintSetByModule.length !== modules.length ||
  experimentalSetByModule.length !== modules.length ||
  preEngineeredSetByModule.length !== modules.length
) {
  throw new Error('Codec table parallel arrays have inconsistent lengths.');
}
assertIndexes(blueprintSetByModule, blueprintSets.unique.length, 'Blueprint-set mapping');
assertIndexes(experimentalSetByModule, experimentalSets.unique.length, 'Experimental-set mapping');
for (const [index, variant] of preEngineeredVariants.entries()) {
  assertIndexes([variant.module], modules.length, `Pre-engineered variant ${index} module`);
  assertIndexes(
    [variant.blueprint],
    blueprints.length,
    `Pre-engineered variant ${index} blueprint`,
  );
  if (variant.experimental !== null) {
    assertIndexes(
      [variant.experimental],
      experimentalEffects.length,
      `Pre-engineered variant ${index} experimental`,
    );
  }
}
for (const [index, set] of preEngineeredSetByModule.entries()) {
  assertIndexes(set, preEngineeredVariants.length, `Pre-engineered module set ${index}`);
}
const payload = {
  SHIPS: ships,
  MODULES: modules,
  POWERED_MODULES: poweredModules,
  BLUEPRINTS: blueprints,
  BLUEPRINT_GRADES: blueprintGrades,
  EXPERIMENTAL_EFFECTS: experimentalEffects,
  SLOTS_BY_SHIP: slotsByShip,
  FIXED_MODULES_BY_SHIP: fixedModulesByShip,
  DEFAULT_MODULES_BY_SHIP: defaultModulesByShip,
  MODULE_SETS: moduleSets.unique,
  MODULE_SET_BY_SHIP: moduleSetByShip,
  BLUEPRINT_SETS: blueprintSets.unique,
  BLUEPRINT_SET_BY_MODULE: blueprintSetByModule,
  EXPERIMENTAL_SETS: experimentalSets.unique,
  EXPERIMENTAL_SET_BY_MODULE: experimentalSetByModule,
  PRE_ENGINEERED_VARIANTS: preEngineeredVariants,
  PRE_ENGINEERED_SET_BY_MODULE: preEngineeredSetByModule,
};

const codecConstants = await readCodecConstants();
assertCapacityWithinCodecLimits();
const budgeted = assertCapacityFitsEnvelope(codecConstants);
assertTableWithinCapacity(payload);
const envelope = assertTableFitsEnvelope(payload, codecConstants);

const contentHash = contentHashOf(payload);
const previous = JSON.parse(await readFile(outputPath, 'utf8').catch(() => 'null'));
// A table committed before this script recorded a hash is still comparable: re-hash its own
// payload the same way, so the first run after the hash landed proves the content held.
const previousHash = previous
  ? contentHashOf(
      Object.fromEntries(Object.entries(previous).filter(([key]) => key !== '$generated')),
    )
  : null;
const declaredPreviousHash = previous?.$generated?.contentHash;

if (declaredPreviousHash && declaredPreviousHash !== previousHash) {
  const detail =
    `Codec table ${TABLE_VERSION} content does not match its declared hash\n` +
    `  declared: ${declaredPreviousHash}\n` +
    `  actual:   ${previousHash}`;
  if (!overwrite) {
    throw new Error(`${detail}\nRefusing to replace a table whose integrity check failed.`);
  }
  console.warn(`${detail}\nOverwriting table ${TABLE_VERSION} in place (--overwrite).`);
}

if (previous && previousHash !== contentHash) {
  const detail =
    `Codec table ${TABLE_VERSION} content changed under Almanac ${almanacVersion}\n` +
    `  committed: ${previousHash ?? '(none recorded)'}\n` +
    `  generated: ${contentHash}\n` +
    `Every published link names the table version that decodes it, so a changed table is a\n` +
    `new encoding: mint the next table version and keep this one for the links already out.`;
  if (!overwrite) {
    throw new Error(
      `${detail}\nRe-run with --overwrite only while no link has been published against table ${TABLE_VERSION}.`,
    );
  }
  console.warn(`${detail}\nOverwriting table ${TABLE_VERSION} in place (--overwrite).`);
}

await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      $generated: {
        tableVersion: TABLE_VERSION,
        contentHash,
      },
      ...payload,
    },
    null,
    2,
  )}\n`,
);

console.log(
  previous && previousHash === contentHash
    ? `Codec table ${TABLE_VERSION} unchanged under Almanac ${almanacVersion} (${contentHash.slice(0, 12)}…).`
    : `Codec table ${TABLE_VERSION} written from Almanac ${almanacVersion} (${contentHash.slice(0, 12)}…).`,
);
// Printed every run so the trend is visible long before the budget refuses a table.
console.log(
  `Largest build it can express: up to ${envelope.bytes} of the ${envelope.limit} bytes a link carries` +
    ` (${budgeted.bytes} once grown to the budgeted capacity).`,
);
