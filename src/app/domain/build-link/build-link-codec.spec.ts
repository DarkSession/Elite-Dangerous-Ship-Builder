import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { PRE_ENGINEERED_MODULES } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import { getPreEngineeredModifiers } from '@elite-dangerous-almanac/core/ships/pre-engineered-stats';
import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';
import type { LoadoutEvent } from '@elite-dangerous-almanac/core/ships/slef';
import {
  BuildLinkCodecError,
  decodeBuildLinkFragment,
  encodeBuildLinkFragment,
} from './build-link-codec';

describe('build-link codec proof of concept', () => {
  it('round-trips the minimal state imported through the Almanac', () => {
    const source = makeImportedEngineeredBuild();

    const decoded = decodeBuildLinkFragment(encodeBuildLinkFragment(source));
    const reimported = ShipLoadout.fromSlef(
      decoded.toSlefString({
        header: { appName: 'Compression POC', appVersion: 1 },
      }),
    );

    expect(minimalState(decoded)).toEqual(minimalState(source));
    expect(minimalState(reimported)).toEqual(minimalState(source));
  });

  it('keeps exact non-terminal engineering quality but omits all credit values', () => {
    const source = makeImportedEngineeredBuild(true);
    const withoutCredits = makeImportedEngineeredBuild(false);

    const encoded = encodeBuildLinkFragment(source);
    const decoded = decodeBuildLinkFragment(encoded);

    expect(decoded.fittedModuleAt('FrameShiftDrive')?.engineering?.Quality).toBe(0.73123456789);
    expect(source.sourcePurchase).not.toBeNull();
    expect(decoded.sourcePurchase).toBeNull();
    expect(encoded).toBe(encodeBuildLinkFragment(withoutCredits));
    expect(decoded.toLoadoutEvent().HullValue).toBe(source.toLoadoutEvent().HullValue);
    expect(decoded.toLoadoutEvent().ModulesValue).toBe(source.toLoadoutEvent().ModulesValue);
    expect(decoded.toLoadoutEvent().Rebuy).toBe(source.toLoadoutEvent().Rebuy);
  });

  it('round-trips the zero-quality engineering boundary without a special effect', () => {
    const source = ShipLoadout.default('Krait_MkII');
    source.applyBlueprint('FrameShiftDrive', 'FSD_LongRange', { grade: 1, quality: 0 });

    const decoded = decodeBuildLinkFragment(encodeBuildLinkFragment(source));

    expect(decoded.fittedModuleAt('FrameShiftDrive')?.engineering).toMatchObject({
      BlueprintName: 'FSD_LongRange',
      Level: 1,
      Quality: 0,
    });
    expect(
      decoded.fittedModuleAt('FrameShiftDrive')?.engineering?.ExperimentalEffect,
    ).toBeUndefined();
  });

  it('uses pinned slot order instead of carrying SLEF module-array order', () => {
    const source = ShipLoadout.default('Krait_MkII');
    const event = source.toLoadoutEvent({ moduleOrder: 'slots' });
    const reordered = ShipLoadout.fromLoadout({ ...event, Modules: [...event.Modules].reverse() });

    const decoded = decodeBuildLinkFragment(encodeBuildLinkFragment(reordered));

    expect(minimalState(decoded)).toEqual(minimalState(reordered));
  });

  it('round-trips dense power states through their compact value modes', () => {
    const allEnabled = ShipLoadout.default('Krait_MkII');
    const allDisabled = ShipLoadout.default('Krait_MkII');
    const priorityOnly = ShipLoadout.default('Krait_MkII');
    const partlySpecified = ShipLoadout.default('Krait_MkII');

    for (const module of allEnabled.fittedModules()) allEnabled.setModuleEnabled(module.slot, true);
    for (const module of allDisabled.fittedModules()) {
      allDisabled.setModuleEnabled(module.slot, false);
      allDisabled.setModulePriority(module.slot, 3);
    }
    for (const module of priorityOnly.fittedModules()) {
      priorityOnly.setModulePriority(module.slot, 2);
      partlySpecified.setModulePriority(module.slot, 2);
    }
    partlySpecified.setModuleEnabled(partlySpecified.fittedModules()[0]!.slot, true);

    for (const source of [allEnabled, allDisabled, priorityOnly, partlySpecified]) {
      expect(minimalState(decodeBuildLinkFragment(encodeBuildLinkFragment(source)))).toEqual(
        minimalState(source),
      );
    }
  });

  it('round-trips every pinned hull in empty and stock configurations', () => {
    const corpus = SHIPS.flatMap(({ symbol }) => [
      ShipLoadout.empty(symbol),
      ShipLoadout.default(symbol),
    ]);

    for (const source of corpus) {
      expect(minimalState(decodeBuildLinkFragment(encodeBuildLinkFragment(source)))).toEqual(
        minimalState(source),
      );
    }

    const longest = corpus
      .map((loadout) => ({
        ship: loadout.shipSymbol,
        length: `https://ships.example/#${encodeBuildLinkFragment(loadout)}`.length,
      }))
      .sort((left, right) => right.length - left.length || left.ship.localeCompare(right.ship))[0];
    expect(longest).toEqual({ ship: 'Adder', length: 36 });
  });

  it('preserves package-identified pre-engineered variants and their effective stats', () => {
    const source = ShipLoadout.fromLoadout({
      Ship: 'Krait_MkII',
      Modules: [
        {
          Slot: 'LargeHardpoint1',
          Item: 'Hpt_Mining_AbrBlstr_Fixed_Small',
          Engineering: {
            BlueprintName: 'Weapon_LongRange',
            Level: 5,
            Quality: 1,
            Modifiers: [
              { Label: 'DistributorDraw', Value: 1, OriginalValue: 2 },
              { Label: 'FalloffRange', Value: 5_000, OriginalValue: 1_000 },
              { Label: 'Integrity', Value: 20, OriginalValue: 40 },
              { Label: 'MaximumRange', Value: 5_000, OriginalValue: 1_000 },
              { Label: 'PowerDraw', Value: 0.17, OriginalValue: 0.34 },
              { Label: 'ThermalLoad', Value: 1, OriginalValue: 2 },
            ],
          },
        },
      ],
    });

    const decoded = decodeBuildLinkFragment(encodeBuildLinkFragment(source));
    const sourceModule = source.fittedModuleAt('LargeHardpoint1')!;
    const decodedModule = decoded.fittedModuleAt('LargeHardpoint1')!;

    expect(sourceModule.preEngineeredVariant).not.toBeNull();
    expect(decodedModule.preEngineeredVariant).toEqual(sourceModule.preEngineeredVariant);
    expect(decodedModule.effectiveStats).toEqual(sourceModule.effectiveStats);
  });

  it('round-trips every package-identifiable fixed pre-engineered variant', () => {
    const identifiable = PRE_ENGINEERED_MODULES.filter(({ modifiers }) => modifiers?.length);
    expect(identifiable).toHaveLength(51);

    for (const variant of identifiable) {
      const source = ShipLoadout.fromLoadout({
        Ship: 'Krait_MkII',
        Modules: [
          {
            Slot: 'LargeHardpoint1',
            Item: variant.symbol,
            Engineering: {
              BlueprintName: variant.blueprint,
              Level: variant.grade,
              Quality: 1,
              ...(variant.experimental === undefined
                ? {}
                : { ExperimentalEffect: variant.experimental }),
              Modifiers: getPreEngineeredModifiers(variant),
            },
          },
        ],
      });
      const decoded = decodeBuildLinkFragment(encodeBuildLinkFragment(source));

      expect(decoded.fittedModuleAt('LargeHardpoint1')?.preEngineeredVariant).toEqual(
        source.fittedModuleAt('LargeHardpoint1')?.preEngineeredVariant,
      );
      expect(decoded.fittedModuleAt('LargeHardpoint1')?.effectiveStats).toEqual(
        source.fittedModuleAt('LargeHardpoint1')?.effectiveStats,
      );
    }
  });

  it('preserves every decorative modification and its authoritative package-resolved stats', () => {
    for (const fdname of ['Decorative_Green', 'Decorative_Red', 'Decorative_Yellow']) {
      const source = ShipLoadout.fromLoadout({
        Ship: 'Krait_MkII',
        Modules: [
          {
            Slot: 'MediumHardpoint1',
            Item: 'Hpt_FlakMortar_Turret_Medium',
            Engineering: {
              BlueprintName: fdname,
              Level: 1,
              Quality: 1,
              Modifiers: [{ Label: 'Damage', Value: 0.34, OriginalValue: 34 }],
            },
          },
        ],
      });

      const decoded = decodeBuildLinkFragment(encodeBuildLinkFragment(source));

      expect(decoded.fittedModuleAt('MediumHardpoint1')?.engineering).toEqual(
        source.fittedModuleAt('MediumHardpoint1')?.engineering,
      );
      expect(decoded.fittedModuleAt('MediumHardpoint1')?.effectiveStats).toEqual(
        source.fittedModuleAt('MediumHardpoint1')?.effectiveStats,
      );
    }
  });

  it('stores the table version as the first field inside the payload', () => {
    const encoded = encodeBuildLinkFragment(ShipLoadout.empty('SideWinder'));

    expect(decodePayload(encoded)[0]).toBe(1);
  });

  it('meets the reference link-length targets', () => {
    const baseUrl = 'https://ships.example/';
    const large = makeFullyEngineeredAnaconda();
    const emptyFragment = encodeBuildLinkFragment(ShipLoadout.empty('SideWinder'));
    const typicalFragment = encodeBuildLinkFragment(ShipLoadout.default('Krait_MkII'));
    const largeFragment = encodeBuildLinkFragment(large);
    const emptyLink = `${baseUrl}#${emptyFragment}`;
    const typicalLink = `${baseUrl}#${typicalFragment}`;
    const largeLink = `${baseUrl}#${largeFragment}`;
    expect([emptyFragment, typicalFragment, largeFragment]).toEqual([
      'b.AQAEAH19lP0',
      'b.ASABEacAHA',
      'b.ARL4_____wcIECBAQMCBQCAQCAQC_w9gAAEEBBBAAP9v37__7thojBqNjcZGY6ONbDQ22rEzdsbO2Bk7Y2fsjJ3P8zzP8zzZt2-zzWabjcj7uRkRAVol',
    ]);
    expect([emptyLink.length, typicalLink.length, largeLink.length]).toEqual([36, 35, 141]);

    expect(emptyLink.length).toBeLessThan(100);
    expect(typicalLink.length).toBeLessThan(300);
    expect(largeLink.length).toBeLessThanOrEqual(500);
    expect(minimalState(decodeBuildLinkFragment(largeFragment))).toEqual(minimalState(large));

    encodeBuildLinkFragment(large);
    const encodeStarted = performance.now();
    const measuredFragment = encodeBuildLinkFragment(large);
    const encodeDuration = performance.now() - encodeStarted;
    const decodeStarted = performance.now();
    decodeBuildLinkFragment(measuredFragment);
    const decodeDuration = performance.now() - decodeStarted;
    expect(encodeDuration).toBeLessThan(50);
    expect(decodeDuration).toBeLessThan(50);
  });

  it('accepts a leading fragment marker', () => {
    const source = ShipLoadout.default('SideWinder');
    const encoded = encodeBuildLinkFragment(source);

    expect(decodeBuildLinkFragment(`#${encoded}`).shipSymbol).toBe(source.shipSymbol);
  });

  it('refuses unsupported versions', () => {
    const encoded = encodeBuildLinkFragment(ShipLoadout.empty('SideWinder'));

    expectCodecError(
      () => decodeBuildLinkFragment(withPayloadVersion(encoded, 2)),
      'unsupportedVersion',
    );
    expectCodecError(() => decodeBuildLinkFragment('b1.AAAA'), 'unsupportedVersion');
  });

  it('refuses identities absent from the pinned version table', () => {
    const unresolvedSlot = ShipLoadout.fromLoadout({
      Ship: 'SideWinder',
      Modules: [{ Slot: 'ImpossibleSlot', Item: 'UnknownModule' }],
    });
    const unresolvedModule = ShipLoadout.fromLoadout({
      Ship: 'SideWinder',
      Modules: [{ Slot: 'SmallHardpoint1', Item: 'UnknownModule' }],
    });

    expectCodecError(() => encodeBuildLinkFragment(unresolvedSlot), 'unknownIdentity');
    expectCodecError(() => encodeBuildLinkFragment(unresolvedModule), 'unknownIdentity');
  });

  it('refuses truncated and malformed encodings', () => {
    expectCodecError(() => decodeBuildLinkFragment('b.'), 'invalidEncoding');
    expectCodecError(() => decodeBuildLinkFragment(`b.${'A'.repeat(8_193)}`), 'invalidEncoding');
    expectCodecError(() => decodeBuildLinkFragment('b.AAAA'), 'invalidPayload');
    expectCodecError(() => decodeBuildLinkFragment('b.not+base64'), 'invalidEncoding');
  });

  it('refuses to encode a fragment its own decoder length limit would reject', () => {
    const oversized = ShipLoadout.fromLoadout({
      Ship: 'SideWinder',
      ShipName: 'A'.repeat(7_000),
      Modules: [],
    });

    expectCodecError(() => encodeBuildLinkFragment(oversized), 'invalidPayload');
  });

  it('validates version-one fields before reconstructing a build', () => {
    const empty = encodeBuildLinkFragment(ShipLoadout.empty('SideWinder'));
    const stock = encodeBuildLinkFragment(ShipLoadout.default('SideWinder'));

    expectCodecError(
      () => decodeBuildLinkFragment(withPayloadBits(empty, 8, 6, 63)),
      'unknownIdentity',
    );
    expectCodecError(
      () => decodeBuildLinkFragment(withPayloadBits(empty, 19, 5, 31)),
      'invalidPayload',
    );
    expectCodecError(
      () => decodeBuildLinkFragment(withPayloadBits(stock, 16, 1, 0)),
      'invalidPayload',
    );
    expectCodecError(() => decodeBuildLinkFragment(withTrailingByte(empty)), 'invalidPayload');
  });

  it('refuses a payload changed after export', () => {
    const encoded = encodeBuildLinkFragment(ShipLoadout.default('SideWinder'));
    const position = Math.floor(encoded.length / 2);
    const replacement = encoded[position] === 'A' ? 'B' : 'A';
    const tampered = `${encoded.slice(0, position)}${replacement}${encoded.slice(position + 1)}`;

    expectCodecError(() => decodeBuildLinkFragment(tampered), 'integrityCheckFailed');
  });
});

