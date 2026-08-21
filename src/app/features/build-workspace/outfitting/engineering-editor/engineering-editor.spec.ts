import { TestBed } from '@angular/core/testing';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { BuildCandidate } from '../../../../application/active-build/active-build.models';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { ReplacementCoordinator } from '../../../../application/active-build/replacement-coordinator';
import { NO_BLUEPRINT } from '../../../../application/outfitting/engineering-draft';
import { OutfittingStore } from '../../../../application/outfitting/outfitting.store';
import type { SlotView } from '../../../../application/outfitting/slot-view';
import {
  FIXED_REWARD_REGRESSION,
  FIXTURE_SLOTS,
  defaultBuild,
  fixedRewardBuild,
} from '../../../../domain/outfitting/outfitting.fixtures';
import { provideLocalization } from '../../../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../../../i18n/testing/localization-harness';
import { NO_BLUEPRINT_CHOICE } from '../../../../ui/outfitting/blueprint-choice-list';
import { EngineeringEditor } from './engineering-editor';

/**
 * The editor's states, from the outside.
 *
 * The states table in the design names ten of them, and several look identical
 * on screen if they are not kept apart: an unengineered module and a mount with
 * no menu are both an editor with nothing selected; a known-zero cost and an
 * unavailable one are both an empty material list. A Commander needs a
 * different sentence for each (engineering editor design, "States").
 */

function candidateFor(loadout: ShipLoadout): BuildCandidate {
  return {
    loadout,
    hullName: 'Anaconda',
    provenance: 'stock',
    qualityNotices: [],
    sourceNamed: null,
    baseline: null,
  };
}

