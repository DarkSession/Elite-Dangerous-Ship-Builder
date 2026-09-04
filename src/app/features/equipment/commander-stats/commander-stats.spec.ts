import { TestBed } from '@angular/core/testing';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import { LoadoutStore } from '../../../application/equipment/loadout.store';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { CommanderStats } from './commander-stats';

/**
 * The trailing column of artboard `1a`.
 *
 * The canvas's two resistance groups, `ARMOUR` over `SHIELDS`, both drawn from
 * the one set the library publishes: a resistance multiplies the damage taken,
 * which is why `SuitGrade` carries one set and not two. The canvas's own
 * `ARMOUR` figures are the mock's arithmetic and are not published
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
    // Four in each of the two blocks.
    expect(element.querySelectorAll('.stats__resistances edsb-resistance-bar').length).toBe(8);
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

  it('states shield strength, regeneration and the resistances in both groups', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    const element = render();

    expect(element.querySelectorAll('edsb-metric-group .metric').length).toBe(2);

    // Two blocks of four, as the canvas draws them: an `ARMOUR` group of bars
    // over a `SHIELDS` group that also carries the strength and the
    // regeneration. Each reads its own published set (Almanac 0.2.10).
    const blocks = [...element.querySelectorAll('.stats__block')].filter(
      (block) => block.querySelector('.stats__resistances') !== null,
    );
    expect(blocks.length).toBe(2);
    expect(blocks[0]?.querySelector('edsb-metric-group')).toBeNull();
    expect(blocks[1]?.querySelector('edsb-metric-group')).not.toBeNull();
    for (const block of blocks) {
      expect(block.querySelectorAll('edsb-resistance-bar').length).toBe(4);
    }
    const values = blocks.map((block) =>
      [...block.querySelectorAll('.resistance__value')].map((cell) => cell.textContent?.trim()),
    );
    // Two sets, not one drawn twice.
    expect(values[0]).not.toEqual(values[1]);
    for (const block of values) {
      expect(block).toHaveLength(4);
      for (const value of block) expect(value).toMatch(/^[+−-]/);
    }
  });

  it('restates every figure when the grade changes', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store.dispatch({ kind: 'setSuitGrade', grade: 1 });
    const first = render().querySelector('.metric__number')?.textContent;

    store.dispatch({ kind: 'setSuitGrade', grade: 5 });
    const raised = render().querySelector('.metric__number')?.textContent;

    expect(raised).not.toBe(first);
  });

  it('draws a row for every mount, named by what is on it', () => {
    // One block, one answer. A suit with nothing carried used to render the
    // heading over nothing, while the bench with no suit at all drew the same
    // block with a dash against each of the catalogue's mounts (Commander
    // request 2026-09-04).
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    const empty = [...render().querySelectorAll('.stats__row')];

    expect(empty.length).toBe(3);
    expect(
      empty.every((row) => row.querySelector('.stats__figure')?.textContent?.trim() === '—'),
    ).toBe(true);

    store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon1', symbol: RIFLE });
    const rows = [...render().querySelectorAll('.stats__row')];

    expect(rows.length).toBe(3);
    expect(rows[0]?.querySelector('.stats__weapon')?.textContent?.trim()).not.toBe('');
    expect(rows[0]?.querySelector('.stats__figure')?.textContent?.trim()).toContain('dps');
  });
});
