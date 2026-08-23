import { TestBed } from '@angular/core/testing';
import { provideLocalization } from '../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../i18n/testing/localization-harness';
import { captureCheckpoint } from '../../domain/build/modeled-build-checkpoint';
import { FIXTURE_SLOTS, defaultBuild } from '../../domain/outfitting/outfitting.fixtures';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { ReplacementCoordinator } from '../active-build/replacement-coordinator';
import type { BuildCandidate } from '../active-build/active-build.models';
import { OutfittingStore } from './outfitting.store';

/**
 * The store's two promises, checked from the outside.
 *
 * One: looking is free. Selecting a mount, opening a chooser, typing a query
 * and closing again must leave the build's revision exactly where it was, or
 * undo would fill up with things nobody decided (FR-018).
 *
 * Two: a refusal costs nothing. The build, the revision and every editing field
 * a Commander had open stay as they were.
 */

function candidateFor(loadout = defaultBuild()): BuildCandidate {
  return {
    loadout,
    hullName: 'Anaconda',
    provenance: 'stock',
    qualityNotices: [],
    sourceNamed: null,
    baseline: null,
  };
}

describe('outfitting store', () => {
  let store: OutfittingStore;
  let active: ActiveBuildStore;
  let coordinator: ReplacementCoordinator;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideLocalization(), ...provideIsolatedLocaleEnvironment()],
    });
    active = TestBed.inject(ActiveBuildStore);
    coordinator = TestBed.inject(ReplacementCoordinator);
    store = TestBed.inject(OutfittingStore);
    // Replacing an unsaved build asks first, so the tests that replace one
    // answer yes. That question is feature 001's and is not what is under test.
    coordinator.setConfirmer(() => Promise.resolve(true));
    active.commit(candidateFor());
  });

  it('spends no revision on selection, surface or query changes', () => {
    const revision = active.revision();

    store.select(FIXTURE_SLOTS.core);
    store.showSurface('replacement');
    store.setQuery('multi');
    store.showSurface('engineering');
    store.select(null);

    expect(active.revision()).toBe(revision);
  });

  it('commits exactly one revision for one changed decision', () => {
    const revision = active.revision();

    const result = store.dispatch({ kind: 'remove', slotKey: FIXTURE_SLOTS.fittedOptional });

    expect(result.kind).toBe('committed');
    expect(active.revision()).toBe(revision + 1);
    expect(active.loadout()?.fittedModuleAt(FIXTURE_SLOTS.fittedOptional)).toBeNull();
  });

  it('keeps the build, the revision and every editing field after a refusal', () => {
    store.select(FIXTURE_SLOTS.cargoHatch);
    store.showSurface('replacement');
    store.setQuery('hatch');
    const before = captureCheckpoint(active.loadout()!);
    const revision = active.revision();

    // The package reports the cargo hatch as immovable, so removal is an
    // operation it does not offer.
    const result = store.dispatch({ kind: 'remove', slotKey: FIXTURE_SLOTS.cargoHatch });

    expect(result.kind).toBe('refused');
    expect(active.revision()).toBe(revision);
    expect(captureCheckpoint(active.loadout()!)).toEqual(before);
    expect(store.selectedSlotKey()).toBe(FIXTURE_SLOTS.cargoHatch);
    expect(store.surface()).toBe('replacement');
    expect(store.query()).toBe('hatch');
    expect(store.lastEditFailure()?.category).toBe('unavailableOperation');
  });

  it('clears selection, surface and query when the build is replaced', async () => {
    store.select(FIXTURE_SLOTS.core);
    store.showSurface('engineering');
    store.setQuery('plant');

    await coordinator.replace(() => ({ ok: true, candidate: candidateFor() }));

    // Back to where the canvas opens: the first mount of the new build, not a
    // bench with nothing in it — the reference draws no such screen.
    expect(store.selectedSlotKey()).toBe(store.slots()[0]?.key);
    expect(store.surface()).toBe('workspace');
    expect(store.query()).toBe('');
    expect(store.lastEditFailure()).toBeNull();
  });

  it('preserves editing state when an incoming build is refused', async () => {
    store.select(FIXTURE_SLOTS.core);
    store.showSurface('replacement');
    store.setQuery('plant');

    const result = await coordinator.replace(() => ({ ok: false, reason: 'refused' }));

    expect(result.kind).toBe('failed');
    // Nothing arrived, so nothing about what the Commander was doing changed.
    expect(store.selectedSlotKey()).toBe(FIXTURE_SLOTS.core);
    expect(store.surface()).toBe('replacement');
    expect(store.query()).toBe('plant');
  });

  it('refuses every intent while there is no build', () => {
    active.clear();

    const result = store.dispatch({ kind: 'remove', slotKey: FIXTURE_SLOTS.fittedOptional });

    expect(result.kind).toBe('refused');
    if (result.kind !== 'refused') {
      return;
    }
    expect(result.failure.category).toBe('unavailableOperation');
    expect(store.hasBuild()).toBe(false);
  });

  it('clears a previous refusal once a decision succeeds', () => {
    store.dispatch({ kind: 'remove', slotKey: FIXTURE_SLOTS.cargoHatch });
    expect(store.lastEditFailure()).not.toBeNull();

    store.dispatch({ kind: 'remove', slotKey: FIXTURE_SLOTS.fittedOptional });

    expect(store.lastEditFailure()).toBeNull();
  });
});

