import { TestBed } from '@angular/core/testing';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import { LoadoutStore } from '../../../application/equipment/loadout.store';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { CommanderStats } from './commander-stats';

/**
 * The trailing column of artboard `1a`.
 *
 * One set of resistance bars, in a group of its own: the library publishes one
 * set of four and the canvas's second group, `ARMOUR`, was invented in the mock
 * (013 design/reference-review.md). The published four are the suit's rather
 * than the shield's, so they are not read under the `SHIELDS` heading.
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
    expect(element.textContent).toContain('—');
    // Canvas 2a keeps `FIREPOWER` too, with a dash against each of the
    // catalogue's own mounts: a block that disappears says nothing about which
    // figures a loadout would answer.
    expect(element.querySelectorAll('.stats__firepower').length).toBe(1);
    expect(element.querySelectorAll('.stats__firepower .stats__row').length).toBe(3);
    expect(
      [...element.querySelectorAll('.stats__firepower .stats__figure')].every(
        (figure) => figure.textContent?.trim() === '—',
      ),
    ).toBe(true);
  });

  it('states shield strength, regeneration and the four resistances', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    const element = render();

    expect(element.querySelectorAll('edsb-metric-group .metric').length).toBe(2);
    expect(element.querySelectorAll('.stats__resistances edsb-resistance-bar').length).toBe(4);
    // The bars stand outside the shield block rather than under its heading.
    expect(element.querySelector('.stats__resistances')?.closest('.stats__block')).not.toBe(
      element.querySelector('edsb-metric-group')?.closest('.stats__block'),
    );
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
