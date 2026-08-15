import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { PRE_ENGINEERED_MODULES } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import type { PreEngineeredVariant } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import { getPreEngineeredModifiers } from '@elite-dangerous-almanac/core/ships/pre-engineered-stats';
import type {
  LoadoutEvent,
  LoadoutModule,
  ModuleEngineering,
} from '@elite-dangerous-almanac/core/ships/slef';
import { BuildLinkCodecError } from './build-link-codec-error';
import { decodeBuildLinkPayload, encodeBuildLinkPayload } from './build-link-radix';
export { BuildLinkCodecError } from './build-link-codec-error';
export type { BuildLinkCodecErrorCode } from './build-link-codec-error';
import codecV1TablesJson from './codec-v1.tables.json';

interface CodecV1Tables {
  readonly CODEC_V1_SHIPS: readonly string[];
  readonly CODEC_V1_MODULES: readonly string[];
  readonly CODEC_V1_POWERED_MODULES: readonly number[];
  readonly CODEC_V1_BLUEPRINTS: readonly string[];
  readonly CODEC_V1_BLUEPRINT_GRADES: readonly (readonly number[])[];
  readonly CODEC_V1_EXPERIMENTAL_EFFECTS: readonly string[];
  readonly CODEC_V1_SLOTS_BY_SHIP: Readonly<Record<string, readonly string[]>>;
  readonly CODEC_V1_FIXED_MODULES_BY_SHIP: Readonly<
    Record<string, readonly { readonly slot: string; readonly module: number }[]>
  >;
  readonly CODEC_V1_DEFAULT_MODULES_BY_SHIP: Readonly<Record<string, readonly (number | null)[]>>;
  readonly CODEC_V1_MODULE_SETS: readonly (readonly number[])[];
  readonly CODEC_V1_MODULE_SET_BY_SHIP: Readonly<Record<string, readonly number[]>>;
  readonly CODEC_V1_BLUEPRINT_SETS: readonly (readonly number[])[];
  readonly CODEC_V1_BLUEPRINT_SET_BY_MODULE: readonly number[];
  readonly CODEC_V1_EXPERIMENTAL_SETS: readonly (readonly number[])[];
  readonly CODEC_V1_EXPERIMENTAL_SET_BY_MODULE: readonly number[];
  readonly CODEC_V1_PRE_ENGINEERED_VARIANTS: readonly {
    readonly module: number;
    readonly blueprint: number;
    readonly grade: number;
    readonly acquisition: string;
    readonly experimental: number | null;
  }[];
  readonly CODEC_V1_PRE_ENGINEERED_SET_BY_MODULE: readonly (readonly number[])[];
}

const {
  CODEC_V1_BLUEPRINT_SET_BY_MODULE,
  CODEC_V1_BLUEPRINT_SETS,
  CODEC_V1_BLUEPRINT_GRADES,
  CODEC_V1_BLUEPRINTS,
  CODEC_V1_DEFAULT_MODULES_BY_SHIP,
  CODEC_V1_EXPERIMENTAL_SET_BY_MODULE,
  CODEC_V1_EXPERIMENTAL_SETS,
  CODEC_V1_EXPERIMENTAL_EFFECTS,
  CODEC_V1_FIXED_MODULES_BY_SHIP,
  CODEC_V1_MODULE_SET_BY_SHIP,
  CODEC_V1_MODULE_SETS,
  CODEC_V1_MODULES,
  CODEC_V1_POWERED_MODULES,
  CODEC_V1_PRE_ENGINEERED_SET_BY_MODULE,
  CODEC_V1_PRE_ENGINEERED_VARIANTS,
  CODEC_V1_SHIPS,
  CODEC_V1_SLOTS_BY_SHIP,
} = codecV1TablesJson as CodecV1Tables;

const FRAGMENT_PREFIX = 'b.';
const CODEC_VERSION = 1;
const MAX_ENCODED_LENGTH = 500;
const CRC_LENGTH = 4;
const VERSION_BITS = 10;
const SHIP_BITS = bitsRequired(CODEC_V1_SHIPS.length);
const MODULE_BITS = bitsRequired(CODEC_V1_MODULES.length);
const BLUEPRINT_BITS = bitsRequired(CODEC_V1_BLUEPRINTS.length);
const EXPERIMENTAL_BITS = bitsRequired(CODEC_V1_EXPERIMENTAL_EFFECTS.length + 1);
const QUALITY_SCALE_4 = 10_000;
const QUALITY_BITS_4 = bitsRequired(QUALITY_SCALE_4 + 1);
const POWERED_MODULE_SET = new Set(CODEC_V1_POWERED_MODULES);

/**
 * Encode a loadout into the application-owned, versioned value placed after `#`.
 * SLEF parsing and reconstruction remain the Almanac's responsibility; this module
 * only serialises the minimal non-derivable build state.
 */
export function encodeBuildLinkFragment(loadout: ShipLoadout): string {
  const writer = new BitWriter();
  writer.writeBits(CODEC_VERSION, VERSION_BITS);
  const shipIndex = requireIdentity(SHIP_INDEX, loadout.shipSymbol, 'ship');
  const canonicalShip = CODEC_V1_SHIPS[shipIndex];
  const slots = CODEC_V1_SLOTS_BY_SHIP[canonicalShip];
  const fixedModules = CODEC_V1_FIXED_MODULES_BY_SHIP[canonicalShip];
  const slotIndex = SLOT_INDEX_BY_SHIP.get(canonicalShip);
  if (!slots || !fixedModules || !slotIndex) {
    throw new BuildLinkCodecError('unknownIdentity', `No codec slots exist for ${canonicalShip}.`);
  }
  const fixedModuleBySlot = new Map(fixedModules.map((fixed) => [normalise(fixed.slot), fixed]));

  writer.writeBits(shipIndex, SHIP_BITS);
  writer.writeBoolean(loadout.shipName !== null);
  writer.writeBoolean(loadout.shipIdent !== null);
  if (loadout.shipName !== null) writer.writeString(loadout.shipName);
  if (loadout.shipIdent !== null) writer.writeString(loadout.shipIdent);

  const modules = loadout.fittedModules();
  const modulesBySlot = new Map<string, (typeof modules)[number]>();
  const moduleIndexes: Array<number | null> = slots.map(() => null);
  for (const module of modules) {
    const encodedSlot = slotIndex.get(normalise(module.slot));
    if (encodedSlot === undefined) {
      const fixed = fixedModuleBySlot.get(normalise(module.slot));
      if (fixed) {
        if (modulesBySlot.has(fixed.slot)) {
          throw new BuildLinkCodecError(
            'invalidPayload',
            `Slot ${fixed.slot} appears more than once.`,
          );
        }
        if (requireIdentity(MODULE_INDEX, module.symbol, 'module') !== fixed.module) {
          throw new BuildLinkCodecError(
            'invalidPayload',
            `Fixed slot ${fixed.slot} does not contain its pinned module.`,
          );
        }
        if (module.engineering !== undefined) {
          throw new BuildLinkCodecError(
            'invalidPayload',
            `Fixed slot ${fixed.slot} cannot carry engineering.`,
          );
        }
        modulesBySlot.set(fixed.slot, module);
        continue;
      }
      throw new BuildLinkCodecError(
        'unknownIdentity',
        `Slot ${module.slot} is absent from codec version 1 for ${canonicalShip}.`,
      );
    }
    const slot = slots[encodedSlot];
    if (modulesBySlot.has(slot)) {
      throw new BuildLinkCodecError('invalidPayload', `Slot ${slot} appears more than once.`);
    }
    modulesBySlot.set(slot, module);
    moduleIndexes[encodedSlot] = requireIdentity(MODULE_INDEX, module.symbol, 'module');
  }

  const defaults = CODEC_V1_DEFAULT_MODULES_BY_SHIP[canonicalShip];
  const pristine =
    moduleIndexes.every((moduleIndex, index) => {
      const module = moduleAt(modulesBySlot, slots[index]);
      return (
        moduleIndex === defaults[index] &&
        (!moduleDrawsPower(moduleIndex) ||
          (module?.on === undefined && module?.priority === undefined)) &&
        module?.engineering === undefined
      );
    }) &&
    fixedModules.every(({ slot, module: moduleIndex }) => {
      const module = moduleAt(modulesBySlot, slot);
      return (
        !moduleDrawsPower(moduleIndex) ||
        (module?.on === undefined && module?.priority === undefined)
      );
    });
  writer.writeBoolean(pristine);
  if (!pristine) {
    writeModuleIdentities(writer, canonicalShip, slots, defaults, moduleIndexes);
    const occupiedSlots = indexesWhere(moduleIndexes, (moduleIndex) => moduleIndex !== null);
    const occupiedModules = occupiedSlots.map((index) => moduleAt(modulesBySlot, slots[index])!);
    const powerStates: PowerState[] = [
      ...occupiedModules.flatMap((module, occupiedIndex) =>
        moduleDrawsPower(moduleIndexes[occupiedSlots[occupiedIndex]!]!)
          ? [{ on: module.on, priority: module.priority }]
          : [],
      ),
      ...fixedModules.flatMap(({ slot, module: moduleIndex }) => {
        if (!moduleDrawsPower(moduleIndex)) return [];
        const module = moduleAt(modulesBySlot, slot);
        return [{ on: module?.on, priority: module?.priority }];
      }),
    ];
    writePowerStates(writer, powerStates);
    writeEngineeringStates(
      writer,
      occupiedModules.map((module, occupiedIndex) =>
        module.engineering === undefined
          ? undefined
          : engineeringStateFromModule(moduleIndexes[occupiedSlots[occupiedIndex]!]!, module),
      ),
      moduleIndexes,
      occupiedSlots,
    );
  }

  const body = writer.toUint8Array();
  const payload = new Uint8Array(body.length + CRC_LENGTH);
  payload.set(body);
  new DataView(payload.buffer).setUint32(body.length, crc32(body), true);
  const fragment = `${FRAGMENT_PREFIX}${encodeBuildLinkPayload(payload)}`;
  if (fragment.length - FRAGMENT_PREFIX.length > MAX_ENCODED_LENGTH) {
    throw new BuildLinkCodecError('invalidPayload', 'The encoded build exceeds the link limit.');
  }
  return fragment;
}

