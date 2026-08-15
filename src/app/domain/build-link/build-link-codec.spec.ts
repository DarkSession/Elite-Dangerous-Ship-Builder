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

  it('omits passive-module power fields but retains the cargo hatch power state', () => {
    const stock = ShipLoadout.default('Krait_MkII');
    const passiveFields = ShipLoadout.default('Krait_MkII');
    passiveFields.setModuleEnabled('Armour', false);
    passiveFields.setModulePriority('Armour', 4);
    passiveFields.setModuleEnabled('PlanetaryApproachSuite', false);
    passiveFields.setModulePriority('PlanetaryApproachSuite', 4);
    const event = stock.toLoadoutEvent({ moduleOrder: 'slots' });
    const withoutCargoHatch = ShipLoadout.fromLoadout({
      ...event,
      Modules: event.Modules.filter(({ Slot }) => Slot.toLowerCase() !== 'cargohatch'),
    });
    const powered = ShipLoadout.default('Krait_MkII');
    powered.setModuleEnabled('CargoHatch', false);
    powered.setModulePriority('CargoHatch', 4);

    expect(encodeBuildLinkFragment(passiveFields)).toBe(encodeBuildLinkFragment(stock));
    expect(
      decodeBuildLinkFragment(encodeBuildLinkFragment(passiveFields)).fittedModuleAt('Armour'),
    ).toMatchObject({ on: undefined, priority: undefined });
    expect(
      decodeBuildLinkFragment(encodeBuildLinkFragment(passiveFields)).fittedModuleAt(
        'PlanetaryApproachSuite',
      ),
    ).toMatchObject({ on: undefined, priority: undefined });
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

  it('reconstructs the external modifier corpus through the journal-equivalent Almanac API', () => {
    const source = ShipLoadout.fromSlef(
      realisticEngineeredCorvette as Parameters<typeof ShipLoadout.fromSlef>[0],
    );
    const fragment = encodeBuildLinkFragment(source);
    const decoded = decodeBuildLinkFragment(fragment);
    const differingModifierSlots: string[] = [];
    for (const module of source.fittedModules()) {
      if (module.engineering !== undefined) {
        expect(module.engineering.Modifiers?.length ?? 0).toBeGreaterThan(0);
        const numericShape = (modifiers: typeof module.engineering.Modifiers) =>
          modifiers?.map(({ Label, Value, OriginalValue }) => ({ Label, Value, OriginalValue }));
        if (
          JSON.stringify(
            numericShape(decoded.fittedModuleAt(module.slot)?.engineering?.Modifiers),
          ) !== JSON.stringify(numericShape(module.engineering.Modifiers))
        ) {
          differingModifierSlots.push(module.slot);
        }
      }
    }
    // The source itself reports a partial quality with complete G5 values in this one slot.
    expect(differingModifierSlots).toEqual(['smallhardpoint2']);

    expect(minimalState(decoded)).toEqual(minimalState(source));
    expect(encodeBuildLinkFragment(decoded)).toBe(fragment);
    expect(fragment).toBe(
      'b.FOv7tGRXKalK9SvJ24XMW7vzR.SG$v28lCSNfJqh8-f5eQLSobwc9JsQ1NeWyv:v5EGfapDg-QgVE:bOI1lEoxQs5j7Jw5gizsH7@zk:IuncA8BNXXW-Y',
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
    expect(encodeBuildLinkFragment(source)).toBe('b.kpL1WJMipEk8');
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

  it('round-trips package-identified decorative modifications and their effective stats', async () => {
    const cases = [
      {
        fdname: 'Decorative_Green',
        module: 'Hpt_FlakMortar_Turret_Medium',
        modifier: { Label: 'Damage', Value: 0.34, OriginalValue: 34 },
      },
      {
        fdname: 'Decorative_Red',
        module: 'Hpt_PulseLaser_Fixed_Small',
        modifier: { Label: 'Damage', Value: 0.0205, OriginalValue: 2.05 },
      },
      {
        fdname: 'Decorative_Yellow',
        module: 'Hpt_FlakMortar_Turret_Medium',
        modifier: { Label: 'Damage', Value: 0.34, OriginalValue: 34 },
      },
    ];
    for (const { fdname, module, modifier } of cases) {
      const source = ShipLoadout.fromLoadout({
        Ship: 'Krait_MkII',
        Modules: [
          {
            Slot: 'MediumHardpoint1',
            Item: module,
            Engineering: {
              BlueprintName: fdname,
              Level: 1,
              Quality: 1,
              Modifiers: [modifier],
            },
          },
        ],
      });

      const fragment = await encodeBuildLinkFragmentOnDemand(source);
      const decoded = await decodeBuildLinkFragmentOnDemand(fragment);

      expect(readPayloadBits(fragment, 0, 10)).toBe(2);
      expect(`https://ships.example/#${fragment}`.length).toBeLessThanOrEqual(500);
      expect(minimalState(decoded)).toEqual(minimalState(source));
      expect(decoded.fittedModuleAt('MediumHardpoint1')?.engineering?.Modifiers).toEqual([
        modifier,
      ]);
      expect(decoded.fittedModuleAt('MediumHardpoint1')?.effectiveStats).toEqual(
        source.fittedModuleAt('MediumHardpoint1')?.effectiveStats,
      );
      expect(await encodeBuildLinkFragmentOnDemand(decoded)).toBe(fragment);
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

  it('keeps the frozen literal special-build link stable in the decode direction', () => {
    // Freeze before release; once v1 ships, never regenerate this fixture to make a build pass.
    const preEngineered = decodeBuildLinkFragment('b.kpL1WJMipEk8');

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
    // Freeze before release; once v1 ships, never regenerate these fixtures to make a build pass.
    expect([emptyFragment, typicalFragment, largeFragment]).toEqual([
      'b.2I85Wn!NOz',
      'b..7HU@.H4',
      'b.3L5F:lK@0XafSWqm2QX@tu!lbrpvhJV5LPSSAqDXsVY0gZfQ4U1tHQkge@qOGmijcGoi$xGpxJM$NT!9CK',
    ]);
    expect([emptyLink.length, typicalLink.length, largeLink.length]).toEqual([35, 33, 107]);

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
    expectCodecError(() => decodeBuildLinkFragment('b.not%base69'), 'invalidEncoding');
    const canonical = encodeBuildLinkFragment(ShipLoadout.default('Krait_MkII'));
    expectCodecError(
      () => decodeBuildLinkFragment(`${canonical.slice(0, -1)}!`),
      'invalidEncoding',
    );
  });

  it('always ends Base69 fragments with an autolinker-safe alphanumeric digit', () => {
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

  it('rejects non-canonical uniform and all-defined power submodes', () => {
    expectCodecError(
      () => decodeBuildLinkFragment(nonCanonicalUniformPriority()),
      'invalidPayload',
    );
    expectCodecError(
      () => decodeBuildLinkFragment(nonCanonicalAllDefinedEnabledState()),
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
    int_cargorack_size6_class1: { blueprint: 'CargoRack_IncreasedCapacity', grade: 5 },
    int_cargorack_size5_class1: { blueprint: 'CargoRack_IncreasedCapacity', grade: 5 },
    int_cargorack_size4_class1: { blueprint: 'CargoRack_IncreasedCapacity', grade: 5 },
    int_cargorack_size1_class1: { blueprint: 'CargoRack_IncreasedCapacity', grade: 5 },
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
                  quality: module.engineering.Quality,
                  experimental: module.engineering.ExperimentalEffect?.toLowerCase(),
                },
        };
      })
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

function nonCanonicalUniformPriority(): string {
  const source = ShipLoadout.default('SideWinder');
  const modules = powerDrawingModules(source);
  for (const module of modules) source.setModuleEnabled(module.slot, true);
  const canonical = decodePayload(encodeBuildLinkFragment(source));
  const bits = copyPayloadBits(canonical, 32);
  writeTestBits(bits, 0, 1); // non-canonical: priorities are uniform, but the flag says mixed
  for (const _module of modules) writeTestBits(bits, 0, 3);
  writeTestBits(bits, 0, 1); // no engineering
  return encodeTestBits(bits);
}

function nonCanonicalAllDefinedEnabledState(): string {
  const source = ShipLoadout.default('SideWinder');
  const modules = powerDrawingModules(source);
  modules.forEach((module, index) => source.setModuleEnabled(module.slot, index % 2 === 0));
  const canonical = decodePayload(encodeBuildLinkFragment(source));
  const bits = copyPayloadBits(canonical, 32);
  writeTestBits(bits, 0, 1); // non-canonical: all values are defined, but the flag says mixed
  modules.forEach((_module, index) => writeTestBits(bits, index % 2 === 0 ? 2 : 1, 2));
  writeTestBits(bits, 1, 1); // priorities are uniformly absent
  writeTestBits(bits, 0, 3);
  writeTestBits(bits, 0, 1); // no engineering
  return encodeTestBits(bits);
}

function powerDrawingModules(source: ShipLoadout): ReturnType<ShipLoadout['fittedModules']> {
  return source.fittedModules().filter((module) => (module.effectiveStats?.powerDraw ?? 0) > 0);
}

function copyPayloadBits(payload: Uint8Array, bitCount: number): number[] {
  const bits: number[] = [];
  for (let offset = 0; offset < bitCount; offset += 1) {
    bits.push((payload[Math.floor(offset / 8)]! >> (offset % 8)) & 1);
  }
  return bits;
}

function encodeTestBits(bits: readonly number[]): string {
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
