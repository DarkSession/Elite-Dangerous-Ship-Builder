import { TestBed } from '@angular/core/testing';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import type { BuildCandidate } from '../../../../application/active-build/active-build.models';
import { BuildIngressCoordinator } from '../../../../application/active-build/build-ingress.coordinator';
import { OutfittingStore } from '../../../../application/outfitting/outfitting.store';
import { FIXTURE_SLOTS, defaultBuild } from '../../../../domain/outfitting/outfitting.fixtures';
import { provideLocalization } from '../../../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../../../i18n/testing/localization-harness';
import { ScreenChrome } from '../../../shared/screen-chrome';
import { OutfittingWorkspace } from './outfitting-workspace';

/**
 * What the workspace publishes to the command bar.
 *
 * Canvas 1c draws `↶ UNDO`, `REDO ↷` and the build's own name in the bar, and
 * canvas 1d draws the same two actions in its `⋮` menu. The shell already
 * renders one list in both placements, so what is checked here is that the
 * region publishes them rather than drawing a second pair of its own
 * (FR-016, FR-019).
 */

function candidateFor(loadout: ShipLoadout): BuildCandidate {
  return {
    loadout,
    hullName: 'Anaconda',
    provenance: 'stock',
    qualityNotices: [],
    sourceNamed: null,
    autosaveRecordId: null,
    baseline: null,
  };
}

describe('the outfitting workspace’s command-bar channel', () => {
  let chrome: ScreenChrome;
  let store: OutfittingStore;
  let active: ActiveBuildStore;

  function render() {
    const fixture = TestBed.createComponent(OutfittingWorkspace);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideLocalization(), ...provideIsolatedLocaleEnvironment()],
    });
    active = TestBed.inject(ActiveBuildStore);
    store = TestBed.inject(OutfittingStore);
    chrome = TestBed.inject(ScreenChrome);
  });

  it('publishes undo and redo, disabled until there is a decision', () => {
    active.commit(candidateFor(defaultBuild()));
    const fixture = render();

    const actions = chrome.actions();
    expect(actions.map((action) => action.id)).toEqual(['outfitting.undo', 'outfitting.redo']);
    expect(actions.every((action) => action.disabled)).toBe(true);

    store.dispatch({ kind: 'setEnabled', slotKey: FIXTURE_SLOTS.fittedHardpoint, enabled: false });
    fixture.detectChanges();

    expect(chrome.actions()[0]?.disabled).toBe(false);
    expect(chrome.actions()[1]?.disabled).toBe(true);
  });

  it('describes what each direction would step through, for a reader', () => {
    active.commit(candidateFor(defaultBuild()));
    const fixture = render();
    store.dispatch({ kind: 'remove', slotKey: FIXTURE_SLOTS.fittedOptional });
    fixture.detectChanges();

    const description = chrome.actions()[0]?.description ?? '';

    // The label a Commander reads is drawn; which decision it would undo is
    // said only to a reader, because the canvas draws no summary beside it.
    expect(description.toLowerCase()).toContain('undo');
    expect(description).not.toBe(chrome.actions()[0]?.label);
  });

  it('runs the action the shell reports back by id', () => {
    active.commit(candidateFor(defaultBuild()));
    const fixture = render();
    store.dispatch({ kind: 'setEnabled', slotKey: FIXTURE_SLOTS.fittedHardpoint, enabled: false });
    fixture.detectChanges();

    expect(chrome.select('outfitting.undo')).toBe(true);

    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(true);
  });

  it('publishes the build’s identity, and nothing where there is no build', () => {
    const fixture = render();

    expect(chrome.identity()).toBeNull();

    active.commit(candidateFor(defaultBuild()));
    fixture.detectChanges();

    expect(chrome.identity()).toEqual({
      name: null,
      // Titled by what the build calls itself where it has no name of its own,
      // exactly as the library titles the same record's row — and the hull is
      // then not repeated beneath that title (FR-010).
      fallbackName: 'Anaconda',
      detail: null,
      ident: null,
      editing: null,
    });
  });

  it('records one decision for a confirmed name, and none for opening the field', () => {
    active.commit(candidateFor(defaultBuild()));
    const fixture = render();

    chrome.openIdentity('name');
    fixture.detectChanges();

    expect(chrome.identity()?.editing).toBe('name');
    // Opening a field is not a decision about the build (FR-018).
    expect(store.canUndo()).toBe(false);

    chrome.commitIdentity({ field: 'name', value: 'Pacifier' });
    fixture.detectChanges();

    expect(store.loadout()?.shipName).toBe('Pacifier');
    expect(chrome.identity()).toEqual({
      name: 'Pacifier',
      fallbackName: 'Anaconda',
      detail: 'Anaconda',
      ident: null,
      editing: null,
    });
    expect(store.canUndo()).toBe(true);
  });

  it('closes the field without committing anything', () => {
    active.commit(candidateFor(defaultBuild()));
    const fixture = render();
    chrome.openIdentity('ident');
    fixture.detectChanges();

    chrome.closeIdentity();
    fixture.detectChanges();

    expect(chrome.identity()?.editing).toBeNull();
    expect(store.loadout()?.shipIdent).toBeNull();
    expect(store.canUndo()).toBe(false);
  });
});
