import { ShipLoadout, type FittedModule } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { PRE_ENGINEERED_MODULES } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import { getPreEngineeredJournalModifiers } from '@elite-dangerous-almanac/core/ships/pre-engineered-stats';
import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';
import type { LoadoutEvent } from '@elite-dangerous-almanac/core/ships/slef';
import { ArithmeticEncoder } from './build-link-arithmetic';
import { BuildLinkCodecError, createBuildLinkCodec } from './build-link-codec';
import { encodeBuildLinkBody } from './build-link-payload';
import {
  decodeBuildLinkFragment as decodeBuildLinkFragmentOnDemand,
  encodeBuildLinkFragment as encodeBuildLinkFragmentOnDemand,
} from './build-link-codec-loader';
import {
  BUILD_LINK_FINAL_ALPHABET,
  decodeBuildLinkPayload,
  encodeBuildLinkPayload,
} from './build-link-radix';
import codecTable1Json from './codec-table-1.json';
import realisticEngineeredCorvette from './realistic-engineered-corvette.fixture.json';
import { makeFullyEngineeredAnaconda, minimalState } from './build-link-codec.spec-helpers';

const codecTable1 = codecTable1Json;
const { decodeBuildLinkFragment, encodeBuildLinkFragment } = createBuildLinkCodec(1, codecTable1);

