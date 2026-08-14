import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { getDecorativeModification } from '@elite-dangerous-almanac/core/ships/decorative-modifications';
import { PRE_ENGINEERED_MODULES } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import type { PreEngineeredVariant } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import { getPreEngineeredModifiers } from '@elite-dangerous-almanac/core/ships/pre-engineered-stats';
import type {
  LoadoutEvent,
  LoadoutModule,
  ModuleEngineering,
} from '@elite-dangerous-almanac/core/ships/slef';
import {
  CODEC_V1_BLUEPRINT_SET_BY_MODULE,
  CODEC_V1_BLUEPRINT_SETS,
  CODEC_V1_BLUEPRINT_GRADES,
  CODEC_V1_BLUEPRINTS,
  CODEC_V1_DECORATIVE_MODIFICATIONS,
  CODEC_V1_DECORATIVE_SET_BY_MODULE,
  CODEC_V1_DEFAULT_MODULES_BY_SHIP,
  CODEC_V1_EXPERIMENTAL_SET_BY_MODULE,
  CODEC_V1_EXPERIMENTAL_SETS,
  CODEC_V1_EXPERIMENTAL_EFFECTS,
  CODEC_V1_MODULE_SET_BY_SHIP,
  CODEC_V1_MODULE_SETS,
  CODEC_V1_MODULES,
  CODEC_V1_PRE_ENGINEERED_SET_BY_MODULE,
  CODEC_V1_PRE_ENGINEERED_VARIANTS,
  CODEC_V1_SHIPS,
  CODEC_V1_SLOTS_BY_SHIP,
} from './codec-v1.tables';

const FRAGMENT_PREFIX = 'b.';
const CODEC_VERSION = 1;
const MAX_ENCODED_LENGTH = 8_192;
const CRC_LENGTH = 4;
const VERSION_BITS = 8;
const SHIP_BITS = bitsRequired(CODEC_V1_SHIPS.length);
const MODULE_BITS = bitsRequired(CODEC_V1_MODULES.length);
const BLUEPRINT_BITS = bitsRequired(CODEC_V1_BLUEPRINTS.length);
const EXPERIMENTAL_BITS = bitsRequired(CODEC_V1_EXPERIMENTAL_EFFECTS.length + 1);

export type BuildLinkCodecErrorCode =
  | 'invalidEncoding'
  | 'integrityCheckFailed'
  | 'unsupportedVersion'
  | 'invalidPayload'
  | 'unknownIdentity';

export class BuildLinkCodecError extends Error {
  constructor(
    readonly code: BuildLinkCodecErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BuildLinkCodecError';
  }
}

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
  const slotIndex = SLOT_INDEX_BY_SHIP.get(canonicalShip);
  if (!slots || !slotIndex) {
    throw new BuildLinkCodecError('unknownIdentity', `No codec slots exist for ${canonicalShip}.`);
  }

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
  const pristine = moduleIndexes.every(
    (moduleIndex, index) =>
      moduleIndex === defaults[index] &&
      moduleAt(modulesBySlot, slots[index])?.on === undefined &&
      moduleAt(modulesBySlot, slots[index])?.priority === undefined &&
      moduleAt(modulesBySlot, slots[index])?.engineering === undefined,
  );
  writer.writeBoolean(pristine);
  if (!pristine) {
    writeModuleIdentities(writer, canonicalShip, slots, defaults, moduleIndexes);
    const occupiedSlots = indexesWhere(moduleIndexes, (moduleIndex) => moduleIndex !== null);
    const occupiedModules = occupiedSlots.map((index) => moduleAt(modulesBySlot, slots[index])!);
    writePowerStates(writer, occupiedModules);
    writeEngineeringStates(writer, occupiedModules, moduleIndexes, occupiedSlots);
  }

  const body = writer.toUint8Array();
  const payload = new Uint8Array(body.length + CRC_LENGTH);
  payload.set(body);
  new DataView(payload.buffer).setUint32(body.length, crc32(body), true);
  const fragment = `${FRAGMENT_PREFIX}${toBase64Url(payload)}`;
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

  const payload = fromBase64Url(encoded);
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
    return readVersionOneLoadout(reader);
  } catch (error) {
    if (error instanceof BuildLinkCodecError) throw error;
    const message = error instanceof Error ? error.message : 'The build-link payload is invalid.';
    throw new BuildLinkCodecError('invalidPayload', message);
  }
}

