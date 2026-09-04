import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoadoutStore } from '../../application/equipment/loadout.store';
import { provideLocalization } from '../../i18n/i18n.providers';
import { LoadoutLinkCoordinator } from '../../application/equipment/loadout-link.coordinator';
import { LoadoutOpenService } from '../../application/equipment/loadout-open.service';
import { isEquipmentRecord } from '../../domain/records/local-record';
import { WebLocksAdapter } from '../../platform/browser/web-locks.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { BUNDLED_ENGLISH } from '../../i18n/locale-registry';
import { declareMeasurement, declareResizeObserver } from '../../ui/measurement.spec-helpers';
import { BENCH_WIDE_MINIMUM_REM } from '../../ui/equipment/bench-composition';
import { ScreenChrome } from '../shared/screen-chrome';
import { EquipmentBenchPage } from './equipment-bench.page';

/**
 * The bench's two arrangements.
 *
 * The renderer lays nothing out, so a spec about the wide composition says how
 * wide the bench is; without that declaration the region reports `compact`,
 * which is artboard `1b` and the one every capability has to fit into.
 */
function declareWideBench(): () => void {
  const measured = declareMeasurement({ width: BENCH_WIDE_MINIMUM_REM * 16 });
  const observed = declareResizeObserver();

  return () => {
    observed();
    measured();
  };
}

/** A lock that serializes without a browser: what is under test is the save. */
class FakeLocks {
  async request<T>(_name: string, operation: () => Promise<T>): Promise<T> {
    return operation();
  }
}

