import { TestBed } from '@angular/core/testing';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import { LoadoutStore } from '../../../application/equipment/loadout.store';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { CommanderStats } from './commander-stats';

/**
 * The trailing column of artboard `1a`.
 *
 * One resistance group, not the canvas's two: the library publishes one set of
 * four resistances and the canvas's `ARMOUR` group was invented in the mock
 * (013 design/reference-review.md).
 */

const RIFLE = 'wpn_m_assaultrifle_plasma_fauto';

describe('CommanderStats', () => {
  let store: LoadoutStore;
  let presenter: LoadoutPresenter;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
    store = TestBed.inject(LoadoutStore);
    presenter = TestBed.inject(LoadoutPresenter);
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(CommanderStats);
    fixture.componentRef.setInput('stats', presenter.stats());
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('names the figures a suit will answer, with the canvas\u2019s dash for each', () => {
    // Canvas 2a draws the block while the bench is empty: which figures a suit
    // answers is itself the information, and an absent block states none of it.
    const element = render();

    expect(element.querySelectorAll('.metric').length).toBe(2);
    expect(element.querySelectorAll('.stats__resistances edsb-resistance-bar').length).toBe(4);
    expect(element.textContent).toContain('\u2014');
    // No weapon is fitted, so the firepower block has nothing to list.
    expect(element.querySelectorAll('.stats__firepower').length).toBe(0);
  });

  it('states shield strength, regeneration and the four resistances', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    const element = render();

    expect(element.querySelectorAll('edsb-metric-group .metric').length).toBe(2);
    expect(element.querySelectorAll('.stats__resistances edsb-resistance-bar').length).toBe(4);
  });

  it('restates every figure when the grade changes', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store.dispatch({ kind: 'setSuitGrade', grade: 1 });
    const first = render().querySelector('.metric__number')?.textContent;

    store.dispatch({ kind: 'setSuitGrade', grade: 5 });
    const raised = render().querySelector('.metric__number')?.textContent;

    expect(raised).not.toBe(first);
  });

  it('names one firepower row per fitted weapon, and none where nothing is fitted', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    expect(render().querySelectorAll('.stats__row').length).toBe(0);

    store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon1', symbol: RIFLE });
    const rows = [...render().querySelectorAll('.stats__row')];

    expect(rows.length).toBe(1);
    expect(rows[0]?.querySelector('.stats__weapon')?.textContent?.trim()).not.toBe('');
    expect(rows[0]?.querySelector('.stats__figure')?.textContent?.trim()).not.toBe('');
  });
});