function readVersionOneLoadout(reader: BitReader): ShipLoadout {
  const shipIndex = reader.readBits(SHIP_BITS);
  const ship = CODEC_V1_SHIPS[shipIndex];
  if (!ship) throw unknownTableIndex('ship', shipIndex);
  const slots = CODEC_V1_SLOTS_BY_SHIP[ship];

  const hasShipName = reader.readBoolean();
  const hasShipIdent = reader.readBoolean();
  const shipName = hasShipName ? reader.readString() : undefined;
  const shipIdent = hasShipIdent ? reader.readString() : undefined;
  const pristine = reader.readBoolean();
  const moduleIndexes = pristine
    ? [...CODEC_V1_DEFAULT_MODULES_BY_SHIP[ship]]
    : readModuleIdentities(reader, ship, slots);
  const occupiedSlots = indexesWhere(moduleIndexes, (moduleIndex) => moduleIndex !== null);
  const powerStates = pristine
    ? occupiedSlots.map(() => ({ on: undefined, priority: undefined }))
    : readPowerStates(reader, occupiedSlots.length);
  const engineeringStates = pristine
    ? occupiedSlots.map(() => undefined)
    : readEngineeringStates(reader, moduleIndexes, occupiedSlots);

  const modules: LoadoutModule[] = occupiedSlots.map((slotIndex, occupiedIndex) => {
    const moduleIndex = moduleIndexes[slotIndex]!;
    const item = CODEC_V1_MODULES[moduleIndex];
    if (!item) throw unknownTableIndex('module', moduleIndex);
    const { on, priority } = powerStates[occupiedIndex]!;
    const engineering = engineeringStates[occupiedIndex];
    return {
      Slot: slots[slotIndex],
      Item: item,
      ...(on === undefined ? {} : { On: on }),
      ...(priority === undefined ? {} : { Priority: priority }),
      ...(engineering === undefined ? {} : { Engineering: engineering }),
    };
  });

  if (!reader.done) {
    throw new BuildLinkCodecError('invalidPayload', 'The build-link payload has trailing data.');
  }

  const event: LoadoutEvent = {
    event: 'Loadout',
    Ship: ship,
    ...(shipName === undefined ? {} : { ShipName: shipName }),
    ...(shipIdent === undefined ? {} : { ShipIdent: shipIdent }),
    Modules: modules,
  };
  return ShipLoadout.fromLoadout(event);
}

type CodecShip = keyof typeof CODEC_V1_SLOTS_BY_SHIP;
type PowerState = { on: boolean | undefined; priority: number | undefined };
type CodecFittedModule = ReturnType<ShipLoadout['fittedModules']>[number];

function writeModuleIdentities(
  writer: BitWriter,
  ship: CodecShip,
  slots: readonly string[],
  defaults: readonly (number | null)[],
  modules: readonly (number | null)[],
): void {
  const changed = indexesWhere(modules, (moduleIndex, index) => moduleIndex !== defaults[index]);
  const occupied = indexesWhere(modules, (moduleIndex) => moduleIndex !== null);
  const baselineCost =
    indexSetBitCost(slots.length, changed) +
    changed.reduce((cost, slotIndex) => {
      const moduleIndex = modules[slotIndex];
      return (
        cost +
        1 +
        (moduleIndex === null
          ? 0
          : moduleIdentityBitCost(moduleIndex, moduleSetForSlot(ship, slotIndex), null))
      );
    }, 0);
  const absoluteCost =
    indexSetBitCost(slots.length, occupied) +
    occupied.reduce(
      (cost, slotIndex) =>
        cost +
        moduleIdentityBitCost(
          modules[slotIndex]!,
          moduleSetForSlot(ship, slotIndex),
          defaults[slotIndex] ?? null,
        ),
      0,
    );
  const useBaseline = baselineCost <= absoluteCost;
  writer.writeBoolean(useBaseline);

  if (useBaseline) {
    writeIndexSet(writer, slots.length, changed);
    for (const slotIndex of changed) {
      const moduleIndex = modules[slotIndex];
      writer.writeBoolean(moduleIndex !== null);
      if (moduleIndex !== null) {
        writeModuleIdentity(writer, moduleIndex, moduleSetForSlot(ship, slotIndex), null);
      }
    }
    return;
  }

  writeIndexSet(writer, slots.length, occupied);
  for (const slotIndex of occupied) {
    writeModuleIdentity(
      writer,
      modules[slotIndex]!,
      moduleSetForSlot(ship, slotIndex),
      defaults[slotIndex] ?? null,
    );
  }
}