/**
 * Fitting, replacing and removing (US1).
 *
 * The behaviours that make an edit trustworthy rather than merely successful: a
 * replacement starts from stock rather than inheriting what was there, remove
 * is offered only where the package permits it, and a refusal leaves the build,
 * the snapshot, the revision and everything derived from them exactly as they
 * were.
 */
describe('outfitting store - fitting', () => {
  let store: OutfittingStore;
  let active: ActiveBuildStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideLocalization(), ...provideIsolatedLocaleEnvironment()],
    });
    active = TestBed.inject(ActiveBuildStore);
    TestBed.inject(ReplacementCoordinator).setConfirmer(() => Promise.resolve(true));
    store = TestBed.inject(OutfittingStore);
    active.commit(candidateFor());
  });

  it('fits the exact package record the choice was built from', () => {
    store.select(FIXTURE_SLOTS.utility);
    const choice = store.membership()!.choices.find((candidate) => candidate.kind === 'stock')!;

    const result = store.dispatch({
      kind: 'fitStock',
      slotKey: FIXTURE_SLOTS.utility,
      choiceKey: choice.key,
    });

    expect(result.kind).toBe('committed');
    expect(active.loadout()?.fittedModuleAt(FIXTURE_SLOTS.utility)?.symbol).toBe(
      choice.module.symbol,
    );
  });

  it('carries no previous engineering into a replacement', () => {
    store.select(FIXTURE_SLOTS.thrusters);
    active.loadout()!.applyBlueprint(FIXTURE_SLOTS.thrusters, 'Engine_Dirty', {
      grade: 5,
      quality: 1,
    });
    active.touch();

    const fitted = active.loadout()!.fittedModuleAt(FIXTURE_SLOTS.thrusters)!.symbol;
    const choice = store
      .membership()!
      .choices.find(
        (candidate) => candidate.kind === 'stock' && candidate.module.symbol !== fitted,
      )!;

    store.dispatch({
      kind: 'fitStock',
      slotKey: FIXTURE_SLOTS.thrusters,
      choiceKey: choice.key,
    });

    // A different module is a different article. Inheriting the old blueprint
    // would be this application deciding what the new one is engineered to.
    expect(active.loadout()?.fittedModuleAt(FIXTURE_SLOTS.thrusters)?.engineering).toBeUndefined();
  });

  it('fits a pre-engineered variant through the package own operation', () => {
    store.select(FIXTURE_SLOTS.frameShiftDrive);
    const variant = store.membership()!.choices.find((candidate) => candidate.kind === 'variant');
    expect(variant).toBeDefined();

    const result = store.dispatch({
      kind: 'fitVariant',
      slotKey: FIXTURE_SLOTS.frameShiftDrive,
      choiceKey: variant!.key,
    });

    expect(result.kind).toBe('committed');
    expect(
      active.loadout()?.fittedModuleAt(FIXTURE_SLOTS.frameShiftDrive)?.preEngineeredVariant,
    ).not.toBeNull();
  });

  it('retains no choice across a revision, rebuilding the set instead', () => {
    store.select(FIXTURE_SLOTS.utility);
    const before = store.membership()!;
    expect(before.buildRevision).toBe(active.revision());

    active.touch();
    const after = store.membership()!;

    // A different set, read at the new revision - not the old one carried
    // forward. That is what makes "no candidate retained across revisions" a
    // property of the design rather than a rule someone has to remember.
    expect(after).not.toBe(before);
    expect(after.buildRevision).toBe(active.revision());
    expect(after.buildRevision).not.toBe(before.buildRevision);
  });

  it('offers remove only where the package reports the mount removable', () => {
    store.select(FIXTURE_SLOTS.core);
    expect(store.selectedCapabilities()?.canRemove).toBe(false);

    store.select(FIXTURE_SLOTS.fittedOptional);
    expect(store.selectedCapabilities()?.canRemove).toBe(true);
  });

  /**
   * A family toggle is looking, not deciding.
   *
   * It is the same promise as selecting a mount or typing a query, and it is
   * worth its own test because the open set lives *inside* the query state:
   * writing to it must not rebuild that state, or every toggle would re-sort
   * and re-fold hundreds of choices (FR-021, decision 15).
   */
  describe('module families', () => {
    it('spends no revision, no history step and no rebuilt index on a toggle', () => {
      store.select(FIXTURE_SLOTS.fittedHardpoint);
      const revision = active.revision();
      const before = store.candidateQuery()!;
      const familyId = [...before.openFamilies][0]!;

      store.toggleFamily(familyId);
      const after = store.candidateQuery()!;

      expect(after.openFamilies.has(familyId)).toBe(false);
      expect(active.revision()).toBe(revision);
      expect(store.canUndo()).toBe(false);
      expect(store.canRedo()).toBe(false);
      // The ordered choices and the folded index are the same objects: a toggle
      // reads nothing from the package and rebuilds nothing.
      expect(after.choices).toBe(before.choices);
      expect(after.index).toBe(before.index);
      expect(after.results).toBe(before.results);
    });

    it('opens the fitted module\u2019s family and no other', () => {
      store.select(FIXTURE_SLOTS.fittedHardpoint);
      const state = store.candidateQuery()!;

      expect(state.fittedFamilyId).not.toBeNull();
      expect([...state.openFamilies]).toEqual([state.fittedFamilyId]);
    });

    it('discards the Commander\u2019s open set on a rebuild, for the seed again', () => {
      store.select(FIXTURE_SLOTS.fittedHardpoint);
      const seeded = [...store.candidateQuery()!.openFamilies];
      const closed = store.candidateQuery()!.openFamilies.values().next().value!;

      store.toggleFamily(closed);
      expect([...store.candidateQuery()!.openFamilies]).toEqual([]);

      // Anything that rebuilds the chooser reseeds it: the open set belongs to
      // the presentation, and that presentation is gone.
      active.touch();

      expect([...store.candidateQuery()!.openFamilies]).toEqual(seeded);
    });
  });

  it('leaves the snapshot, revision and derived results untouched after a refusal', () => {
    store.select(FIXTURE_SLOTS.hardpoint);
    const before = captureCheckpoint(active.loadout()!);
    const revision = active.revision();
    const jump = active.loadout()!.maxJumpRange();

    // A key no choice in this mount ever carried. It resolves to nothing, which
    // is a refusal rather than a guess at what was meant.
    const result = store.dispatch({
      kind: 'fitStock',
      slotKey: FIXTURE_SLOTS.hardpoint,
      choiceKey: 'a-key-no-choice-has',
    });

    expect(result.kind).toBe('refused');
    expect(active.revision()).toBe(revision);
    expect(captureCheckpoint(active.loadout()!)).toEqual(before);
    expect(active.loadout()!.maxJumpRange()).toBe(jump);
  });
});