/** Decode a fragment produced by {@link encodeBuildLinkFragment}. */
export function decodeBuildLinkFragment(fragment: string): ShipLoadout {
  const value = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  if (!value.startsWith(FRAGMENT_PREFIX)) {
    throw new BuildLinkCodecError('unsupportedVersion', 'The build-link version is not supported.');
  }

  const encoded = value.slice(FRAGMENT_PREFIX.length);
  if (encoded.length === 0 || encoded.length > MAX_ENCODED_LENGTH) {
    throw new BuildLinkCodecError('invalidEncoding', 'The encoded build has an invalid length.');
  }

  const payload = decodeBuildLinkPayload(encoded);
  if (payload.length <= CRC_LENGTH) {
    throw new BuildLinkCodecError('invalidPayload', 'The build-link payload is truncated.');
  }

  const body = payload.subarray(0, payload.length - CRC_LENGTH);
  const expectedCrc = new DataView(
    payload.buffer,
    payload.byteOffset + body.length,
    CRC_LENGTH,
  ).getUint32(0, true);
  if (crc32(body) !== expectedCrc) {
    throw new BuildLinkCodecError('integrityCheckFailed', 'The build-link integrity check failed.');
  }

  try {
    const reader = new BitReader(body);
    const version = reader.readBits(VERSION_BITS);
    if (version !== CODEC_VERSION) {
      throw new BuildLinkCodecError(
        'unsupportedVersion',
        `Build-link codec version ${version} is not supported.`,
      );
    }
    const state = readVersionOneState(reader);
    if (!bytesEqual(writeVersionOneState(state), body)) {
      throw new BuildLinkCodecError('invalidPayload', 'The build-link encoding is not canonical.');
    }
    return reconstructVersionOneLoadout(state);
  } catch (error) {
    if (error instanceof BuildLinkCodecError) throw error;
    throw new BuildLinkCodecError('invalidPayload', 'The build-link payload is invalid.');
  }
}

type OrdinaryEngineeringState = {
  readonly kind: 'ordinary';
  readonly blueprint: number;
  readonly level: number;
  readonly quality: number;
  readonly experimental: number | null;
};

type PreEngineeredState = {
  readonly kind: 'preEngineered';
  readonly variant: number;
  readonly quality: number;
  readonly experimental: number | null;
};

type CodecEngineeringState = OrdinaryEngineeringState | PreEngineeredState;

type VersionOneState = {
  readonly shipIndex: number;
  readonly shipName: string | undefined;
  readonly shipIdent: string | undefined;
  readonly pristine: boolean;
  readonly moduleIndexes: readonly (number | null)[];
  readonly powerStates: readonly PowerState[];
  readonly engineeringStates: readonly (CodecEngineeringState | undefined)[];
};

function readVersionOneState(reader: BitReader): VersionOneState {
  const shipIndex = reader.readBits(SHIP_BITS);
  const ship = CODEC_V1_SHIPS[shipIndex];
  if (!ship) throw unknownTableIndex('ship', shipIndex);
  const slots = CODEC_V1_SLOTS_BY_SHIP[ship];
  const fixedModules = CODEC_V1_FIXED_MODULES_BY_SHIP[ship];

  const hasShipName = reader.readBoolean();
  const hasShipIdent = reader.readBoolean();
  const shipName = hasShipName ? reader.readString() : undefined;
  const shipIdent = hasShipIdent ? reader.readString() : undefined;
  const pristine = reader.readBoolean();
  const moduleIndexes = pristine
    ? [...CODEC_V1_DEFAULT_MODULES_BY_SHIP[ship]]
    : readModuleIdentities(reader, ship, slots);
  const occupiedSlots = indexesWhere(moduleIndexes, (moduleIndex) => moduleIndex !== null);
  const powerLayout = powerStateLayout(moduleIndexes, occupiedSlots, fixedModules);
  const powerStateCount = powerLayout.occupied.length + powerLayout.fixed.length;
  const powerStates = pristine
    ? Array.from({ length: powerStateCount }, () => ({ on: undefined, priority: undefined }))
    : readPowerStates(reader, powerStateCount);
  const engineeringStates = pristine
    ? occupiedSlots.map(() => undefined)
    : readEngineeringStates(reader, moduleIndexes, occupiedSlots);

  if (!pristine && isPristineState(ship, moduleIndexes, powerStates, engineeringStates)) {
    throw new BuildLinkCodecError(
      'invalidPayload',
      'A stock loadout must use the pristine representation.',
    );
  }

  if (!reader.done) {
    throw new BuildLinkCodecError('invalidPayload', 'The build-link payload has trailing data.');
  }

  return {
    shipIndex,
    shipName,
    shipIdent,
    pristine,
    moduleIndexes,
    powerStates,
    engineeringStates,
  };
}

function writeVersionOneState(state: VersionOneState): Uint8Array {
  const writer = new BitWriter();
  writer.writeBits(CODEC_VERSION, VERSION_BITS);
  writer.writeBits(state.shipIndex, SHIP_BITS);
  writer.writeBoolean(state.shipName !== undefined);
  writer.writeBoolean(state.shipIdent !== undefined);
  if (state.shipName !== undefined) writer.writeString(state.shipName);
  if (state.shipIdent !== undefined) writer.writeString(state.shipIdent);
  writer.writeBoolean(state.pristine);
  if (!state.pristine) {
    const ship = CODEC_V1_SHIPS[state.shipIndex] as CodecShip;
    const slots = CODEC_V1_SLOTS_BY_SHIP[ship];
    const defaults = CODEC_V1_DEFAULT_MODULES_BY_SHIP[ship];
    const occupiedSlots = indexesWhere(state.moduleIndexes, (moduleIndex) => moduleIndex !== null);
    writeModuleIdentities(writer, ship, slots, defaults, state.moduleIndexes);
    writePowerStates(writer, state.powerStates);
    writeEngineeringStates(writer, state.engineeringStates, state.moduleIndexes, occupiedSlots);
  }
  return writer.toUint8Array();
}

function reconstructVersionOneLoadout(state: VersionOneState): ShipLoadout {
  const ship = CODEC_V1_SHIPS[state.shipIndex] as CodecShip;
  const slots = CODEC_V1_SLOTS_BY_SHIP[ship];
  const fixedModules = CODEC_V1_FIXED_MODULES_BY_SHIP[ship];
  const occupiedSlots = indexesWhere(state.moduleIndexes, (moduleIndex) => moduleIndex !== null);
  const powerLayout = powerStateLayout(state.moduleIndexes, occupiedSlots, fixedModules);
  const powerByOccupiedIndex = new Map(
    powerLayout.occupied.map((occupiedIndex, powerIndex) => [
      occupiedIndex,
      state.powerStates[powerIndex]!,
    ]),
  );
  const fixedPowerOffset = powerLayout.occupied.length;
  const powerByFixedIndex = new Map(
    powerLayout.fixed.map((fixedIndex, powerIndex) => [
      fixedIndex,
      state.powerStates[fixedPowerOffset + powerIndex]!,
    ]),
  );

  const modules: LoadoutModule[] = occupiedSlots.map((slotIndex, occupiedIndex) => {
    const moduleIndex = state.moduleIndexes[slotIndex]!;
    const item = CODEC_V1_MODULES[moduleIndex];
    if (!item) throw unknownTableIndex('module', moduleIndex);
    const { on, priority } = powerByOccupiedIndex.get(occupiedIndex) ?? EMPTY_POWER_STATE;
    const engineering = state.engineeringStates[occupiedIndex];
    const resolvedEngineering =
      engineering?.kind === 'preEngineered'
        ? resolvePreEngineeredEngineering(engineering)
        : undefined;
    return {
      Slot: slots[slotIndex],
      Item: item,
      ...(on === undefined ? {} : { On: on }),
      ...(priority === undefined ? {} : { Priority: priority }),
      ...(resolvedEngineering === undefined ? {} : { Engineering: resolvedEngineering }),
    };
  });
  fixedModules.forEach(({ slot, module }, fixedIndex) => {
    const item = CODEC_V1_MODULES[module];
    if (!item) throw unknownTableIndex('fixed module', module);
    const { on, priority } = powerByFixedIndex.get(fixedIndex) ?? EMPTY_POWER_STATE;
    modules.push({
      Slot: slot,
      Item: item,
      ...(on === undefined ? {} : { On: on }),
      ...(priority === undefined ? {} : { Priority: priority }),
    });
  });

  const event: LoadoutEvent = {
    event: 'Loadout',
    Ship: ship,
    ...(state.shipName === undefined ? {} : { ShipName: state.shipName }),
    ...(state.shipIdent === undefined ? {} : { ShipIdent: state.shipIdent }),
    Modules: modules,
  };
  const loadout = ShipLoadout.fromLoadout(event);
  occupiedSlots.forEach((slotIndex, occupiedIndex) => {
    const engineering = state.engineeringStates[occupiedIndex];
    if (engineering?.kind !== 'ordinary') return;
    const blueprint = CODEC_V1_BLUEPRINTS[engineering.blueprint];
    if (!blueprint) throw unknownTableIndex('engineering blueprint', engineering.blueprint);
    const experimental =
      engineering.experimental === null
        ? undefined
        : CODEC_V1_EXPERIMENTAL_EFFECTS[engineering.experimental];
    if (engineering.experimental !== null && experimental === undefined) {
      throw unknownTableIndex('experimental effect', engineering.experimental);
    }
    loadout.applyBlueprint(slots[slotIndex], blueprint, {
      grade: engineering.level,
      quality: engineering.quality,
      ...(experimental === undefined ? {} : { experimental }),
    });
  });
  return loadout;
}

