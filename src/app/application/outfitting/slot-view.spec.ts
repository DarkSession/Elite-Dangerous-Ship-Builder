import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { getOutfittingFamilyName } from '@elite-dangerous-almanac/core/i18n/module-families';
import { getModuleName } from '@elite-dangerous-almanac/core/i18n/modules';
import { getPreEngineeredVariantName } from '@elite-dangerous-almanac/core/i18n/pre-engineered';
import {
  getLoadoutSlotName,
  getSlotRestrictionLabel,
} from '@elite-dangerous-almanac/core/i18n/slots';
import { presentGameText } from '../../i18n/game-text.presenter';
import {
  FIXTURE_SLOTS,
  OMITTED_FIXED_MOUNTS,
  defaultBuild,
  fixedRewardVariant,
} from '../../domain/outfitting/outfitting.fixtures';
import { hardpointCoverage } from './hardpoint-coverage.adapter';
import { slotCapabilities } from './slot-capabilities';
import { slotViews, type SlotTextResolver } from './slot-view';

/**
 * The ledger shows what the package says is there, with the two exceptions
 * FR-002a states and no third: the cargo hatch is drawn above the optional
 * mounts rather than after them, and the planetary approach mount is not drawn
 * at all. Empty mounts stay visible because a Commander fits into them; the
 * package's own reasons stay visible because a missing action with no reason is
 * indistinguishable from a bug.
 */

const text: SlotTextResolver = {
  slotName: (slot) => presentGameText(getLoadoutSlotName, slot, 'en'),
  slotRestrictionLabel: (restriction) =>
    presentGameText(getSlotRestrictionLabel, restriction, 'en'),
  moduleName: (symbol) => presentGameText(getModuleName, symbol, 'en'),
  preEngineeredVariantName: (variant) =>
    presentGameText(getPreEngineeredVariantName, variant, 'en'),
  outfittingFamilyName: (familyId) => presentGameText(getOutfittingFamilyName, familyId, 'en'),
};

