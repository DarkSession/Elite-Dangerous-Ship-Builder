import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import {
  FIXED_REWARD_REGRESSION,
  FIXTURE_HULL,
  FIXTURE_SLOTS,
  defaultBuild,
  fixedRewardBuild,
  mercenaryVariant,
  packageText,
} from '../../domain/outfitting/outfitting.fixtures';
import {
  NO_BLUEPRINT,
  currentSelection,
  draftIsStale,
  engineeringIntent,
  engineeringOperation,
  openEngineeringDraft,
  openingSelection,
  withBlueprint,
  withEffect,
  withGrade,
  type EngineeringDraft,
  type EngineeringSelection,
} from './engineering-draft';
import { engineeringView } from './engineering-view';
import { fittedModuleView } from './fitted-module-view';

/**
 * The engineering draft, against the installed package.
 *
 * Every menu, grade and identity in here comes from a real `ShipLoadout`. The
 * draft's whole job is to offer exactly what the package offers and nothing
 * else, so a suite that wrote its own menus down would be testing the
 * fabrication rather than the rule (constitution II).
 */

const TEXT = packageText();
const SLOT = FIXTURE_SLOTS.frameShiftDrive;

/** A draft over the fixture hull's drive, at revision 1. */
function driveDraft(
  selection: EngineeringSelection = { blueprintFdname: null, grade: null, effectFdname: null },
  loadout: ShipLoadout = defaultBuild(),
  revision = 1,
): EngineeringDraft {
  const draft = openEngineeringDraft(loadout, SLOT, revision, selection, TEXT);
  expect(draft).not.toBeNull();
  return draft!;
}