function isPristineState(
  ship: CodecShip,
  moduleIndexes: readonly (number | null)[],
  powerStates: readonly PowerState[],
  engineeringStates: readonly (CodecEngineeringState | undefined)[],
): boolean {
  const defaults = CODEC_V1_DEFAULT_MODULES_BY_SHIP[ship];
  return (
    moduleIndexes.every((moduleIndex, index) => moduleIndex === defaults[index]) &&
    powerStates.every(({ on, priority }) => on === undefined && priority === undefined) &&
    engineeringStates.every((engineering) => engineering === undefined)
  );
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((byte, index) => byte === right[index]);
}

type CodecShip = keyof typeof CODEC_V1_SLOTS_BY_SHIP;
type PowerState = { on: boolean | undefined; priority: number | undefined };
const EMPTY_POWER_STATE: PowerState = { on: undefined, priority: undefined };
type CodecFittedModule = ReturnType<ShipLoadout['fittedModules']>[number];

function moduleDrawsPower(moduleIndex: number | null): boolean {
  return moduleIndex !== null && POWERED_MODULE_SET.has(moduleIndex);
}

function powerStateLayout(
  moduleIndexes: readonly (number | null)[],
  occupiedSlots: readonly number[],
  fixedModules: readonly { readonly module: number }[],
): { readonly occupied: number[]; readonly fixed: number[] } {
  return {
    occupied: indexesWhere(occupiedSlots, (slotIndex) =>
      moduleDrawsPower(moduleIndexes[slotIndex]!),
    ),
    fixed: indexesWhere(fixedModules, ({ module }) => moduleDrawsPower(module)),
  };
}
type ModuleIdentityContext = {
  context: readonly number[];
  defaultIndex: number | null;
};
type ModuleIdentityEntry = ModuleIdentityContext & { moduleIndex: number };

function writeModuleIdentities(
  writer: BitWriter,
  ship: CodecShip,
  slots: readonly string[],
  defaults: readonly (number | null)[],
  modules: readonly (number | null)[],
): void {
  const { changed, occupied, baselineCost, absoluteCost } = moduleIdentityLayoutCosts(
    ship,
    slots,
    defaults,
    modules,
  );
  const useBaseline = baselineCost <= absoluteCost;
  writer.writeBoolean(useBaseline);

  if (useBaseline) {
    writeIndexSet(writer, slots.length, changed);
    const entries: ModuleIdentityEntry[] = [];
    for (const slotIndex of changed) {
      const moduleIndex = modules[slotIndex];
      writer.writeBoolean(moduleIndex !== null);
      if (moduleIndex !== null) {
        entries.push({
          moduleIndex,
          context: moduleSetForSlot(ship, slotIndex),
          defaultIndex: null,
        });
      }
    }
    writeModuleIdentitySequence(writer, entries);
    return;
  }

  writeIndexSet(writer, slots.length, occupied);
  writeModuleIdentitySequence(
    writer,
    occupied.map((slotIndex) => ({
      moduleIndex: modules[slotIndex]!,
      context: moduleSetForSlot(ship, slotIndex),
      defaultIndex: defaults[slotIndex] ?? null,
    })),
  );
}

function readModuleIdentities(
  reader: BitReader,
  ship: CodecShip,
  slots: readonly string[],
): Array<number | null> {
  const defaults = CODEC_V1_DEFAULT_MODULES_BY_SHIP[ship] as readonly (number | null)[];
  const useBaseline = reader.readBoolean();
  let modules: Array<number | null>;
  if (useBaseline) {
    modules = [...defaults];
    const changed = readIndexSet(reader, slots.length);
    const present = changed.map(() => reader.readBoolean());
    const presentSlots = changed.filter((_slotIndex, index) => present[index]);
    const identities = readModuleIdentitySequence(
      reader,
      presentSlots.map((slotIndex) => ({
        context: moduleSetForSlot(ship, slotIndex),
        defaultIndex: null,
      })),
    );
    let identityIndex = 0;
    for (const [changedIndex, slotIndex] of changed.entries()) {
      const module = present[changedIndex] ? identities[identityIndex++]! : null;
      if (module === defaults[slotIndex]) {
        throw new BuildLinkCodecError(
          'invalidPayload',
          'A baseline change restates the default module.',
        );
      }
      modules[slotIndex] = module;
    }
  } else {
    modules = slots.map(() => null);
    const occupied = readIndexSet(reader, slots.length);
    const identities = readModuleIdentitySequence(
      reader,
      occupied.map((slotIndex) => ({
        context: moduleSetForSlot(ship, slotIndex),
        defaultIndex: defaults[slotIndex] ?? null,
      })),
    );
    occupied.forEach((slotIndex, index) => {
      modules[slotIndex] = identities[index]!;
    });
  }

  const costs = moduleIdentityLayoutCosts(ship, slots, defaults, modules);
  if (useBaseline !== costs.baselineCost <= costs.absoluteCost) {
    throw new BuildLinkCodecError('invalidPayload', 'The module layout is not canonical.');
  }
  return modules;
}

function moduleIdentityLayoutCosts(
  ship: CodecShip,
  slots: readonly string[],
  defaults: readonly (number | null)[],
  modules: readonly (number | null)[],
): {
  changed: number[];
  occupied: number[];
  baselineCost: number;
  absoluteCost: number;
} {
  const changed = indexesWhere(modules, (moduleIndex, index) => moduleIndex !== defaults[index]);
  const occupied = indexesWhere(modules, (moduleIndex) => moduleIndex !== null);
  const baselineEntries = changed.flatMap((slotIndex): ModuleIdentityEntry[] => {
    const moduleIndex = modules[slotIndex];
    return moduleIndex === null
      ? []
      : [{ moduleIndex, context: moduleSetForSlot(ship, slotIndex), defaultIndex: null }];
  });
  const absoluteEntries = occupied.map((slotIndex): ModuleIdentityEntry => ({
    moduleIndex: modules[slotIndex]!,
    context: moduleSetForSlot(ship, slotIndex),
    defaultIndex: defaults[slotIndex] ?? null,
  }));
  return {
    changed,
    occupied,
    baselineCost:
      indexSetBitCost(slots.length, changed) +
      changed.length +
      moduleIdentitySequenceBitCost(baselineEntries),
    absoluteCost:
      indexSetBitCost(slots.length, occupied) + moduleIdentitySequenceBitCost(absoluteEntries),
  };
}

function writeModuleIdentitySequence(
  writer: BitWriter,
  entries: readonly ModuleIdentityEntry[],
): void {
  if (entries.length === 0) return;
  if (entries.length === 1) {
    const entry = entries[0]!;
    writeModuleIdentity(writer, entry.moduleIndex, entry.context, entry.defaultIndex);
    return;
  }

  const useReferences =
    referencedModuleIdentityBitCost(entries) < plainModuleIdentityBitCost(entries);
  writer.writeBoolean(useReferences);
  if (!useReferences) {
    for (const entry of entries) {
      writeModuleIdentity(writer, entry.moduleIndex, entry.context, entry.defaultIndex);
    }
    return;
  }

  const distinct: number[] = [];
  let previous: number | undefined;
  entries.forEach((entry, index) => {
    if (index > 0) {
      const sameAsPrevious = entry.moduleIndex === previous;
      writer.writeBoolean(sameAsPrevious);
      if (sameAsPrevious) return;
      const repeated = distinct.includes(entry.moduleIndex);
      writer.writeBoolean(repeated);
      if (repeated) {
        writeIndexInSet(writer, entry.moduleIndex, distinct);
        previous = entry.moduleIndex;
        return;
      }
    }
    writeModuleIdentity(writer, entry.moduleIndex, entry.context, entry.defaultIndex);
    distinct.push(entry.moduleIndex);
    previous = entry.moduleIndex;
  });
}

