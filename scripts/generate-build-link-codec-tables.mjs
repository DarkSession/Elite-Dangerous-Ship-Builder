import { BLUEPRINTS } from '@elite-dangerous-almanac/core/ships/blueprints';
import { DECORATIVE_MODIFICATIONS } from '@elite-dangerous-almanac/core/ships/decorative-modifications';
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

const CODEC_V1_ALMANAC_VERSION = '0.1.0-beta.5';
const outputPath = fileURLToPath(
  new URL('../src/app/domain/build-link/codec-v1.tables.json', import.meta.url),
);
const almanacPackageUrl = new URL(
  '../../package.json',
  import.meta.resolve('@elite-dangerous-almanac/core/ships/ships'),
);
const almanacPackage = JSON.parse(await readFile(almanacPackageUrl, 'utf8'));
if (almanacPackage.version !== CODEC_V1_ALMANAC_VERSION) {
  throw new Error(
    `Codec v1 is pinned to Almanac ${CODEC_V1_ALMANAC_VERSION}; refusing to generate it from ${almanacPackage.version}.`,
  );
}

const ships = SHIPS.map(({ symbol }) => symbol);
const stockLoadouts = Object.fromEntries(ships.map((ship) => [ship, ShipLoadout.default(ship)]));
const modules = ALL_MODULES.map(({ symbol }) => symbol);
const knownModules = new Set(modules.map((symbol) => symbol.toLowerCase()));
for (const ship of ships) {
  for (const { symbol } of stockLoadouts[ship].fittedModules()) {
    if (knownModules.has(symbol.toLowerCase())) continue;
    knownModules.add(symbol.toLowerCase());
    modules.push(symbol);
  }
}
const blueprints = Object.keys(BLUEPRINTS).sort();
const blueprintGrades = blueprints.map((fdname) => {
  const grades = Object.keys(BLUEPRINTS[fdname].grades).map(Number);
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
const decorativeModifications = Object.keys(DECORATIVE_MODIFICATIONS);

const internSets = (sets) => {
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
const decorativeSetByModule = modules.map((symbol) =>
  decorativeModifications.flatMap((fdname, index) =>
    DECORATIVE_MODIFICATIONS[fdname].modules.some(
      (moduleSymbol) => moduleSymbol.toLowerCase() === symbol.toLowerCase(),
    )
      ? [index]
      : [],
  ),
);

const output = `${JSON.stringify(
  {
    $generated: {
      script: 'scripts/generate-build-link-codec-tables.mjs',
      almanacVersion: CODEC_V1_ALMANAC_VERSION,
    },
    CODEC_V1_SHIPS: ships,
    CODEC_V1_MODULES: modules,
    CODEC_V1_BLUEPRINTS: blueprints,
    CODEC_V1_BLUEPRINT_GRADES: blueprintGrades,
    CODEC_V1_EXPERIMENTAL_EFFECTS: experimentalEffects,
    CODEC_V1_SLOTS_BY_SHIP: slotsByShip,
    CODEC_V1_FIXED_MODULES_BY_SHIP: fixedModulesByShip,
    CODEC_V1_DEFAULT_MODULES_BY_SHIP: defaultModulesByShip,
    CODEC_V1_MODULE_SETS: moduleSets.unique,
    CODEC_V1_MODULE_SET_BY_SHIP: moduleSetByShip,
    CODEC_V1_BLUEPRINT_SETS: blueprintSets.unique,
    CODEC_V1_BLUEPRINT_SET_BY_MODULE: blueprintSetByModule,
    CODEC_V1_EXPERIMENTAL_SETS: experimentalSets.unique,
    CODEC_V1_EXPERIMENTAL_SET_BY_MODULE: experimentalSetByModule,
    CODEC_V1_PRE_ENGINEERED_VARIANTS: preEngineeredVariants,
    CODEC_V1_PRE_ENGINEERED_SET_BY_MODULE: preEngineeredSetByModule,
    CODEC_V1_DECORATIVE_MODIFICATIONS: decorativeModifications,
    CODEC_V1_DECORATIVE_SET_BY_MODULE: decorativeSetByModule,
  },
  null,
  2,
)}\n`;

await writeFile(outputPath, output);
