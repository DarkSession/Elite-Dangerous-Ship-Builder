import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';

/**
 * The fully outfitted and engineered Anaconda reference build described in
 * `docs/build-link-codec.md`. Shared by the codec and model specs so the pinned reference and
 * every measurement derived from it stay a single definition.
 */
export function makeFullyEngineeredAnaconda(): ShipLoadout {
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
    if (!candidate) throw new Error(`No module candidate exists for ${slot.key}.`);
    loadout.setModule(slot.key, candidate);
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
      ...(engineering.experimental ? { experimentalEffectSymbol: engineering.experimental } : {}),
    });
  }
  return loadout;
}

/**
 * The observable-state projection the specs compare round-trips with: everything the codec
 * models and nothing it deliberately omits.
 */
export function minimalState(loadout: ShipLoadout, assumeFullQuality = false): unknown {
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