function readModuleIdentitySequence(
  reader: BitReader,
  contexts: readonly ModuleIdentityContext[],
): number[] {
  if (contexts.length === 0) return [];
  const useReferences = contexts.length > 1 && reader.readBoolean();
  const modules: number[] = [];
  const distinct: number[] = [];
  let previous: number | undefined;
  for (const [index, context] of contexts.entries()) {
    let moduleIndex: number;
    if (useReferences && index > 0 && reader.readBoolean()) {
      moduleIndex = previous!;
    } else if (useReferences && index > 0 && reader.readBoolean()) {
      moduleIndex = readIndexFromSet(reader, distinct, 'module back-reference');
      if (moduleIndex === previous) {
        throw new BuildLinkCodecError(
          'invalidPayload',
          'A module back-reference is not canonical.',
        );
      }
    } else {
      moduleIndex = readModuleIdentity(reader, context.context, context.defaultIndex);
      if (useReferences && distinct.includes(moduleIndex)) {
        throw new BuildLinkCodecError(
          'invalidPayload',
          'A repeated module identity is not canonical.',
        );
      }
      distinct.push(moduleIndex);
    }
    modules.push(moduleIndex);
    previous = moduleIndex;
  }

  const entries = modules.map((moduleIndex, index) => ({ ...contexts[index]!, moduleIndex }));
  const canonicalReferences =
    entries.length > 1 &&
    referencedModuleIdentityBitCost(entries) < plainModuleIdentityBitCost(entries);
  if (useReferences !== canonicalReferences) {
    throw new BuildLinkCodecError('invalidPayload', 'Module identity encoding is not canonical.');
  }
  return modules;
}

function moduleIdentitySequenceBitCost(entries: readonly ModuleIdentityEntry[]): number {
  if (entries.length < 2) return plainModuleIdentityBitCost(entries);
  return (
    1 + Math.min(plainModuleIdentityBitCost(entries), referencedModuleIdentityBitCost(entries))
  );
}

function plainModuleIdentityBitCost(entries: readonly ModuleIdentityEntry[]): number {
  return entries.reduce(
    (cost, entry) =>
      cost + moduleIdentityBitCost(entry.moduleIndex, entry.context, entry.defaultIndex),
    0,
  );
}

function referencedModuleIdentityBitCost(entries: readonly ModuleIdentityEntry[]): number {
  const distinct: number[] = [];
  let previous: number | undefined;
  return entries.reduce((cost, entry, index) => {
    if (index > 0 && entry.moduleIndex === previous) return cost + 1;
    if (index > 0 && distinct.includes(entry.moduleIndex)) {
      previous = entry.moduleIndex;
      return cost + 2 + contextualIndexBits(distinct.length);
    }
    const prefix = index === 0 ? 0 : 2;
    distinct.push(entry.moduleIndex);
    previous = entry.moduleIndex;
    return (
      cost + prefix + moduleIdentityBitCost(entry.moduleIndex, entry.context, entry.defaultIndex)
    );
  }, 0);
}

function moduleIdentityBitCost(
  moduleIndex: number,
  context: readonly number[],
  defaultIndex: number | null,
): number {
  const defaultBits = defaultIndex === null ? 0 : 1;
  if (defaultIndex === moduleIndex) return defaultBits;
  if (context.length === 0) return defaultBits + MODULE_BITS;
  return (
    defaultBits +
    1 +
    (context.includes(moduleIndex) ? contextualIndexBits(context.length) : MODULE_BITS)
  );
}

function writeModuleIdentity(
  writer: BitWriter,
  moduleIndex: number,
  context: readonly number[],
  defaultIndex: number | null,
): void {
  if (defaultIndex !== null) {
    writer.writeBoolean(moduleIndex === defaultIndex);
    if (moduleIndex === defaultIndex) return;
  }
  writeContextualIndex(writer, moduleIndex, context, MODULE_BITS);
}

function readModuleIdentity(
  reader: BitReader,
  context: readonly number[],
  defaultIndex: number | null,
): number {
  if (defaultIndex !== null && reader.readBoolean()) return defaultIndex;
  const moduleIndex = readContextualIndex(reader, context, MODULE_BITS);
  if (!CODEC_V1_MODULES[moduleIndex]) throw unknownTableIndex('module', moduleIndex);
  return moduleIndex;
}

function writePowerStates(writer: BitWriter, modules: readonly PowerState[]): void {
  const overrides = indexesWhere(
    modules,
    ({ on, priority }) => on !== undefined || priority !== undefined,
  );
  writer.writeBoolean(overrides.length > 0);
  if (overrides.length === 0) return;

  const mode = powerMode(modules, overrides);
  writer.writeBits(mode, 2);
  if (mode === 0) {
    writeFixedPowerStates(writer, modules);
  } else if (mode === 1) {
    writeIndexSet(writer, modules.length, overrides);
    for (const index of overrides) {
      const module = modules[index]!;
      writer.writeBits(encodeOn(module.on), 2);
      writer.writeBits(encodePriority(module.priority), 3);
    }
  } else {
    writeBaselinePowerStates(writer, modules);
  }
}

function readPowerStates(reader: BitReader, moduleCount: number): PowerState[] {
  const states: PowerState[] = Array.from({ length: moduleCount }, () => ({
    on: undefined,
    priority: undefined,
  }));
  if (!reader.readBoolean()) return states;

  const mode = reader.readBits(2);
  let decoded: PowerState[];
  if (mode === 0) decoded = readFixedPowerStates(reader, moduleCount);
  if (mode === 1) {
    for (const index of readIndexSet(reader, moduleCount)) {
      states[index] = {
        on: decodeOn(reader.readBits(2)),
        priority: decodePriority(reader.readBits(3)),
      };
    }
    decoded = states;
  } else if (mode === 2) {
    decoded = readBaselinePowerStates(reader, moduleCount);
  } else if (mode !== 0) {
    throw new BuildLinkCodecError('invalidPayload', 'A power-state mode is invalid.');
  }
  const overrides = indexesWhere(
    decoded!,
    ({ on, priority }) => on !== undefined || priority !== undefined,
  );
  if (overrides.length === 0 || mode !== powerMode(decoded!, overrides)) {
    throw new BuildLinkCodecError('invalidPayload', 'Power-state mode is not canonical.');
  }
  return decoded!;
}

function powerMode(modules: readonly PowerState[], overrides: readonly number[]): 0 | 1 | 2 {
  const costs = [
    fixedPowerBitCost(modules),
    indexSetBitCost(modules.length, overrides) + overrides.length * 5,
    baselinePowerBitCost(modules),
  ];
  return costs.indexOf(Math.min(...costs)) as 0 | 1 | 2;
}

function baselinePowerBitCost(modules: readonly PowerState[]): number {
  const onChanges = indexesWhere(modules, ({ on }) => on !== true);
  const onUniform = onChanges.every((index) => modules[index]!.on === modules[onChanges[0]!]!.on);
  const priorityChanges = indexesWhere(modules, ({ priority }) => priority !== 1);
  const prioritiesDefined = priorityChanges.every(
    (index) => modules[index]!.priority !== undefined,
  );
  return (
    1 +
    (onChanges.length === 0
      ? 0
      : indexSetBitCost(modules.length, onChanges) + 1 + (onUniform ? 1 : onChanges.length)) +
    1 +
    (priorityChanges.length === 0
      ? 0
      : indexSetBitCost(modules.length, priorityChanges) +
        1 +
        priorityChanges.length * (prioritiesDefined ? 2 : 3))
  );
}

function writeBaselinePowerStates(writer: BitWriter, modules: readonly PowerState[]): void {
  const onChanges = indexesWhere(modules, ({ on }) => on !== true);
  writer.writeBoolean(onChanges.length > 0);
  if (onChanges.length > 0) {
    writeIndexSet(writer, modules.length, onChanges);
    const uniform = onChanges.every((index) => modules[index]!.on === modules[onChanges[0]!]!.on);
    writer.writeBoolean(uniform);
    if (uniform) writer.writeBoolean(modules[onChanges[0]!]!.on === false);
    else for (const index of onChanges) writer.writeBoolean(modules[index]!.on === false);
  }

  const priorityChanges = indexesWhere(modules, ({ priority }) => priority !== 1);
  writer.writeBoolean(priorityChanges.length > 0);
  if (priorityChanges.length > 0) {
    writeIndexSet(writer, modules.length, priorityChanges);
    const allDefined = priorityChanges.every((index) => modules[index]!.priority !== undefined);
    writer.writeBoolean(allDefined);
    for (const index of priorityChanges) {
      const priority = modules[index]!.priority;
      if (allDefined) writer.writeBits(encodeDefinedPriorityDeviation(priority!), 2);
      else writer.writeBits(encodePriority(priority), 3);
    }
  }
}