function readModuleIdentities(
  reader: BitReader,
  ship: CodecShip,
  slots: readonly string[],
): Array<number | null> {
  const defaults = CODEC_V1_DEFAULT_MODULES_BY_SHIP[ship] as readonly (number | null)[];
  const useBaseline = reader.readBoolean();
  if (useBaseline) {
    const modules = [...defaults];
    for (const slotIndex of readIndexSet(reader, slots.length)) {
      modules[slotIndex] = reader.readBoolean()
        ? readModuleIdentity(reader, moduleSetForSlot(ship, slotIndex), null)
        : null;
    }
    return modules;
  }

  const modules: Array<number | null> = slots.map(() => null);
  for (const slotIndex of readIndexSet(reader, slots.length)) {
    modules[slotIndex] = readModuleIdentity(
      reader,
      moduleSetForSlot(ship, slotIndex),
      defaults[slotIndex] ?? null,
    );
  }
  return modules;
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

  const fixedCost = fixedPowerBitCost(modules);
  const sparseCost = indexSetBitCost(modules.length, overrides) + overrides.length * 5;
  const fixed = fixedCost <= sparseCost;
  writer.writeBoolean(fixed);
  if (fixed) {
    writeFixedPowerStates(writer, modules);
    return;
  }

  writeIndexSet(writer, modules.length, overrides);
  for (const index of overrides) {
    const module = modules[index]!;
    writer.writeBits(encodeOn(module.on), 2);
    writer.writeBits(encodePriority(module.priority), 3);
  }
}

function readPowerStates(reader: BitReader, moduleCount: number): PowerState[] {
  const states: PowerState[] = Array.from({ length: moduleCount }, () => ({
    on: undefined,
    priority: undefined,
  }));
  if (!reader.readBoolean()) return states;

  const fixed = reader.readBoolean();
  if (fixed) return readFixedPowerStates(reader, moduleCount);

  for (const index of readIndexSet(reader, moduleCount)) {
    states[index] = {
      on: decodeOn(reader.readBits(2)),
      priority: decodePriority(reader.readBits(3)),
    };
  }
  return states;
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
  const on =
    onMode === 0
      ? Array<boolean | undefined>(moduleCount).fill(undefined)
      : onMode === 1
        ? Array<boolean | undefined>(moduleCount).fill(true)
        : onMode === 2
          ? Array<boolean | undefined>(moduleCount).fill(false)
          : reader.readBoolean()
            ? Array.from({ length: moduleCount }, () => reader.readBoolean())
            : Array.from({ length: moduleCount }, () => decodeOn(reader.readBits(2)));
  const uniformPriority = reader.readBoolean();
  const priority = uniformPriority
    ? Array<number | undefined>(moduleCount).fill(decodePriority(reader.readBits(3)))
    : Array.from({ length: moduleCount }, () => decodePriority(reader.readBits(3)));
  return on.map((value, index) => ({ on: value, priority: priority[index] }));
}

function writeEngineeringStates(
  writer: BitWriter,
  modules: readonly CodecFittedModule[],
  moduleIndexes: readonly (number | null)[],
  occupiedSlots: readonly number[],
): void {
  const engineered = indexesWhere(modules, ({ engineering }) => engineering !== undefined);
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
  for (const occupiedIndex of engineered) {
    writeEngineering(
      writer,
      moduleIndexes[occupiedSlots[occupiedIndex]!]!,
      modules[occupiedIndex]!,
    );
  }
}

function readEngineeringStates(
  reader: BitReader,
  moduleIndexes: readonly (number | null)[],
  occupiedSlots: readonly number[],
): Array<ModuleEngineering | undefined> {
  const states: Array<ModuleEngineering | undefined> = occupiedSlots.map(() => undefined);
  if (!reader.readBoolean()) return states;

  const eligible = engineeringEligibleIndexes(moduleIndexes, occupiedSlots);
  const all = reader.readBoolean();
  const engineered = all
    ? eligible
    : readIndexSet(reader, eligible.length).map((index) => eligible[index]!);
  for (const occupiedIndex of engineered) {
    const moduleIndex = moduleIndexes[occupiedSlots[occupiedIndex]!]!;
    states[occupiedIndex] = readEngineering(reader, moduleIndex);
  }
  return states;
}

