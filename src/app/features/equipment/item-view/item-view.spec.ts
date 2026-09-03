import { TestBed } from '@angular/core/testing';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import { LoadoutStore } from '../../../application/equipment/loadout.store';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { BUNDLED_ENGLISH } from '../../../i18n/locale-registry';
import { ItemView } from './item-view';

/**
 * The middle column of artboard `1a`: what is selected, at what grade, and what
 * it is worth. Every figure here is the presenter's, which is the package's.
 */

const RIFLE = 'wpn_m_assaultrifle_plasma_fauto';

describe('ItemView', () => {
  let store: LoadoutStore;
  let presenter: LoadoutPresenter;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
    store = TestBed.inject(LoadoutStore);
    presenter = TestBed.inject(LoadoutPresenter);
  });

  function render(showBack = false) {
    const fixture = TestBed.createComponent(ItemView);
    fixture.componentRef.setInput('item', presenter.item());
    fixture.componentRef.setInput('showBack', showBack);
    fixture.detectChanges();
    return fixture;
  }

  it('says nothing is selected rather than drawing an empty item', () => {
    const element = render().nativeElement as HTMLElement;

    expect(element.querySelector('.item')).toBeNull();
    expect(element.querySelector('.item__empty')?.textContent?.trim()).toBe(
      BUNDLED_ENGLISH['equipment.item.noSelection'],
    );
  });

  it('states the suit, its grade ladder and its figures', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    const element = render().nativeElement as HTMLElement;

    expect(element.querySelector('.item__name')?.textContent?.trim()).not.toBe('');
    // Five grades, and the ladder is the ship tool's own.
    expect(element.querySelectorAll('edsb-grade-selector .grade__radio').length).toBe(5);
    expect(element.querySelectorAll('edsb-metric-group .metric').length).toBeGreaterThan(0);
  });

  it('offers only the one grade the Flight Suit publishes, and says why (spec Edge Cases)', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'flightsuit' });
    const element = render().nativeElement as HTMLElement;

    expect(element.querySelectorAll('edsb-grade-selector .grade__radio').length).toBe(1);
    // Four locked slots with nothing to explain them would say the suit could
    // be upgraded and this bench would not let you.
    expect(element.querySelector('.item__notice')?.textContent?.trim()).toBe(
      BUNDLED_ENGLISH['equipment.item.noUpgrade'],
    );
  });

  it('states a fitted weapon’s damage figures', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon1', symbol: RIFLE });
    store.select('PrimaryWeapon1');
    const element = render().nativeElement as HTMLElement;

    const labels = [...element.querySelectorAll('edsb-metric-group .metric__label')].map((label) =>
      label.textContent?.trim(),
    );
    expect(labels).toContain(BUNDLED_ENGLISH['equipment.attribute.damagePerShot']);
    expect(labels).toContain(BUNDLED_ENGLISH['equipment.attribute.dps']);
  });

  it('asks for a grade, a chooser and the way back out, and nothing else', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    const fixture = render(true);
    const element = fixture.nativeElement as HTMLElement;
    const grades: number[] = [];
    let chooserOpened = 0;
    let closed = 0;
    fixture.componentInstance.gradeChosen.subscribe((grade) => grades.push(grade));
    fixture.componentInstance.chooserOpened.subscribe(() => (chooserOpened += 1));
    fixture.componentInstance.closed.subscribe(() => (closed += 1));

    element.querySelectorAll<HTMLInputElement>('edsb-grade-selector .grade__radio')[3]?.click();
    element.querySelector<HTMLButtonElement>('.item__swap')?.click();
    element.querySelector<HTMLButtonElement>('.item__back')?.click();

    expect(grades).toEqual([4]);
    expect(chooserOpened).toBe(1);
    expect(closed).toBe(1);
  });

  it('draws no way back where the item view is a column rather than a drill-in', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });

    expect((render().nativeElement as HTMLElement).querySelector('.item__back')).toBeNull();
  });
});
