import { TestBed } from '@angular/core/testing';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import { LoadoutStore } from '../../../application/equipment/loadout.store';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { BUNDLED_ENGLISH } from '../../../i18n/locale-registry';
import { MaterialRequirements } from './material-requirements';

/**
 * The shopping list, which is the sum of what is fitted **and unlocked**.
 *
 * A modification in a locked slot is held rather than fitted, and counting it
 * would send a Commander gathering for something they cannot apply (FR-011).
 */

const REGEN = 'suit_increasedshieldregen';

describe('MaterialRequirements', () => {
  let store: LoadoutStore;
  let presenter: LoadoutPresenter;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
    store = TestBed.inject(LoadoutStore);
    presenter = TestBed.inject(LoadoutPresenter);
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(MaterialRequirements);
    fixture.componentRef.setInput('materials', presenter.materials());
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('says there is nothing to gather rather than drawing an empty list', () => {
    const element = render();

    expect(element.querySelector('.materials__list')).toBeNull();
    expect(element.querySelector('.materials__empty')?.textContent?.trim()).toBe(
      BUNDLED_ENGLISH['equipment.materials.empty'],
    );
    expect(element.querySelector('.materials__summary')).toBeNull();
  });

  it('lists one row per resource with its count, and counts types and units', () => {
    store.dispatch({ kind: 'fitModification', target: 'suit', slot: 0, symbol: REGEN });
    const element = render();
    const rows = [...element.querySelectorAll('.materials__row')];

    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every((row) => (row.querySelector('.materials__count')?.textContent ?? '') !== ''),
    ).toBe(true);
    expect(element.querySelector('.materials__summary')?.textContent?.trim()).not.toBe('');
  });

  it('drops back to nothing when the only modification is removed', () => {
    store.dispatch({ kind: 'fitModification', target: 'suit', slot: 0, symbol: REGEN });
    expect(render().querySelectorAll('.materials__row').length).toBeGreaterThan(0);

    store.dispatch({ kind: 'clearSlot', target: 'suit', slot: 0 });

    expect(render().querySelector('.materials__empty')).not.toBeNull();
  });

  it('counts nothing for a modification whose slot is locked (FR-011)', () => {
    store.dispatch({ kind: 'fitModification', target: 'suit', slot: 3, symbol: REGEN });
    const fitted = render().querySelectorAll('.materials__row').length;
    expect(fitted).toBeGreaterThan(0);

    // Grade 2 closes the fourth slot. What is in it is held, not fitted.
    store.dispatch({ kind: 'setSuitGrade', grade: 2 });

    expect(render().querySelector('.materials__empty')).not.toBeNull();
  });

  it('says what the total covers, because the total cannot say it', () => {
    expect(render().querySelector('.materials__note')?.textContent?.trim()).toBe(
      BUNDLED_ENGLISH['equipment.materials.note'],
    );
  });
});
