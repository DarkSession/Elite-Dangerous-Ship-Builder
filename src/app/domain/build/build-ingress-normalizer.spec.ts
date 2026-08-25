import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { ModuleEngineering } from '@elite-dangerous-almanac/core/ships/slef';
import {
  FINAL_ARTICLE_SOURCE_QUALITY,
  FIXTURE_HULL,
  FIXTURE_SLOTS,
  OMITTED_FIXED_MOUNTS,
  finalArticlePartialQuality,
  SUPPORTED_PARTIAL_QUALITY,
  SUPPORTED_PARTIAL_SOURCE_QUALITY,
  UNKNOWN_HULL_PAYLOAD,
  UNSUPPORTED_PARTIAL_QUALITY,
  UNSUPPORTED_PARTIAL_SOURCE_QUALITY,
  UNUSABLE_FIXED_MOUNT,
} from '../outfitting/outfitting.fixtures';
import { normalizeIncomingBuild, normalizeReconstructedBuild } from './build-ingress-normalizer';
import { emptyFixedMounts } from './fixed-mounts';

/**
 * Ingress is all-or-nothing, and it happens before anyone is looking.
 *
 * These tests are about the two guarantees the rest of the feature stands on: a
 * candidate that is accepted has already had every fixed mount populated and
 * every supported partial roll completed, and a candidate that is refused has
 * changed nothing at all — because it never touched anything to begin with.
 */