describe('EquipmentBenchPage', () => {
  let store: LoadoutStore;
  let records: LocalRecordRepository;

  beforeEach(async () => {
    // The bench publishes the loadout it holds into the address, and the
    // document's address outlives one test. A fragment left by an earlier one
    // is a loadout this bench would open on creation, so each test starts from
    // an address carrying nothing.
    history.replaceState(null, '', location.pathname);

    await TestBed.configureTestingModule({
      imports: [EquipmentBenchPage],
      providers: [
        provideLocalization(),
        provideRouter([]),
        // The bench saves into the one record library, so it reaches storage
        // the moment it is created.
        ...provideMemoryStorage(new MemoryStorage()),
        { provide: WebLocksAdapter, useValue: new FakeLocks() },
      ],
    }).compileComponents();
    store = TestBed.inject(LoadoutStore);
    records = TestBed.inject(LocalRecordRepository);
  });

  const render = (): HTMLElement => {
    const fixture = TestBed.createComponent(EquipmentBenchPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const wear = (): void => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
  };

  it('opens an empty compact bench straight onto the chooser', () => {
    // Canvas 2b draws no ledger at all: the `LOADOUT` tab opens on `STEP 1 ·
    // CHOOSE A SUIT`. Every row a ledger would draw there says `LOCKED` about a
    // mount no suit has offered yet, and at 390px they fill the screen the one
    // live choice has to be on. The gate keeps its heading for a reader, which
    // is what names the region (US1 scenario 1).
    const bench = render();

    expect(bench.querySelector('.bench__region--loadout')).toBeNull();
    expect(bench.querySelector('edsb-suit-gate')).not.toBeNull();
    expect(bench.querySelector('edsb-item-view')).toBeNull();
    expect(bench.querySelector('.gate__title')?.textContent?.trim()).toBe(
      BUNDLED_ENGLISH['equipment.gate.title'],
    );
  });

  it('draws the gate where the item view goes once a suit is on the bench', () => {
    const fixture = TestBed.createComponent(EquipmentBenchPage);
    fixture.detectChanges();

    fixture.componentInstance.chooseFirstSuit('tacticalsuit');
    fixture.detectChanges();

    const bench = fixture.nativeElement as HTMLElement;
    expect(bench.querySelector('edsb-suit-gate')).toBeNull();
    expect(store.selected()).toBe('suit');
  });

  it('draws the ledger, the item view and the commander column where there is room', () => {
    const restore = declareWideBench();
    try {
      wear();
      const named = [...render().querySelectorAll('.bench__region')].map((region) =>
        region.getAttribute('aria-label'),
      );

      // Canvas 1a's three columns, with the materials block under the stats.
      expect(named).toEqual([
        BUNDLED_ENGLISH['equipment.region.loadout'],
        BUNDLED_ENGLISH['equipment.region.item'],
        BUNDLED_ENGLISH['equipment.region.stats'],
        BUNDLED_ENGLISH['equipment.region.materials'],
      ]);
    } finally {
      restore();
    }
  });

  it('draws one tab at a time where there is not, the ledger first', () => {
    wear();
    const bench = render();

    expect(bench.querySelector('edsb-tab-group')).not.toBeNull();
    expect(bench.querySelector('.bench__region--loadout')).not.toBeNull();
    expect(bench.querySelector('.bench__region--stats')).toBeNull();
  });

  it('gives the materials a tab of their own where the columns do not fit', () => {
    wear();
    const fixture = TestBed.createComponent(EquipmentBenchPage);
    fixture.detectChanges();
    const bench = fixture.nativeElement as HTMLElement;
    expect(bench.querySelector('.bench__region--materials')).toBeNull();

    fixture.componentInstance.showTab('materials');
    fixture.detectChanges();

    expect(bench.querySelector('.bench__region--materials')).not.toBeNull();
    expect(bench.querySelector('.bench__region--stats')).toBeNull();
  });

  it('replaces the compact ledger with the item it was asked to open, and goes back', () => {
    wear();
    const fixture = TestBed.createComponent(EquipmentBenchPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;

    page.open('suit');
    fixture.detectChanges();
    const bench = fixture.nativeElement as HTMLElement;
    expect(bench.querySelector('.bench__region--loadout')).toBeNull();
    expect(bench.querySelector('.bench__region--item')).not.toBeNull();

    page.closeItem();
    fixture.detectChanges();
    expect(bench.querySelector('.bench__region--loadout')).not.toBeNull();
  });

  it('draws every action on an empty bench, and refuses the two that need a loadout', () => {
    // Canvas 2a keeps `↶ UNDO REDO ↷ | OPEN BUILD IMPORT EXPORT SAVE ?` with
    // export and save dimmed. A control that vanishes takes with it the fact
    // that it exists (FR-022).
    const chrome = TestBed.inject(ScreenChrome);
    const fixture = TestBed.createComponent(EquipmentBenchPage);
    fixture.detectChanges();

    expect(chrome.actions().map((action) => action.id)).toEqual([
      'equipment.undo',
      'equipment.redo',
      'equipment.export',
      'equipment.save',
    ]);
    expect(chrome.actions().every((action) => action.disabled === true)).toBe(true);
  });

  it('publishes its actions to the shell rather than drawing its own bar (FR-022)', () => {
    const chrome = TestBed.inject(ScreenChrome);
    wear();
    const fixture = TestBed.createComponent(EquipmentBenchPage);
    fixture.detectChanges();

    // The history pair leads, ahead of the shell's own actions, which is where
    // both canvases draw them and where the ship tool already publishes its.
    expect(chrome.actions().map((action) => action.id)).toEqual([
      'equipment.undo',
      'equipment.redo',
      'equipment.export',
      'equipment.save',
    ]);
    // Starting a loadout is not an edit — there is nothing behind it to undo.
    // Exporting and saving are drawn and refused on an empty bench rather than
    // taken away, so this loadout can use both.
    expect(chrome.actions().map((action) => action.disabled)).toEqual([true, true, false, false]);

    fixture.destroy();
    expect(chrome.actions()).toEqual([]);
  });

  it('saves the open loadout into the one record library, and holds what it saved', async () => {
    // The loadout is what is stored — identities only — and the bench now
    // belongs to the save, so the layer can offer to replace it (FR-016).
    const fixture = TestBed.createComponent(EquipmentBenchPage);
    fixture.detectChanges();
    wear();

    await fixture.componentInstance.requestSave({
      name: 'Silent Entry',
      note: null,
      overwrite: false,
    });

    const listed = records.list();
    const saved = listed.ok ? listed.value.filter((entry) => entry.available) : [];
    expect(saved.length).toBe(1);
    const record = saved[0]?.available === true ? saved[0].record : null;
    expect(record?.name).toBe('Silent Entry');
    expect(record !== null && isEquipmentRecord(record) && record.loadout.suitFamily).toBe(
      'tacticalsuit',
    );
    expect(store.source()?.recordId).toBe(record?.id);
  });

  it('opens a saved loadout back onto the bench, exactly as it was saved', async () => {
    const fixture = TestBed.createComponent(EquipmentBenchPage);
    fixture.detectChanges();
    wear();
    store.dispatch({ kind: 'setSuitGrade', grade: 3 });
    await fixture.componentInstance.requestSave({
      name: 'Silent Entry',
      note: null,
      overwrite: false,
    });
    const recordId = store.source()!.recordId;

    store.open(null);
    expect(store.hasLoadout()).toBe(false);

    expect(TestBed.inject(LoadoutOpenService).open(recordId).ok).toBe(true);
    expect(store.loadout()?.suitFamily).toBe('tacticalsuit');
    expect(store.loadout()?.suitGrade).toBe(3);
  });

  it('says why a loadout link was refused, in the library’s words (FR-021)', () => {
    const links = TestBed.inject(LoadoutLinkCoordinator);
    const fixture = TestBed.createComponent(EquipmentBenchPage);
    fixture.detectChanges();
    wear();
    const before = store.loadout();

    links.ingest('e.notaloadoutatall');
    fixture.detectChanges();

    const notice = (fixture.nativeElement as HTMLElement).querySelector('edsb-status-notice');
    expect(notice?.textContent).toContain('could not be read');
    // Never Frontier's journal key, and never the bench's own loadout.
    expect(notice?.textContent).not.toContain('PrimaryWeapon');
    expect(store.loadout()).toBe(before);
  });

  it('synthesizes no heading of its own', () => {
    // Neither artboard draws one, and the shell draws none either.
    expect(render().querySelectorAll('h1').length).toBe(0);
  });
});