describe('engineering editor surface', () => {
  let store: OutfittingStore;
  let active: ActiveBuildStore;

  function open(slotKey: string) {
    store.select(slotKey);
    const fixture = TestBed.createComponent(EngineeringEditor);
    fixture.componentRef.setInput('slot', slotFor(slotKey));
    fixture.detectChanges();
    return fixture;
  }

  function slotFor(slotKey: string): SlotView {
    const slot = store.slots().find((candidate) => candidate.key === slotKey);
    if (slot === undefined) {
      throw new Error(`The fixture hull has no ${slotKey} mount.`);
    }
    return slot;
  }

  function commit(loadout: ShipLoadout): void {
    active.commit(candidateFor(loadout));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideLocalization(), ...provideIsolatedLocaleEnvironment()],
    });
    active = TestBed.inject(ActiveBuildStore);
    TestBed.inject(ReplacementCoordinator).setConfirmer(() => Promise.resolve(true));
    store = TestBed.inject(OutfittingStore);
  });

  describe('an unengineered module', () => {
    it('offers the package’s whole menu with nothing selected', () => {
      commit(defaultBuild());

      const fixture = open(FIXTURE_SLOTS.frameShiftDrive);
      const editor = fixture.componentInstance;

      expect(editor.state()).toBe('ready');
      expect(editor.blueprintChoices().length).toBeGreaterThan(0);
      expect(editor.selectedBlueprint()).toBeNull();
      // No grade until a recipe is chosen: a grade is a grade of something.
      expect(editor.grades()).toEqual([]);
      expect(editor.canApply()).toBe(false);
    });

    it('says the module is not engineered rather than leaving it blank', () => {
      commit(defaultBuild());

      const editor = open(FIXTURE_SLOTS.frameShiftDrive).componentInstance;

      expect(editor.currentSummary()?.toLowerCase()).toContain('not engineered');
      expect(editor.purchaseSummary()).toBeNull();
    });
  });

  describe('choosing', () => {
    it('offers exactly the selected recipe’s grades, and applies at one of them', () => {
      commit(defaultBuild());
      const editor = open(FIXTURE_SLOTS.frameShiftDrive).componentInstance;
      const recipe = editor.blueprintChoices()[0]!.fdname;

      editor.chooseBlueprint(recipe);

      const offered = store
        .loadout()!
        .availableBlueprints(FIXTURE_SLOTS.frameShiftDrive)
        .find((blueprint) => blueprint.fdname === recipe)!.grades;
      expect(editor.grades()).toEqual(offered);
      expect(offered).toContain(editor.selectedGrade());
      expect(editor.canApply()).toBe(true);
    });

    it('commits one revision and closes', () => {
      commit(defaultBuild());
      const fixture = open(FIXTURE_SLOTS.frameShiftDrive);
      const editor = fixture.componentInstance;
      const closed: unknown[] = [];
      editor.closed.subscribe(() => closed.push(true));
      editor.chooseBlueprint(editor.blueprintChoices()[0]!.fdname);
      const revision = store.revision();

      editor.apply();

      expect(store.revision()).toBe(revision + 1);
      expect(closed).toHaveLength(1);
      expect(
        store.loadout()?.fittedModuleAt(FIXTURE_SLOTS.frameShiftDrive)?.engineering?.Quality,
      ).toBe(1);
    });

    it('spends nothing on looking', () => {
      commit(defaultBuild());
      const editor = open(FIXTURE_SLOTS.frameShiftDrive).componentInstance;
      const revision = store.revision();

      editor.chooseBlueprint(editor.blueprintChoices()[0]!.fdname);
      editor.chooseGrade(editor.grades()[0]!);
      editor.chooseEffect(editor.effectChoices()[0]?.fdname ?? null);
      editor.revert();

      // Opening, choosing and abandoning is not a decision (FR-018).
      expect(store.revision()).toBe(revision);
    });
  });

  describe('clearing', () => {
    it('is the blueprint list’s first option and nothing else', () => {
      const build = defaultBuild();
      build.applyBlueprint(FIXTURE_SLOTS.frameShiftDrive, 'FSD_LongRange', {
        grade: 5,
        quality: 1,
      });
      commit(build);
      const editor = open(FIXTURE_SLOTS.frameShiftDrive).componentInstance;

      editor.chooseBlueprint(NO_BLUEPRINT_CHOICE);

      expect(editor.selectedBlueprint()).toBe(NO_BLUEPRINT);
      expect(editor.canApply()).toBe(true);

      editor.apply();

      expect(
        store.loadout()?.fittedModuleAt(FIXTURE_SLOTS.frameShiftDrive)?.engineering,
      ).toBeUndefined();
    });

    it('discloses the loss of purchase identity before it happens', () => {
      commit(fixedRewardBuild());

      const editor = open(FIXED_REWARD_REGRESSION.slot).componentInstance;

      // Only on a purchased article: on an ordinary module there is nothing
      // more to lose than the engineering itself.
      expect(editor.clearConsequence()).not.toBeNull();
    });

    it('says nothing about purchase identity on an ordinary module', () => {
      commit(defaultBuild());

      expect(open(FIXTURE_SLOTS.frameShiftDrive).componentInstance.clearConsequence()).toBeNull();
    });
  });

  describe('a purchased article', () => {
    it('keeps the purchase grade beside the grade now applied', () => {
      commit(fixedRewardBuild());

      const editor = open(FIXED_REWARD_REGRESSION.slot).componentInstance;

      expect(editor.purchaseSummary()).not.toBeNull();
      expect(editor.currentSummary()).not.toBeNull();
    });

    it('never prices what the article arrived with', () => {
      commit(fixedRewardBuild());

      const editor = open(FIXED_REWARD_REGRESSION.slot).componentInstance;

      expect(editor.fixedPurchase()).toBe(true);
    });
  });

  describe('the cost', () => {
    it('shows a known zero and an unavailable cost as different things', () => {
      const build = defaultBuild();
      build.applyBlueprint(FIXTURE_SLOTS.frameShiftDrive, 'FSD_LongRange', {
        grade: 5,
        quality: 1,
      });
      commit(build);
      const editor = open(FIXTURE_SLOTS.frameShiftDrive).componentInstance;

      // The recipe is already at grade 5, so climbing to grade 3 costs nothing
      // — and `[]` is "nothing more to buy", not "no figure".
      editor.chooseBlueprint('FSD_LongRange');
      editor.chooseGrade(3);

      const blueprint = editor.materialParts().find((part) => part.part === 'blueprint');
      expect(blueprint?.state).toBe('known');
      expect(blueprint?.materials).toEqual([]);
    });

    it('carries each material’s package rarity and count', () => {
      commit(defaultBuild());
      const editor = open(FIXTURE_SLOTS.frameShiftDrive).componentInstance;

      editor.chooseBlueprint('FSD_LongRange');
      editor.chooseGrade(5);

      const blueprint = editor.materialParts().find((part) => part.part === 'blueprint')!;
      expect(blueprint.state).toBe('known');
      expect(blueprint.materials.length).toBeGreaterThan(0);
      expect(blueprint.materials.every((material) => material.count.length > 0)).toBe(true);
      expect(blueprint.materials.some((material) => material.grade !== null)).toBe(true);
    });
  });

  describe('the comparison', () => {
    it('describes the candidate against the current module', () => {
      commit(defaultBuild());
      const editor = open(FIXTURE_SLOTS.frameShiftDrive).componentInstance;

      editor.chooseBlueprint('FSD_LongRange');
      editor.chooseGrade(5);

      const rows = editor.attributes();
      expect(rows.length).toBeGreaterThan(0);
      // Every row has at least one side; nothing is filled in for the other.
      expect(rows.every((row) => row.current !== null || row.candidate !== null)).toBe(true);
    });

    it('has nothing to show before a recipe is chosen', () => {
      commit(defaultBuild());

      expect(open(FIXTURE_SLOTS.frameShiftDrive).componentInstance.attributes()).toEqual([]);
    });
  });

  describe('a mount the package offers nothing for', () => {
    it('says so rather than drawing an empty editor', () => {
      commit(defaultBuild());

      const editor = open(FIXTURE_SLOTS.cargoHatch).componentInstance;

      expect(editor.state()).toBe('packageEmpty');
      expect(editor.showChoices()).toBe(false);
    });
  });

  describe('a stale draft', () => {
    it('refuses to apply, rebuilds, and keeps no history step', () => {
      commit(defaultBuild());
      const fixture = open(FIXTURE_SLOTS.frameShiftDrive);
      const editor = fixture.componentInstance;
      editor.chooseBlueprint('FSD_LongRange');
      editor.chooseGrade(5);

      // Something else changes the build under the open editor.
      store.dispatch({ kind: 'setPriority', slotKey: FIXTURE_SLOTS.core, priority: 3 });
      fixture.detectChanges();

      expect(editor.stale()).toBe(true);
      expect(editor.state()).toBe('stale');
      expect(editor.canApply()).toBe(false);

      const revision = store.revision();
      editor.apply();

      expect(store.revision()).toBe(revision);
      // Rebuilt against what the module actually carries now.
      expect(editor.stale()).toBe(false);
      expect(editor.selectedBlueprint()).toBeNull();
    });
  });
});
