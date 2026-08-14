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

const CODEC_V1_ALMANAC_VERSION = '0.1.0-beta.4';
const outputPath = fileURLToPath(
  new URL('../src/app/domain/build-link/codec-v1.tables.ts', import.meta.url),
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
      .map(({ key }) => key),
  ]),
);

const indexOf = (index, identity, kind) => {
  const value = index.get(identity.toLowerCase());
  if (value === undefined) throw new Error(`Missing ${kind} identity ${identity}.`);
  return value;
};

const preEngineeredVariants = PRE_ENGINEERED_MODULES.map(
  ({ symbol, blueprint, grade, acquisition }) => ({
    module: indexOf(moduleIndex, symbol, 'pre-engineered module'),
    blueprint: indexOf(blueprintIndex, blueprint, 'pre-engineered blueprint'),
    grade,
    acquisition,
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

const render = (value) => JSON.stringify(value, null, 2);
const output = `// Generated by scripts/generate-build-link-codec-tables.mjs from
// @elite-dangerous-almanac/core@${CODEC_V1_ALMANAC_VERSION}. Do not edit by hand.

export const CODEC_V1_SHIPS = ${render(ships)} as const;

export const CODEC_V1_MODULES = ${render(modules)} as const;

export const CODEC_V1_BLUEPRINTS = ${render(blueprints)} as const;

export const CODEC_V1_BLUEPRINT_GRADES = ${render(blueprintGrades)} as const;

export const CODEC_V1_EXPERIMENTAL_EFFECTS = ${render(experimentalEffects)} as const;

export const CODEC_V1_SLOTS_BY_SHIP = ${render(slotsByShip)} as const;

export const CODEC_V1_DEFAULT_MODULES_BY_SHIP = ${render(defaultModulesByShip)} as const;

export const CODEC_V1_MODULE_SETS = ${render(moduleSets.unique)} as const;

export const CODEC_V1_MODULE_SET_BY_SHIP = ${render(moduleSetByShip)} as const;

export const CODEC_V1_BLUEPRINT_SETS = ${render(blueprintSets.unique)} as const;

export const CODEC_V1_BLUEPRINT_SET_BY_MODULE = ${render(blueprintSetByModule)} as const;

export const CODEC_V1_EXPERIMENTAL_SETS = ${render(experimentalSets.unique)} as const;

export const CODEC_V1_EXPERIMENTAL_SET_BY_MODULE = ${render(experimentalSetByModule)} as const;

export const CODEC_V1_PRE_ENGINEERED_VARIANTS = ${render(preEngineeredVariants)} as const;

export const CODEC_V1_PRE_ENGINEERED_SET_BY_MODULE = ${render(preEngineeredSetByModule)} as const;

export const CODEC_V1_DECORATIVE_MODIFICATIONS = ${render(decorativeModifications)} as const;

export const CODEC_V1_DECORATIVE_SET_BY_MODULE = ${render(decorativeSetByModule)} as const;
`;

await writeFile(outputPath, output);