function readBaselinePowerStates(reader: BitReader, moduleCount: number): PowerState[] {
  const states: PowerState[] = Array.from({ length: moduleCount }, () => ({
    on: true,
    priority: 1,
  }));
  if (reader.readBoolean()) {
    const onChanges = readIndexSet(reader, moduleCount);
    if (onChanges.length === 0) {
      throw new BuildLinkCodecError('invalidPayload', 'A baseline power-state set is empty.');
    }
    const uniform = reader.readBoolean();
    if (uniform) {
      const on = reader.readBoolean() ? false : undefined;
      for (const index of onChanges) states[index]!.on = on;
    } else {
      for (const index of onChanges) states[index]!.on = reader.readBoolean() ? false : undefined;
    }
    const canonicalUniform = onChanges.every(
      (index) => states[index]!.on === states[onChanges[0]!]!.on,
    );
    if (uniform !== canonicalUniform) {
      throw new BuildLinkCodecError(
        'invalidPayload',
        'A baseline enabled-state mode is not canonical.',
      );
    }
  }

  if (reader.readBoolean()) {
    const priorityChanges = readIndexSet(reader, moduleCount);
    if (priorityChanges.length === 0) {
      throw new BuildLinkCodecError('invalidPayload', 'A baseline priority set is empty.');
    }
    const allDefined = reader.readBoolean();
    for (const index of priorityChanges) {
      const priority = allDefined
        ? decodeDefinedPriorityDeviation(reader.readBits(2))
        : decodePriority(reader.readBits(3));
      if (priority === 1) {
        throw new BuildLinkCodecError(
          'invalidPayload',
          'A baseline power-state change restates the default priority.',
        );
      }
      states[index]!.priority = priority;
    }
    const canonicalAllDefined = priorityChanges.every(
      (index) => states[index]!.priority !== undefined,
    );
    if (allDefined !== canonicalAllDefined) {
      throw new BuildLinkCodecError('invalidPayload', 'A baseline priority mode is not canonical.');
    }
  }
  return states;
}

function encodeDefinedPriorityDeviation(priority: number): number {
  if (priority === 0) return 0;
  if (priority >= 2 && priority <= 4) return priority - 1;
  throw new BuildLinkCodecError(
    'invalidPayload',
    'A defined baseline priority deviation must be 0 or from 2 to 4.',
  );
}

function decodeDefinedPriorityDeviation(value: number): number {
  return value === 0 ? 0 : value + 1;
}

function fixedPowerBitCost(modules: readonly PowerState[]): number {
  const on = modules.map((module) => module.on);
  const allOnSame = on.every((value) => value === on[0]);
  const allOnDefined = on.every((value) => value !== undefined);
  const onCost = allOnSame ? 2 : 3 + (allOnDefined ? modules.length : modules.length * 2);
  const priority = modules.map((module) => module.priority);
  const allPrioritiesSame = priority.every((value) => value === priority[0]);
  return onCost + (allPrioritiesSame ? 4 : 1 + modules.length * 3);
}

function writeFixedPowerStates(writer: BitWriter, modules: readonly PowerState[]): void {
  const on = modules.map((module) => module.on);
  const onMode = on.every((value) => value === undefined)
    ? 0
    : on.every((value) => value === true)
      ? 1
      : on.every((value) => value === false)
        ? 2
        : 3;
  writer.writeBits(onMode, 2);
  if (onMode === 3) {
    const allDefined = on.every((value) => value !== undefined);
    writer.writeBoolean(allDefined);
    for (const value of on) {
      if (allDefined) writer.writeBoolean(value!);
      else writer.writeBits(encodeOn(value), 2);
    }
  }

  const priorities = modules.map((module) => module.priority);
  const uniform = priorities.every((value) => value === priorities[0]);
  writer.writeBoolean(uniform);
  if (uniform) writer.writeBits(encodePriority(priorities[0]), 3);
  else for (const priority of priorities) writer.writeBits(encodePriority(priority), 3);
}

function readFixedPowerStates(reader: BitReader, moduleCount: number): PowerState[] {
  const onMode = reader.readBits(2);
  let on: Array<boolean | undefined>;
  if (onMode === 0) on = Array<boolean | undefined>(moduleCount).fill(undefined);
  else if (onMode === 1) on = Array<boolean | undefined>(moduleCount).fill(true);
  else if (onMode === 2) on = Array<boolean | undefined>(moduleCount).fill(false);
  else {
    const allDefined = reader.readBoolean();
    on = allDefined
      ? Array.from({ length: moduleCount }, () => reader.readBoolean())
      : Array.from({ length: moduleCount }, () => decodeOn(reader.readBits(2)));
    if (allDefined !== on.every((value) => value !== undefined)) {
      throw new BuildLinkCodecError(
        'invalidPayload',
        'A fixed enabled-state definition mode is not canonical.',
      );
    }
    if (on.every((value) => value === on[0])) {
      throw new BuildLinkCodecError(
        'invalidPayload',
        'A uniform enabled state must use its fixed mode.',
      );
    }
  }
  const uniformPriority = reader.readBoolean();
  const priority = uniformPriority
    ? Array<number | undefined>(moduleCount).fill(decodePriority(reader.readBits(3)))
    : Array.from({ length: moduleCount }, () => decodePriority(reader.readBits(3)));
  if (uniformPriority !== priority.every((value) => value === priority[0])) {
    throw new BuildLinkCodecError('invalidPayload', 'A fixed priority mode is not canonical.');
  }
  return on.map((value, index) => ({ on: value, priority: priority[index] }));
}

function writeEngineeringStates(
  writer: BitWriter,
  states: readonly (CodecEngineeringState | undefined)[],
  moduleIndexes: readonly (number | null)[],
  occupiedSlots: readonly number[],
): void {
  const engineered = indexesWhere(states, (engineering) => engineering !== undefined);
  writer.writeBoolean(engineered.length > 0);
  if (engineered.length === 0) return;

  const eligible = engineeringEligibleIndexes(moduleIndexes, occupiedSlots);
  if (engineered.some((occupiedIndex) => !eligible.includes(occupiedIndex))) {
    throw new BuildLinkCodecError(
      'invalidPayload',
      'A module without engineering recipes carries engineering.',
    );
  }
  const all = engineered.length === eligible.length;
  writer.writeBoolean(all);
  if (!all) {
    writeIndexSet(
      writer,
      eligible.length,
      engineered.map((occupiedIndex) => eligible.indexOf(occupiedIndex)),
    );
  }
  const records = engineered.map((occupiedIndex) => ({
    moduleIndex: moduleIndexes[occupiedSlots[occupiedIndex]!]!,
    engineering: states[occupiedIndex]!,
  }));
  const references = engineeringReferences(records);
  const plainCost = records.reduce((cost, record) => cost + engineeringRecordBitCost(record), 0);
  const referenceWidth = bitsRequired(records.length);
  const referenceCost = records.reduce(
    (cost, record, index) =>
      cost + 1 + (references[index] === null ? engineeringRecordBitCost(record) : referenceWidth),
    0,
  );
  const useReferences = records.length > 1 && referenceCost < plainCost;
  if (records.length > 1) writer.writeBoolean(useReferences);

  for (const [index, { moduleIndex, engineering }] of records.entries()) {
    if (useReferences) {
      const reference = references[index];
      writer.writeBoolean(reference !== null);
      if (reference !== null) {
        writer.writeBits(reference, referenceWidth);
        continue;
      }
    }
    writeEngineering(writer, moduleIndex, engineering);
  }
}

function readEngineeringStates(
  reader: BitReader,
  moduleIndexes: readonly (number | null)[],
  occupiedSlots: readonly number[],
): Array<CodecEngineeringState | undefined> {
  const states: Array<CodecEngineeringState | undefined> = occupiedSlots.map(() => undefined);
  if (!reader.readBoolean()) return states;

  const eligible = engineeringEligibleIndexes(moduleIndexes, occupiedSlots);
  const all = reader.readBoolean();
  const engineered = all
    ? eligible
    : readIndexSet(reader, eligible.length).map((index) => eligible[index]!);
  const useReferences = engineered.length > 1 && reader.readBoolean();
  const referenceWidth = bitsRequired(engineered.length);
  const decodedRecords: CodecEngineeringState[] = [];
  const firstRecordByKey = new Map<string, number>();
  for (const [recordIndex, occupiedIndex] of engineered.entries()) {
    const moduleIndex = moduleIndexes[occupiedSlots[occupiedIndex]!]!;
    if (useReferences && reader.readBoolean()) {
      const reference = reader.readBits(referenceWidth);
      const referenced = decodedRecords[reference];
      if (
        referenced === undefined ||
        referenced.kind !== 'ordinary' ||
        firstRecordByKey.get(engineeringStateKey(referenced)) !== reference
      ) {
        throw new BuildLinkCodecError(
          'invalidPayload',
          'An engineering back-reference is invalid.',
        );
      }
      states[occupiedIndex] = referenced;
      decodedRecords.push(referenced);
      continue;
    }

    const engineering = readEngineering(reader, moduleIndex);
    if (useReferences && engineering.kind === 'ordinary') {
      const key = engineeringStateKey(engineering);
      if (firstRecordByKey.has(key)) {
        throw new BuildLinkCodecError(
          'invalidPayload',
          'A repeated engineering record is not canonical.',
        );
      }
      firstRecordByKey.set(key, recordIndex);
    }
    states[occupiedIndex] = engineering;
    decodedRecords.push(engineering);
  }
  const records = engineered.map((occupiedIndex) => ({
    moduleIndex: moduleIndexes[occupiedSlots[occupiedIndex]!]!,
    engineering: states[occupiedIndex]!,
  }));
  const references = engineeringReferences(records);
  const plainCost = records.reduce((cost, record) => cost + engineeringRecordBitCost(record), 0);
  const referenceWidthForCost = bitsRequired(records.length);
  const referenceCost = records.reduce(
    (cost, record, index) =>
      cost +
      1 +
      (references[index] === null ? engineeringRecordBitCost(record) : referenceWidthForCost),
    0,
  );
  if (useReferences !== (records.length > 1 && referenceCost < plainCost)) {
    throw new BuildLinkCodecError('invalidPayload', 'Engineering reference mode is not canonical.');
  }
  return states;
}

