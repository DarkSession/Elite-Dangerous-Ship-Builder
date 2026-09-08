import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { ActiveBuildStore } from '../../application/active-build/active-build.store';
import { AutosaveService } from '../../application/build-library/autosave.service';
import { provideLocalization } from '../../i18n/i18n.providers';
import { WebLocksAdapter } from '../../platform/browser/web-locks.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import { recordKey } from '../../platform/storage/storage-keys';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { LibraryPresence } from '../build-library/library-presence';
import { BuildWorkspacePage } from './build-workspace.page';

/** A lock that serializes without a browser: what is under test is the save. */
class FakeLocks {
  readonly available = true;

  async request<T>(_name: string, operation: () => Promise<T>): Promise<T> {
    return operation();
  }
}

/**
 * What the workspace does with the action the status reports.
 *
 * The status component says which control was pressed and nothing more, because
 * it draws for both tools and each tool holds its own autosave. Reaching the
 * ship tool's autosave is this screen's own work, so it is asserted here rather
 * than through the component (017/FR-007).
 */
describe('BuildWorkspacePage persistence actions', () => {
  let active: ActiveBuildStore;
  let records: LocalRecordRepository;
  let storage: MemoryStorage;

  beforeEach(async () => {
    // The workspace publishes the build it holds into the address, and the
    // document's address outlives one test.
    history.replaceState(null, '', location.pathname);

    await TestBed.configureTestingModule({
      imports: [BuildWorkspacePage],
      providers: [
        provideLocalization(),
        provideRouter([]),
        ...provideMemoryStorage((storage = new MemoryStorage())),
        { provide: WebLocksAdapter, useValue: new FakeLocks() },
      ],
    }).compileComponents();
    active = TestBed.inject(ActiveBuildStore);
    records = TestBed.inject(LocalRecordRepository);
  });

  /** A build on the workspace, as opening a stock hull leaves one. */
  function openBuild(symbol = 'Anaconda'): void {
    active.commit({
      loadout: ShipLoadout.default(symbol),
      hullName: symbol,
      provenance: 'stock',
      sourceNamed: null,
      autosaveRecordId: null,
      baseline: null,
    });
  }

  it('resumes saving when the Commander asks it to', () => {
    const fixture = TestBed.createComponent(BuildWorkspacePage);
    fixture.detectChanges();
    openBuild();
    const autosave = TestBed.inject(AutosaveService);
    autosave.flush();
    const mine = active.autosaveRecordId()!;

    // Gone from the store as well as announced, so that the record standing
    // afterwards is one the resume wrote rather than the one it was told about.
    storage.entries.delete(recordKey(mine));
    window.dispatchEvent(new StorageEvent('storage', { key: recordKey(mine), newValue: null }));
    fixture.detectChanges();
    expect(autosave.paused()).toBe(true);
    expect(storage.entries.has(recordKey(mine))).toBe(false);

    fixture.componentInstance.actOnPersistence('resume');

    expect(autosave.paused()).toBe(false);
    expect(storage.entries.has(recordKey(mine))).toBe(true);
    fixture.destroy();
  });

  it('writes again when the Commander asks to retry', () => {
    const fixture = TestBed.createComponent(BuildWorkspacePage);
    fixture.detectChanges();
    openBuild();

    fixture.componentInstance.actOnPersistence('retry');

    expect(active.autosaveRecordId()).not.toBeNull();
    expect(storage.entries.has(recordKey(active.autosaveRecordId()!))).toBe(true);
    fixture.destroy();
  });

  it('raises the saved records layer to choose what to discard', () => {
    // A full store is the one state whose way out is somewhere else: what to
    // discard is the saved records layer's own work (001/FR-013).
    const fixture = TestBed.createComponent(BuildWorkspacePage);
    fixture.detectChanges();
    openBuild();
    const layer = TestBed.inject(LibraryPresence);
    expect(layer.open()).toBe(false);

    fixture.componentInstance.actOnPersistence('manage');

    expect(layer.open()).toBe(true);
    expect(records.list().ok).toBe(true);
    fixture.destroy();
  });
});
