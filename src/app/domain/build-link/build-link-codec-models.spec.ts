import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';
import { createBuildLinkCodec } from './build-link-codec';
import type { BuildLinkSymbolModels } from './build-link-codec';
import codecTable1 from './codec-table-1.json';
import realisticEngineeredCorvette from './realistic-engineered-corvette.fixture.json';

/**
 * Proof-of-concept model weights. The boolean and power skews are defensible priors for real
 * builds (grades are usually maximal, engineered modules usually carry an experimental effect,
 * identities are almost always contextual, explicit enabled states are usually `on`). The
 * character weights approximate English-plus-callsign text over the compact alphabet. The
 * context-index decay is pinned uniform: table 1's candidate sets are catalogue-ordered, which
 * carries no popularity signal (measured decays help one reference build and hurt another), so a
 * production table would pin popularity-ordered sets or per-set weights instead of one decay.
 */
const POC_MODELS: BuildLinkSymbolModels = {
  GRADE_IS_MAX: [1, 7],
  EXPERIMENTAL_PRESENT: [1, 3],
  CONTEXT_HIT: [1, 31],
  POWER_ON: [2, 1, 5],
  POWER_PRIORITY: [4, 4, 8, 5, 3, 2],
  CONTEXT_INDEX_DECAY: [1, 1],
  COMPACT_CHARACTERS: [
    // A-Z
    41, 8, 14, 22, 64, 11, 10, 31, 35, 2, 4, 20, 12, 34, 38, 10, 2, 30, 32, 46, 14, 5, 12, 2, 10, 2,
    // a-z
    82, 15, 28, 43, 127, 22, 20, 61, 70, 2, 8, 40, 24, 67, 75, 19, 1, 60, 63, 91, 28, 10, 24, 2, 20,
    1,
    // 0-9
    8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
    // space, dash
    40, 12,
  ],
};

const modelledTable = {
  ...codecTable1,
  $generated: { ...codecTable1.$generated, tableVersion: 2 },
  MODELS: POC_MODELS,
};
const table1Codec = createBuildLinkCodec(1, codecTable1);
const modelledCodec = createBuildLinkCodec(2, modelledTable);
/**
 * The models' own effect is measured against the same table without models. Comparing against
 * table 1 directly would fold in an unrelated ±1-character artifact: the version value changes
 * the payload bytes and the CRC, which can move the Base70 digit count on its own.
 */
const baselineCodec = createBuildLinkCodec(2, {
  ...codecTable1,
  $generated: { ...codecTable1.$generated, tableVersion: 2 },
});

