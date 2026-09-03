import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoadoutStore } from '../../application/equipment/loadout.store';
import { provideLocalization } from '../../i18n/i18n.providers';
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

  it('keeps the bench drawn on an empty one, with the gate in the detail column', () => {
    // Canvas 2b: the ledger is drawn and inert, and the gate stands under it in
    // the `LOADOUT` tab rather than in place of the bench (US1 scenario 1).
    const bench = render();

    expect(bench.querySelector('.bench__region--loadout')).not.toBeNull();
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

  it('publishes undo, redo and save to the shell rather than drawing its own (FR-022)', () => {
    const chrome = TestBed.inject(ScreenChrome);
    wear();
    const fixture = TestBed.createComponent(EquipmentBenchPage);
    fixture.detectChanges();

    expect(chrome.actions().map((action) => action.id)).toEqual([
      'equipment.undo',
      'equipment.redo',
      'equipment.save',
    ]);
    // Starting a loadout is not an edit — there is nothing behind it to undo.
    // Saving one is always available, which is why it states no disabled state.
    expect(chrome.actions().map((action) => action.disabled)).toEqual([true, true, undefined]);

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

  it('synthesizes no heading of its own', () => {
    // Neither artboard draws one, and the shell draws none either.
    expect(render().querySelectorAll('h1').length).toBe(0);
  });
});
