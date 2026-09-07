import { TestBed } from '@angular/core/testing';
import { BroadcastChannelAdapter } from '../../platform/browser/broadcast-channel.adapter';
import { HistoryLocationAdapter } from '../../platform/browser/history-location.adapter';
import { PageLifecycleAdapter } from '../../platform/browser/page-lifecycle.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { provideLocalization } from '../../i18n/i18n.providers';
import { EmptyBenchService } from './empty-bench.service';
import { LoadoutLinkCoordinator } from './loadout-link.coordinator';
import { LoadoutStore } from './loadout.store';

/** A location that remembers what was written to it, without a browser. */
class MemoryLocation {
  fragmentValue = '';
  /** How many times the fragment was replaced, so a test can count entries. */
  replacements = 0;

  fragment(): string {
    return this.fragmentValue;
  }

  currentDocument(): string {
    return '/equipment';
  }

  urlWithFragment(value: string): string {
    return `https://navbeacon.test/equipment#${value}`;
  }

  replaceFragment(value: string | null): void {
    this.replacements += 1;
    this.fragmentValue = value ?? '';
  }
}

class SilentLifecycle {
  onFlush(): () => void {
    return () => {};
  }
}

class SilentChannel {
  readonly available = false;
  post(): void {}
  subscribe(): () => void {
    return () => {};
  }
}

function setup() {
  const location = new MemoryLocation();
  const storage = new MemoryStorage();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideLocalization(),
      ...provideMemoryStorage(storage),
      { provide: HistoryLocationAdapter, useValue: location },
      { provide: PageLifecycleAdapter, useValue: new SilentLifecycle() },
      { provide: BroadcastChannelAdapter, useValue: new SilentChannel() },
    ],
  });
  return {
    location,
    storage,
    bench: TestBed.inject(EmptyBenchService),
    store: TestBed.inject(LoadoutStore),
    links: TestBed.inject(LoadoutLinkCoordinator),
    records: TestBed.inject(LocalRecordRepository),
  };
}

/** The records this browser is holding, as the saved list reads them. */
function stored(records: LocalRecordRepository) {
  const listed = records.list();
  return listed.ok ? listed.value.filter((entry) => entry.available) : [];
}

describe('starting an empty bench', () => {
  it('leaves the bench as it is before a suit is chosen', () => {
    const { bench, store } = setup();
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });

    bench.start();

    expect(store.hasLoadout()).toBe(false);
    // The suit gate stands, which is the row the bench points at with nothing
    // on it.
    expect(store.selected()).toBe('suit');
    // The choices before it belong to a loadout that is no longer here.
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);
  });

  it('keeps the loadout that was on the bench, as the record it is autosaved to', () => {
    // Which is what makes the action safe to offer without asking: there is
    // nothing to lose (017/FR-006).
    const { bench, store, records } = setup();
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });

    bench.start();

    const saved = stored(records);
    expect(saved.length).toBe(1);
    const record = saved[0]?.available === true ? saved[0].record : null;
    expect(record?.kind).toBe('working');
    expect(record !== null && record.tool === 'equipment' && record.suitFamily).toBe(
      'tacticalsuit',
    );
  });

  it('leaves a named record it was opened from exactly as it was', () => {
    const { bench, store, records } = setup();
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store.markSaved({ recordId: 'their-save', baseRevisionId: 'revision-1' });
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });

    bench.start();

    // Autosave has no path to a named record, so what it wrote is an unnamed
    // one of its own and the save is untouched.
    expect(
      stored(records).every((entry) => entry.available && entry.record.kind === 'working'),
    ).toBe(true);
    expect(store.sourceNamed()).toBeNull();
  });

  it('takes the loadout out of the address without adding a history entry', () => {
    const { bench, store, links, location } = setup();
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    links.publish();
    expect(location.fragmentValue.startsWith('e.')).toBe(true);
    const replacements = location.replacements;

    bench.start();

    expect(location.fragmentValue).toBe('');
    // Replaced in place: a Commander pressing BACK meant to leave the bench,
    // not to walk back through the loadouts it has held.
    expect(location.replacements).toBe(replacements + 1);
    expect(links.link()).toEqual({ kind: 'absent' });
  });

  it('changes nothing at all on a bench that is already empty', () => {
    const { bench, store, location, records } = setup();
    const revision = store.revision();

    bench.start();

    expect(store.revision()).toBe(revision);
    expect(store.hasLoadout()).toBe(false);
    expect(location.replacements).toBe(0);
    expect(stored(records)).toEqual([]);
  });
});
