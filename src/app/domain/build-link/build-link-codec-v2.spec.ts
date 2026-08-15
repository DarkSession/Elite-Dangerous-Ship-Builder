import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import {
  decodeBuildLinkFragment as decodeVersionOne,
  encodeBuildLinkFragment as encodeVersionOne,
} from './build-link-codec';
import {
  BuildLinkCodecError,
  decodeBuildLinkFragment,
  encodeBuildLinkFragment,
} from './build-link-codec-v2';
import { decodeBuildLinkPayload, encodeBuildLinkPayload } from './build-link-radix';
import codecV1Tables from './codec-v1.tables.json';

describe('build-link codec v2', () => {
  it('keeps its frozen literal and semantic reconstruction stable', () => {
    const source = decorativeBuild();
    const fragment = encodeBuildLinkFragment(source);

    expect(fragment).toBe('b.1OllPbKPUDRfVbodBHwEht5VR4');
    const decoded = decodeBuildLinkFragment(fragment);
    expect(decoded.shipSymbol.toLowerCase()).toBe('krait_mkii');
    expect(decoded.fittedModuleAt('MediumHardpoint1')).toMatchObject({
      symbol: 'hpt_pulselaser_fixed_small',
      engineering: {
        BlueprintName: 'Decorative_Red',
        Level: 1,
        Quality: 1,
        Modifiers: [{ Label: 'Damage', Value: 0.0205, OriginalValue: 2.05 }],
      },
    });
    expect(encodeBuildLinkFragment(decoded)).toBe(fragment);
  });

  it('rejects integrity failures and re-checksummed malformed overlays', () => {
    const fragment = encodeBuildLinkFragment(decorativeBuild());
    const tampered = decodeBuildLinkPayload(fragment.slice('b.'.length));
    tampered[0]! ^= 0b100;
    expectCodecError(
      () => decodeBuildLinkFragment(`b.${encodeBuildLinkPayload(tampered)}`),
      'integrityCheckFailed',
    );

    const versionOneLength = embeddedVersionOneLength(fragment);
    const countOffset = 4 + versionOneLength;
    const entryOffset = countOffset + 1;
    for (const malformed of [
      mutateBody(fragment, (body) => new DataView(body.buffer).setUint16(2, 0xffff, true)),
      mutateBody(fragment, (body) => {
        body[countOffset] = 0;
      }),
      mutateBody(fragment, (body) => {
        body[entryOffset] = 0xff;
      }),
      mutateBody(fragment, (body) => {
        body[entryOffset + 1] = 0xff;
      }),
    ]) {
      expectCodecError(
        () => decodeBuildLinkFragment(malformed),
        'invalidPayload',
        'unknownIdentity',
      );
    }
  });

  it('rejects duplicate decorative slots and overlays on an already-engineered module', () => {
    const duplicate = encodeBuildLinkFragment(decorativeBuild(true));
    const duplicateEntryOffset = 5 + embeddedVersionOneLength(duplicate);
    const repeatedSlot = mutateBody(duplicate, (body) => {
      body[duplicateEntryOffset + 2] = body[duplicateEntryOffset]!;
    });
    expectCodecError(() => decodeBuildLinkFragment(repeatedSlot), 'invalidPayload');

    const engineered = ShipLoadout.empty('Krait_MkII');
    const pulse = engineered
      .modulesForSlot('MediumHardpoint1')
      .find(({ symbol }) => symbol.toLowerCase() === 'hpt_pulselaser_fixed_small')!;
    engineered.setModule('MediumHardpoint1', pulse);
    engineered.applyBlueprint('MediumHardpoint1', 'Weapon_Sturdy', { grade: 5, quality: 1 });
    const slots = codecV1Tables.CODEC_V1_SLOTS_BY_SHIP.Krait_MkII;
    const slotIndex = slots.findIndex((slot) => slot.toLowerCase() === 'mediumhardpoint1');
    const overlay = overlayVersionOne(encodeVersionOne(engineered), slotIndex, 1);

    expectCodecError(() => decodeBuildLinkFragment(overlay), 'invalidPayload');
    expect(
      decodeVersionOne(encodeVersionOne(engineered)).fittedModuleAt('MediumHardpoint1'),
    ).toMatchObject({ engineering: { BlueprintName: 'Weapon_Sturdy' } });
  });
});

function decorativeBuild(twoSlots = false): ShipLoadout {
  const module = (Slot: string) => ({
    Slot,
    Item: 'Hpt_PulseLaser_Fixed_Small',
    Engineering: {
      BlueprintName: 'Decorative_Red',
      Level: 1,
      Quality: 1,
      Modifiers: [{ Label: 'Damage', Value: 0.0205, OriginalValue: 2.05 }],
    },
  });
  return ShipLoadout.fromLoadout({
    Ship: 'Krait_MkII',
    Modules: [module('MediumHardpoint1'), ...(twoSlots ? [module('MediumHardpoint2')] : [])],
  });
}

function embeddedVersionOneLength(fragment: string): number {
  const payload = decodeBuildLinkPayload(fragment.slice('b.'.length));
  return new DataView(payload.buffer, payload.byteOffset).getUint16(2, true);
}

function overlayVersionOne(fragment: string, slot: number, modification: number): string {
  const versionOne = decodeBuildLinkPayload(fragment.slice('b.'.length));
  const body = new Uint8Array(5 + versionOne.length + 2);
  body[0] = 2;
  new DataView(body.buffer).setUint16(2, versionOne.length, true);
  body.set(versionOne, 4);
  body[4 + versionOne.length] = 1;
  body[5 + versionOne.length] = slot;
  body[6 + versionOne.length] = modification;
  return envelope(body);
}

function mutateBody(fragment: string, mutate: (body: Uint8Array) => void): string {
  const payload = decodeBuildLinkPayload(fragment.slice('b.'.length));
  const body = payload.slice(0, -4);
  mutate(body);
  return envelope(body);
}

function envelope(body: Uint8Array): string {
  const payload = new Uint8Array(body.length + 4);
  payload.set(body);
  new DataView(payload.buffer).setUint32(body.length, crc32(body), true);
  return `b.${encodeBuildLinkPayload(payload)}`;
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

function expectCodecError(
  action: () => unknown,
  ...codes: readonly ('integrityCheckFailed' | 'invalidPayload' | 'unknownIdentity')[]
): void {
  try {
    action();
    expect.fail('Expected the codec to reject the input.');
  } catch (error) {
    expect(error).toBeInstanceOf(BuildLinkCodecError);
    expect(codes).toContain((error as BuildLinkCodecError).code);
  }
}