describe('slot views', () => {
  it('renders every package slot but the planetary approach mount', () => {
    const loadout = defaultBuild();

    const views = slotViews(loadout, text);

    const withheld = loadout
      .slots()
      .filter((slot) => slot.kind === 'optional' && slot.restriction === 'planetaryApproachSuite');
    expect(withheld.length).toBe(1);
    expect([...views].map((view) => view.key).sort()).toEqual(
      loadout
        .slots()
        .map((slot) => slot.key)
        .filter((key) => key !== withheld[0]!.key)
        .sort(),
    );
    // Withheld from the ledger and from nothing else: the suite is still in the
    // build the package holds.
    expect(loadout.fittedModuleAt(withheld[0]!.key)).not.toBeNull();
  });

  it('draws the cargo hatch above the optional mounts, and keeps every other place', () => {
    const loadout = defaultBuild();

    const kinds = slotViews(loadout, text).map((view) => view.kind);

    // The package puts the hatch last of all. The ledger closes the core
    // internals with it, which is where the `CORE` category already lists it
    // (FR-002a).
    expect(kinds.indexOf('cargoHatch')).toBe(kinds.lastIndexOf('core') + 1);
    expect(kinds.indexOf('cargoHatch')).toBeLessThan(kinds.indexOf('optional'));
    // Everything else is the package's own order, with the hatch taken out.
    expect(kinds.filter((kind) => kind !== 'cargoHatch')).toEqual(
      loadout
        .slots()
        .filter((slot) => slot.kind !== 'cargoHatch')
        .filter(
          (slot) => !(slot.kind === 'optional' && slot.restriction === 'planetaryApproachSuite'),
        )
        .map((slot) => slot.kind),
    );
  });

  it('numbers a mount by its place in the package’s own list, not the drawn one', () => {
    const loadout = defaultBuild();

    const views = slotViews(loadout, text);

    // Node numbers are counted before the withheld mount is dropped and before
    // the hatch moves, so no mount is renumbered by what the ledger does not
    // draw or by where it draws it.
    for (const kind of ['hardpoint', 'utility', 'optional'] as const) {
      const packaged = loadout.slots().filter((slot) => slot.kind === kind);
      for (const view of views.filter((candidate) => candidate.kind === kind)) {
        expect(view.node).toBe(packaged.findIndex((slot) => slot.key === view.key) + 1);
      }
    }
  });

  it('keeps empty removable mounts visible', () => {
    const loadout = defaultBuild();
    loadout.removeModule(FIXTURE_SLOTS.fittedOptional);

    const view = slotViews(loadout, text).find(
      (candidate) => candidate.key === FIXTURE_SLOTS.fittedOptional,
    );

    expect(view).toBeDefined();
    expect(view?.module).toBeNull();
    expect(view?.removable).toBe(true);
  });

  it('shows every package-resolved fixed mount as ordinary fitted state', () => {
    // Constructed from a payload that named no modules at all, so every fixed
    // mount is the package's default. Nothing marks them as repaired, because
    // nothing repaired them (FR-010).
    const views = slotViews(ShipLoadout.fromLoadout(OMITTED_FIXED_MOUNTS), text);
    const fixed = views.filter((view) => ['core', 'armour', 'cargoHatch'].includes(view.kind));

    expect(fixed.length).toBeGreaterThan(0);
    for (const view of fixed) {
      expect(view.module, view.key).not.toBeNull();
    }
  });

  it('reports the cargo hatch’s package reason and offers power and its engineering panel', () => {
    const loadout = defaultBuild();
    const views = slotViews(loadout, text);
    const hatch = views.find((view) => view.key === FIXTURE_SLOTS.cargoHatch)!;

    expect(hatch.immovableReason).toBe('cargoHatch');
    expect(hatch.removable).toBe(false);

    const capabilities = slotCapabilities(loadout, hatch);
    expect(capabilities).toEqual({
      canOpenReplacement: false,
      canFitSelection: false,
      canRemove: false,
      // The panel opens on anything fitted, the hatch included. Whether the
      // Almanac offers a recipe for it is what the panel says, not what decides
      // whether there is one to read (wave 9).
      canOpenEngineering: true,
      canSetEnabled: true,
      canSetPriority: true,
      packageEmpty: true,
    });
  });

  it('reports a required core mount as replaceable but not removable', () => {
    const loadout = defaultBuild();
    const plant = slotViews(loadout, text).find((view) => view.key === FIXTURE_SLOTS.core)!;

    expect(plant.removable).toBe(false);
    expect(plant.immovableReason).toBe('requiredSlot');
    const capabilities = slotCapabilities(loadout, plant);
    expect(capabilities.canOpenReplacement).toBe(true);
    expect(capabilities.canRemove).toBe(false);
  });

  it('never turns an unavailable fact into a zero', () => {
    const loadout = defaultBuild();
    const views = slotViews(loadout, text);
    const utility = views.find((view) => view.kind === 'utility')!;

    // Utility mounts publish `0` as a size placeholder because their fit rules
    // are not size-based. Drawing that as "size 0" would state something the
    // package did not.
    expect(utility.size).toBeNull();
  });

  it('recognises a fitted variant only through the package', () => {
    const loadout = defaultBuild();
    loadout.setPreEngineeredVariant(FIXTURE_SLOTS.frameShiftDrive, fixedRewardVariant());

    const drive = slotViews(loadout, text).find(
      (view) => view.key === FIXTURE_SLOTS.frameShiftDrive,
    )!;

    expect(drive.module?.variant?.acquisition).toBe('techBroker');
    // The purchase grade the article was bought at, and the current ordinary
    // grade, are separate facts and stay separate (FR-007).
    expect(drive.module?.variant?.grade).toBe(5);
    expect(drive.module?.engineering?.BlueprintName).toBe('FSD_LongRange');
    // The name a Commander reads is the package's, never the fdname echoed.
    expect(drive.module?.displayName.text).not.toBe('FSD_LongRange');
  });

  it('preserves absent power state rather than defaulting it', () => {
    const loadout = defaultBuild();
    const lifeSupport = slotViews(loadout, text).find((view) => view.key === 'LifeSupport')!;

    expect(lifeSupport.module?.enabled).toBeUndefined();
    expect(lifeSupport.module?.priority).toBeUndefined();

    loadout.setModuleEnabled('LifeSupport', false);
    const off = slotViews(loadout, text).find((view) => view.key === 'LifeSupport')!;
    // `false` is a decision and `undefined` is silence. They never merge.
    expect(off.module?.enabled).toBe(false);
  });

  it('numbers each mount within its kind for the label the canvas draws', () => {
    const views = slotViews(defaultBuild(), text);
    const hardpoints = views.filter((view) => view.kind === 'hardpoint');

    expect(hardpoints.map((view) => view.node)).toEqual(hardpoints.map((_, index) => index + 1));
  });
});

describe('hardpoint coverage', () => {
  it('reports the occupied mounts when the views can answer', () => {
    const views = slotViews(defaultBuild(), text);

    const coverage = hardpointCoverage(views);

    expect(coverage.kind).toBe('complete');
    if (coverage.kind !== 'complete') {
      return;
    }
    expect(coverage.occupiedSlots).toEqual(
      views
        .filter((view) => view.kind === 'hardpoint' && view.module !== null)
        .map((view) => view.key),
    );
  });

  it('confirms empty only when every package hardpoint is empty', () => {
    const loadout = defaultBuild();
    for (const slot of loadout.slots('hardpoint')) {
      if (slot.module !== null) {
        loadout.removeModule(slot.key);
      }
    }

    expect(hardpointCoverage(slotViews(loadout, text)).kind).toBe('confirmedEmpty');
  });

  it('says unavailable rather than empty when the views cannot answer', () => {
    // No views at all is not evidence of no weapons. Reporting it as empty
    // would state something about the build that nobody checked.
    expect(hardpointCoverage([]).kind).toBe('unavailable');
  });
});
