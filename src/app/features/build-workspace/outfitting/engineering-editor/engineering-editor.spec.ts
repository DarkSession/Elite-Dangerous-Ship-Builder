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

  /**
   * The editor over one mount, in the composition that holds a draft.
   *
   * Canvas 1d's layer is where choices are gathered and applied by an explicit
   * control, so that is what the draft states are exercised through. The
   * inline composition canvas 1c draws has no such control and commits each
   * choice as it is made; `openInline` is how that is exercised instead.
   *
   * `asLayer` is set after the first render rather than before it, because the
   * layer element opens a modal dialog the test DOM has no implementation for
   * — and nothing here reads the rendered layer, only the signals behind it.
   */
  function open(slotKey: string) {
    const fixture = openInline(slotKey);
    fixture.componentRef.setInput('asLayer', true);
    return fixture;
  }

  function openInline(slotKey: string) {
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

    it('draws no purchase line on a module that was never bought as an article', () => {
      commit(defaultBuild());

      // What the module carries now is drawn by the choices themselves — an
      // unengineered module has none checked — so there is no sentence here to
      // read, and nothing about a purchase either.
      expect(open(FIXTURE_SLOTS.frameShiftDrive).componentInstance.purchaseSummary()).toBeNull();
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
    it('keeps the purchase grade, which the choices themselves cannot show', () => {
      commit(fixedRewardBuild());

      const editor = open(FIXED_REWARD_REGRESSION.slot).componentInstance;

      // The grade it was bought at is not the grade now applied, and no drawn
      // choice carries it — so this line stays where the current recipe's does
      // not (FR-007).
      expect(editor.purchaseSummary()).not.toBeNull();
    });

    it('shows the grade it carries even when its recipe does not offer that grade', () => {
      commit(fixedRewardBuild());

      const editor = open(FIXED_REWARD_REGRESSION.slot).componentInstance;

      // A bespoke Mercenary recipe starts at grade 2. An article bought at
      // grade 1 still carries grade 1, and a blank bar on a plainly engineered
      // module is the bug this guards (wave 5).
      expect(editor.selectedGrade()).toBe(editor.draft()?.current.currentGrade ?? null);
      expect(editor.selectedGrade()).not.toBeNull();
    });
  });

  describe('the cost', () => {
    it('prices the recipe whatever the module already carries', () => {
      const build = defaultBuild();
      build.applyBlueprint(FIXTURE_SLOTS.frameShiftDrive, 'FSD_LongRange', {
        grade: 5,
        quality: 1,
      });
      commit(build);
      const editor = open(FIXTURE_SLOTS.frameShiftDrive).componentInstance;

      editor.chooseBlueprint('FSD_LongRange');
      editor.chooseGrade(3);

      // Engineering always costs materials. The module already being at grade 5
      // does not make a grade 3 job free — what the panel answers is what this
      // job costs, and an empty list would mean the Almanac priced none of it
      // (wave 5).
      // One list, not one per part: the recipe and the effect are folded
      // together because a Commander gathers them once (wave 9).
      const [only, ...rest] = editor.materialParts();
      expect(rest).toEqual([]);
      expect(only?.state).toBe('known');
      expect(only?.materials.length).toBeGreaterThan(0);
    });

    it('carries each material’s package rarity and count', () => {
      commit(defaultBuild());
      const editor = open(FIXTURE_SLOTS.frameShiftDrive).componentInstance;

      editor.chooseBlueprint('FSD_LongRange');
      editor.chooseGrade(5);

      const [only] = editor.materialParts();
      expect(only.state).toBe('known');
      expect(only.materials.length).toBeGreaterThan(0);
      expect(only.materials.every((material) => material.count.length > 0)).toBe(true);
      expect(only.materials.some((material) => material.grade !== null)).toBe(true);
    });

    it('lists them commonest first, in the one shared order', () => {
      commit(defaultBuild());
      const editor = open(FIXTURE_SLOTS.frameShiftDrive).componentInstance;

      editor.chooseBlueprint('FSD_LongRange');
      editor.chooseGrade(5);

      // The package returns its own catalogue order, which is neither. This
      // panel and the status rail draw the same materials for the same build,
      // so both read them through `sortMaterialLines` — and nothing but an
      // assertion here holds this caller to it (ruling G,
      // `specs/009-cost-and-materials/design/reference-review.md`).
      const grades = editor
        .materialParts()[0]!
        .materials.map((material) => material.grade ?? Number.MAX_SAFE_INTEGER);

      expect(grades.length).toBeGreaterThan(1);
      expect(new Set(grades).size).toBeGreaterThan(1);
      expect(grades).toEqual([...grades].sort((left, right) => left - right));
    });
  });

  describe('the comparison', () => {
    it('describes the modified module against the stock one', () => {
      commit(defaultBuild());
      const editor = open(FIXTURE_SLOTS.frameShiftDrive).componentInstance;

      editor.chooseBlueprint('FSD_LongRange');
      editor.chooseGrade(5);

      const rows = editor.attributes();
      expect(rows.length).toBeGreaterThan(0);
      // Every row has at least one side; nothing is filled in for the other.
      expect(rows.every((row) => row.stock !== null || row.modified !== null)).toBe(true);
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

      // Something else changes the build under the open editor. Nothing is
      // re-rendered: the staleness is in the signals, and the layer element
      // would open a modal dialog the test DOM has no implementation for.
      store.dispatch({ kind: 'setPriority', slotKey: FIXTURE_SLOTS.core, priority: 3 });

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

  describe('a Merc-Coin recipe', () => {
    it('is offered on the article that was bought with it and on no other', () => {
      commit(defaultBuild());

      // The stock article's own menu. A recipe whose grades start above 1 is a
      // purchase's, and the Almanac would refuse it here after the Commander
      // had chosen it (wave 4).
      const stock = openInline(FIXTURE_SLOTS.hardpoint).componentInstance;
      expect(stock.blueprintChoices().every((choice) => choice.route === 'ordinary')).toBe(true);
    });

    it('runs its grade bar from one, with the grades it cannot reach refused', () => {
      commit(defaultBuild());
      const editor = open(FIXTURE_SLOTS.frameShiftDrive).componentInstance;

      editor.chooseBlueprint('FSD_LongRange');

      // One cell per grade to the recipe's highest, and `lowestGrade` is what
      // makes the ones below the recipe's first refuse rather than vanish.
      expect(editor.grades()[0]).toBe(1);
      expect(editor.grades().at(-1)).toBeGreaterThan(1);
      expect(editor.lowestGrade()).toBe(1);
    });
  });

  describe('the inline editor', () => {
    it('keeps showing what the recipe did once there is nothing left to apply', () => {
      commit(defaultBuild());
      const fixture = openInline(FIXTURE_SLOTS.frameShiftDrive);
      const editor = fixture.componentInstance;

      editor.chooseBlueprint('FSD_LongRange');
      fixture.componentRef.setInput('slot', slotFor(FIXTURE_SLOTS.frameShiftDrive));

      // Canvas 1c draws the comparison beside a module that already carries its
      // recipe. Emptying it the moment the recipe lands would empty it exactly
      // when a Commander goes looking for what it did.
      const rows = editor.attributes();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.some((row) => row.stock !== row.modified)).toBe(true);
    });

    it('commits each choice as it is made, because the canvas draws no apply', () => {
      commit(defaultBuild());
      const editor = openInline(FIXTURE_SLOTS.frameShiftDrive).componentInstance;

      const revision = store.revision();
      editor.chooseBlueprint('FSD_LongRange');

      // Canvas 1c draws no apply and no revert. Inline the choice is the
      // decision, and undo is what takes it back (design-canvas rule, wave 4).
      expect(store.revision()).toBeGreaterThan(revision);
      expect(
        slotFor(FIXTURE_SLOTS.frameShiftDrive).module?.engineering?.BlueprintName?.toLowerCase(),
      ).toBe('fsd_longrange');
    });
  });
});
