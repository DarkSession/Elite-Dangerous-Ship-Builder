import {
  getDecorativeModifiers,
  unresolvedDecorativeModifiers,
} from '@elite-dangerous-almanac/core/ships/decorative-modification-stats';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { ModuleEngineering } from '@elite-dangerous-almanac/core/ships/slef';
import {
  decodeBuildLinkFragment as decodeVersionOne,
  encodeBuildLinkFragment as encodeVersionOne,
} from './build-link-codec';
import { BuildLinkCodecError } from './build-link-codec-error';
import { decodeBuildLinkPayload, encodeBuildLinkPayload } from './build-link-radix';
import codecV1TablesJson from './codec-v1.tables.json';
import codecV2TablesJson from './codec-v2.tables.json';

export { BuildLinkCodecError } from './build-link-codec-error';
export type { BuildLinkCodecErrorCode } from './build-link-codec-error';

interface CodecV1Slots {
  readonly CODEC_V1_SLOTS_BY_SHIP: Readonly<Record<string, readonly string[]>>;
}

interface CodecV2Tables {
  readonly CODEC_V2_DECORATIVE_MODIFICATIONS: readonly string[];
}

const { CODEC_V1_SLOTS_BY_SHIP } = codecV1TablesJson as CodecV1Slots;
const { CODEC_V2_DECORATIVE_MODIFICATIONS } = codecV2TablesJson as CodecV2Tables;

const FRAGMENT_PREFIX = 'b.';
const CODEC_VERSION = 2;
const MAX_ENCODED_LENGTH = 500;
const CRC_LENGTH = 4;
const HEADER_LENGTH = 5;
const DECORATIVE_INDEX = new Map(
  CODEC_V2_DECORATIVE_MODIFICATIONS.map((fdname, index) => [normalise(fdname), index]),
);
const SLOTS_BY_NORMALISED_SHIP = new Map(
  Object.entries(CODEC_V1_SLOTS_BY_SHIP).map(([ship, slots]) => [normalise(ship), slots]),
);

type DecorativeEntry = {
  readonly slotIndex: number;
  readonly modification: number;
};

/** Encode a decorative build as a canonical v1 loadout plus its package-owned transformation ids. */
export function encodeBuildLinkFragment(loadout: ShipLoadout): string {
  const slots = SLOTS_BY_NORMALISED_SHIP.get(normalise(loadout.shipSymbol));
  if (!slots) {
    throw new BuildLinkCodecError(
      'unknownIdentity',
      `No codec slots exist for ${loadout.shipSymbol}.`,
    );
  }
  const slotIndex = new Map(slots.map((slot, index) => [normalise(slot), index]));
  const decorations = loadout
    .fittedModules()
    .flatMap((module): DecorativeEntry[] => {
      const engineering = module.engineering;
      if (engineering === undefined) return [];
      const modification = DECORATIVE_INDEX.get(normalise(engineering.BlueprintName));
      if (modification === undefined) return [];
      const encodedSlot = slotIndex.get(normalise(module.slot));
      if (encodedSlot === undefined) {
        throw new BuildLinkCodecError(
          'unknownIdentity',
          `Decorative slot ${module.slot} is absent from codec version 2.`,
        );
      }
      requireDecorativeEngineering(module.symbol, modification, engineering);
      return [{ slotIndex: encodedSlot, modification }];
    })
    .sort((left, right) => left.slotIndex - right.slotIndex);
  if (decorations.length === 0) {
    throw new BuildLinkCodecError(
      'invalidPayload',
      'Codec version 2 requires at least one decorative modification.',
    );
  }

  const decoratedSlots = new Set(
    decorations.map(({ slotIndex: index }) => normalise(slots[index]!)),
  );
  const event = loadout.toLoadoutEvent({ moduleOrder: 'slots' });
  const undecorated = ShipLoadout.fromLoadout({
    ...event,
    Modules: event.Modules.map((module) => {
      if (!decoratedSlots.has(normalise(module.Slot))) return module;
      const { Engineering: _engineering, ...plainModule } = module;
      return plainModule;
    }),
  });
  const versionOnePayload = decodeBuildLinkPayload(
    encodeVersionOne(undecorated).slice(FRAGMENT_PREFIX.length),
  );
  if (versionOnePayload.length > 0xffff || decorations.length > 0xff) {
    throw new BuildLinkCodecError('invalidPayload', 'The decorative build is too large.');
  }

  const body = new Uint8Array(HEADER_LENGTH + versionOnePayload.length + decorations.length * 2);
  body[0] = CODEC_VERSION;
  body[1] = 0;
  new DataView(body.buffer).setUint16(2, versionOnePayload.length, true);
  body.set(versionOnePayload, 4);
  body[4 + versionOnePayload.length] = decorations.length;
  decorations.forEach(({ slotIndex: encodedSlot, modification }, index) => {
    const offset = HEADER_LENGTH + versionOnePayload.length + index * 2;
    body[offset] = encodedSlot;
    body[offset + 1] = modification;
  });
  return encodeEnvelope(body);
}

