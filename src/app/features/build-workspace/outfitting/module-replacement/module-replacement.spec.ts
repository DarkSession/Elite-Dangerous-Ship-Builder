import { TestBed } from '@angular/core/testing';
import type { BuildCandidate } from '../../../../application/active-build/active-build.models';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { ReplacementCoordinator } from '../../../../application/active-build/replacement-coordinator';
import { OutfittingStore } from '../../../../application/outfitting/outfitting.store';
import type { SlotView } from '../../../../application/outfitting/slot-view';
import { FIXTURE_SLOTS, defaultBuild } from '../../../../domain/outfitting/outfitting.fixtures';
import { provideLocalization } from '../../../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../../../i18n/testing/localization-harness';
import { ModuleReplacement } from './module-replacement';

/**
 * The chooser's states, from the outside.
 *
 * What matters here is that the six the contract names stay six: an empty
 * package answer, a search that found nothing, a build that moved underneath
 * and a mount that takes nothing at all look identical on screen — an empty
 * list — and a Commander needs a different sentence for each of them
 * (module-catalogue contract, "Search").
 */

function candidateFor(): BuildCandidate {
  return {
    loadout: defaultBuild(),
    hullName: 'Anaconda',
    provenance: 'stock',
    qualityNotices: [],
    sourceNamed: null,
    baseline: null,
  };
}