describe('engineering draft', () => {
  describe('menus', () => {
    it('offers exactly the package’s own blueprint menu, in its own order', () => {
      const loadout = defaultBuild();

      const draft = driveDraft(undefined, loadout);

      expect(draft.blueprints).toEqual(loadout.availableBlueprints(SLOT));
      expect(draft.blueprints.length).toBeGreaterThan(0);
    });

    it('offers exactly the package’s own effect menu', () => {
      const loadout = defaultBuild();

      const draft = driveDraft(undefined, loadout);

      expect(draft.effects).toEqual(loadout.availableExperimentalEffects(SLOT));
    });

    it('offers no grade the selected descriptor does not publish', () => {
      const loadout = defaultBuild();
      const descriptor = loadout.availableBlueprints(SLOT)[0]!;

      const draft = driveDraft(
        { blueprintFdname: descriptor.fdname, grade: 99, effectFdname: null },
        loadout,
      );

      // A grade the package never published for this recipe is not a grade a
      // Commander can be offered, so it is dropped rather than clamped into one.
      expect(draft.selectedGrade).toBeNull();
      expect(descriptor.grades).not.toContain(99);
    });

    it('drops an effect that is not on this mount’s menu', () => {
      const draft = driveDraft({
        blueprintFdname: null,
        grade: null,
        effectFdname: 'special_no_such_effect',
      });

      expect(draft.selectedEffectFdname).toBeNull();
    });

    it('says the package offers nothing rather than drawing an empty editor', () => {
      const loadout = defaultBuild();
      const hatch = FIXTURE_SLOTS.cargoHatch;
      expect(loadout.availableBlueprints(hatch)).toHaveLength(0);

      const draft = openEngineeringDraft(
        loadout,
        hatch,
        1,
        { blueprintFdname: null, grade: null, effectFdname: null },
        TEXT,
      );

      expect(draft?.packageEmpty).toBe(true);
    });

    it('is nothing at all for an empty mount', () => {
      const loadout = ShipLoadout.empty(FIXTURE_HULL);
      const empty = loadout.slots().find((slot) => slot.module === null);
      expect(empty).toBeDefined();

      expect(
        openEngineeringDraft(
          loadout,
          empty!.key,
          1,
          { blueprintFdname: null, grade: null, effectFdname: null },
          TEXT,
        ),
      ).toBeNull();
    });
  });

  describe('no selection and no blueprint', () => {
    it('opens on what the module already carries, never on “remove it”', () => {
      const loadout = defaultBuild();
      loadout.applyBlueprint(SLOT, 'FSD_LongRange', { grade: 4, quality: 1 });
      const current = engineeringView(fittedModuleView(loadout.fittedModuleAt(SLOT)!, TEXT));

      expect(openingSelection(current)).toEqual({
        blueprintFdname: 'FSD_LongRange',
        grade: 4,
        effectFdname: null,
      });
    });

    it('opens an unengineered module with nothing selected, not with ‘none’', () => {
      const draft = driveDraft();

      // `null` is "the Commander has chosen nothing yet". `'none'` would be the
      // editor proposing to strip a module that has nothing to strip.
      expect(draft.selectedBlueprintFdname).toBeNull();
      expect(draft.selectedBlueprintFdname).not.toBe(NO_BLUEPRINT);
    });

    it('asks for nothing when nothing has been chosen', () => {
      expect(engineeringIntent(driveDraft())).toBeNull();
    });

    it('dispatches clearEngineering for ‘none’, never applyBlueprint', () => {
      const loadout = defaultBuild();
      loadout.applyBlueprint(SLOT, 'FSD_LongRange', { grade: 5, quality: 1 });
      const draft = driveDraft(
        { blueprintFdname: NO_BLUEPRINT, grade: null, effectFdname: null },
        loadout,
      );

      // The package has a word for removing engineering. Using `applyBlueprint`
      // with a hole in it would blur what was asked for (data model).
      expect(engineeringIntent(draft)).toEqual({ kind: 'clearEngineering', slotKey: SLOT });
    });

    it('really does strip the module when ‘none’ is applied', () => {
      const loadout = defaultBuild();
      loadout.applyBlueprint(SLOT, 'FSD_LongRange', { grade: 5, quality: 1 });
      const draft = driveDraft(
        { blueprintFdname: NO_BLUEPRINT, grade: null, effectFdname: null },
        loadout,
      );

      engineeringOperation(engineeringIntent(draft)!)!(loadout);

      expect(loadout.fittedModuleAt(SLOT)?.engineering).toBeUndefined();
    });

    it('clears the effect with the blueprint when ‘none’ is chosen', () => {
      const loadout = defaultBuild();
      const effect = loadout.availableExperimentalEffects(SLOT)[0]!;
      loadout.applyBlueprint(SLOT, 'FSD_LongRange', { grade: 5, quality: 1, experimental: effect });
      const draft = driveDraft(
        { blueprintFdname: 'FSD_LongRange', grade: 5, effectFdname: effect },
        loadout,
      );

      // Otherwise the editor would show a chosen effect that the operation it
      // is about to run discards.
      expect(withBlueprint(draft, NO_BLUEPRINT)).toEqual({
        blueprintFdname: NO_BLUEPRINT,
        grade: null,
        effectFdname: null,
      });
    });
  });

  describe('quality', () => {
    it('is the literal 1 on every projection, whatever the block says', () => {
      const loadout = defaultBuild();
      loadout.applyBlueprint(SLOT, 'FSD_LongRange', { grade: 5, quality: 0.42 });

      const draft = driveDraft(undefined, loadout);

      // The application models completed grades only. A roll is not something
      // it can produce, edit or show (FR-013).
      expect(draft.current.quality).toBe(1);
    });

    it('applies at explicit quality 1, never at the package’s default', () => {
      const loadout = defaultBuild();
      const draft = driveDraft(
        { blueprintFdname: 'FSD_LongRange', grade: 5, effectFdname: null },
        loadout,
      );

      engineeringOperation(engineeringIntent(draft)!)!(loadout);

      expect(loadout.fittedModuleAt(SLOT)?.engineering?.Quality).toBe(1);
    });

    it('exposes no roll control of any kind', () => {
      const draft = driveDraft();

      // The draft is the only thing an editor can render a control from, so a
      // quality field absent here is a quality control absent everywhere.
      expect(Object.keys(draft)).not.toContain('quality');
      expect(Object.keys(draft)).not.toContain('selectedQuality');
    });
  });

  describe('purchase identity', () => {
    it('keeps the purchase grade separate from the grade now applied', () => {
      const merc = mercenaryVariant();
      const loadout = ShipLoadout.default(FIXTURE_HULL);
      const slot = loadout
        .slots('hardpoint')
        .find((candidate) =>
          loadout.modulesForSlot(candidate.key).some((module) => module.symbol === merc.symbol),
        );
      expect(slot).toBeDefined();
      loadout.setPreEngineeredVariant(slot!.key, merc);

      const draft = openEngineeringDraft(
        loadout,
        slot!.key,
        1,
        { blueprintFdname: null, grade: null, effectFdname: null },
        TEXT,
      );

      // Two different numbers about two different things. Showing one as the
      // other tells a Commander their reward is worse than it is (FR-007).
      expect(draft?.current.purchaseVariant?.grade).toBe(merc.grade);
      expect(draft?.current.currentGrade).toBe(merc.grade);
      expect(draft?.current.purchaseVariant?.blueprint).toBe(merc.blueprint);
    });

    it('previews an effect-only change without rolling a reward’s recipe', () => {
      const loadout = fixedRewardBuild();
      const slot = FIXED_REWARD_REGRESSION.slot;
      const effect = loadout.availableExperimentalEffects(slot)[0]!;
      const current = loadout.fittedModuleAt(slot)!;

      const draft = openEngineeringDraft(
        loadout,
        slot,
        1,
        {
          blueprintFdname: current.engineering!.BlueprintName,
          grade: current.engineering!.Level,
          effectFdname: effect,
        },
        TEXT,
      );

      // Nothing about the recipe is moving, so this is the effect operation —
      // the one that keeps the article's hand-set block and its identity
      // (FR-012). Previewing it as a fresh `applyBlueprint` would show a reward
      // that had been rolled into an ordinary module.
      expect(engineeringIntent(draft!)).toEqual({
        kind: 'setExperimental',
        slotKey: slot,
        effectFdname: effect,
      });
    });
  });

  describe('selection transitions', () => {
    it('keeps a grade the new recipe also offers', () => {
      const loadout = defaultBuild();
      const [first, second] = loadout.availableBlueprints(SLOT);
      expect(second).toBeDefined();
      const shared = first!.grades.find((grade) => second!.grades.includes(grade))!;

      const draft = driveDraft(
        { blueprintFdname: first!.fdname, grade: shared, effectFdname: null },
        loadout,
      );

      expect(withBlueprint(draft, second!.fdname).grade).toBe(shared);
    });

    it('ignores a blueprint the package does not offer here', () => {
      const draft = driveDraft();

      expect(withBlueprint(draft, 'Weapon_Overcharged')).toEqual(currentSelection(draft));
    });

    it('moves the grade and the effect without touching the rest', () => {
      const loadout = defaultBuild();
      const descriptor = loadout.availableBlueprints(SLOT)[0]!;
      const effect = loadout.availableExperimentalEffects(SLOT)[0]!;
      const draft = driveDraft(
        { blueprintFdname: descriptor.fdname, grade: descriptor.grades[0]!, effectFdname: null },
        loadout,
      );

      expect(withGrade(draft, descriptor.grades.at(-1)!)).toEqual({
        blueprintFdname: descriptor.fdname,
        grade: descriptor.grades.at(-1),
        effectFdname: null,
      });
      expect(withEffect(draft, effect).effectFdname).toBe(effect);
      expect(withEffect(draft, null).effectFdname).toBeNull();
    });
  });

  describe('staleness', () => {
    it('is stale exactly when the build has moved on', () => {
      const draft = driveDraft(undefined, defaultBuild(), 7);

      expect(draftIsStale(draft, 7)).toBe(false);
      expect(draftIsStale(draft, 8)).toBe(true);
    });

    it('rebuilds against the current build rather than reusing the old menus', () => {
      const loadout = defaultBuild();
      const slot = FIXTURE_SLOTS.fittedOptional;
      const descriptor = loadout.availableBlueprints(slot)[0]!;
      const before = openEngineeringDraft(
        loadout,
        slot,
        1,
        {
          blueprintFdname: descriptor.fdname,
          grade: descriptor.grades.at(-1)!,
          effectFdname: null,
        },
        TEXT,
      );
      expect(before?.selectedBlueprintFdname).toBe(descriptor.fdname);

      // The mount is emptied under the open draft. Rebuilding is what turns a
      // selection about a module that is gone into no selection at all, rather
      // than into a fit the package would refuse after offering it.
      loadout.removeModule(slot);
      const after = openEngineeringDraft(loadout, slot, 2, currentSelection(before!), TEXT);

      expect(after).toBeNull();
    });
  });

  describe('the preview', () => {
    it('describes the modified module against the stock one, from package stats', () => {
      const loadout = defaultBuild();
      const draft = driveDraft(
        { blueprintFdname: 'FSD_LongRange', grade: 5, effectFdname: null },
        loadout,
      );

      expect(draft.preview.kind).toBe('known');
      const attributes = draft.preview.kind === 'known' ? draft.preview.attributes : [];
      expect(attributes.length).toBeGreaterThan(0);
      // Every row has at least one side, or it would not be a row.
      expect(attributes.every((row) => row.stock !== null || row.modified !== null)).toBe(true);
      // The stock column is the package's catalogue record for the fitted
      // article — the reference's own `STOCK` — not the module as it stands.
      const mass = attributes.find((row) => row.attribute === 'mass');
      expect(mass?.stock).toBe(loadout.fittedModuleAt(SLOT)?.stats?.mass);
    });

    it('changes nothing about the build it previewed against', () => {
      const loadout = defaultBuild();
      const before = loadout.fittedModuleAt(SLOT)?.engineering;

      driveDraft({ blueprintFdname: 'FSD_LongRange', grade: 5, effectFdname: null }, loadout);

      // Opening a draft is not a decision. The preview runs on a detached copy,
      // so looking at what a grade 5 would do costs nothing (FR-018).
      expect(loadout.fittedModuleAt(SLOT)?.engineering).toEqual(before);
    });

    it('is unavailable rather than invented when the package refuses the selection', () => {
      const loadout = defaultBuild();

      const draft = driveDraft({ blueprintFdname: null, grade: null, effectFdname: null }, loadout);

      expect(draft.preview).toEqual({ kind: 'unavailable' });
    });
  });
});