describe('build-link codec', () => {
  it('round-trips the minimal state imported through the Almanac', () => {
    const source = makeImportedEngineeredBuild();

    const decoded = decodeBuildLinkFragment(encodeBuildLinkFragment(source));
    const reimported = ShipLoadout.fromSlef(
      decoded.toSlefString({
        header: { appName: 'Elite Dangerous Ship Builder', appVersion: 1 },
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

  it('assumes complete engineering quality and omits all credit values', () => {
    const source = makeImportedEngineeredBuild(true, 0.73123456789);
    const withoutCredits = makeImportedEngineeredBuild(false, 0.73123456789);

    const encoded = encodeBuildLinkFragment(source);
    const decoded = decodeBuildLinkFragment(encoded);

    expect(decoded.fittedModuleAt('FrameShiftDrive')?.engineering?.Quality).toBe(1);
    expect(source.sourcePurchase).not.toBeNull();
    expect(decoded.sourcePurchase).toBeNull();
    expect(encoded).toBe(encodeBuildLinkFragment(withoutCredits));
    expect(decoded.toLoadoutEvent().HullValue).toBe(source.toLoadoutEvent().HullValue);
    expect(decoded.toLoadoutEvent().ModulesValue).toBe(source.toLoadoutEvent().ModulesValue);
    expect(decoded.toLoadoutEvent().Rebuy).toBe(source.toLoadoutEvent().Rebuy);
  });

  it('compacts common ASCII metadata without changing Unicode fallback semantics', () => {
    const cases = [
      { name: 'Astraea', ident: 'TST-42', length: 29 },
      { name: 'Astraea 星', ident: 'TST-42', length: 38 },
      { name: '星', ident: null, length: 21 },
      { name: 'THE WANDERING STAR 42', ident: 'AB-123', length: 43 },
    ];
    for (const { name, ident, length } of cases) {
      const source = ShipLoadout.fromLoadout({
        Ship: 'SideWinder',
        ShipName: name,
        ...(ident === null ? {} : { ShipIdent: ident }),
        Modules: [],
      });
      const fragment = encodeBuildLinkFragment(source);
      const decoded = decodeBuildLinkFragment(fragment);

      expect(fragment).toHaveLength(length);
      expect(decoded.shipName).toBe(name);
      expect(decoded.shipIdent).toBe(ident);
      expect(encodeBuildLinkFragment(decoded)).toBe(fragment);
    }
  });

  it('pins the compact metadata alphabet and its tagged lengths', () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -';
    // The alphabet is exactly two labels wide at the 32-unit bound, so it takes both to pin it.
    const name = alphabet.slice(0, 32);
    const ident = alphabet.slice(32);
    const compact = ShipLoadout.fromLoadout({
      Ship: 'SideWinder',
      ShipName: name,
      ShipIdent: ident,
      Modules: [],
    });
    const compactFragment = encodeBuildLinkFragment(compact);
    const metadataOffset = 10 + testBitsRequired(codecTable1.SHIPS.length) + 2;
    const identOffset = metadataOffset + 8 + name.length * 6;

    // An odd header is a compact character count: 2 * 32 + 1, inside a single varuint byte.
    expect(readPayloadBits(compactFragment, metadataOffset, 8)).toBe(65);
    expect(readPayloadBits(compactFragment, identOffset, 8)).toBe(65);
    for (let index = 0; index < alphabet.length; index += 1) {
      const offset =
        index < name.length
          ? metadataOffset + 8 + index * 6
          : identOffset + 8 + (index - name.length) * 6;
      expect(readPayloadBits(compactFragment, offset, 6)).toBe(index);
    }
    expect(decodeBuildLinkFragment(compactFragment).shipName).toBe(name);
    expect(decodeBuildLinkFragment(compactFragment).shipIdent).toBe(ident);

    // An even header is a UTF-8 byte count. The widest label the codec accepts is 2 * 32, so
    // every header it writes fits one byte and a longer one can only come from outside.
    const fallback = ShipLoadout.fromLoadout({
      Ship: 'SideWinder',
      ShipName: 'é'.repeat(16),
      Modules: [],
    });
    const fallbackFragment = encodeBuildLinkFragment(fallback);

    expect(readPayloadBits(fallbackFragment, metadataOffset, 8)).toBe(64);
    expect(decodeBuildLinkFragment(fallbackFragment).shipName).toBe('é'.repeat(16));
    // A two-byte header still parses, and is then refused for what it claims rather than ignored.
    expect(() =>
      decodeBuildLinkFragment(handcraftedMetadataFragment(128, [{ value: 0x41, width: 8 }])),
    ).toThrowError('A build-link string is too long.');
  });

  it('rejects non-canonical, truncated, and malformed tagged metadata', () => {
    expectCodecError(
      () => decodeBuildLinkFragment(handcraftedMetadataFragment(2, [{ value: 65, width: 8 }])),
      'invalidPayload',
    );
    expectCodecError(
      () => decodeBuildLinkFragment(handcraftedMetadataFragment(129, [], false)),
      'invalidPayload',
    );
    expectCodecError(
      () => decodeBuildLinkFragment(handcraftedMetadataFragment(2, [{ value: 0xff, width: 8 }])),
      'invalidPayload',
    );
  });

  it('normalises imported zero-quality engineering without a special effect', () => {
    const source = ShipLoadout.default('Krait_MkII');
    source.applyBlueprint('FrameShiftDrive', 'FSD_LongRange', { grade: 1, quality: 0 });

    const decoded = decodeBuildLinkFragment(encodeBuildLinkFragment(source));

    expect(decoded.fittedModuleAt('FrameShiftDrive')?.engineering).toMatchObject({
      BlueprintName: 'FSD_LongRange',
      Level: 1,
      Quality: 1,
    });
    expect(
      decoded.fittedModuleAt('FrameShiftDrive')?.engineering?.ExperimentalEffect,
    ).toBeUndefined();
  });

  it('omits partial engineering quality from the canonical build model', () => {
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

    expect(decoded.fittedModuleAt('FrameShiftDrive')?.engineering?.Quality).toBe(1);
    expect(encodeBuildLinkFragment(source)).toBe(encodeBuildLinkFragment(floatEscape));
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
    expect(longest).toEqual({ ship: 'Anaconda', length: 41 });
  });

  it('normalises an external partial-quality capture to a completed blueprint', () => {
    const source = ShipLoadout.fromSlef(
      realisticEngineeredCorvette as Parameters<typeof ShipLoadout.fromSlef>[0],
    );
    const fragment = encodeBuildLinkFragment(source);
    const decoded = decodeBuildLinkFragment(fragment);
    // The application models a selected grade as a completed blueprint even when a journal capture
    // reports the partial roll that happened to produce the imported modifiers.
    expect(source.fittedModuleAt('SmallHardpoint2')?.engineering?.Quality).toBe(0.9438);
    expect(decoded.fittedModuleAt('SmallHardpoint2')?.engineering?.Quality).toBe(1);

    expect(minimalState(decoded)).toEqual(minimalState(source, true));
    expect(encodeBuildLinkFragment(decoded)).toBe(fragment);
    expect(fragment).toBe(
      'b.1vt1AsJNQOz@5/xzoXz80TStxhx7ttNjJuEoqU9Q0A:Q/VgcWpNlK@mJujF.IPA0qRo1-GSdd3Lul3gHSO/wrvrWzPtV-pV',
    );
    expect(`https://ships.example/#${fragment}`).toHaveLength(120);
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
    expect(encodeBuildLinkFragment(source)).toBe('b.5SHJb2soVSh3gtL7tnQ');
    const sourceModule = source.fittedModuleAt('LargeHardpoint1')!;
    const decodedModule = decoded.fittedModuleAt('LargeHardpoint1')!;

    expect(sourceModule.preEngineeredVariant).not.toBeNull();
    expect(decodedModule.preEngineeredVariant).toEqual(sourceModule.preEngineeredVariant);
    expect(decodedModule.effectiveStats).toEqual(sourceModule.effectiveStats);
  });

  it('round-trips every package-identifiable fixed pre-engineered variant', () => {
    const identifiable = PRE_ENGINEERED_MODULES.filter(({ modifiers }) => modifiers?.length);
    expect(identifiable).toHaveLength(54);

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
              Modifiers: getPreEngineeredJournalModifiers(variant),
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

  it('pins which fixed variants the package publishes a modifier block for', () => {
    // The 22/54 split is the axis both records turn on, so pin it in both directions: a
    // non-Mercenary variant shipping without a modifier block would change what the
    // pre-engineered record can restore, and must not pass unnoticed.
    const withoutModifiers = PRE_ENGINEERED_MODULES.filter(({ modifiers }) => !modifiers?.length);
    const mercenary = PRE_ENGINEERED_MODULES.filter(
      ({ acquisition }) => acquisition === 'mercenary',
    );
    expect(withoutModifiers).toHaveLength(22);
    expect(mercenary).toHaveLength(22);
    expect(new Set(withoutModifiers)).toEqual(new Set(mercenary));
  });

  it('leaves a Mercenary purchase fitted in the application carrying no modifiers', () => {
    // This is what makes the pre-engineered record sufficient for the purchase itself, and so what
    // the round-trip test below relies on. The package publishes no modifier block for one.
    const variant = mercenaryVariants().find(
      ({ symbol }) => symbol === 'Hpt_Railgun_Fixed_Medium',
    )!;
    const build = ShipLoadout.empty('Krait_MkII');
    build.setPreEngineeredVariant('LargeHardpoint1', variant);
    const fitted = build.fittedModuleAt('LargeHardpoint1')!;

    expect(fitted.preEngineeredVariant).toEqual(variant);
    expect(fitted.engineering?.Level).toBe(variant.grade);
    expect(fitted.engineering?.Modifiers ?? []).toHaveLength(0);
  });

  it('round-trips every Mercenary variant at its purchase grade', () => {
    for (const variant of mercenaryVariants()) {
      const source = mercenaryBuild(variant, variant.grade);
      const sourceModule = source.fittedModuleAt('LargeHardpoint1')!;
      expect(sourceModule.preEngineeredVariant).toEqual(variant);
      expect(sourceModule.engineering?.Modifiers ?? []).toHaveLength(0);

      const fragment = encodeBuildLinkFragment(source);
      const decoded = decodeBuildLinkFragment(fragment);
      const decodedModule = decoded.fittedModuleAt('LargeHardpoint1')!;

      expect(decodedModule.preEngineeredVariant).toEqual(variant);
      expect(decodedModule.engineering?.Level).toBe(variant.grade);
      expect(decodedModule.effectiveStats).toEqual(sourceModule.effectiveStats);
      expect(decoded.mercCoinCost()).toBe(source.mercCoinCost());
      expect(encodeBuildLinkFragment(decoded)).toBe(fragment);
    }
  });

  it('refuses a Mercenary purchase whose capture states modifiers the record cannot restore', () => {
    // The package publishes no modifier block for a Mercenary purchase, so the pre-engineered
    // record restores none. A capture that states them would decode as a stock module, which is
    // why this is refused rather than encoded.
    for (const variant of mercenaryVariants()) {
      const source = mercenaryBuild(variant, variant.grade, [
        { Label: 'Mass', Value: 3, OriginalValue: 2 },
      ]);
      const sourceModule = source.fittedModuleAt('LargeHardpoint1')!;
      expect(sourceModule.preEngineeredVariant).toEqual(variant);
      expect(sourceModule.engineering?.Modifiers).toHaveLength(1);

      // The ordinary record is the fallback, and no Mercenary blueprint offers the purchase grade
      // as a craftable one, so it cannot spell this either. Which refusal arrives depends on
      // whether the module has an ordinary blueprint set at all.
      const error = expectCodecError(
        () => encodeBuildLinkFragment(source),
        hasOrdinaryBlueprints(variant.symbol) ? 'invalidPayload' : 'unknownIdentity',
      );
      expect(error.message).toContain('LargeHardpoint1');
    }
  });

  it('refuses a Mercenary purchase whose modifiers an experimental effect cannot account for', () => {
    // With an effect applied the record does restore modifiers — the effect's. Comparing counts
    // would wave this through and decode the module to entirely different values, so the record is
    // taken only when it reproduces the module's own modifiers.
    const variant = mercenaryVariants().find(
      ({ symbol }) => symbol === 'Int_PowerDistributor_Size5_Class5',
    )!;
    const source = ShipLoadout.fromLoadout({
      Ship: 'Krait_MkII',
      Modules: [
        {
          Slot: 'Slot01_Size6',
          Item: variant.symbol,
          Engineering: {
            BlueprintName: variant.blueprint,
            Level: variant.grade,
            Quality: 1,
            ExperimentalEffect: 'special_powerdistributor_capacity',
            Modifiers: [
              { Label: 'WeaponsCapacity', Value: 30, OriginalValue: 41 },
              { Label: 'SystemsCapacity', Value: 32, OriginalValue: 29 },
              { Label: 'EnginesCapacity', Value: 32, OriginalValue: 29 },
            ],
          },
        },
      ],
    });
    const sourceModule = source.fittedModuleAt('Slot01_Size6')!;
    expect(sourceModule.preEngineeredVariant).toEqual(variant);
    expect(sourceModule.engineering?.Modifiers).toHaveLength(3);

    const error = expectCodecError(() => encodeBuildLinkFragment(source), 'invalidPayload');
    expect(error.message).toContain('Slot01_Size6');
  });

  it('round-trips a Mercenary purchase whose capture agrees with its experimental effect', () => {
    // The record does describe this one: the effect is pinned in the record, and the capture states
    // exactly the modifiers that effect contributes, so decoding reproduces them. The application
    // cannot reach this state itself — the package rejects an uncatalogued variant effect — so a
    // journal or SLEF capture is the only way in, which is exactly what a shared link must carry.
    const variant = mercenaryVariants().find(
      ({ symbol }) => symbol === 'Int_PowerDistributor_Size5_Class5',
    )!;
    const experimental = 'special_powerdistributor_capacity';
    const faithful = getPreEngineeredJournalModifiers({ ...variant, experimental });
    expect(faithful.length).toBeGreaterThan(0);

    const source = ShipLoadout.fromLoadout({
      Ship: 'Krait_MkII',
      Modules: [
        {
          Slot: 'Slot01_Size6',
          Item: variant.symbol,
          Engineering: {
            BlueprintName: variant.blueprint,
            Level: variant.grade,
            Quality: 1,
            ExperimentalEffect: experimental,
            Modifiers: faithful,
          },
        },
      ],
    });
    const sourceModule = source.fittedModuleAt('Slot01_Size6')!;
    expect(sourceModule.preEngineeredVariant).toEqual(variant);

    const fragment = encodeBuildLinkFragment(source);
    const decoded = decodeBuildLinkFragment(fragment);
    const decodedModule = decoded.fittedModuleAt('Slot01_Size6')!;

    expect(decodedModule.engineering?.ExperimentalEffect).toBe(experimental);
    expect(decodedModule.engineering?.Modifiers).toEqual(sourceModule.engineering?.Modifiers);
    expect(decodedModule.effectiveStats).toEqual(sourceModule.effectiveStats);
    expect(decodedModule.preEngineeredVariant?.acquisition).toBe('mercenary');
    expect(encodeBuildLinkFragment(decoded)).toBe(fragment);
  });

  it('keeps the fitted grade of a Mercenary variant upgraded past its purchase', () => {
    const upgradable = PRE_ENGINEERED_MODULES.filter(
      (variant) => variant.acquisition === 'mercenary' && hasOrdinaryBlueprints(variant.symbol),
    );
    expect(upgradable).toHaveLength(16);

    for (const variant of upgradable) {
      const grades = blueprintGrades(variant.blueprint);
      expect(grades).not.toContain(variant.grade);

      for (const grade of grades) {
        const source = mercenaryBuild(variant, grade);
        const sourceModule = source.fittedModuleAt('LargeHardpoint1')!;
        expect(sourceModule.preEngineeredVariant).toEqual(variant);
        expect(sourceModule.engineering?.Level).toBe(grade);

        const fragment = encodeBuildLinkFragment(source);
        const decoded = decodeBuildLinkFragment(fragment);
        const decodedModule = decoded.fittedModuleAt('LargeHardpoint1')!;

        expect(decodedModule.engineering?.Level).toBe(grade);
        expect(decodedModule.preEngineeredVariant).toEqual(variant);
        expect(decoded.mercCoinCost()).toBe(source.mercCoinCost());
        expect(minimalState(decoded)).toEqual(minimalState(source));
        expect(encodeBuildLinkFragment(decoded)).toBe(fragment);
        // The crafted grade must survive as engineering, not merely as a number: the decoded
        // module carries the blueprint's regenerated modifiers and stats that differ from stock.
        expect(decodedModule.engineering?.Modifiers?.length ?? 0).toBeGreaterThan(0);
        expect(decodedModule.effectiveStats).not.toEqual(stockStats(variant.symbol));
      }
    }
  });

  it('names the slot when a module carrying engineering has no recipe for it', () => {
    // The advanced small mining laser accepts no blueprint, so a capture that engineers one cannot
    // be spelled. FR-022b wants the refusal to say which slot, not merely that one exists.
    const source = ShipLoadout.fromLoadout({
      Ship: 'SideWinder',
      Modules: [
        {
          Slot: 'SmallHardpoint1',
          Item: 'Hpt_MiningLaser_Fixed_Small_Advanced',
          Engineering: { BlueprintName: 'Weapon_LongRange', Level: 3, Quality: 1 },
        },
      ],
    });

    const error = expectCodecError(() => encodeBuildLinkFragment(source), 'invalidPayload');
    expect(error.message).toContain('SmallHardpoint1');
    expect(error.message).toContain('Hpt_MiningLaser_Fixed_Small_Advanced');
  });

  it('refuses an upgraded Mercenary article table 1 cannot spell', () => {
    // These six sit on modules the package reports no ordinary blueprint for, so table 1 records
    // none either and the ordinary record cannot name one. Refusing is the only honest answer: the
    // pre-engineered record would silently restore the purchase grade.
    const unspellable = PRE_ENGINEERED_MODULES.filter(
      (variant) => variant.acquisition === 'mercenary' && !hasOrdinaryBlueprints(variant.symbol),
    );
    expect(unspellable.map(({ symbol }) => symbol).sort()).toEqual([
      'Hpt_CausticMissile_Fixed_Medium',
      'Hpt_MiningLaser_Fixed_Small',
      'Hpt_Mining_AbrBlstr_Fixed_Small',
      'Int_CargoRack_Size5_Class1',
      'Int_CargoRack_Size6_Class1',
      'Int_ModuleReinforcement_Size5_Class2',
    ]);

    for (const variant of unspellable) {
      for (const grade of blueprintGrades(variant.blueprint)) {
        const source = mercenaryBuild(variant, grade);
        expect(source.fittedModuleAt('LargeHardpoint1')?.preEngineeredVariant).toEqual(variant);
        const error = expectCodecError(() => encodeBuildLinkFragment(source), 'unknownIdentity');
        expect(error.message).toContain('LargeHardpoint1');
      }
    }
  });

  it('round-trips festive modules as package-owned pre-engineered variants', async () => {
    const cases = PRE_ENGINEERED_MODULES.filter(({ blueprint }) =>
      blueprint.startsWith('Decorative_'),
    );
    expect(cases).toHaveLength(3);
    for (const variant of cases) {
      const source = ShipLoadout.empty('Krait_MkII');
      source.setPreEngineeredVariant('MediumHardpoint1', variant);
      const modifiers = source.fittedModuleAt('MediumHardpoint1')?.engineering?.Modifiers;
      expect(modifiers?.length).toBeGreaterThan(0);

      const fragment = await encodeBuildLinkFragmentOnDemand(source);
      const decoded = await decodeBuildLinkFragmentOnDemand(fragment);

      expect(readPayloadBits(fragment, 0, 10)).toBe(1);
      if (variant.blueprint === 'Decorative_Green') {
        expect(fragment).toBe('b.5S25TzaeHpHOJ3g@NDt');
      }
      expect(`https://ships.example/#${fragment}`.length).toBeLessThanOrEqual(500);
      expect(minimalState(decoded)).toEqual(minimalState(source));
      expect(decoded.fittedModuleAt('MediumHardpoint1')?.engineering?.Modifiers).toEqual(modifiers);
      expect(decoded.fittedModuleAt('MediumHardpoint1')?.preEngineeredVariant).toEqual(variant);
      expect(decoded.fittedModuleAt('MediumHardpoint1')?.effectiveStats).toEqual(
        source.fittedModuleAt('MediumHardpoint1')?.effectiveStats,
      );
      expect(await encodeBuildLinkFragmentOnDemand(decoded)).toBe(fragment);
    }
  });

  it('preserves unrelated engineered state when decoding a festive pre-engineered module', () => {
    const source = ShipLoadout.fromLoadout({
      Ship: 'Krait_MkII',
      Modules: [
        {
          Slot: 'MediumHardpoint1',
          Item: 'Hpt_FlakMortar_Turret_Medium',
        },
        { Slot: 'LargeHardpoint1', Item: 'Hpt_MultiCannon_Fixed_Medium' },
      ],
    });
    source.applyBlueprint('LargeHardpoint1', 'Weapon_HighCapacity', {
      grade: 5,
      quality: 1,
    });
    const festive = PRE_ENGINEERED_MODULES.find(
      ({ blueprint }) => blueprint === 'Decorative_Green',
    )!;
    source.setPreEngineeredVariant('MediumHardpoint1', festive);
    const ordinaryBefore = source.fittedModuleAt('LargeHardpoint1')!;

    const decoded = decodeBuildLinkFragment(encodeBuildLinkFragment(source));
    const ordinaryAfter = decoded.fittedModuleAt('LargeHardpoint1')!;

    expect(ordinaryAfter.engineering).toEqual(ordinaryBefore.engineering);
    expect(ordinaryAfter.effectiveStats).toEqual(ordinaryBefore.effectiveStats);
    expect(ordinaryAfter.effectiveStats?.burstInterval).toBe(
      ordinaryBefore.effectiveStats?.burstInterval,
    );
  });

  it('stores the table version as the first field inside the payload', () => {
    const encoded = encodeBuildLinkFragment(ShipLoadout.empty('SideWinder'));

    expect(readPayloadBits(encoded, 0, 10)).toBe(1);
    expect(readPayloadBits(withPayloadTableVersion(encoded, 1_023), 0, 10)).toBe(1_023);
  });

  it('pins the reviewed pre-release table 1 content hash', async () => {
    // Table 1 was explicitly regenerated while the application and link format are still
    // unpublished, most recently to pin its symbol models. Once released, a changed hash
    // belongs under the next table number.
    const { contentHash, tableVersion } = codecTable1.$generated;
    const { $generated: _omitted, ...payload } = codecTable1;

    expect(contentHash).toBe('511740e210f8f22a334c3f337e4f6c67e81385205e3776f8ce7a5e90e1c045be');
    expect(await canonicalHash(payload)).toBe(contentHash);
    expect(tableVersion).toBe(1);
  });

  it('encodes both grades of a two-grade blueprint without a redundant bounded symbol', () => {
    const blueprintIndex = codecTable1.BLUEPRINTS.indexOf('FSD_LongRange');
    const table2 = {
      ...codecTable1,
      $generated: { ...codecTable1.$generated, tableVersion: 2 },
      BLUEPRINT_GRADES: codecTable1.BLUEPRINT_GRADES.map((grades, index) =>
        index === blueprintIndex ? [1, 5] : grades,
      ),
    };
    const codec2 = createBuildLinkCodec(2, table2);

    for (const grade of [1, 5]) {
      const source = ShipLoadout.default('Krait_MkII');
      source.applyBlueprint('FrameShiftDrive', 'FSD_LongRange', { grade, quality: 1 });
      const decoded = codec2.decodeBuildLinkFragment(codec2.encodeBuildLinkFragment(source));

      expect(decoded.fittedModuleAt('FrameShiftDrive')?.engineering).toMatchObject({
        BlueprintName: 'FSD_LongRange',
        Level: grade,
        Quality: 1,
      });
    }
  });

  it('shares one codec implementation across independent table versions', () => {
    const table2 = {
      ...codecTable1,
      $generated: { ...codecTable1.$generated, tableVersion: 2 },
      SHIPS: [codecTable1.SHIPS[1]!, codecTable1.SHIPS[0]!, ...codecTable1.SHIPS.slice(2)],
    };
    const codec2 = createBuildLinkCodec(2, table2);
    const source = ShipLoadout.default('SideWinder');
    const nestedSource = ShipLoadout.empty('Eagle');
    let nestedFragment: string | undefined;
    const reentrantSource = new Proxy(source, {
      get(loadout, property) {
        if (property === 'shipSymbol') {
          nestedFragment = encodeBuildLinkFragment(nestedSource);
        }
        const value: unknown = Reflect.get(loadout, property, loadout);
        return typeof value === 'function' ? value.bind(loadout) : value;
      },
    });
    const encoded = codec2.encodeBuildLinkFragment(reentrantSource);

    expect(readPayloadBits(encoded, 0, 10)).toBe(2);
    expect(readPayloadBits(encoded, 10, testBitsRequired(table2.SHIPS.length))).toBe(1);
    expect(minimalState(codec2.decodeBuildLinkFragment(encoded))).toEqual(minimalState(source));
    expect(readPayloadBits(nestedFragment!, 0, 10)).toBe(1);
    expect(decodeBuildLinkFragment(nestedFragment!).shipSymbol).toBe('Eagle');
    expectCodecError(() => decodeBuildLinkFragment(encoded), 'unsupportedTableVersion');
    expect(() => createBuildLinkCodec(2, codecTable1)).toThrowError(
      'The build-link codec table version is invalid.',
    );
  });

  it('does not widen global experimental indexes at an exact power of two', () => {
    const source = ShipLoadout.default('Krait_MkII');
    source.applyBlueprint('FrameShiftDrive', 'FSD_LongRange', {
      grade: 5,
      quality: 1,
      experimental: 'special_fsd_heavy',
    });
    source.applyBlueprint('PowerPlant', 'PowerPlant_Armoured', {
      grade: 5,
      quality: 1,
    });
    const moduleIndex = codecTable1.MODULES.indexOf(
      source.fittedModuleAt('FrameShiftDrive')!.symbol,
    );
    const emptySetIndex = codecTable1.EXPERIMENTAL_SETS.length;
    const tableWithEffectCount = (effectCount: number) => ({
      ...codecTable1,
      $generated: { ...codecTable1.$generated, tableVersion: 2 },
      EXPERIMENTAL_EFFECTS: [
        ...codecTable1.EXPERIMENTAL_EFFECTS,
        ...Array.from(
          { length: effectCount - codecTable1.EXPERIMENTAL_EFFECTS.length },
          (_value, index) => `TestEffect_${index}`,
        ),
      ],
      EXPERIMENTAL_SETS: [...codecTable1.EXPERIMENTAL_SETS, []],
      EXPERIMENTAL_SET_BY_MODULE: codecTable1.EXPERIMENTAL_SET_BY_MODULE.map((set, index) =>
        index === moduleIndex ? emptySetIndex : set,
      ),
    });

    const at127 = createBuildLinkCodec(2, tableWithEffectCount(127));
    const at128 = createBuildLinkCodec(2, tableWithEffectCount(128));
    const fragment = at127.encodeBuildLinkFragment(source);

    expect(at128.encodeBuildLinkFragment(source)).toBe(fragment);
    expect(minimalState(at128.decodeBuildLinkFragment(fragment))).toEqual(minimalState(source));
  });

  it('loads the payload-declared table on demand', async () => {
    const source = ShipLoadout.default('Krait_MkII');
    const encoded = await encodeBuildLinkFragmentOnDemand(source);

    expect(minimalState(await decodeBuildLinkFragmentOnDemand(encoded))).toEqual(
      minimalState(source),
    );
    expect(readPayloadBits(encoded, 0, 10)).toBe(1);
    expect(
      minimalState(await decodeBuildLinkFragmentOnDemand(encodeBuildLinkFragment(source))),
    ).toEqual(minimalState(source));
    await expect(
      decodeBuildLinkFragmentOnDemand(withPayloadTableVersion(encoded, 513)),
    ).rejects.toMatchObject({ code: 'unsupportedTableVersion' });

    const corrupted = decodePayload(encoded);
    corrupted[0]! ^= 1;
    await expect(
      decodeBuildLinkFragmentOnDemand(`b.${encodeBuildLinkPayload(corrupted)}`),
    ).rejects.toMatchObject({ code: 'integrityCheckFailed' });
  });

  it('keeps the frozen literal special-build link stable in the decode direction', () => {
    // Freeze before release; once table 1 ships, never regenerate this fixture to make a build pass.
    const preEngineered = decodeBuildLinkFragment('b.eXcDHGhn7Tub');

    expect(preEngineered.shipSymbol).toBe('Krait_MkII');
    expect(preEngineered.shipName).toBeNull();
    expect(preEngineered.shipIdent).toBeNull();
    expect(
      preEngineered
        .slots()
        .filter(({ immovableReason }) => immovableReason === 'requiredSlot')
        .every(({ module }) => module !== null),
    ).toBe(true);
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
    // Freeze before release; once table 1 ships, never regenerate these fixtures to make a build pass.
    expect([emptyFragment, typicalFragment, largeFragment]).toEqual([
      'b.1S..A@YX6Cjy!R',
      'b.vz,jdQ_4',
      'b.V-Vvc1n36H310k3c1JR73EOXTDVtl.J/noD6UIA!DNJj1i6Yb3BK4h-klUe.0Oe',
    ]);
    expect([emptyLink.length, typicalLink.length, largeLink.length]).toEqual([39, 33, 88]);

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

  it('refuses unsupported table versions and envelopes', () => {
    const encoded = encodeBuildLinkFragment(ShipLoadout.empty('SideWinder'));

    expectCodecError(
      () => decodeBuildLinkFragment(withPayloadTableVersion(encoded, 513)),
      'unsupportedTableVersion',
    );
    expectCodecError(() => decodeBuildLinkFragment('b1.AAAA'), 'unsupportedEnvelope');
  });

  it('reconstructs every omitted fixed mount with the package default', () => {
    const source = ShipLoadout.fromLoadout({ Ship: 'SideWinder', Modules: [] });

    const fixedSlots = source
      .slots()
      .filter(({ immovableReason }) => immovableReason === 'requiredSlot');
    expect(fixedSlots).toHaveLength(8);
    expect(fixedSlots.every(({ module }) => module !== null)).toBe(true);
    expect(source.fittedModuleAt('CargoHatch')).not.toBeNull();
    expect(source.importOutcomes).toHaveLength(9);
    expect(source.importOutcomes.every(({ action }) => action === 'defaulted')).toBe(true);
    expect(encodeBuildLinkFragment(source)).toBe('b.1S..A@YX6Cjy!R');
  });

  it('refuses a slot the pinned table cannot spell', () => {
    // The table is frozen at its version while the Almanac keeps moving, so a hull that gains a
    // mount the table never recorded must be refused rather than encoded into a published link.
    const pruned = {
      ...codecTable1,
      $generated: { ...codecTable1.$generated, tableVersion: 2 },
      SLOTS_BY_SHIP: {
        ...codecTable1.SLOTS_BY_SHIP,
        SideWinder: codecTable1.SLOTS_BY_SHIP.SideWinder.filter(
          (slot) => slot !== 'SmallHardpoint1',
        ),
      },
    };
    const codec2 = createBuildLinkCodec(2, pruned);

    const error = expectCodecError(
      () => codec2.encodeBuildLinkFragment(ShipLoadout.default('SideWinder')),
      'unknownIdentity',
    );
    expect(error.message).toContain('SmallHardpoint1');
  });

  it('refuses a module identity the pinned table cannot spell', () => {
    const source = ShipLoadout.default('SideWinder');
    const symbol = source.fittedModules().find(({ slot }) => slot === 'SmallHardpoint1')!.symbol;
    const index = codecTable1.MODULES.findIndex(
      (entry) => entry.toLowerCase() === symbol.toLowerCase(),
    );
    expect(index).toBeGreaterThanOrEqual(0);
    const pruned = {
      ...codecTable1,
      $generated: { ...codecTable1.$generated, tableVersion: 2 },
      MODULES: codecTable1.MODULES.map((entry, at) => (at === index ? 'Absent_Module' : entry)),
    };
    const codec2 = createBuildLinkCodec(2, pruned);

    const error = expectCodecError(() => codec2.encodeBuildLinkFragment(source), 'unknownIdentity');
    expect(error.message).toContain(symbol);
  });

  it('refuses truncated and malformed encodings', () => {
    expectCodecError(() => decodeBuildLinkFragment('b.'), 'invalidEncoding');
    expectCodecError(() => decodeBuildLinkFragment(`b.${'A'.repeat(499)}`), 'invalidEncoding');
    expectCodecError(() => decodeBuildLinkFragment('b.AAAA'), 'invalidPayload');
    expectCodecError(() => decodeBuildLinkFragment('b.not%base70'), 'invalidEncoding');
    const canonical = encodeBuildLinkFragment(ShipLoadout.default('Krait_MkII'));
    expectCodecError(
      () => decodeBuildLinkFragment(`${canonical.slice(0, -1)}!`),
      'invalidEncoding',
    );
  });

  it('always ends Base70 fragments with an autolinker-safe alphanumeric digit', () => {
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

  it('pins combination-rank boundaries and rejects invalid ranks and preferred-mode ties', () => {
    const slots = codecTable1.SLOTS_BY_SHIP.SideWinder;
    const cases = [
      { removed: [slots[0]!, slots[1]!], rank: 0 },
      { removed: [slots[17]!, slots[18]!], rank: 170 },
    ];
    for (const { removed, rank } of cases) {
      const source = ShipLoadout.default('SideWinder');
      removed.forEach((slot) => source.removeModule(slot));
      const fragment = encodeBuildLinkFragment(source);

      expect(readPayloadBits(fragment, 20, 2)).toBe(3);
      expect(readPayloadBits(fragment, 22, 5)).toBe(2);
      expect(readPayloadBits(fragment, 27, 8)).toBe(rank);
      expect(minimalState(decodeBuildLinkFragment(fragment))).toEqual(minimalState(source));
    }

    const invalidRank = ShipLoadout.default('SideWinder');
    invalidRank.removeModule(slots[17]!);
    invalidRank.removeModule(slots[18]!);
    expectCodecError(
      () =>
        decodeBuildLinkFragment(withPayloadBits(encodeBuildLinkFragment(invalidRank), 27, 8, 171)),
      'invalidPayload',
    );

    const preferredIncluded = ShipLoadout.default('SideWinder');
    preferredIncluded.removeModule(slots[0]!);
    const preferredFragment = encodeBuildLinkFragment(preferredIncluded);
    expect(readPayloadBits(preferredFragment, 20, 2)).toBe(1);
    expectCodecError(
      () => decodeBuildLinkFragment(withPayloadBits(preferredFragment, 20, 2, 3)),
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

  it('uses arithmetic coding only when its final body is shorter', () => {
    const dense = encodeBuildLinkFragment(makeFullyEngineeredAnaconda());
    const shipCount = codecTable1.SHIPS.length;
    const tagWidth = testBitsRequired(shipCount + 1);

    expect(readPayloadBits(dense, 10, tagWidth)).toBeGreaterThanOrEqual(shipCount);
    expect(
      readPayloadBits(encodeBuildLinkFragment(ShipLoadout.empty('SideWinder')), 10, tagWidth),
    ).toBeLessThan(shipCount);
    expectCodecError(
      () =>
        decodeBuildLinkFragment(
          'b.K0sHIwAq0MqZOAnrkyWdTvF5Px1CSCHkHbs9/.VvX,@2y9UOqj8YkgFciGNH9_l3LnvS.rtR3x74NVG7',
        ),
      'invalidPayload',
    );

    const arithmeticEmpty = nonCanonicalArithmeticEmptySidewinder();
    expectCodecError(() => decodeBuildLinkFragment(arithmeticEmpty), 'invalidPayload');
  });

  it('rejects every re-checksummed arithmetic truncation and trailing-data form', () => {
    const fragment = encodeBuildLinkFragment(makeFullyEngineeredAnaconda());
    const payload = decodePayload(fragment);
    const body = payload.subarray(0, payload.length - 4);
    for (let length = 0; length < body.length; length += 1) {
      const truncated = new Uint8Array(length + 4);
      truncated.set(body.subarray(0, length));
      expectCodecError(() => decodeBuildLinkFragment(encodePayload(truncated)), 'invalidPayload');
    }
    for (const suffix of [[0], [0xff], [0, 0], [0xff, 0x55]]) {
      const extended = new Uint8Array(body.length + suffix.length + 4);
      extended.set(body);
      extended.set(suffix, body.length);
      expectCodecError(() => decodeBuildLinkFragment(encodePayload(extended)), 'invalidPayload');
    }

    const alternateSuffix = decodePayload(fragment);
    const finalBodyByte = body.length - 1;
    alternateSuffix[finalBodyByte]! ^= 0x80;
    expectCodecError(
      () => decodeBuildLinkFragment(encodePayload(alternateSuffix)),
      'invalidPayload',
    );
  });

  it('either rejects re-checksummed mutations or stabilizes accepted reconstructed state', () => {
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
        const canonical = encodeBuildLinkFragment(decoded);
        expect(minimalState(decodeBuildLinkFragment(canonical))).toEqual(minimalState(decoded));
        expect(encodeBuildLinkFragment(decodeBuildLinkFragment(canonical))).toBe(canonical);
      } catch (error) {
        expect(error).toBeInstanceOf(BuildLinkCodecError);
      }
    }
  });

  it('preserves surrogate pairs and rejects unpaired UTF-16 surrogates', () => {
    const valid = ShipLoadout.fromLoadout({
      Ship: 'SideWinder',
      ShipName: 'Astraea 🚀',
      Modules: [],
    });
    expect(decodeBuildLinkFragment(encodeBuildLinkFragment(valid)).shipName).toBe('Astraea 🚀');

    for (const invalidName of ['\ud800', '\udc00', '\ud800A', '\ud800\ud800']) {
      const target = ShipLoadout.empty('SideWinder');
      const source = new Proxy(target, {
        get(loadout, property) {
          if (property === 'shipName') return invalidName;
          const value: unknown = Reflect.get(loadout, property, loadout);
          return typeof value === 'function' ? value.bind(loadout) : value;
        },
      });
      expectCodecError(() => encodeBuildLinkFragment(source), 'invalidPayload');
    }
  });

  it('accepts metadata at the string-unit bound and rejects the unit beyond it', () => {
    const atBound = ShipLoadout.fromLoadout({
      Ship: 'SideWinder',
      ShipName: 'A'.repeat(32),
      ShipIdent: 'é'.repeat(16),
      Modules: [],
    });
    const decoded = decodeBuildLinkFragment(encodeBuildLinkFragment(atBound));

    expect(decoded.shipName).toBe(atBound.shipName);
    expect(decoded.shipIdent).toBe(atBound.shipIdent);

    for (const ShipName of ['A'.repeat(33), 'é'.repeat(17)]) {
      const source = ShipLoadout.fromLoadout({ Ship: 'SideWinder', ShipName, Modules: [] });
      expect(() => encodeBuildLinkFragment(source)).toThrowError(
        'A build-link string is too long.',
      );
    }
  });

  it('keeps the largest reference build inside the envelope with metadata at its bound', () => {
    const named = structuredClone(realisticEngineeredCorvette) as unknown as {
      data: { ShipName: string; ShipIdent: string };
    }[];
    // The widest metadata the codec accepts: 32 UTF-8 bytes each, both on its largest build.
    named[0]!.data.ShipName = 'é'.repeat(16);
    named[0]!.data.ShipIdent = 'é'.repeat(16);
    const source = ShipLoadout.fromSlef(named as Parameters<typeof ShipLoadout.fromSlef>[0]);

    const fragment = encodeBuildLinkFragment(source);
    const decoded = decodeBuildLinkFragment(fragment);

    // FR-021 counts a complete codec value, `b.` included.
    expect(fragment.length).toBeLessThanOrEqual(500);
    expect(decoded.shipName).toBe('é'.repeat(16));
    expect(decoded.shipIdent).toBe('é'.repeat(16));
  });

  it('refuses to encode a body its own decoder length limit would reject', () => {
    // 500 characters including `b.` leave 498 encoded digits, which carry 377 bytes of body.
    expectCodecError(() => encodeBuildLinkBody(new Uint8Array(378).fill(0xff)), 'invalidPayload');
    expect(encodeBuildLinkBody(new Uint8Array(377).fill(0xff))).toHaveLength(500);
  });

  it('validates table-one fields before reconstructing a build', () => {
    const empty = encodeBuildLinkFragment(ShipLoadout.empty('SideWinder'));
    const stock = encodeBuildLinkFragment(ShipLoadout.default('SideWinder'));

    expectCodecError(
      () => decodeBuildLinkFragment(withPayloadBits(empty, 10, 6, 63)),
      'invalidPayload',
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

  it('distinguishes a valid payload from an Almanac reconstruction failure', () => {
    const encoded = encodeBuildLinkFragment(ShipLoadout.default('SideWinder'));
    const reconstruction = vi.spyOn(ShipLoadout, 'fromLoadout').mockImplementationOnce(() => {
      throw new TypeError('Synthetic Almanac failure');
    });

    try {
      expectCodecError(() => decodeBuildLinkFragment(encoded), 'reconstructionFailed');
    } finally {
      reconstruction.mockRestore();
    }
  });

  it('refuses a payload changed after export', () => {
    const encoded = encodeBuildLinkFragment(ShipLoadout.default('SideWinder'));
    const payload = decodePayload(encoded);
    payload[0]! ^= 0b100;
    const tampered = `b.${encodeBuildLinkPayload(payload)}`;

    expectCodecError(() => decodeBuildLinkFragment(tampered), 'integrityCheckFailed');
  });
});

function makeImportedEngineeredBuild(includeCredits = true, quality = 1): ShipLoadout {
  const assembled = ShipLoadout.default('Krait_MkII');
  assembled.applyBlueprint('FrameShiftDrive', 'FSD_LongRange', {
    grade: 5,
    quality,
    experimental: 'special_fsd_heavy',
  });
  assembled.setModuleEnabled('FrameShiftDrive', false);
  assembled.setModulePriority('FrameShiftDrive', 4);
  const exported = assembled.toLoadoutEvent({ moduleOrder: 'slots' });
  const event: LoadoutEvent = {
    event: 'Loadout',
    Ship: exported.Ship,
    ShipName: 'Astraea 星',
    ShipIdent: 'TST-42',
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
      header: { appName: 'Elite Dangerous Ship Builder', appVersion: 1 },
      data: event,
    },
  ]);
}

function blueprintGrades(fdname: string): readonly number[] {
  const index = codecTable1.BLUEPRINTS.indexOf(fdname);
  const grades = codecTable1.BLUEPRINT_GRADES[index] as readonly number[] | undefined;
  if (!grades) throw new Error(`Blueprint ${fdname} is absent from codec table 1.`);
  return grades;
}

function hasOrdinaryBlueprints(symbol: string): boolean {
  const moduleIndex = codecTable1.MODULES.indexOf(symbol);
  const setIndex = codecTable1.BLUEPRINT_SET_BY_MODULE[moduleIndex];
  return setIndex !== undefined && codecTable1.BLUEPRINT_SETS[setIndex].length > 0;
}

function stockStats(symbol: string): unknown {
  const stock = ShipLoadout.fromLoadout({
    Ship: 'Krait_MkII',
    Modules: [{ Slot: 'LargeHardpoint1', Item: symbol }],
  });
  return stock.fittedModuleAt('LargeHardpoint1')?.effectiveStats;
}

function mercenaryVariants(): readonly (typeof PRE_ENGINEERED_MODULES)[number][] {
  const variants = PRE_ENGINEERED_MODULES.filter(({ acquisition }) => acquisition === 'mercenary');
  expect(variants).toHaveLength(22);
  return variants;
}

function mercenaryBuild(
  variant: (typeof PRE_ENGINEERED_MODULES)[number],
  grade: number,
  modifiers?: readonly {
    readonly Label: string;
    readonly Value: number;
    readonly OriginalValue: number;
  }[],
): ShipLoadout {
  return ShipLoadout.fromLoadout({
    Ship: 'Krait_MkII',
    Modules: [
      {
        Slot: 'LargeHardpoint1',
        Item: variant.symbol,
        Engineering: {
          BlueprintName: variant.blueprint,
          Level: grade,
          Quality: 1,
          ...(modifiers === undefined ? {} : { Modifiers: modifiers }),
        },
      },
    ],
  });
}

function decodePayload(fragment: string): Uint8Array {
  return decodeBuildLinkPayload(fragment.slice('b.'.length));
}

function withPayloadTableVersion(fragment: string, version: number): string {
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

function testBitsRequired(valueCount: number): number {
  return Math.max(1, Math.ceil(Math.log2(valueCount)));
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

function handcraftedMetadataFragment(
  header: number,
  values: readonly { readonly value: number; readonly width: number }[],
  includeTail = true,
): string {
  const bits: number[] = [];
  writeTestBits(bits, 1, 10);
  writeTestBits(
    bits,
    codecTable1.SHIPS.indexOf('SideWinder'),
    testBitsRequired(codecTable1.SHIPS.length),
  );
  writeTestBits(bits, 1, 1); // ship name present
  writeTestBits(bits, 0, 1); // ship ident absent
  writeTestVarUint(bits, header);
  values.forEach(({ value, width }) => writeTestBits(bits, value, width));
  if (includeTail) {
    writeTestBits(bits, 1, 1); // pristine default
  }
  return encodeTestBits(bits);
}

function nonCanonicalArithmeticEmptySidewinder(): string {
  const bits: number[] = [];
  const shipCount = codecTable1.SHIPS.length;
  const tagWidth = testBitsRequired(shipCount + 1);
  const markerCount = 2 ** tagWidth - shipCount;
  const shipIndex = codecTable1.SHIPS.indexOf('SideWinder');
  const remainder = shipIndex % markerCount;
  const groupCount = Math.floor((shipCount - 1 - remainder) / markerCount) + 1;
  writeTestBits(bits, 1, 10);
  writeTestBits(bits, shipCount + remainder, tagWidth);

  const encoder = new ArithmeticEncoder((bit) => bits.push(bit));
  encoder.write(Math.floor(shipIndex / markerCount), groupCount);
  const symbols: Array<{ readonly value: number; readonly count: number }> = [
    { value: 0, count: 2 }, // ship name absent
    { value: 0, count: 2 }, // ship ident absent
    { value: 0, count: 2 }, // not the pristine stock loadout
    { value: 0, count: 2 }, // absolute module layout
    { value: 3, count: 4 }, // combination-rank index set
    { value: 0, count: codecTable1.SLOTS_BY_SHIP.SideWinder.length + 1 },
  ];
  symbols.push(
    { value: 0, count: 2 }, // no power overrides
    { value: 0, count: 2 }, // no engineering
  );
  symbols.forEach(({ value, count }) => encoder.write(value, count));
  encoder.finish();
  return encodeTestBits(bits);
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
  const defaults = codecTable1.DEFAULT_MODULES_BY_SHIP.SideWinder;
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

function powerDrawingModules(source: ShipLoadout): readonly FittedModule[] {
  return source.fittedModules().filter((module) => (module.effectiveStats?.powerDraw ?? 0) > 0);
}

/** Mirrors the canonicalisation in `scripts/generate-build-link-codec-tables.mjs`. */
async function canonicalHash(payload: unknown): Promise<string> {
  const canonicalise = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonicalise);
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.keys(value as Record<string, unknown>)
          .sort()
          .map((key) => [key, canonicalise((value as Record<string, unknown>)[key])]),
      );
    }
    return value;
  };
  const encoded = new TextEncoder().encode(JSON.stringify(canonicalise(payload)));
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
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

function writeTestVarUint(bits: number[], value: number): void {
  let remaining = value;
  do {
    const byte = remaining % 128;
    remaining = Math.floor(remaining / 128);
    writeTestBits(bits, byte | (remaining > 0 ? 0x80 : 0), 8);
  } while (remaining > 0);
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
  code:
    | InstanceType<typeof BuildLinkCodecError>['code']
    | readonly InstanceType<typeof BuildLinkCodecError>['code'][],
): BuildLinkCodecError {
  try {
    operation();
    expect.fail('Expected the codec to reject the input.');
  } catch (error) {
    expect(error).toBeInstanceOf(BuildLinkCodecError);
    const actual = (error as BuildLinkCodecError).code;
    if (Array.isArray(code)) expect(code).toContain(actual);
    else expect(actual).toBe(code);
    return error as BuildLinkCodecError;
  }
}