function engineeringStateKey(engineering: OrdinaryEngineeringState): string {
  return JSON.stringify([
    engineering.blueprint,
    engineering.level,
    engineering.quality,
    engineering.experimental,
  ]);
}

type EngineeringRecord = {
  readonly moduleIndex: number;
  readonly engineering: CodecEngineeringState;
};

function engineeringReferences(records: readonly EngineeringRecord[]): Array<number | null> {
  const firstRecordByKey = new Map<string, number>();
  return records.map(({ engineering }, index) => {
    if (engineering.kind !== 'ordinary') return null;
    const key = engineeringStateKey(engineering);
    const previous = firstRecordByKey.get(key);
    if (previous !== undefined) return previous;
    firstRecordByKey.set(key, index);
    return null;
  });
}

function engineeringRecordBitCost(record: EngineeringRecord): number {
  const writer = new BitWriter();
  writeEngineering(writer, record.moduleIndex, record.engineering);
  return writer.length;
}

function engineeringEligibleIndexes(
  moduleIndexes: readonly (number | null)[],
  occupiedSlots: readonly number[],
): number[] {
  return indexesWhere(occupiedSlots, (slotIndex) => {
    const moduleIndex = moduleIndexes[slotIndex]!;
    return (
      blueprintSetForModule(moduleIndex).length > 0 ||
      preEngineeredSetForModule(moduleIndex).length > 0
    );
  });
}

function writeIndexSet(writer: BitWriter, valueCount: number, indexes: readonly number[]): void {
  const mode = indexSetMode(valueCount, indexes);
  writer.writeBits(mode, 2);
  if (mode === 0) {
    const included = new Set(indexes);
    for (let index = 0; index < valueCount; index += 1) {
      writer.writeBoolean(included.has(index));
    }
    return;
  }

  const encodedIndexes =
    mode === 1
      ? indexes
      : indexesWhere(
          Array.from({ length: valueCount }, () => false),
          (_value, index) => !indexes.includes(index),
        );
  writer.writeBits(encodedIndexes.length, bitsRequired(valueCount + 1));
  for (const index of encodedIndexes) writer.writeBits(index, bitsRequired(valueCount));
}

function readIndexSet(reader: BitReader, valueCount: number): number[] {
  const mode = reader.readBits(2);
  let indexes: number[];
  if (mode === 0) {
    indexes = [];
    for (let index = 0; index < valueCount; index += 1) {
      if (reader.readBoolean()) indexes.push(index);
    }
  } else if (mode === 1 || mode === 2) {
    const encodedIndexes = readSparseIndexes(reader, valueCount);
    indexes =
      mode === 1
        ? encodedIndexes
        : indexesWhere(
            Array.from({ length: valueCount }, () => false),
            (_value, index) => !encodedIndexes.includes(index),
          );
  } else {
    throw new BuildLinkCodecError('invalidPayload', 'An index-set mode is invalid.');
  }
  if (mode !== indexSetMode(valueCount, indexes)) {
    throw new BuildLinkCodecError('invalidPayload', 'An index set is not canonical.');
  }
  return indexes;
}

function indexSetBitCost(valueCount: number, indexes: readonly number[]): number {
  return 2 + indexSetDataBitCost(valueCount, indexes, indexSetMode(valueCount, indexes));
}

function indexSetMode(valueCount: number, indexes: readonly number[]): 0 | 1 | 2 {
  const costs = [
    indexSetDataBitCost(valueCount, indexes, 0),
    indexSetDataBitCost(valueCount, indexes, 1),
    indexSetDataBitCost(valueCount, indexes, 2),
  ];
  const minimum = Math.min(...costs);
  return costs.indexOf(minimum) as 0 | 1 | 2;
}

function indexSetDataBitCost(
  valueCount: number,
  indexes: readonly number[],
  mode: 0 | 1 | 2,
): number {
  if (mode === 0) return valueCount;
  const encodedCount = mode === 1 ? indexes.length : valueCount - indexes.length;
  return bitsRequired(valueCount + 1) + encodedCount * bitsRequired(valueCount);
}

function readSparseIndexes(reader: BitReader, valueCount: number): number[] {
  const count = reader.readBits(bitsRequired(valueCount + 1));
  if (count > valueCount) {
    throw new BuildLinkCodecError('invalidPayload', 'An index set contains too many values.');
  }
  const indexes: number[] = [];
  for (let position = 0; position < count; position += 1) {
    const index = reader.readBits(bitsRequired(valueCount));
    if (index >= valueCount || (indexes.at(-1) ?? -1) >= index) {
      throw new BuildLinkCodecError('invalidPayload', 'An index set is not strictly ordered.');
    }
    indexes.push(index);
  }
  return indexes;
}

function writeContextualIndex(
  writer: BitWriter,
  value: number,
  context: readonly number[],
  globalBits: number,
): void {
  if (context.length === 0) {
    writer.writeBits(value, globalBits);
    return;
  }
  const contextualIndex = context.indexOf(value);
  writer.writeBoolean(contextualIndex !== -1);
  if (contextualIndex === -1) writer.writeBits(value, globalBits);
  else if (context.length > 1) writer.writeBits(contextualIndex, bitsRequired(context.length));
}

function readContextualIndex(
  reader: BitReader,
  context: readonly number[],
  globalBits: number,
): number {
  if (context.length === 0) return reader.readBits(globalBits);
  if (reader.readBoolean()) return readIndexFromSet(reader, context, 'contextual identity');
  const value = reader.readBits(globalBits);
  if (context.includes(value)) {
    throw new BuildLinkCodecError('invalidPayload', 'A contextual identity is not canonical.');
  }
  return value;
}

function readIndexFromSet(reader: BitReader, context: readonly number[], kind: string): number {
  const width = contextualIndexBits(context.length);
  const contextualIndex = width === 0 ? 0 : reader.readBits(width);
  const value = context[contextualIndex];
  if (value === undefined) throw unknownTableIndex(kind, contextualIndex);
  return value;
}

function writeIndexInSet(writer: BitWriter, value: number, context: readonly number[]): void {
  const contextualIndex = context.indexOf(value);
  if (contextualIndex === -1) {
    throw new BuildLinkCodecError(
      'unknownIdentity',
      `The identity is absent from its contextual set.`,
    );
  }
  const width = contextualIndexBits(context.length);
  if (width > 0) writer.writeBits(contextualIndex, width);
}

function contextualIndexBits(valueCount: number): number {
  return valueCount <= 1 ? 0 : bitsRequired(valueCount);
}

function moduleSetForSlot(ship: CodecShip, slotIndex: number): readonly number[] {
  const setIndex = CODEC_V1_MODULE_SET_BY_SHIP[ship][slotIndex];
  const set = CODEC_V1_MODULE_SETS[setIndex];
  if (!set) throw unknownTableIndex('module candidate set', setIndex);
  return set;
}

function blueprintSetForModule(moduleIndex: number): readonly number[] {
  const setIndex = CODEC_V1_BLUEPRINT_SET_BY_MODULE[moduleIndex];
  const set = setIndex === undefined ? undefined : CODEC_V1_BLUEPRINT_SETS[setIndex];
  if (!set) throw unknownTableIndex('blueprint set', setIndex ?? -1);
  return set;
}

function experimentalSetForModule(moduleIndex: number): readonly number[] {
  const setIndex = CODEC_V1_EXPERIMENTAL_SET_BY_MODULE[moduleIndex];
  const set = setIndex === undefined ? undefined : CODEC_V1_EXPERIMENTAL_SETS[setIndex];
  if (!set) throw unknownTableIndex('experimental-effect set', setIndex ?? -1);
  return set;
}

function preEngineeredSetForModule(moduleIndex: number): readonly number[] {
  return CODEC_V1_PRE_ENGINEERED_SET_BY_MODULE[moduleIndex] ?? [];
}

function resolvePreEngineeredVariant(index: number): PreEngineeredVariant {
  const identity = CODEC_V1_PRE_ENGINEERED_VARIANTS[index];
  if (!identity) throw unknownTableIndex('pre-engineered variant', index);
  const symbol = CODEC_V1_MODULES[identity.module];
  const blueprint = CODEC_V1_BLUEPRINTS[identity.blueprint];
  const variant = PRE_ENGINEERED_MODULES.find(
    (candidate) =>
      normalise(candidate.symbol) === normalise(symbol) &&
      normalise(candidate.blueprint) === normalise(blueprint) &&
      candidate.grade === identity.grade &&
      candidate.acquisition === identity.acquisition,
  );
  if (!variant) throw unknownTableIndex('pre-engineered variant', index);
  return variant;
}

function preEngineeredVariantIndex(variant: PreEngineeredVariant): number {
  const module = MODULE_INDEX.get(normalise(variant.symbol));
  const blueprint = BLUEPRINT_INDEX.get(normalise(variant.blueprint));
  if (module === undefined || blueprint === undefined) return -1;
  return CODEC_V1_PRE_ENGINEERED_VARIANTS.findIndex(
    (identity) =>
      identity.module === module &&
      identity.blueprint === blueprint &&
      identity.grade === variant.grade &&
      identity.acquisition === variant.acquisition,
  );
}

