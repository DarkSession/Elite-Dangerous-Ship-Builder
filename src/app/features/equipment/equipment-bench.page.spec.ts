import { TestBed } from '@angular/core/testing';
import { LoadoutStore } from '../../application/equipment/loadout.store';
import { provideLocalization } from '../../i18n/i18n.providers';
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

describe('EquipmentBenchPage', () => {
  let store: LoadoutStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentBenchPage],
      providers: [provideLocalization()],
    }).compileComponents();
    store = TestBed.inject(LoadoutStore);
  });

  const render = (): HTMLElement => {
    const fixture = TestBed.createComponent(EquipmentBenchPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const wear = (): void => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
  };

  it('says nothing is on the bench, and offers the one thing an empty bench can do', () => {
    // Neither artboard draws an empty bench, and the spec opens on one (US1
    // scenario 1). The ship tool's own no-build block is what stands here, with
    // the control this tool owns: the suit chooser.
    const bench = render();

    expect(bench.querySelector('.bench__empty-title')?.textContent?.trim()).toBe(
      BUNDLED_ENGLISH['equipment.no-loadout.title'],
    );
    expect(bench.querySelectorAll('.bench__region').length).toBe(0);
  });

  it('draws the ledger, the item view and the stats side by side where there is room', () => {
    const restore = declareWideBench();
    try {
      wear();
      const named = [...render().querySelectorAll('.bench__region')].map((region) =>
        region.getAttribute('aria-label'),
      );

      expect(named).toEqual([
        BUNDLED_ENGLISH['equipment.region.loadout'],
        BUNDLED_ENGLISH['equipment.region.item'],
        BUNDLED_ENGLISH['equipment.region.stats'],
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

  it('publishes undo and redo to the shell rather than drawing its own pair (FR-022)', () => {
    const chrome = TestBed.inject(ScreenChrome);
    wear();
    const fixture = TestBed.createComponent(EquipmentBenchPage);
    fixture.detectChanges();

    expect(chrome.actions().map((action) => action.id)).toEqual([
      'equipment.undo',
      'equipment.redo',
    ]);
    // Starting a loadout is not an edit — there is nothing behind it to undo.
    expect(chrome.actions().map((action) => action.disabled)).toEqual([true, true]);

    fixture.destroy();
    expect(chrome.actions()).toEqual([]);
  });

  it('synthesizes no heading of its own', () => {
    // Neither artboard draws one, and the shell draws none either.
    expect(render().querySelectorAll('h1').length).toBe(0);
  });
});