function engineeringEligibleIndexes(
  moduleIndexes: readonly (number | null)[],
  occupiedSlots: readonly number[],
): number[] {
  return indexesWhere(occupiedSlots, (slotIndex) => {
    const moduleIndex = moduleIndexes[slotIndex]!;
    return (
      blueprintSetForModule(moduleIndex).length > 0 ||
      preEngineeredSetForModule(moduleIndex).length > 0 ||
      decorativeSetForModule(moduleIndex).length > 0
    );
  });
}

function writeIndexSet(writer: BitWriter, valueCount: number, indexes: readonly number[]): void {
  const sparseBits = bitsRequired(valueCount + 1) + indexes.length * bitsRequired(valueCount);
  const sparse = sparseBits < valueCount;
  writer.writeBoolean(sparse);
  if (sparse) {
    writer.writeBits(indexes.length, bitsRequired(valueCount + 1));
    for (const index of indexes) writer.writeBits(index, bitsRequired(valueCount));
    return;
  }
  const included = new Set(indexes);
  for (let index = 0; index < valueCount; index += 1) writer.writeBoolean(included.has(index));
}

function readIndexSet(reader: BitReader, valueCount: number): number[] {
  const sparse = reader.readBoolean();
  if (!sparse)
    return indexesWhere(
      Array.from({ length: valueCount }, () => 0),
      () => reader.readBoolean(),
    );

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

function indexSetBitCost(valueCount: number, indexes: readonly number[]): number {
  return (
    1 +
    Math.min(valueCount, bitsRequired(valueCount + 1) + indexes.length * bitsRequired(valueCount))
  );
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
  return reader.readBoolean()
    ? readIndexFromSet(reader, context, 'contextual identity')
    : reader.readBits(globalBits);
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

function decorativeSetForModule(moduleIndex: number): readonly number[] {
  return CODEC_V1_DECORATIVE_SET_BY_MODULE[moduleIndex] ?? [];
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

function writeEngineering(writer: BitWriter, moduleIndex: number, module: CodecFittedModule): void {
  const engineering = module.engineering!;
  const preEngineeredIndex =
    module.preEngineeredVariant === null
      ? -1
      : PRE_ENGINEERED_MODULES.indexOf(module.preEngineeredVariant);
  const decorativeIndex = CODEC_V1_DECORATIVE_MODIFICATIONS.findIndex(
    (fdname) => normalise(fdname) === normalise(engineering.BlueprintName),
  );
  const special = preEngineeredIndex !== -1 || decorativeIndex !== -1;
  const ordinaryAvailable = blueprintSetForModule(moduleIndex).length > 0;
  const preEngineeredAvailable = preEngineeredSetForModule(moduleIndex).length > 0;
  const decorativeAvailable = decorativeSetForModule(moduleIndex).length > 0;
  const hasSpecialCandidates = preEngineeredAvailable || decorativeAvailable;
  if (special && !hasSpecialCandidates) {
    throw new BuildLinkCodecError(
      'unknownIdentity',
      'The special engineering identity is unavailable for its fitted module.',
    );
  }
  if (!special && !ordinaryAvailable) {
    throw new BuildLinkCodecError(
      'unknownIdentity',
      'Ordinary engineering is unavailable for its fitted module.',
    );
  }
  if (ordinaryAvailable && hasSpecialCandidates) writer.writeBoolean(special);
  if (special) {
    const decorative = preEngineeredIndex === -1;
    if (preEngineeredAvailable && decorativeAvailable) writer.writeBoolean(decorative);
    if (decorative) {
      if (!decorativeSetForModule(moduleIndex).includes(decorativeIndex)) {
        throw new BuildLinkCodecError(
          'unknownIdentity',
          'The decorative modification is unavailable for its fitted module.',
        );
      }
      writeIndexInSet(writer, decorativeIndex, decorativeSetForModule(moduleIndex));
      if (!Number.isInteger(engineering.Level) || engineering.Level < 1 || engineering.Level > 5) {
        throw new BuildLinkCodecError('invalidPayload', 'Decorative grade must be from 1 to 5.');
      }
      writer.writeBoolean(engineering.Level !== 1);
      if (engineering.Level !== 1) writer.writeBits(engineering.Level - 2, 2);
    } else {
      if (!preEngineeredSetForModule(moduleIndex).includes(preEngineeredIndex)) {
        throw new BuildLinkCodecError(
          'unknownIdentity',
          'The pre-engineered variant is unavailable for its fitted module.',
        );
      }
      writeIndexInSet(writer, preEngineeredIndex, preEngineeredSetForModule(moduleIndex));
    }
    writeQuality(writer, engineering.Quality);
    if (decorative) writeExperimental(writer, moduleIndex, engineering.ExperimentalEffect);
    else {
      writeExperimentalWithDefault(
        writer,
        moduleIndex,
        engineering.ExperimentalEffect,
        PRE_ENGINEERED_MODULES[preEngineeredIndex]!.experimental,
      );
    }
    return;
  }

  const blueprint = requireIdentity(
    BLUEPRINT_INDEX,
    engineering.BlueprintName,
    'engineering blueprint',
  );
  const grades = CODEC_V1_BLUEPRINT_GRADES[blueprint] as readonly number[];
  const maximumGrade = grades.at(-1)!;
  if (!Number.isInteger(engineering.Level) || !grades.includes(engineering.Level)) {
    throw new BuildLinkCodecError(
      'invalidPayload',
      'Engineering grade is unavailable for its blueprint.',
    );
  }
  writeContextualIndex(writer, blueprint, blueprintSetForModule(moduleIndex), BLUEPRINT_BITS);
  if (grades.length > 1) {
    writer.writeBoolean(engineering.Level === maximumGrade);
    if (engineering.Level !== maximumGrade) {
      writer.writeBits(grades.indexOf(engineering.Level), bitsRequired(grades.length - 1));
    }
  }
  writeQuality(writer, engineering.Quality);
  writeExperimental(writer, moduleIndex, engineering.ExperimentalEffect);
}

function readEngineering(reader: BitReader, moduleIndex: number): ModuleEngineering {
  const ordinaryAvailable = blueprintSetForModule(moduleIndex).length > 0;
  const preEngineeredAvailable = preEngineeredSetForModule(moduleIndex).length > 0;
  const decorativeAvailable = decorativeSetForModule(moduleIndex).length > 0;
  const hasSpecialCandidates = preEngineeredAvailable || decorativeAvailable;
  const special = hasSpecialCandidates && (!ordinaryAvailable || reader.readBoolean());
  if (special) {
    const decorative = decorativeAvailable && (!preEngineeredAvailable || reader.readBoolean());
    if (decorative) {
      const decorativeIndex = readIndexFromSet(
        reader,
        decorativeSetForModule(moduleIndex),
        'decorative modification',
      );
      const fdname = CODEC_V1_DECORATIVE_MODIFICATIONS[decorativeIndex];
      if (!fdname) throw unknownTableIndex('decorative modification', decorativeIndex);
      const record = getDecorativeModification(fdname);
      if (!record) throw unknownTableIndex('decorative modification', decorativeIndex);
      const level = reader.readBoolean() ? reader.readBits(2) + 2 : 1;
      const quality = readQuality(reader);
      const experimental = readExperimental(reader, moduleIndex);
      const resolverInput = {
        symbol: CODEC_V1_MODULES[moduleIndex],
        modifiers: record.modifiers,
        ...(experimental === undefined ? {} : { experimental }),
      } as unknown as PreEngineeredVariant;
      return {
        BlueprintName: fdname,
        Level: level,
        Quality: quality,
        ...(experimental === undefined ? {} : { ExperimentalEffect: experimental }),
        Modifiers: getPreEngineeredModifiers(resolverInput),
      };
    }

    const variantIndex = readIndexFromSet(
      reader,
      preEngineeredSetForModule(moduleIndex),
      'pre-engineered variant',
    );
    const variant = resolvePreEngineeredVariant(variantIndex);
    const quality = readQuality(reader);
    const experimental = readExperimentalWithDefault(reader, moduleIndex, variant.experimental);
    const resolvedVariant = {
      ...variant,
      ...(experimental === undefined ? { experimental: undefined } : { experimental }),
    } as PreEngineeredVariant;
    return {
      BlueprintName: variant.blueprint,
      Level: variant.grade,
      Quality: quality,
      ...(experimental === undefined ? {} : { ExperimentalEffect: experimental }),
      Modifiers: getPreEngineeredModifiers(resolvedVariant),
    };
  }

  const blueprintIndex = readContextualIndex(
    reader,
    blueprintSetForModule(moduleIndex),
    BLUEPRINT_BITS,
  );
  const blueprint = CODEC_V1_BLUEPRINTS[blueprintIndex];
  if (!blueprint) throw unknownTableIndex('engineering blueprint', blueprintIndex);
  const grades = CODEC_V1_BLUEPRINT_GRADES[blueprintIndex] as readonly number[];
  const maximumGrade = grades.at(-1)!;
  const level =
    grades.length === 1 || reader.readBoolean()
      ? maximumGrade
      : grades[reader.readBits(bitsRequired(grades.length - 1))];
  if (level === undefined) throw unknownTableIndex('engineering grade', -1);

  const quality = readQuality(reader);
  const experimental = readExperimental(reader, moduleIndex);
  return {
    BlueprintName: blueprint,
    Level: level,
    Quality: quality,
    ...(experimental === undefined ? {} : { ExperimentalEffect: experimental }),
  };
}

function writeQuality(writer: BitWriter, quality: number): void {
  if (!Number.isFinite(quality) || quality < 0 || quality > 1) {
    throw new BuildLinkCodecError('invalidPayload', 'Engineering quality must be from 0 to 1.');
  }
  writer.writeBoolean(quality !== 1);
  if (quality !== 1) writer.writeBoolean(quality !== 0);
  if (quality !== 0 && quality !== 1) writer.writeFloat64(quality);
}

function readQuality(reader: BitReader): number {
  return reader.readBoolean() ? (reader.readBoolean() ? reader.readUnitFloat() : 0) : 1;
}

function writeExperimental(
  writer: BitWriter,
  moduleIndex: number,
  experimentalEffect: string | undefined,
): void {
  writer.writeBoolean(experimentalEffect !== undefined);
  if (experimentalEffect === undefined) return;
  const experimental = requireIdentity(
    EXPERIMENTAL_INDEX,
    experimentalEffect,
    'experimental effect',
  );
  writeContextualIndex(
    writer,
    experimental,
    experimentalSetForModule(moduleIndex),
    EXPERIMENTAL_BITS,
  );
}

function readExperimental(reader: BitReader, moduleIndex: number): string | undefined {
  if (!reader.readBoolean()) return undefined;
  const experimentalIndex = readContextualIndex(
    reader,
    experimentalSetForModule(moduleIndex),
    EXPERIMENTAL_BITS,
  );
  const experimental = CODEC_V1_EXPERIMENTAL_EFFECTS[experimentalIndex];
  if (!experimental) throw unknownTableIndex('experimental effect', experimentalIndex);
  return experimental;
}

function writeExperimentalWithDefault(
  writer: BitWriter,
  moduleIndex: number,
  experimentalEffect: string | undefined,
  defaultEffect: string | undefined,
): void {
  if (defaultEffect === undefined) {
    writeExperimental(writer, moduleIndex, experimentalEffect);
    return;
  }
  const matchesDefault =
    experimentalEffect !== undefined && normalise(experimentalEffect) === normalise(defaultEffect);
  writer.writeBoolean(!matchesDefault);
  if (!matchesDefault) writeExperimental(writer, moduleIndex, experimentalEffect);
}

function readExperimentalWithDefault(
  reader: BitReader,
  moduleIndex: number,
  defaultEffect: string | undefined,
): string | undefined {
  if (defaultEffect === undefined) return readExperimental(reader, moduleIndex);
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
  return Math.max(1, Math.ceil(Math.log2(valueCount)));
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/u.test(value) || value.length % 4 === 1) {
    throw new BuildLinkCodecError('invalidEncoding', 'The build-link encoding is invalid.');
  }
  try {
    const padded = value
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new BuildLinkCodecError('invalidEncoding', 'The build-link encoding is invalid.');
  }
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