function pinnedPreEngineeredExperimentalIndex(index: number): number | null {
  const experimental = CODEC_V1_PRE_ENGINEERED_VARIANTS[index]?.experimental;
  if (experimental === null) return null;
  if (experimental === undefined || !CODEC_V1_EXPERIMENTAL_EFFECTS[experimental]) {
    throw unknownTableIndex('pre-engineered experimental effect', experimental ?? -1);
  }
  return experimental;
}

function resolvePreEngineeredEngineering(engineering: PreEngineeredState): ModuleEngineering {
  const variant = resolvePreEngineeredVariant(engineering.variant);
  const experimental =
    engineering.experimental === null
      ? undefined
      : CODEC_V1_EXPERIMENTAL_EFFECTS[engineering.experimental];
  if (engineering.experimental !== null && experimental === undefined) {
    throw unknownTableIndex('experimental effect', engineering.experimental);
  }
  const resolvedVariant = {
    ...variant,
    ...(experimental === undefined ? { experimental: undefined } : { experimental }),
  } as PreEngineeredVariant;
  return {
    BlueprintName: variant.blueprint,
    Level: variant.grade,
    Quality: engineering.quality,
    ...(experimental === undefined ? {} : { ExperimentalEffect: experimental }),
    Modifiers: getPreEngineeredModifiers(resolvedVariant),
  };
}

function indexesWhere<T>(
  values: readonly T[],
  predicate: (value: T, index: number) => boolean,
): number[] {
  const indexes: number[] = [];
  values.forEach((value, index) => {
    if (predicate(value, index)) indexes.push(index);
  });
  return indexes;
}

function moduleAt<T>(modules: ReadonlyMap<string, T>, slot: string | undefined): T | undefined {
  return slot === undefined ? undefined : modules.get(slot);
}

function engineeringStateFromModule(
  moduleIndex: number,
  module: CodecFittedModule,
): CodecEngineeringState {
  const engineering = module.engineering!;
  const preEngineeredIndex =
    module.preEngineeredVariant === null
      ? -1
      : preEngineeredVariantIndex(module.preEngineeredVariant);
  if (module.preEngineeredVariant !== null && preEngineeredIndex === -1) {
    throw new BuildLinkCodecError(
      'unknownIdentity',
      'The pre-engineered variant is absent from codec version 1.',
    );
  }
  const experimental =
    engineering.ExperimentalEffect === undefined
      ? null
      : requireIdentity(EXPERIMENTAL_INDEX, engineering.ExperimentalEffect, 'experimental effect');
  if (preEngineeredIndex !== -1) {
    if (!preEngineeredSetForModule(moduleIndex).includes(preEngineeredIndex)) {
      throw new BuildLinkCodecError(
        'unknownIdentity',
        'The pre-engineered variant is unavailable for its fitted module.',
      );
    }
    return {
      kind: 'preEngineered',
      variant: preEngineeredIndex,
      quality: engineering.Quality,
      experimental,
    };
  }

  const blueprint = requireIdentity(
    BLUEPRINT_INDEX,
    engineering.BlueprintName,
    'engineering blueprint',
  );
  const grades = CODEC_V1_BLUEPRINT_GRADES[blueprint] as readonly number[];
  if (!Number.isInteger(engineering.Level) || !grades.includes(engineering.Level)) {
    throw new BuildLinkCodecError(
      'invalidPayload',
      'Engineering grade is unavailable for its blueprint.',
    );
  }
  return {
    kind: 'ordinary',
    blueprint,
    level: engineering.Level,
    quality: engineering.Quality,
    experimental,
  };
}

function writeEngineering(
  writer: BitWriter,
  moduleIndex: number,
  engineering: CodecEngineeringState,
): void {
  const ordinaryAvailable = blueprintSetForModule(moduleIndex).length > 0;
  const preEngineeredAvailable = preEngineeredSetForModule(moduleIndex).length > 0;
  const special = engineering.kind === 'preEngineered';
  if (special && !preEngineeredAvailable) {
    throw new BuildLinkCodecError(
      'unknownIdentity',
      'The pre-engineered variant is unavailable for its fitted module.',
    );
  }
  if (!special && !ordinaryAvailable) {
    throw new BuildLinkCodecError(
      'unknownIdentity',
      'Ordinary engineering is unavailable for its fitted module.',
    );
  }
  if (ordinaryAvailable && preEngineeredAvailable) writer.writeBoolean(special);
  if (engineering.kind === 'preEngineered') {
    if (!preEngineeredSetForModule(moduleIndex).includes(engineering.variant)) {
      throw new BuildLinkCodecError(
        'unknownIdentity',
        'The pre-engineered variant is unavailable for its fitted module.',
      );
    }
    writeIndexInSet(writer, engineering.variant, preEngineeredSetForModule(moduleIndex));
    writeQuality(writer, engineering.quality);
    writeExperimentalWithDefault(
      writer,
      moduleIndex,
      engineering.experimental,
      pinnedPreEngineeredExperimentalIndex(engineering.variant),
    );
    return;
  }

  const grades = CODEC_V1_BLUEPRINT_GRADES[engineering.blueprint] as readonly number[];
  const maximumGrade = grades.at(-1)!;
  if (!Number.isInteger(engineering.level) || !grades.includes(engineering.level)) {
    throw new BuildLinkCodecError(
      'invalidPayload',
      'Engineering grade is unavailable for its blueprint.',
    );
  }
  writeContextualIndex(
    writer,
    engineering.blueprint,
    blueprintSetForModule(moduleIndex),
    BLUEPRINT_BITS,
  );
  if (grades.length > 1) {
    writer.writeBoolean(engineering.level === maximumGrade);
    if (engineering.level !== maximumGrade) {
      writer.writeBits(grades.indexOf(engineering.level), bitsRequired(grades.length - 1));
    }
  }
  writeQuality(writer, engineering.quality);
  writeExperimental(writer, moduleIndex, engineering.experimental);
}

function readEngineering(reader: BitReader, moduleIndex: number): CodecEngineeringState {
  const ordinaryAvailable = blueprintSetForModule(moduleIndex).length > 0;
  const preEngineeredAvailable = preEngineeredSetForModule(moduleIndex).length > 0;
  const special = preEngineeredAvailable && (!ordinaryAvailable || reader.readBoolean());
  if (special) {
    const variantIndex = readIndexFromSet(
      reader,
      preEngineeredSetForModule(moduleIndex),
      'pre-engineered variant',
    );
    const quality = readQuality(reader);
    const experimental = readExperimentalWithDefault(
      reader,
      moduleIndex,
      pinnedPreEngineeredExperimentalIndex(variantIndex),
    );
    return {
      kind: 'preEngineered',
      variant: variantIndex,
      quality,
      experimental,
    };
  }

  const blueprintIndex = readContextualIndex(
    reader,
    blueprintSetForModule(moduleIndex),
    BLUEPRINT_BITS,
  );
  if (!CODEC_V1_BLUEPRINTS[blueprintIndex]) {
    throw unknownTableIndex('engineering blueprint', blueprintIndex);
  }
  const grades = CODEC_V1_BLUEPRINT_GRADES[blueprintIndex] as readonly number[];
  const maximumGrade = grades.at(-1)!;
  let level = maximumGrade;
  if (grades.length > 1 && !reader.readBoolean()) {
    const gradeIndex = reader.readBits(bitsRequired(grades.length - 1));
    if (gradeIndex >= grades.length - 1) {
      throw new BuildLinkCodecError(
        'invalidPayload',
        'Engineering grade encoding is not canonical.',
      );
    }
    level = grades[gradeIndex];
  }
  if (level === undefined) throw unknownTableIndex('engineering grade', -1);

  const quality = readQuality(reader);
  const experimental = readExperimental(reader, moduleIndex);
  return {
    kind: 'ordinary',
    blueprint: blueprintIndex,
    level,
    quality,
    experimental,
  };
}

function writeQuality(writer: BitWriter, quality: number): void {
  if (!Number.isFinite(quality) || quality < 0 || quality > 1) {
    throw new BuildLinkCodecError('invalidPayload', 'Engineering quality must be from 0 to 1.');
  }
  writer.writeBoolean(quality !== 1);
  if (quality === 1) return;
  writer.writeBoolean(quality !== 0);
  if (quality === 0) return;

  const scaled4 = exactScaledQuality(quality, QUALITY_SCALE_4);
  writer.writeBoolean(scaled4 === null);
  if (scaled4 !== null) writer.writeBits(scaled4, QUALITY_BITS_4);
  else writer.writeFloat64(quality);
}

function readQuality(reader: BitReader): number {
  if (!reader.readBoolean()) return 1;
  if (!reader.readBoolean()) return 0;
  if (!reader.readBoolean()) return readScaledQuality(reader);
  const quality = reader.readUnitFloat();
  if (exactScaledQuality(quality, QUALITY_SCALE_4) !== null) {
    throw new BuildLinkCodecError('invalidPayload', 'Engineering quality is not canonical.');
  }
  return quality;
}

function exactScaledQuality(quality: number, scale: number): number | null {
  const scaled = Math.round(quality * scale);
  return scaled / scale === quality ? scaled : null;
}