describe('incoming build normalization', () => {
  it('refuses a hull the package does not carry', () => {
    const result = normalizeIncomingBuild(UNKNOWN_HULL_PAYLOAD);

    expect(result.kind).toBe('unusable');
    if (result.kind !== 'unusable') {
      return;
    }
    expect(result.reason).toContain(UNKNOWN_HULL_PAYLOAD.Ship);
  });

  it('accepts an absent fixed mount already populated by the package', () => {
    const result = normalizeIncomingBuild(OMITTED_FIXED_MOUNTS);

    expect(result.kind).toBe('accepted');
    if (result.kind !== 'accepted') {
      return;
    }
    expect(emptyFixedMounts(result.candidate)).toEqual([]);
    // A defaulted mount is ordinary build state. It produces no notice, because
    // there is nothing about it for a Commander to decide (FR-010, FR-011).
    expect(result.notices).toEqual([]);
  });

  it('accepts an unusable fixed mount replaced by the package default', () => {
    const result = normalizeIncomingBuild(UNUSABLE_FIXED_MOUNT);

    expect(result.kind).toBe('accepted');
    if (result.kind !== 'accepted') {
      return;
    }
    expect(result.candidate.fittedModuleAt(FIXTURE_SLOTS.core)).not.toBeNull();
    expect(emptyFixedMounts(result.candidate)).toEqual([]);
    expect(result.notices).toEqual([]);
  });

  it('completes a supported partial roll and reports it once', () => {
    const result = normalizeIncomingBuild(SUPPORTED_PARTIAL_QUALITY);

    expect(result.kind).toBe('accepted');
    if (result.kind !== 'accepted') {
      return;
    }
    expect(result.candidate.fittedModuleAt(FIXTURE_SLOTS.thrusters)?.engineering?.Quality).toBe(1);
    expect(result.notices).toEqual([
      {
        kind: 'qualityCompleted',
        slotKey: FIXTURE_SLOTS.thrusters,
        moduleSymbol: 'Int_Engine_Size7_Class5',
        blueprintFdname: 'Engine_Dirty',
        previousQuality: SUPPORTED_PARTIAL_SOURCE_QUALITY,
        quality: 1,
      },
    ]);
  });

  it('refuses the whole candidate when one partial roll is unsupported', () => {
    const result = normalizeIncomingBuild(UNSUPPORTED_PARTIAL_QUALITY);

    expect(result.kind).toBe('refused');
    if (result.kind !== 'refused') {
      return;
    }
    expect(result.failures).toHaveLength(1);
    const failure = result.failures[0]!;
    expect(failure.reason).toBe('packageResult');
    expect(failure.code).toBe('unidentifiedPreEngineeredVariant');
    // The refusal names exactly what arrived, so the surface can say it.
    expect(failure.source.slotKey).toBe(FIXTURE_SLOTS.frameShiftDrive);
    expect(failure.source.moduleSymbol).toBe('Int_Hyperdrive_Size6_Class5');
    expect(failure.source.blueprintFdname).toBe('FSD_LongRange');
    expect(failure.source.quality).toBe(UNSUPPORTED_PARTIAL_SOURCE_QUALITY);
  });

  it('refuses every affected slot at once rather than the first one', () => {
    const result = normalizeIncomingBuild({
      event: 'Loadout',
      Ship: FIXTURE_HULL,
      Modules: [
        {
          Slot: FIXTURE_SLOTS.frameShiftDrive,
          Item: 'Int_Hyperdrive_Size6_Class5',
          Engineering: { BlueprintName: 'FSD_LongRange', Level: 5, Quality: 0.42 },
        },
        {
          Slot: FIXTURE_SLOTS.thrusters,
          Item: 'Int_Engine_Size7_Class5',
          Engineering: { BlueprintName: 'No_Such_Blueprint', Level: 5, Quality: 0.5 },
        },
      ],
    });

    expect(result.kind).toBe('refused');
    if (result.kind !== 'refused') {
      return;
    }
    expect(result.failures.map((failure) => failure.source.slotKey).sort()).toEqual(
      [FIXTURE_SLOTS.frameShiftDrive, FIXTURE_SLOTS.thrusters].sort(),
    );
  });

  it('never asks the package to complete an absent or already complete quality', () => {
    const complete = normalizeIncomingBuild({
      event: 'Loadout',
      Ship: FIXTURE_HULL,
      Modules: [
        {
          Slot: FIXTURE_SLOTS.thrusters,
          Item: 'Int_Engine_Size7_Class5',
          Engineering: { BlueprintName: 'Engine_Dirty', Level: 5, Quality: 1 },
        },
      ],
    });
    expect(complete.kind).toBe('accepted');
    if (complete.kind === 'accepted') {
      expect(complete.notices).toEqual([]);
    }

    // Absent quality: the package answers `unsupported` if asked, so a pipeline
    // that asked would refuse a build with nothing wrong with it.
    const absent = normalizeIncomingBuild({
      event: 'Loadout',
      Ship: FIXTURE_HULL,
      Modules: [
        {
          Slot: FIXTURE_SLOTS.thrusters,
          Item: 'Int_Engine_Size7_Class5',
          Engineering: { BlueprintName: 'Engine_Dirty', Level: 5 } as ModuleEngineering,
        },
      ],
    });
    expect(absent.kind).toBe('accepted');
  });

  it('ignores a partial roll on a module the package did not keep', () => {
    // The article is unresolvable, so the package empties the mount. Its roll
    // went with it; correlating by slot alone would try to complete whatever
    // ended up there instead.
    const result = normalizeIncomingBuild({
      event: 'Loadout',
      Ship: FIXTURE_HULL,
      Modules: [
        {
          Slot: FIXTURE_SLOTS.hardpoint,
          Item: 'Hpt_NotAWeapon_Fixed_Huge',
          Engineering: { BlueprintName: 'Weapon_Overcharged', Level: 5, Quality: 0.3 },
        },
      ],
    });

    expect(result.kind).toBe('accepted');
    if (result.kind !== 'accepted') {
      return;
    }
    expect(result.notices).toEqual([]);
  });

  it('accepts a final article whose stated quality was never a roll', () => {
    // The regression a real Guardian loadout arrives as: the game writes the
    // baked recipe with `Quality: 0`, the package locks the article, and asking
    // it to complete a grade answers `finalArticle`. Reading that as a
    // normalization failure refused the whole build over a module that has
    // nothing wrong with it.
    const { event, slot, symbol } = finalArticlePartialQuality();

    const result = normalizeIncomingBuild(event);

    expect(result.kind).toBe('accepted');
    if (result.kind !== 'accepted') {
      return;
    }
    // Nothing was completed, so nothing is reported: the article is exactly the
    // article, at the quality the package holds it at.
    expect(result.notices).toEqual([]);
    const fitted = result.candidate.fittedModuleAt(slot);
    expect(fitted?.symbol).toBe(symbol);
    expect(fitted?.preEngineeredVariant?.engineeringLocked).toBe(true);
    expect(fitted?.engineering?.Quality).toBe(FINAL_ARTICLE_SOURCE_QUALITY);
  });

  it('accepts a final article on the reconstructed path too', () => {
    // Opening a record and loading a link read their partials off the built
    // candidate rather than off a source event. One pipeline, one answer: a
    // build that imports must also re-open.
    const { event } = finalArticlePartialQuality();
    const built = normalizeIncomingBuild(event);
    expect(built.kind).toBe('accepted');
    if (built.kind !== 'accepted') {
      return;
    }

    const reopened = normalizeReconstructedBuild(built.candidate);

    expect(reopened.kind).toBe('accepted');
    expect(reopened.kind === 'accepted' ? reopened.notices : null).toEqual([]);
  });

  it('touches nothing outside the candidate it was given', () => {
    // The pipeline is a pure function of its input: there is no active build to
    // change, no store to write and no revision to spend. Proving it directly
    // is what makes "a refusal costs nothing" a property rather than a promise.
    const existing = ShipLoadout.default(FIXTURE_HULL);
    const before = JSON.stringify(existing.toLoadoutEvent());

    normalizeIncomingBuild(UNSUPPORTED_PARTIAL_QUALITY);
    normalizeIncomingBuild(UNKNOWN_HULL_PAYLOAD);

    expect(JSON.stringify(existing.toLoadoutEvent())).toBe(before);
  });
});