describe('module replacement surface', () => {
  let store: OutfittingStore;
  let active: ActiveBuildStore;

  function open(slotKey: string) {
    store.select(slotKey);
    const fixture = TestBed.createComponent(ModuleReplacement);
    fixture.componentRef.setInput('slot', slotFor(slotKey));
    fixture.detectChanges();
    return fixture;
  }

  /**
   * The same surface, told it is canvas 1d's full-screen layer.
   *
   * Set after the inline render and never re-rendered: `<dialog>.showModal()`
   * does not exist in the test environment, and what is being checked here is
   * the two-step the layer adds — pick, then commit — which is component state
   * rather than anything the layer draws.
   */
  function asLayer(fixture: ReturnType<typeof open>) {
    fixture.componentRef.setInput('asLayer', true);
    return fixture;
  }

  function slotFor(slotKey: string): SlotView {
    const slot = store.slots().find((candidate) => candidate.key === slotKey);
    if (slot === undefined) {
      throw new Error(`The fixture hull has no ${slotKey} mount.`);
    }
    return slot;
  }

  /**
   * How many rows the chooser has actually built.
   *
   * Counted off the sections it draws rather than read from a figure on the
   * surface: neither canvas draws one, so there is nothing there to read
   * (design-canvas rule, wave 3).
   */
  function built(instance: ModuleReplacement): number {
    return instance
      .sections()
      .flatMap((section) => section.groups)
      .reduce((total, group) => total + group.choices.length, 0);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideLocalization(), ...provideIsolatedLocaleEnvironment()],
    });
    active = TestBed.inject(ActiveBuildStore);
    TestBed.inject(ReplacementCoordinator).setConfirmer(() => Promise.resolve(true));
    store = TestBed.inject(OutfittingStore);
    active.commit(candidateFor());
  });

  it('offers the package’s whole expansion for a mount that takes modules', () => {
    const fixture = open(FIXTURE_SLOTS.hardpoint);

    expect(fixture.componentInstance.state()).toBe('ready');
    expect(fixture.componentInstance.resultCount()).toBe(store.membership()?.choices.length ?? 0);
    expect(fixture.componentInstance.sections().length).toBeGreaterThan(0);
  });

  it('renders the whole expansion, so the scroller knows how tall it is', () => {
    const fixture = open(FIXTURE_SLOTS.hardpoint);
    const instance = fixture.componentInstance;

    // Every choice, in the document, from the first frame. A list that grew as
    // it was scrolled could not tell the browser its height, and its scrollbar
    // shrank under the Commander every time it grew (wave 4).
    expect(built(instance)).toBe(instance.resultCount());
    expect(instance.resultCount()).toBeGreaterThan(100);
  });

  it('narrows to the matches and back, with no page state in between', () => {
    const fixture = open(FIXTURE_SLOTS.hardpoint);
    const instance = fixture.componentInstance;
    const all = instance.resultCount();

    instance.search('multi');
    fixture.detectChanges();
    expect(built(instance)).toBe(instance.resultCount());
    expect(instance.resultCount()).toBeLessThan(all);

    instance.clear();
    fixture.detectChanges();
    expect(built(instance)).toBe(all);
  });

  it('separates a successful empty answer from a search that found nothing', () => {
    const empty = open(FIXTURE_SLOTS.cargoHatch);
    // The hatch's menus come back empty, so the surface never opens a chooser
    // over it at all — it says the Almanac takes nothing else there.
    expect(empty.componentInstance.state()).toBe('notReplaceable');

    const searched = open(FIXTURE_SLOTS.hardpoint);
    store.setQuery('zzzz nothing');
    searched.detectChanges();

    expect(searched.componentInstance.state()).toBe('noMatches');
    expect(searched.componentInstance.canClear()).toBe(true);
  });

  it('restores every choice when the query is cleared, without touching the build', () => {
    const fixture = open(FIXTURE_SLOTS.hardpoint);
    const all = fixture.componentInstance.resultCount();
    const revision = active.revision();

    store.setQuery('zzzz nothing');
    fixture.detectChanges();
    expect(fixture.componentInstance.resultCount()).toBe(0);

    fixture.componentInstance.clear();
    fixture.detectChanges();

    expect(fixture.componentInstance.resultCount()).toBe(all);
    expect(active.revision()).toBe(revision);
  });

  it('takes a row as the fit where the panel is drawn without a commit control', () => {
    // Canvas 1c draws no `FIT MODULE`: the amber row is the module in the
    // mount, and choosing another row is the fit. One decision, one revision.
    const fixture = open(FIXTURE_SLOTS.hardpoint);
    const revision = active.revision();
    const choice = fixture.componentInstance.sections()[0]!.groups[0]!.choices[0]!;

    fixture.componentInstance.choose(choice.key);
    fixture.detectChanges();

    expect(active.revision()).toBe(revision + 1);
  });

  it('spends no revision on picking a row, and one on fitting it, as a layer', () => {
    // Canvas 1d is where the two-control bar is, because at that width the
    // chooser is a screen of its own and leaving it has to be a decision.
    const fixture = asLayer(open(FIXTURE_SLOTS.hardpoint));
    const revision = active.revision();
    const choice = fixture.componentInstance.sections()[0]!.groups[0]!.choices[0]!;

    fixture.componentInstance.choose(choice.key);

    expect(fixture.componentInstance.canFit()).toBe(true);
    expect(active.revision()).toBe(revision);

    fixture.componentInstance.fit();

    expect(active.revision()).toBe(revision + 1);
  });

  it('drops a pick the build has moved out from under, and says so', () => {
    const fixture = asLayer(open(FIXTURE_SLOTS.hardpoint));
    const choice = fixture.componentInstance.sections()[0]!.groups[0]!.choices[0]!;

    fixture.componentInstance.choose(choice.key);
    // Something else edits the build. The pick was about a revision that is no
    // longer on screen, so it stops being a pick rather than becoming a fit of
    // a record the Almanac would refuse.
    store.dispatch({ kind: 'remove', slotKey: FIXTURE_SLOTS.fittedOptional });

    expect(fixture.componentInstance.stale()).toBe(true);
    expect(fixture.componentInstance.selectedChoiceKey()).toBeNull();
    expect(fixture.componentInstance.canFit()).toBe(false);
    expect(fixture.componentInstance.state()).toBe('stale');
  });

  it('leaves the build and the query alone when it is cancelled', () => {
    const fixture = asLayer(open(FIXTURE_SLOTS.hardpoint));
    const revision = active.revision();

    store.setQuery('multi');
    fixture.componentInstance.choose(
      fixture.componentInstance.sections()[0]!.groups[0]!.choices[0]!.key,
    );
    fixture.componentInstance.cancel();

    expect(active.revision()).toBe(revision);
    expect(store.query()).toBe('');
    expect(fixture.componentInstance.selectedChoiceKey()).toBeNull();
  });
});
