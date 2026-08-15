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
import {
  decodeBuildLinkFragment as decodeBuildLinkFragmentOnDemand,
  encodeBuildLinkFragment as encodeBuildLinkFragmentOnDemand,
} from './build-link-codec-loader';
import {
  BUILD_LINK_FINAL_ALPHABET,
  decodeBuildLinkPayload,
  encodeBuildLinkPayload,
} from './build-link-radix';
import codecV1Tables from './codec-v1.tables.json';
import realisticEngineeredCorvette from './realistic-engineered-corvette.fixture.json';

describe('build-link codec', () => {
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
    expect(decoded.fittedModuleAt('FrameShiftDrive')?.engineering?.Modifiers).toEqual(
      source.fittedModuleAt('FrameShiftDrive')?.engineering?.Modifiers,
    );
    expect(decoded.fittedModuleAt('FrameShiftDrive')?.effectiveStats).toEqual(
      source.fittedModuleAt('FrameShiftDrive')?.effectiveStats,
    );
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

  it('uses exact compact fixed-point storage for four-decimal journal quality', () => {
    const source = ShipLoadout.default('Krait_MkII');
    const floatEscape = ShipLoadout.default('Krait_MkII');
    source.applyBlueprint('FrameShiftDrive', 'FSD_LongRange', {
      grade: 5,
      quality: 0.9438,
    });
    floatEscape.applyBlueprint('FrameShiftDrive', 'FSD_LongRange', {
      grade: 5,
      quality: 0.943812345,
    });

    const decoded = decodeBuildLinkFragment(encodeBuildLinkFragment(source));

    expect(decoded.fittedModuleAt('FrameShiftDrive')?.engineering?.Quality).toBe(0.9438);
    expect(encodeBuildLinkFragment(source).length).toBeLessThan(
      encodeBuildLinkFragment(floatEscape).length,
    );
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

  it('treats the cargo hatch as a fixed module and serialises only its power state', () => {
    const stock = ShipLoadout.default('Krait_MkII');
    const event = stock.toLoadoutEvent({ moduleOrder: 'slots' });
    const withoutCargoHatch = ShipLoadout.fromLoadout({
      ...event,
      Modules: event.Modules.filter(({ Slot }) => Slot.toLowerCase() !== 'cargohatch'),
    });
    const powered = ShipLoadout.default('Krait_MkII');
    powered.setModuleEnabled('CargoHatch', false);
    powered.setModulePriority('CargoHatch', 4);

    expect(encodeBuildLinkFragment(withoutCargoHatch)).toBe(encodeBuildLinkFragment(stock));
    const decoded = decodeBuildLinkFragment(encodeBuildLinkFragment(powered));
    expect(decoded.fittedModuleAt('CargoHatch')).toMatchObject({
      symbol: 'ModularCargoBayDoor',
      on: false,
      priority: 4,
    });
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
    expect(longest).toEqual({ ship: 'Adder', length: 35 });
  });

  it('round-trips a sanitised real journal build including calculated engineering state', () => {
    const source = ShipLoadout.fromSlef(
      realisticEngineeredCorvette as Parameters<typeof ShipLoadout.fromSlef>[0],
    );
    const fragment = encodeBuildLinkFragment(source);
    const decoded = decodeBuildLinkFragment(fragment);
    const event = source.toLoadoutEvent({ moduleOrder: 'slots' });
    const expected = ShipLoadout.fromLoadout({
      ...event,
      Modules: event.Modules.map(({ Engineering: _engineering, ...module }) => module),
    });
    for (const module of source.fittedModules()) {
      if (!module.engineering) continue;
      expected.applyBlueprint(module.slot, module.engineering.BlueprintName, {
        grade: module.engineering.Level,
        quality: module.engineering.Quality,
        ...(module.engineering.ExperimentalEffect === undefined
          ? {}
          : { experimental: module.engineering.ExperimentalEffect }),
      });
    }

    expect(minimalState(decoded)).toEqual(minimalState(source));
    for (const module of expected.fittedModules()) {
      expect(decoded.fittedModuleAt(module.slot)?.effectiveStats).toEqual(module.effectiveStats);
    }
    expect(encodeBuildLinkFragment(decoded)).toBe(fragment);
    expect(fragment).toBe(
      'b.620+T.w$pbsJZ/44HAtL5DO*ik.QDUEJv@G/a2CpG2Pd0TVVtWhiBk-RfPOkw!i0WLQdJA3RbRN6kdvMcn~wfoVJEF!M0K+~~nN+e6y8rD+f@krO**5JQ',
    );
    expect(`https://ships.example/#${fragment}`).toHaveLength(142);
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
    expect(encodeBuildLinkFragment(source)).toBe('b.QiIwal~zVIx8');
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

  it('refuses decorative modifications until the Almanac exposes a supported resolver', () => {
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

      expectCodecError(() => encodeBuildLinkFragment(source), 'unknownIdentity');
    }
  });

  it('stores the table version as the first field inside the payload', () => {
    const encoded = encodeBuildLinkFragment(ShipLoadout.empty('SideWinder'));

    expect(readPayloadBits(encoded, 0, 10)).toBe(1);
    expect(readPayloadBits(withPayloadVersion(encoded, 1_023), 0, 10)).toBe(1_023);
  });

  it('loads the payload-declared codec and tables on demand', async () => {
    const source = ShipLoadout.default('Krait_MkII');
    const encoded = await encodeBuildLinkFragmentOnDemand(source);

    expect(minimalState(await decodeBuildLinkFragmentOnDemand(encoded))).toEqual(
      minimalState(source),
    );
    await expect(
      decodeBuildLinkFragmentOnDemand(withPayloadVersion(encoded, 513)),
    ).rejects.toMatchObject({ code: 'unsupportedVersion' });
  });

  it('keeps literal special-build links stable in the decode direction', () => {
    const preEngineered = decodeBuildLinkFragment('b.QiIwal~zVIx8');

    expect(minimalState(preEngineered)).toEqual({
      shipSymbol: 'krait_mkii',
      shipName: null,
      shipIdent: null,
      modules: [
        {
          slot: 'largehardpoint1',
          symbol: 'hpt_mining_abrblstr_fixed_small',
          on: undefined,
          priority: undefined,
          engineering: {
            blueprint: 'weapon_longrange',
            grade: 5,
            quality: 1,
            experimental: undefined,
          },
        },
      ],
    });
    expect(preEngineered.fittedModuleAt('LargeHardpoint1')).toMatchObject({
      preEngineeredVariant: {
        symbol: 'Hpt_Mining_AbrBlstr_Fixed_Small',
        blueprint: 'Weapon_LongRange',
        grade: 5,
        acquisition: 'communityGoal',
      },
      effectiveStats: {
        integrity: 20,
        powerDraw: 0.17,
        distributorDraw: 1,
        thermalLoad: 1,
        falloffRange: 5_000,
        maximumRange: 5_000,
      },
    });
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
      'b.1WGofBv1qz',
      'b.j05F1hq4',
      'b.$r--q!jo_LNuP1e54__g+BthxYbG*E/585pvN2Gp@W$QHaoOtrfgD!8gJp8LM/VvV$jT6wMJgMd77aC5hr*@l/x3',
    ]);
    expect([emptyLink.length, typicalLink.length, largeLink.length]).toEqual([35, 33, 113]);

    expect(emptyLink.length).toBeLessThan(100);
    expect(typicalLink.length).toBeLessThan(300);
    expect(largeLink.length).toBeLessThanOrEqual(500);
    expect(minimalState(decodeBuildLinkFragment(largeFragment))).toEqual(minimalState(large));
    for (const fragment of [emptyFragment, typicalFragment, largeFragment]) {
      expect(encodeBuildLinkFragment(decodeBuildLinkFragment(fragment))).toBe(fragment);
    }

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
      () => decodeBuildLinkFragment(withPayloadVersion(encoded, 513)),
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
    expectCodecError(() => decodeBuildLinkFragment(`b.${'A'.repeat(501)}`), 'invalidEncoding');
    expectCodecError(() => decodeBuildLinkFragment('b.AAAA'), 'invalidPayload');
    expectCodecError(() => decodeBuildLinkFragment('b.not%base73'), 'invalidEncoding');
    const canonical = encodeBuildLinkFragment(ShipLoadout.default('Krait_MkII'));
    expectCodecError(
      () => decodeBuildLinkFragment(`${canonical.slice(0, -1)}!`),
      'invalidEncoding',
    );
  });

  it('always ends Base73 fragments with an autolinker-safe alphanumeric digit', () => {
    for (const { symbol } of SHIPS) {
      for (const source of [ShipLoadout.empty(symbol), ShipLoadout.default(symbol)]) {
        expect(BUILD_LINK_FINAL_ALPHABET).toContain(encodeBuildLinkFragment(source).at(-1));
      }
    }
  });

  it('rejects a semantically valid but non-canonical index-set mode', () => {
    expectCodecError(
      () => decodeBuildLinkFragment(nonCanonicalEmptySidewinder()),
      'invalidPayload',
    );
  });

  it('either rejects re-checksummed mutations or decodes them canonically', () => {
    const references = [
      encodeBuildLinkFragment(ShipLoadout.empty('SideWinder')),
      encodeBuildLinkFragment(ShipLoadout.default('Krait_MkII')),
      encodeBuildLinkFragment(makeFullyEngineeredAnaconda()),
    ];
    let state = 0x6d2b_79f5;
    for (let iteration = 0; iteration < 2_000; iteration += 1) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      const payload = decodePayload(references[iteration % references.length]!);
      const bodyBits = (payload.length - 4) * 8;
      const bit = (state >>> 0) % bodyBits;
      payload[Math.floor(bit / 8)]! ^= 1 << (bit % 8);
      const mutated = encodePayload(payload);
      try {
        const decoded = decodeBuildLinkFragment(mutated);
        expect(encodeBuildLinkFragment(decoded)).toBe(mutated);
      } catch (error) {
        expect(error).toBeInstanceOf(BuildLinkCodecError);
      }
    }
  });

  it('rejects lone UTF-16 surrogates instead of changing the ship name', () => {
    const target = ShipLoadout.empty('SideWinder');
    const source = new Proxy(target, {
      get(loadout, property) {
        if (property === 'shipName') return '\ud800';
        const value: unknown = Reflect.get(loadout, property, loadout);
        return typeof value === 'function' ? value.bind(loadout) : value;
      },
    });
    expectCodecError(() => encodeBuildLinkFragment(source), 'invalidPayload');
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
      () => decodeBuildLinkFragment(withPayloadBits(empty, 10, 6, 63)),
      'unknownIdentity',
    );
    expectCodecError(
      () => decodeBuildLinkFragment(withPayloadBits(empty, 21, 5, 31)),
      'invalidPayload',
    );
    expectCodecError(
      () => decodeBuildLinkFragment(withPayloadBits(stock, 18, 1, 0)),
      'invalidPayload',
    );
    expectCodecError(() => decodeBuildLinkFragment(withTrailingByte(empty)), 'invalidPayload');
  });

  it('refuses a payload changed after export', () => {
    const encoded = encodeBuildLinkFragment(ShipLoadout.default('SideWinder'));
    const payload = decodePayload(encoded);
    payload[0]! ^= 0b100;
    const tampered = `b.${encodeBuildLinkPayload(payload)}`;

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
  return decodeBuildLinkPayload(fragment.slice('b.'.length));
}

function withPayloadVersion(fragment: string, version: number): string {
  return withPayloadBits(fragment, 0, 10, version);
}

function readPayloadBits(fragment: string, offset: number, width: number): number {
  const payload = decodePayload(fragment);
  let value = 0;
  for (let bit = 0; bit < width; bit += 1) {
    const absolute = offset + bit;
    const byteIndex = Math.floor(absolute / 8);
    const mask = 1 << (absolute % 8);
    if ((payload[byteIndex]! & mask) !== 0) value |= 1 << bit;
  }
  return value;
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
  return `b.${encodeBuildLinkPayload(payload)}`;
}

function nonCanonicalEmptySidewinder(): string {
  const canonical = decodePayload(encodeBuildLinkFragment(ShipLoadout.empty('SideWinder')));
  const canonicalBody = canonical.subarray(0, canonical.length - 4);
  const bits: number[] = [];
  for (let offset = 0; offset < 20; offset += 1) {
    bits.push((canonicalBody[Math.floor(offset / 8)]! >> (offset % 8)) & 1);
  }

  // Mode 1 spells the changed defaults as an included sparse list; bitmap mode is cheaper.
  writeTestBits(bits, 1, 2);
  const defaults = codecV1Tables.CODEC_V1_DEFAULT_MODULES_BY_SHIP.SideWinder;
  const changed = defaults.flatMap((module, index) => (module === null ? [] : [index]));
  writeTestBits(bits, changed.length, 5);
  for (const index of changed) writeTestBits(bits, index, 5);
  for (const _index of changed) writeTestBits(bits, 0, 1);
  writeTestBits(bits, 0, 1); // no power overrides
  writeTestBits(bits, 0, 1); // no engineering

  const body = new Uint8Array(Math.ceil(bits.length / 8));
  bits.forEach((bit, offset) => {
    if (bit === 1) body[Math.floor(offset / 8)]! |= 1 << (offset % 8);
  });
  const payload = new Uint8Array(body.length + 4);
  payload.set(body);
  return encodePayload(payload);
}

function writeTestBits(bits: number[], value: number, width: number): void {
  for (let bit = 0; bit < width; bit += 1) bits.push((value >> bit) & 1);
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