/** Decode the v2 decorative overlay, preserving the embedded immutable v1 build. */
export function decodeBuildLinkFragment(fragment: string): ShipLoadout {
  const { value, body } = decodeEnvelope(fragment);
  try {
    if (body.length < HEADER_LENGTH || body[0] !== CODEC_VERSION || body[1] !== 0) {
      throw new BuildLinkCodecError(
        'unsupportedVersion',
        'Build-link codec version 2 is not supported by this payload.',
      );
    }
    const versionOneLength = new DataView(body.buffer, body.byteOffset).getUint16(2, true);
    const countOffset = 4 + versionOneLength;
    if (countOffset >= body.length) {
      throw new BuildLinkCodecError('invalidPayload', 'The build-link payload is truncated.');
    }
    const count = body[countOffset]!;
    if (count === 0 || body.length !== HEADER_LENGTH + versionOneLength + count * 2) {
      throw new BuildLinkCodecError('invalidPayload', 'The decorative overlay is invalid.');
    }

    const versionOnePayload = body.subarray(4, countOffset);
    const loadout = decodeVersionOne(
      `${FRAGMENT_PREFIX}${encodeBuildLinkPayload(versionOnePayload)}`,
    );
    const slots = SLOTS_BY_NORMALISED_SHIP.get(normalise(loadout.shipSymbol));
    if (!slots) throw new BuildLinkCodecError('unknownIdentity', 'The pinned ship has no slots.');

    const decorations = new Map<string, ModuleEngineering>();
    let previousSlot = -1;
    for (let index = 0; index < count; index += 1) {
      const offset = countOffset + 1 + index * 2;
      const encodedSlot = body[offset]!;
      const modification = body[offset + 1]!;
      const slot = slots[encodedSlot];
      if (slot === undefined || encodedSlot <= previousSlot) {
        throw new BuildLinkCodecError(
          'invalidPayload',
          'Decorative slots are not strictly ordered.',
        );
      }
      previousSlot = encodedSlot;
      const module = loadout.fittedModuleAt(slot);
      if (!module || module.engineering !== undefined) {
        throw new BuildLinkCodecError(
          'invalidPayload',
          'A decorative slot does not contain an unengineered module.',
        );
      }
      decorations.set(normalise(slot), resolveDecorativeEngineering(module.symbol, modification));
    }

    const event = loadout.toLoadoutEvent({ moduleOrder: 'slots' });
    const decorated = ShipLoadout.fromLoadout({
      ...event,
      Modules: event.Modules.map((module) => {
        const engineering = decorations.get(normalise(module.Slot));
        return engineering === undefined ? module : { ...module, Engineering: engineering };
      }),
    });
    if (encodeBuildLinkFragment(decorated) !== value) {
      throw new BuildLinkCodecError('invalidPayload', 'The build-link encoding is not canonical.');
    }
    return decorated;
  } catch (error) {
    if (error instanceof BuildLinkCodecError) throw error;
    throw new BuildLinkCodecError('invalidPayload', 'The build-link payload is invalid.');
  }
}

function requireDecorativeEngineering(
  symbol: string,
  modification: number,
  engineering: ModuleEngineering,
): void {
  if (
    engineering.Level !== 1 ||
    engineering.Quality !== 1 ||
    engineering.ExperimentalEffect !== undefined
  ) {
    throw new BuildLinkCodecError(
      'invalidPayload',
      'Decorative engineering must use its fixed package-defined state.',
    );
  }
  resolveDecorativeEngineering(symbol, modification);
}

function resolveDecorativeEngineering(symbol: string, modification: number): ModuleEngineering {
  const fdname = CODEC_V2_DECORATIVE_MODIFICATIONS[modification];
  if (!fdname) {
    throw new BuildLinkCodecError('unknownIdentity', 'The decorative identity is not pinned.');
  }
  const modifiers = getDecorativeModifiers(symbol, fdname);
  const unresolved = unresolvedDecorativeModifiers(symbol, fdname);
  if (modifiers === null || unresolved === null || unresolved.length > 0) {
    throw new BuildLinkCodecError(
      'unknownIdentity',
      'The decorative modification cannot be reconstructed by the Almanac.',
    );
  }
  return { BlueprintName: fdname, Level: 1, Quality: 1, Modifiers: modifiers };
}

function encodeEnvelope(body: Uint8Array): string {
  const payload = new Uint8Array(body.length + CRC_LENGTH);
  payload.set(body);
  new DataView(payload.buffer).setUint32(body.length, crc32(body), true);
  const fragment = `${FRAGMENT_PREFIX}${encodeBuildLinkPayload(payload)}`;
  if (fragment.length - FRAGMENT_PREFIX.length > MAX_ENCODED_LENGTH) {
    throw new BuildLinkCodecError('invalidPayload', 'The encoded build exceeds the link limit.');
  }
  return fragment;
}

function decodeEnvelope(fragment: string): { value: string; body: Uint8Array } {
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
  return { value, body };
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

function normalise(value: string): string {
  return value.trim().toLowerCase();
}