function makeImportedEngineeredBuild(includeCredits = true): ShipLoadout {
  const assembled = ShipLoadout.default('Krait_MkII');
  assembled.applyBlueprint('FrameShiftDrive', 'FSD_LongRange', {
    grade: 5,
    quality: 0.73123456789,
    experimental: 'special_fsd_heavy',
  });
  assembled.setModuleEnabled('FrameShiftDrive', false);
  assembled.setModulePriority('FrameShiftDrive', 4);
  const exported = assembled.toLoadoutEvent({ moduleOrder: 'slots' });
  const event: LoadoutEvent = {
    event: 'Loadout',
    Ship: exported.Ship,
    ShipName: 'Astraea 星',
    ShipIdent: 'POC-42',
    ...(includeCredits
      ? {
          HullValue: 12_345_678.5,
          ModulesValue: 9_876_543.25,
          Rebuy: 1_111_111.125,
        }
      : {}),
    Modules: exported.Modules.map(({ Value: _value, ...module }, index) =>
      includeCredits && index % 3 === 0 ? { ...module, Value: index * 1000 + 0.5 } : module,
    ),
  };
  return ShipLoadout.fromSlef([
    {
      header: { appName: 'Compression POC', appVersion: 1 },
      data: event,
    },
  ]);
}

function makeFullyEngineeredAnaconda(): ShipLoadout {
  const loadout = ShipLoadout.default('Anaconda');
  for (const slot of loadout.slots()) {
    if (slot.module || !slot.removable) continue;
    const candidate = loadout.modulesForSlot(slot.key).find((module) => {
      try {
        loadout.setModule(slot.key, module);
        return true;
      } catch {
        return false;
      }
    });
    expect(candidate, `a module for ${slot.key}`).toBeDefined();
  }

  for (const [index, module] of loadout.fittedModules().entries()) {
    loadout.setModuleEnabled(module.slot, index % 7 !== 0);
    loadout.setModulePriority(module.slot, index % 5);
    const blueprint = loadout.availableBlueprints(module.slot).at(-1);
    if (!blueprint) continue;
    const experimental = loadout.availableExperimentalEffects(module.slot).at(-1);
    loadout.applyBlueprint(module.slot, blueprint.fdname, {
      grade: blueprint.grades.at(-1)!,
      quality: 1,
      ...(experimental ? { experimental } : {}),
    });
  }
  return loadout;
}

