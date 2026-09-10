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
    expect(element.querySelectorAll('ednb-grade-selector .grade__radio').length).toBe(5);
    expect(element.querySelectorAll('ednb-metric-group .metric').length).toBeGreaterThan(0);
  });

  it('offers only the one grade the Flight Suit publishes, and says why (spec Edge Cases)', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'flightsuit' });
    const element = render().nativeElement as HTMLElement;

    expect(element.querySelectorAll('ednb-grade-selector .grade__radio').length).toBe(1);
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

    const labels = [...element.querySelectorAll('ednb-metric-group .metric__label')].map((label) =>
      label.textContent?.trim(),
    );
    expect(labels).toContain(BUNDLED_ENGLISH['equipment.attribute.damagePerShot']);
    expect(labels).toContain(BUNDLED_ENGLISH['equipment.attribute.dps']);
  });

  it('asks for a grade, an alternative and the way back out, and nothing else', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    const fixture = render(true);
    const element = fixture.nativeElement as HTMLElement;
    const grades: number[] = [];
    const chosen: string[] = [];
    let closed = 0;
    fixture.componentInstance.gradeChosen.subscribe((grade) => grades.push(grade));
    fixture.componentInstance.alternativeChosen.subscribe((id) => chosen.push(id));
    fixture.componentInstance.closed.subscribe(() => (closed += 1));

    element.querySelectorAll<HTMLInputElement>('ednb-grade-selector .grade__radio')[3]?.click();
    element.querySelector<HTMLButtonElement>('.item__alternatives .choice')?.click();
    element.querySelector<HTMLButtonElement>('.item__back')?.click();

    expect(grades).toEqual([4]);
    expect(chosen.length).toBe(1);
    expect(closed).toBe(1);
  });

  it('draws no way back where the item view is a column rather than a drill-in', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });

    expect((render().nativeElement as HTMLElement).querySelector('.item__back')).toBeNull();
  });

  it('holds the ladder’s track on a mount that publishes no grade, and states nothing in it', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store.select('PrimaryWeapon1');
    const track = (render().nativeElement as HTMLElement).querySelector('.item__grades');

    // The track is there and empty. Where it came and went with the ladder, the
    // header shrank and the list a Commander was choosing from moved under the
    // press (019/FR-001).
    expect(track).not.toBeNull();
    expect(track?.querySelector('ednb-grade-selector')).toBeNull();
    expect(track?.querySelectorAll('.grade__radio').length).toBe(0);

    // An empty mount publishes no grade, so the track answers nothing and says
    // so: out of the accessibility tree and out of the focus order (019/FR-002).
    expect(track?.classList.contains('item__grades--held')).toBe(true);
    expect(track?.hasAttribute('inert')).toBe(true);
    expect(track?.getAttribute('aria-hidden')).toBe('true');
  });

  it('gives the track no such attribute where it holds a ladder', () => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon1', symbol: RIFLE });
    store.select('PrimaryWeapon1');
    const track = (render().nativeElement as HTMLElement).querySelector('.item__grades');

    expect(track?.querySelectorAll('.grade__radio').length).toBeGreaterThan(0);
    expect(track?.classList.contains('item__grades--held')).toBe(false);
    expect(track?.hasAttribute('inert')).toBe(false);
    expect(track?.hasAttribute('aria-hidden')).toBe(false);
  });

  it('draws the track whatever the item is', () => {
    // The track's whole job is to be the same box before and after a choice, so
    // what a later edit must not do is make it conditional again. Its size is
    // not asserted here: jsdom computes no layout, and `equipment-builder.spec`
    // is where the held height is measured against the ladder's own.
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    expect((render().nativeElement as HTMLElement).querySelector('.item__grades')).not.toBeNull();

    store.select('PrimaryWeapon1');
    expect((render().nativeElement as HTMLElement).querySelector('.item__grades')).not.toBeNull();

    store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon1', symbol: RIFLE });
    expect((render().nativeElement as HTMLElement).querySelector('.item__grades')).not.toBeNull();
  });
});