describe('build-link codec pinned symbol models (proof of concept)', () => {
  it('round-trips the reference corpus canonically under the modelled table', () => {
    for (const { label, source, assumeFullQuality } of referenceCorpus()) {
      const fragment = modelledCodec.encodeBuildLinkFragment(source);
      const decoded = modelledCodec.decodeBuildLinkFragment(fragment);

      expect(minimalState(decoded), label).toEqual(minimalState(source, assumeFullQuality));
      expect(modelledCodec.encodeBuildLinkFragment(decoded), label).toBe(fragment);
    }
  });

  it('round-trips empty and stock configurations for every pinned hull', () => {
    for (const { symbol } of SHIPS) {
      for (const source of [ShipLoadout.empty(symbol), ShipLoadout.default(symbol)]) {
        const fragment = modelledCodec.encodeBuildLinkFragment(source);

        expect(minimalState(modelledCodec.decodeBuildLinkFragment(fragment))).toEqual(
          minimalState(source),
        );
      }
    }
  });

  it('never lengthens a reference link and shrinks the engineered references', () => {
    const rows = referenceCorpus().map(({ label, source }) => {
      const table1Length = table1Codec.encodeBuildLinkFragment(source).length;
      const baselineLength = baselineCodec.encodeBuildLinkFragment(source).length;
      const modelledLength = modelledCodec.encodeBuildLinkFragment(source).length;
      return { label, table1Length, baselineLength, modelledLength };
    });
    console.info(
      ['POC symbol-model link lengths (characters, including the b. prefix):']
        .concat(
          rows.map(
            ({ label, table1Length, baselineLength, modelledLength }) =>
              `  ${label}: table 1 ${table1Length}, unmodelled ${baselineLength} -> ` +
              `modelled ${modelledLength}`,
          ),
        )
        .join('\n'),
    );

    for (const { label, baselineLength, modelledLength } of rows) {
      expect(modelledLength, label).toBeLessThanOrEqual(baselineLength);
    }
    for (const engineered of ['engineered Anaconda', 'supplied engineered Corvette']) {
      const row = rows.find(({ label }) => label === engineered)!;
      expect(row.modelledLength, engineered).toBeLessThan(row.baselineLength);
      expect(row.modelledLength, engineered).toBeLessThan(row.table1Length);
    }
  });

  it('never lengthens any empty or stock hull link', () => {
    for (const { symbol } of SHIPS) {
      for (const source of [ShipLoadout.empty(symbol), ShipLoadout.default(symbol)]) {
        expect(modelledCodec.encodeBuildLinkFragment(source).length, symbol).toBeLessThanOrEqual(
          baselineCodec.encodeBuildLinkFragment(source).length,
        );
      }
    }
  });

  it('shrinks compact metadata under the character model', () => {
    const named = makeNamedBuild('Interstellar Explorer', 'IX-01');

    const baselineFragment = baselineCodec.encodeBuildLinkFragment(named);
    const modelledFragment = modelledCodec.encodeBuildLinkFragment(named);

    expect(modelledFragment.length).toBeLessThan(baselineFragment.length);
    const decoded = modelledCodec.decodeBuildLinkFragment(modelledFragment);
    expect(decoded.shipName).toBe('Interstellar Explorer');
    expect(decoded.shipIdent).toBe('IX-01');
  });

  it('round-trips fallback UTF-8 metadata, which the character model does not touch', () => {
    const named = makeNamedBuild('Astraea 星', 'TST-42');

    const decoded = modelledCodec.decodeBuildLinkFragment(
      modelledCodec.encodeBuildLinkFragment(named),
    );

    expect(decoded.shipName).toBe('Astraea 星');
    expect(decoded.shipIdent).toBe('TST-42');
  });

  it('round-trips canonically under a non-uniform context-index decay', () => {
    const decayCodec = createBuildLinkCodec(2, {
      ...modelledTable,
      MODELS: { ...POC_MODELS, CONTEXT_INDEX_DECAY: [63, 64] },
    });
    const source = makeFullyEngineeredAnaconda();

    const fragment = decayCodec.encodeBuildLinkFragment(source);
    const decoded = decayCodec.decodeBuildLinkFragment(fragment);

    expect(minimalState(decoded)).toEqual(minimalState(source));
    expect(decayCodec.encodeBuildLinkFragment(decoded)).toBe(fragment);
  });

  it('rejects malformed model weight tables', () => {
    const withModels = (models: unknown) => () =>
      createBuildLinkCodec(2, {
        ...modelledTable,
        MODELS: models as BuildLinkSymbolModels,
      });
    const expectedError = 'The build-link codec table models are invalid.';

    expect(withModels({ ...POC_MODELS, GRADE_IS_MAX: [0, 1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, GRADE_IS_MAX: [1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, GRADE_IS_MAX: [1, 1.5] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, GRADE_IS_MAX: [2 ** 24, 1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, POWER_ON: [1, 1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, CONTEXT_INDEX_DECAY: [2, 1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, CONTEXT_INDEX_DECAY: [1, 128] })).toThrowError(
      expectedError,
    );
    expect(withModels({ ...POC_MODELS, CONTEXT_INDEX_DECAY: [1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, COMPACT_CHARACTERS: [1] })).toThrowError(expectedError);
  });
});

type CorpusEntry = {
  readonly label: string;
  readonly source: ShipLoadout;
  readonly assumeFullQuality?: boolean;
};

function referenceCorpus(): readonly CorpusEntry[] {
  return [
    { label: 'empty Sidewinder', source: ShipLoadout.empty('SideWinder') },
    { label: 'stock Krait Mk II', source: ShipLoadout.default('Krait_MkII') },
    { label: 'engineered Anaconda', source: makeFullyEngineeredAnaconda() },
    {
      label: 'supplied engineered Corvette',
      source: ShipLoadout.fromSlef(
        realisticEngineeredCorvette as Parameters<typeof ShipLoadout.fromSlef>[0],
      ),
      assumeFullQuality: true,
    },
    {
      label: 'named stock Krait Mk II',
      source: makeNamedBuild('Interstellar Explorer', 'IX-01'),
    },
  ];
}

function makeNamedBuild(name: string, ident: string): ShipLoadout {
  const stock = ShipLoadout.default('Krait_MkII').toLoadoutEvent({ moduleOrder: 'slots' });
  return ShipLoadout.fromLoadout({
    ...stock,
    ShipName: name,
    ShipIdent: ident,
  });
}

/** Mirrors the reference build pinned in `build-link-codec.spec.ts`. */
function makeFullyEngineeredAnaconda(): ShipLoadout {
  const loadout = ShipLoadout.default('Anaconda');
  const moduleForEmptySlot = (slot: string): string => {
    if (slot.startsWith('TinyHardpoint')) return 'Hpt_ChaffLauncher_Tiny';
    if (slot.includes('Hardpoint')) return 'Hpt_PulseLaser_Fixed_Small';
    if (slot.startsWith('Military')) return 'Int_ShieldCellBank_Size1_Class1';
    return 'Int_FuelTank_Size1_Class3';
  };
  for (const slot of loadout.slots()) {
    if (slot.module || !slot.removable) continue;
    const symbol = moduleForEmptySlot(slot.key);
    const candidate = loadout
      .modulesForSlot(slot.key)
      .find((module) => module.symbol.toLowerCase() === symbol.toLowerCase());
    expect(candidate, `a module for ${slot.key}`).toBeDefined();
    loadout.setModule(slot.key, candidate!);
  }

  const engineeringByModule: Readonly<
    Record<string, { blueprint: string; grade: number; experimental?: string }>
  > = {
    hpt_pulselaser_fixed_small: {
      blueprint: 'Weapon_Sturdy',
      grade: 5,
      experimental: 'special_weapon_toughened',
    },
    anaconda_armour_grade1: {
      blueprint: 'Armour_Thermic',
      grade: 5,
      experimental: 'special_armour_thermic',
    },
    int_powerplant_size8_class1: {
      blueprint: 'PowerPlant_Stealth',
      grade: 5,
      experimental: 'special_powerplant_toughened',
    },
    int_engine_size7_class1: {
      blueprint: 'Engine_Tuned',
      grade: 5,
      experimental: 'special_engine_toughened',
    },
    int_hyperdrive_size6_class1: {
      blueprint: 'FSD_Shielded',
      grade: 5,
      experimental: 'special_fsd_toughened',
    },
    int_lifesupport_size5_class1: { blueprint: 'LifeSupport_Shielded', grade: 5 },
    int_powerdistributor_size8_class1: {
      blueprint: 'PowerDistributor_Shielded',
      grade: 5,
      experimental: 'special_powerdistributor_toughened',
    },
    int_sensors_size8_class1: { blueprint: 'Sensor_WideAngle', grade: 5 },
    int_shieldgenerator_size6_class1: {
      blueprint: 'ShieldGenerator_Thermic',
      grade: 5,
      experimental: 'special_shield_toughened',
    },
    hpt_chafflauncher_tiny: { blueprint: 'Misc_Shielded', grade: 5 },
    int_shieldcellbank_size1_class1: {
      blueprint: 'ShieldCellBank_Specialised',
      grade: 4,
      experimental: 'special_shieldcell_toughened',
    },
  };
  const powerBySlot: Readonly<Record<string, readonly [on: boolean, priority: number]>> = {
    smallhardpoint1: [false, 0],
    smallhardpoint2: [true, 1],
    mainengines: [true, 4],
    frameshiftdrive: [true, 0],
    lifesupport: [true, 1],
    powerdistributor: [false, 2],
    radar: [true, 3],
    slot03_size6: [true, 2],
    slot14_size1: [true, 0],
    hugehardpoint1: [true, 3],
    largehardpoint1: [true, 4],
    largehardpoint2: [true, 0],
    largehardpoint3: [false, 1],
    mediumhardpoint1: [true, 2],
    mediumhardpoint2: [true, 3],
    tinyhardpoint1: [true, 4],
    tinyhardpoint2: [true, 0],
    tinyhardpoint3: [true, 1],
    tinyhardpoint4: [true, 2],
    tinyhardpoint5: [false, 3],
    tinyhardpoint6: [true, 4],
    tinyhardpoint7: [true, 0],
    tinyhardpoint8: [true, 1],
    military01: [false, 0],
    cargohatch: [true, 2],
  };
  for (const module of loadout.fittedModules()) {
    const power = powerBySlot[module.slot.toLowerCase()];
    if (power) {
      loadout.setModuleEnabled(module.slot, power[0]);
      loadout.setModulePriority(module.slot, power[1]);
    }
    const engineering = engineeringByModule[module.symbol.toLowerCase()];
    if (!engineering) continue;
    loadout.applyBlueprint(module.slot, engineering.blueprint, {
      grade: engineering.grade,
      quality: 1,
      ...(engineering.experimental ? { experimental: engineering.experimental } : {}),
    });
  }
  return loadout;
}

/** Mirrors the observable-state projection used by `build-link-codec.spec.ts`. */
function minimalState(loadout: ShipLoadout, assumeFullQuality = false): unknown {
  const cargoHatch = loadout.fittedModuleAt('CargoHatch');
  const hasCargoHatchPower = cargoHatch?.on !== undefined || cargoHatch?.priority !== undefined;
  return {
    shipSymbol: loadout.shipSymbol.toLowerCase(),
    shipName: loadout.shipName,
    shipIdent: loadout.shipIdent,
    ...(hasCargoHatchPower
      ? { cargoHatchPower: { on: cargoHatch?.on, priority: cargoHatch?.priority } }
      : {}),
    modules: loadout
      .fittedModules()
      .filter((module) => module.slot.toLowerCase() !== 'cargohatch')
      .map((module) => {
        const drawsPower = (module.effectiveStats?.powerDraw ?? 0) > 0;
        return {
          slot: module.slot.toLowerCase(),
          symbol: module.symbol.toLowerCase(),
          on: drawsPower ? module.on : undefined,
          priority: drawsPower ? module.priority : undefined,
          engineering:
            module.engineering === undefined
              ? undefined
              : {
                  blueprint: module.engineering.BlueprintName.toLowerCase(),
                  grade: module.engineering.Level,
                  quality: assumeFullQuality ? 1 : module.engineering.Quality,
                  experimental: module.engineering.ExperimentalEffect?.toLowerCase(),
                },
        };
      })
      .sort((left, right) => left.slot.localeCompare(right.slot)),
  };
}