function minimalState(loadout: ShipLoadout): unknown {
  return {
    shipSymbol: loadout.shipSymbol.toLowerCase(),
    shipName: loadout.shipName,
    shipIdent: loadout.shipIdent,
    modules: loadout
      .fittedModules()
      .map((module) => ({
        slot: module.slot.toLowerCase(),
        symbol: module.symbol.toLowerCase(),
        on: module.on,
        priority: module.priority,
        engineering:
          module.engineering === undefined
            ? undefined
            : {
                blueprint: module.engineering.BlueprintName.toLowerCase(),
                grade: module.engineering.Level,
                quality: module.engineering.Quality,
                experimental: module.engineering.ExperimentalEffect?.toLowerCase(),
              },
      }))
      .sort((left, right) => left.slot.localeCompare(right.slot)),
  };
}

function decodePayload(fragment: string): Uint8Array {
  const encoded = fragment.slice('b.'.length);
  const padded = encoded
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), '=');
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function withPayloadVersion(fragment: string, version: number): string {
  return withPayloadByte(fragment, 0, version);
}

function withPayloadByte(fragment: string, index: number, value: number): string {
  const payload = decodePayload(fragment);
  payload[index] = value;
  return encodePayload(payload);
}

function withPayloadBits(fragment: string, offset: number, width: number, value: number): string {
  const payload = decodePayload(fragment);
  for (let bit = 0; bit < width; bit += 1) {
    const absolute = offset + bit;
    const byteIndex = Math.floor(absolute / 8);
    const mask = 1 << (absolute % 8);
    if ((value & (1 << bit)) === 0) payload[byteIndex]! &= ~mask;
    else payload[byteIndex]! |= mask;
  }
  return encodePayload(payload);
}

function withTrailingByte(fragment: string): string {
  const payload = decodePayload(fragment);
  const body = payload.subarray(0, payload.length - 4);
  const expanded = new Uint8Array(payload.length + 1);
  expanded.set(body);
  expanded[body.length] = 0;
  return encodePayload(expanded);
}

function encodePayload(payload: Uint8Array): string {
  const body = payload.subarray(0, payload.length - 4);
  new DataView(payload.buffer, payload.byteOffset).setUint32(body.length, crc32(body), true);
  let binary = '';
  for (const byte of payload) binary += String.fromCharCode(byte);
  return `b.${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')}`;
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
  operation: () => unknown,
  code: InstanceType<typeof BuildLinkCodecError>['code'],
): void {
  try {
    operation();
    expect.fail('Expected the codec to reject the input.');
  } catch (error) {
    expect(error).toBeInstanceOf(BuildLinkCodecError);
    expect((error as BuildLinkCodecError).code).toBe(code);
  }
}