function readScaledQuality(reader: BitReader): number {
  const scaled = reader.readBits(QUALITY_BITS_4);
  if (scaled <= 0 || scaled >= QUALITY_SCALE_4) {
    throw new BuildLinkCodecError('invalidPayload', 'Engineering quality is not canonical.');
  }
  return scaled / QUALITY_SCALE_4;
}

function writeExperimental(
  writer: BitWriter,
  moduleIndex: number,
  experimental: number | null,
): void {
  writer.writeBoolean(experimental !== null);
  if (experimental === null) return;
  writeContextualIndex(
    writer,
    experimental,
    experimentalSetForModule(moduleIndex),
    EXPERIMENTAL_BITS,
  );
}

function readExperimental(reader: BitReader, moduleIndex: number): number | null {
  if (!reader.readBoolean()) return null;
  const experimentalIndex = readContextualIndex(
    reader,
    experimentalSetForModule(moduleIndex),
    EXPERIMENTAL_BITS,
  );
  if (!CODEC_V1_EXPERIMENTAL_EFFECTS[experimentalIndex]) {
    throw unknownTableIndex('experimental effect', experimentalIndex);
  }
  return experimentalIndex;
}

function writeExperimentalWithDefault(
  writer: BitWriter,
  moduleIndex: number,
  experimental: number | null,
  defaultEffect: number | null,
): void {
  if (defaultEffect === null) {
    writeExperimental(writer, moduleIndex, experimental);
    return;
  }
  const matchesDefault = experimental === defaultEffect;
  writer.writeBoolean(!matchesDefault);
  if (!matchesDefault) writeExperimental(writer, moduleIndex, experimental);
}

function readExperimentalWithDefault(
  reader: BitReader,
  moduleIndex: number,
  defaultEffect: number | null,
): number | null {
  if (defaultEffect === null) return readExperimental(reader, moduleIndex);
  return reader.readBoolean() ? readExperimental(reader, moduleIndex) : defaultEffect;
}

function encodeOn(value: boolean | undefined): number {
  return value === undefined ? 0 : value ? 2 : 1;
}

function decodeOn(value: number): boolean | undefined {
  if (value === 0) return undefined;
  if (value === 1) return false;
  if (value === 2) return true;
  throw new BuildLinkCodecError('invalidPayload', 'A module enabled state is invalid.');
}

function encodePriority(value: number | undefined): number {
  if (value === undefined) return 0;
  if (!Number.isInteger(value) || value < 0 || value > 4) {
    throw new BuildLinkCodecError('invalidPayload', 'A module priority is invalid.');
  }
  return value + 1;
}

function decodePriority(value: number): number | undefined {
  if (value === 0) return undefined;
  if (value <= 5) return value - 1;
  throw new BuildLinkCodecError('invalidPayload', 'A module priority is invalid.');
}

function createIndex(values: readonly string[]): Map<string, number> {
  return new Map(values.map((value, index) => [normalise(value), index]));
}

function requireIdentity(index: Map<string, number>, value: string, kind: string): number {
  const result = index.get(normalise(value));
  if (result === undefined) {
    throw new BuildLinkCodecError(
      'unknownIdentity',
      `${kind} identity ${value} is absent from codec version 1.`,
    );
  }
  return result;
}

function unknownTableIndex(kind: string, index: number): BuildLinkCodecError {
  return new BuildLinkCodecError(
    'unknownIdentity',
    `${kind} index ${index} is absent from codec version 1.`,
  );
}

function normalise(value: string): string {
  return value.toLowerCase();
}

class BitWriter {
  private readonly bytes: number[] = [];
  private bitLength = 0;

  get length(): number {
    return this.bitLength;
  }

  writeBoolean(value: boolean): void {
    this.writeBits(value ? 1 : 0, 1);
  }

  writeBits(value: number, width: number): void {
    if (
      !Number.isSafeInteger(value) ||
      value < 0 ||
      !Number.isInteger(width) ||
      width < 1 ||
      width > 31 ||
      value >= 2 ** width
    ) {
      throw new BuildLinkCodecError('invalidPayload', 'A bit-packed integer is invalid.');
    }
    for (let bit = 0; bit < width; bit += 1) {
      const byteIndex = Math.floor(this.bitLength / 8);
      const bitIndex = this.bitLength % 8;
      this.bytes[byteIndex] ??= 0;
      if (Math.floor(value / 2 ** bit) % 2 === 1) this.bytes[byteIndex] |= 1 << bitIndex;
      this.bitLength += 1;
    }
  }

  writeVarUint(value: number): void {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new BuildLinkCodecError('invalidPayload', 'An unsigned integer is invalid.');
    }
    let remaining = value;
    do {
      const byte = remaining % 128;
      remaining = Math.floor(remaining / 128);
      this.writeBits(byte | (remaining > 0 ? 0x80 : 0), 8);
    } while (remaining > 0);
  }

  writeFloat64(value: number): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new BuildLinkCodecError('invalidPayload', 'A non-negative number is required.');
    }
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setFloat64(0, value, true);
    for (const byte of bytes) this.writeBits(byte, 8);
  }

  writeString(value: string): void {
    if (!isWellFormedUnicode(value)) {
      throw new BuildLinkCodecError('invalidPayload', 'A build-link string is not valid Unicode.');
    }
    const encoded = new TextEncoder().encode(value);
    this.writeVarUint(encoded.length);
    for (const byte of encoded) this.writeBits(byte, 8);
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

class BitReader {
  private bitOffset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get done(): boolean {
    const remaining = this.remainingBits;
    if (remaining >= 8) return false;
    for (let offset = this.bitOffset; offset < this.bytes.length * 8; offset += 1) {
      const byte = this.bytes[Math.floor(offset / 8)]!;
      if ((byte & (1 << (offset % 8))) !== 0) return false;
    }
    return true;
  }

  private get remainingBits(): number {
    return this.bytes.length * 8 - this.bitOffset;
  }

  readBoolean(): boolean {
    return this.readBits(1) === 1;
  }

  readBits(width: number): number {
    if (!Number.isInteger(width) || width < 1 || width > 31) {
      throw new BuildLinkCodecError('invalidPayload', 'A bit width is invalid.');
    }
    if (this.bitOffset + width > this.bytes.length * 8) {
      throw new BuildLinkCodecError('invalidPayload', 'The build-link payload is truncated.');
    }
    let value = 0;
    for (let bit = 0; bit < width; bit += 1) {
      const offset = this.bitOffset + bit;
      const byte = this.bytes[Math.floor(offset / 8)]!;
      if ((byte & (1 << (offset % 8))) !== 0) value += 2 ** bit;
    }
    this.bitOffset += width;
    return value;
  }

  readVarUint(): number {
    let value = 0;
    let factor = 1;
    for (let count = 0; count < 8; count += 1) {
      const byte = this.readBits(8);
      value += (byte & 0x7f) * factor;
      if (!Number.isSafeInteger(value)) {
        throw new BuildLinkCodecError('invalidPayload', 'An encoded integer is too large.');
      }
      if ((byte & 0x80) === 0) return value;
      factor *= 128;
    }
    throw new BuildLinkCodecError('invalidPayload', 'An encoded integer is too long.');
  }

  readFloat64(): number {
    const bytes = Uint8Array.from({ length: 8 }, () => this.readBits(8));
    return new DataView(bytes.buffer).getFloat64(0, true);
  }

  readNonNegativeFloat(): number {
    const value = this.readFloat64();
    if (!Number.isFinite(value) || value < 0) {
      throw new BuildLinkCodecError('invalidPayload', 'A non-negative number is required.');
    }
    return value;
  }

  readUnitFloat(): number {
    const value = this.readNonNegativeFloat();
    if (value > 1) {
      throw new BuildLinkCodecError('invalidPayload', 'Engineering quality must be from 0 to 1.');
    }
    return value;
  }

  readString(): string {
    const length = this.readVarUint();
    if (length > Math.floor(this.remainingBits / 8)) {
      throw new BuildLinkCodecError('invalidPayload', 'The build-link payload is truncated.');
    }
    const encoded = Uint8Array.from({ length }, () => this.readBits(8));
    return new TextDecoder('utf-8', { fatal: true }).decode(encoded);
  }
}

function bitsRequired(valueCount: number): number {
  let width = 1;
  let capacity = 2;
  while (capacity < valueCount) {
    width += 1;
    capacity *= 2;
  }
  return width;
}

function isWellFormedUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      if (index + 1 >= value.length) return false;
      const following = value.charCodeAt(index + 1);
      if (following < 0xdc00 || following > 0xdfff) return false;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffff_ffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb8_8320 : 0);
    }
  }
  return (crc ^ 0xffff_ffff) >>> 0;
}

const SHIP_INDEX = createIndex(CODEC_V1_SHIPS);
const MODULE_INDEX = createIndex(CODEC_V1_MODULES);
const BLUEPRINT_INDEX = createIndex(CODEC_V1_BLUEPRINTS);
const EXPERIMENTAL_INDEX = createIndex(CODEC_V1_EXPERIMENTAL_EFFECTS);
const SLOT_INDEX_BY_SHIP = new Map(
  CODEC_V1_SHIPS.map((ship) => [ship, createIndex(CODEC_V1_SLOTS_BY_SHIP[ship])]),
);
