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

  function slotFor(slotKey: string): SlotView {
    const slot = store.slots().find((candidate) => candidate.key === slotKey);
    if (slot === undefined) {
      throw new Error(`The fixture hull has no ${slotKey} mount.`);
    }
    return slot;
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

  it('builds a page at a time and never misreports how many there are', () => {
    const fixture = open(FIXTURE_SLOTS.hardpoint);
    const instance = fixture.componentInstance;

    const total = instance.resultCount();
    expect(total).toBeGreaterThan(instance.builtCount());
    expect(instance.hasMore()).toBe(true);

    const built = instance.builtCount();
    instance.more();
    fixture.detectChanges();

    expect(instance.builtCount()).toBeGreaterThan(built);
    // The count a Commander reads is how many choices there are, whatever has
    // been built so far. A paged list that reported its page as the answer
    // would be telling them the Almanac offers sixty modules.
    expect(instance.resultCount()).toBe(total);
  });

  it('starts a new query at the first page rather than keeping a grown one', () => {
    const fixture = open(FIXTURE_SLOTS.hardpoint);
    const instance = fixture.componentInstance;

    instance.more();
    instance.more();
    fixture.detectChanges();
    const grown = instance.builtCount();

    instance.search('multi');
    fixture.detectChanges();

    expect(instance.builtCount()).toBeLessThan(grown);
    expect(instance.builtCount()).toBe(Math.min(instance.resultCount(), grown));
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

  it('spends no revision on picking a row, and one on fitting it', () => {
    const fixture = open(FIXTURE_SLOTS.hardpoint);
    const revision = active.revision();
    const choice = fixture.componentInstance.sections()[0]!.groups[0]!.choices[0]!;

    fixture.componentInstance.choose(choice.key);
    fixture.detectChanges();

    expect(fixture.componentInstance.canFit()).toBe(true);
    expect(active.revision()).toBe(revision);

    fixture.componentInstance.fit();

    expect(active.revision()).toBe(revision + 1);
  });

  it('drops a pick the build has moved out from under, and says so', () => {
    const fixture = open(FIXTURE_SLOTS.hardpoint);
    const choice = fixture.componentInstance.sections()[0]!.groups[0]!.choices[0]!;

    fixture.componentInstance.choose(choice.key);
    // Something else edits the build. The pick was about a revision that is no
    // longer on screen, so it stops being a pick rather than becoming a fit of
    // a record the Almanac would refuse.
    store.dispatch({ kind: 'remove', slotKey: FIXTURE_SLOTS.fittedOptional });
    fixture.detectChanges();

    expect(fixture.componentInstance.stale()).toBe(true);
    expect(fixture.componentInstance.selectedChoiceKey()).toBeNull();
    expect(fixture.componentInstance.canFit()).toBe(false);
    expect(fixture.componentInstance.state()).toBe('stale');
  });

  it('leaves the build and the query alone when it is cancelled', () => {
    const fixture = open(FIXTURE_SLOTS.hardpoint);
    const revision = active.revision();

    store.setQuery('multi');
    fixture.componentInstance.choose(
      fixture.componentInstance.sections()[0]!.groups[0]!.choices[0]!.key,
    );
    fixture.componentInstance.cancel();
    fixture.detectChanges();

    expect(active.revision()).toBe(revision);
    expect(store.query()).toBe('');
    expect(fixture.componentInstance.selectedChoiceKey()).toBeNull();
  });
});
