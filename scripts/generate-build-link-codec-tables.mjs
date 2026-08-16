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
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const TABLE_VERSION = 1;
const TABLE_1_ALMANAC_VERSION = '0.1.0-beta.8';
const outputPath = fileURLToPath(
  new URL('../src/app/domain/build-link/codec-table-1.json', import.meta.url),
);
const almanacPackageUrl = new URL(
  '../../package.json',
  import.meta.resolve('@elite-dangerous-almanac/core/ships/ships'),
);
const almanacPackage = JSON.parse(await readFile(almanacPackageUrl, 'utf8'));
if (almanacPackage.version !== TABLE_1_ALMANAC_VERSION) {
  throw new Error(
    `Codec table 1 is pinned to Almanac ${TABLE_1_ALMANAC_VERSION}; refusing to generate it from ${almanacPackage.version}.`,
  );
}

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
const slotsByShip = Object.fromEntries(
  ships.map((ship) => [
    ship,
    ShipLoadout.empty(ship)
      .slots()
      .filter(({ removable }) => removable)
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
        .filter(({ removable }) => !removable)
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
const output = `${JSON.stringify(
  {
    $generated: {
      script: 'scripts/generate-build-link-codec-tables.mjs',
      tableVersion: TABLE_VERSION,
      almanacVersion: TABLE_1_ALMANAC_VERSION,
    },
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
  },
  null,
  2,
)}\n`;

await writeFile(outputPath, output);
