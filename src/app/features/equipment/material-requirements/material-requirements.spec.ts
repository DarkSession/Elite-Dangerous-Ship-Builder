import { TestBed } from '@angular/core/testing';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import { LoadoutStore } from '../../../application/equipment/loadout.store';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { BUNDLED_ENGLISH } from '../../../i18n/locale-registry';
import { MaterialRequirements } from './material-requirements';

/**
 * The shopping list, which is the climb to each grade plus what is fitted **and
 * unlocked**.
 *
 * A modification in a locked slot is held rather than fitted, and counting it
 * would send a Commander gathering for something they cannot apply (FR-011).
 *
 * The suit stands at grade 1 unless a test raises it, so that a list is empty
 * where nothing is fitted: a raised grade is a cost of its own (FR-014).
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
    store.dispatch({ kind: 'setSuitGrade', grade: 1 });
  });

  function render(compact = false): HTMLElement {
    const fixture = TestBed.createComponent(MaterialRequirements);
    fixture.componentRef.setInput('materials', presenter.materials());
    fixture.componentRef.setInput('compact', compact);
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
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });
    store.dispatch({ kind: 'fitModification', target: 'suit', slot: 0, symbol: REGEN });
    const element = render();
    const rows = [...element.querySelectorAll('.materials__row')];

    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every((row) => (row.querySelector('.materials__count')?.textContent ?? '') !== ''),
    ).toBe(true);
    expect(element.querySelector('.materials__summary')?.textContent?.trim()).not.toBe('');
  });

  it('drops back to the climb alone when the only modification is removed', () => {
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });
    const climb = render().querySelector('.materials__summary')?.textContent?.trim();
    store.dispatch({ kind: 'fitModification', target: 'suit', slot: 0, symbol: REGEN });
    expect(render().querySelector('.materials__summary')?.textContent?.trim()).not.toBe(climb);

    store.dispatch({ kind: 'clearSlot', target: 'suit', slot: 0 });

    expect(render().querySelector('.materials__summary')?.textContent?.trim()).toBe(climb);
  });

  it('counts nothing for a modification whose slot is locked (FR-011)', () => {
    // Grade 2 closes the fourth slot, so what compares is the same grade with
    // the slot open and closed: the climb to it is counted either way, and the
    // held modification is counted in neither.
    store.dispatch({ kind: 'setSuitGrade', grade: 2 });
    const climb = render().querySelector('.materials__summary')?.textContent?.trim();
    expect(climb).not.toBe('');

    store.dispatch({ kind: 'fitModification', target: 'suit', slot: 3, symbol: REGEN });

    expect(render().querySelector('.materials__summary')?.textContent?.trim()).toBe(climb);

    // Grade 5 opens it, and the modification joins the total.
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });

    expect(render().querySelector('.materials__summary')?.textContent?.trim()).not.toBe(climb);
  });

  it('says what the total covers where the list is the whole screen', () => {
    // Canvas 1b's `MATERIALS` tab carries the footnote; canvas 1a's column,
    // where the list stands under the stats, draws no note beside a total.
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });
    store.dispatch({ kind: 'fitModification', target: 'suit', slot: 0, symbol: REGEN });

    expect(render(true).querySelector('.materials__note')?.textContent?.trim()).toBe(
      BUNDLED_ENGLISH['equipment.materials.note'],
    );
    expect(render().querySelector('.materials__note')).toBeNull();
  });

  it('counts the climb to a grade with no modification fitted (FR-014)', () => {
    // A raised suit is a cost on its own: raising it consumes micro resources
    // at a settlement, and the list states them.
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });

    expect(render().querySelectorAll('.materials__row').length).toBeGreaterThan(0);
  });

  it('leaves the note off where there is no total for it to be about', () => {
    // Canvas 2a writes one line on an empty bench, not two: a footnote
    // explaining what a total covers, printed above no total, explains nothing.
    expect(render(true).querySelector('.materials__note')).toBeNull();
  });
});
